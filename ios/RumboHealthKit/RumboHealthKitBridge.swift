import Foundation
import HealthKit
import WebKit

/// Add this handler to the RUMBO WKWebView configuration under the name "rumboHealthKit".
/// Keep the WKWebView's navigation allow-list restricted to the RUMBO origin.
final class RumboHealthKitBridge: NSObject, WKScriptMessageHandler {
    private let store = HKHealthStore()
    private weak var webView: WKWebView?

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
    }

    private var readableTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        let identifiers: [HKQuantityTypeIdentifier] = [
            .stepCount, .distanceWalkingRunning, .activeEnergyBurned,
            .heartRate, .restingHeartRate
        ]
        identifiers.compactMap(HKObjectType.quantityType(forIdentifier:)).forEach { types.insert($0) }
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        types.insert(HKObjectType.workoutType())
        return types
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let id = body["id"] as? String,
              let action = body["action"] as? String else { return }

        guard HKHealthStore.isHealthDataAvailable() else {
            respond(id: id, error: "Apple Health no está disponible en este dispositivo.")
            return
        }

        switch action {
        case "requestAuthorization":
            store.requestAuthorization(toShare: [], read: readableTypes) { [weak self] success, error in
                if let error = error { self?.respond(id: id, error: error.localizedDescription); return }
                self?.respond(id: id, data: ["authorizedRequestCompleted": success])
            }
        case "readDailySummary":
            let days = min(max(body["days"] as? Int ?? 7, 1), 30)
            readDailySummary(days: days) { [weak self] result in
                switch result {
                case .success(let rows): self?.respond(id: id, data: rows)
                case .failure(let error): self?.respond(id: id, error: error.localizedDescription)
                }
            }
        default:
            respond(id: id, error: "Acción HealthKit no reconocida.")
        }
    }

    private func readDailySummary(days: Int, completion: @escaping (Result<[[String: Any]], Error>) -> Void) {
        let calendar = Calendar.current
        let end = Date()
        guard let start = calendar.date(byAdding: .day, value: -days + 1, to: calendar.startOfDay(for: end)) else {
            completion(.success([])); return
        }
        let group = DispatchGroup()
        let lock = NSLock()
        var rows: [String: [String: Any]] = [:]
        var firstError: Error?

        func add(_ date: Date, _ key: String, _ value: Double) {
            lock.lock(); defer { lock.unlock() }
            let day = ISO8601DateFormatter.rumboDay.string(from: date)
            var row = rows[day] ?? ["date": day]
            row[key] = value
            rows[day] = row
        }

        func quantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, key: String) {
            guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return }
            group.enter()
            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
            let query = HKStatisticsCollectionQuery(quantityType: type, quantitySamplePredicate: predicate,
                options: .cumulativeSum, anchorDate: calendar.startOfDay(for: start),
                intervalComponents: DateComponents(day: 1))
            query.initialResultsHandler = { _, collection, error in
                defer { group.leave() }
                if let error = error { lock.lock(); firstError = firstError ?? error; lock.unlock(); return }
                collection?.enumerateStatistics(from: start, to: end) { statistics, _ in
                    if let sum = statistics.sumQuantity() { add(statistics.startDate, key, sum.doubleValue(for: unit)) }
                }
            }
            store.execute(query)
        }

        quantity(.stepCount, unit: .count(), key: "steps")
        quantity(.activeEnergyBurned, unit: .kilocalorie(), key: "activeEnergyKcal")
        quantity(.distanceWalkingRunning, unit: .meter(), key: "distanceMeters")

        group.notify(queue: .main) {
            if let error = firstError { completion(.failure(error)); return }
            let output = rows.keys.sorted().compactMap { rows[$0] }
            completion(.success(output))
        }
    }

    private func respond(id: String, data: Any? = nil, error: String? = nil) {
        var payload: [String: Any] = ["id": id]
        if let data = data { payload["data"] = data }
        if let error = error { payload["error"] = error }
        guard let json = try? JSONSerialization.data(withJSONObject: payload),
              let string = String(data: json, encoding: .utf8) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.RumboHealthKit && window.RumboHealthKit.handleResponse(\(string));")
        }
    }
}

private extension ISO8601DateFormatter {
    static let rumboDay: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
}