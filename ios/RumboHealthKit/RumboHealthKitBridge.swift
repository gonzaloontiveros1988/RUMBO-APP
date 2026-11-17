import Foundation
import HealthKit
import WebKit

/// HealthKit reader exposed only to RUMBO's bundled, local WKWebView.
final class RumboHealthKitBridge: NSObject, WKScriptMessageHandler {
    private let store = HKHealthStore()
    private weak var webView: WKWebView?
    private var observerQueries: [HKObserverQuery] = []
    private let isoDay: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        startBackgroundObservation()
    }

    private var readableTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        let ids: [HKQuantityTypeIdentifier] = [
            .stepCount, .distanceWalkingRunning, .activeEnergyBurned,
            .heartRate, .restingHeartRate, .heartRateVariabilitySDNN
        ]
        ids.compactMap(HKObjectType.quantityType(forIdentifier:)).forEach { types.insert($0) }
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        types.insert(HKObjectType.workoutType())
        return types
    }

    /// Ask HealthKit for background updates where the OS/device permits them.
    /// Delivery is opportunistic, not real-time or guaranteed.
    private func startBackgroundObservation() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        for objectType in readableTypes {
            guard let sampleType = objectType as? HKSampleType else { continue }
            let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] _, completion, error in
                defer { completion() }
                guard error == nil else { return }
                DispatchQueue.main.async {
                    self?.webView?.evaluateJavaScript("window.dispatchEvent(new Event('rumbo-healthkit-updated'))")
                }
            }
            observerQueries.append(query)
            store.execute(query)
            store.enableBackgroundDelivery(for: sampleType, frequency: .hourly) { _, _ in
                // Background delivery may be unavailable for a type or restricted by iOS.
            }
        }
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
            store.requestAuthorization(toShare: [], read: readableTypes) { [weak self] _, error in
                if let error = error { self?.respond(id: id, error: error.localizedDescription); return }
                // HealthKit deliberately does not reveal read-permission decisions.
                self?.respond(id: id, data: ["requestCompleted": true])
            }
        case "readDailySummary":
            let days = min(max(body["days"] as? Int ?? 7, 1), 30)
            readDashboard(days: days) { [weak self] result in
                switch result {
                case .success(let data): self?.respond(id: id, data: data)
                case .failure(let error): self?.respond(id: id, error: error.localizedDescription)
                }
            }
        default:
            respond(id: id, error: "Acción HealthKit no reconocida.")
        }
    }

    private func readDashboard(days: Int, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        guard let start = calendar.date(byAdding: .day, value: -days + 1, to: calendar.startOfDay(for: now)) else {
            completion(.success(["days": [], "workouts": []])); return
        }
        let group = DispatchGroup()
        let lock = NSLock()
        var rows: [String: [String: Any]] = [:]
        var workouts: [[String: Any]] = []
        var firstError: Error?

        func record(_ date: Date, _ key: String, _ value: Double) {
            lock.lock(); defer { lock.unlock() }
            let day = isoDay.string(from: date)
            var row = rows[day] ?? ["date": day]
            row[key] = value
            rows[day] = row
        }
        func setError(_ error: Error) {
            lock.lock(); defer { lock.unlock() }
            firstError = firstError ?? error
        }
        func quantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, key: String,
                      option: HKStatisticsOptions, transform: ((Double) -> Double)? = nil) {
            guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return }
            group.enter()
            let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
            let query = HKStatisticsCollectionQuery(quantityType: type, quantitySamplePredicate: predicate,
                options: option, anchorDate: calendar.startOfDay(for: start),
                intervalComponents: DateComponents(day: 1))
            query.initialResultsHandler = { _, collection, error in
                defer { group.leave() }
                if let error = error { setError(error); return }
                collection?.enumerateStatistics(from: start, to: now) { stats, _ in
                    let sample = option.contains(.cumulativeSum) ? stats.sumQuantity() : stats.averageQuantity()
                    if let sample {
                        let raw = sample.doubleValue(for: unit)
                        record(stats.startDate, key, transform?(raw) ?? raw)
                    }
                }
            }
            store.execute(query)
        }

        quantity(.stepCount, unit: .count(), key: "steps", option: .cumulativeSum)
        quantity(.activeEnergyBurned, unit: .kilocalorie(), key: "activeEnergyKcal", option: .cumulativeSum)
        quantity(.distanceWalkingRunning, unit: .meter(), key: "distanceMeters", option: .cumulativeSum)
        quantity(.heartRate, unit: HKUnit.count().unitDivided(by: .minute()), key: "heartRateBpm", option: .discreteAverage)
        quantity(.restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()), key: "restingHeartRateBpm", option: .discreteAverage)
        quantity(.heartRateVariabilitySDNN, unit: .secondUnit(with: .milli), key: "hrvSdnnMs", option: .discreteAverage)

        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: [])
            let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit,
                                      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { [weak self] _, samples, error in
                defer { group.leave() }
                if let error { setError(error); return }
                let values = (samples as? [HKCategorySample]) ?? []
                var durations: [String: TimeInterval] = [:]
                for sample in values {
                    let asleep = sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue ||
                        sample.value == HKCategoryValueSleepAnalysis.asleepCore.rawValue ||
                        sample.value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                        sample.value == HKCategoryValueSleepAnalysis.asleepREM.rawValue
                    guard asleep else { continue }
                    // Attribute sleep to the local date on which the sleep interval ends.
                    let key = self?.isoDay.string(from: sample.endDate) ?? ""
                    durations[key, default: 0] += sample.endDate.timeIntervalSince(sample.startDate)
                }
                for (day, seconds) in durations {
                    lock.lock()
                    var row = rows[day] ?? ["date": day]
                    row["sleepHours"] = seconds / 3600
                    rows[day] = row
                    lock.unlock()
                }
            }
            store.execute(query)
        }

        group.enter()
        let workoutPredicate = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
        let workoutQuery = HKSampleQuery(sampleType: .workoutType(), predicate: workoutPredicate, limit: 100,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, error in
                defer { group.leave() }
                if let error { setError(error); return }
                workouts = ((samples as? [HKWorkout]) ?? []).map { workout in
                    [
                        "date": self.isoDay.string(from: workout.startDate),
                        "activity": workout.workoutActivityType.name,
                        "durationMinutes": workout.duration / 60,
                        "activeEnergyKcal": workout.totalEnergyBurned.map { $0.doubleValue(for: .kilocalorie()) } ?? 0,
                        "distanceMeters": workout.totalDistance.map { $0.doubleValue(for: .meter()) } ?? 0,
                        "source": workout.sourceRevision.source.name
                    ]
                }
            }
        store.execute(workoutQuery)

        group.notify(queue: .main) {
            if let firstError { completion(.failure(firstError)); return }
            let output = rows.keys.sorted().compactMap { rows[$0] }
            completion(.success(["days": output, "workouts": workouts]))
        }
    }

    private func respond(id: String, data: Any? = nil, error: String? = nil) {
        var payload: [String: Any] = ["id": id]
        if let data { payload["data"] = data }
        if let error { payload["error"] = error }
        guard JSONSerialization.isValidJSONObject(payload),
              let json = try? JSONSerialization.data(withJSONObject: payload),
              let string = String(data: json, encoding: .utf8) else {
            DispatchQueue.main.async { [weak self] in self?.webView?.evaluateJavaScript("window.RumboHealthKit && window.RumboHealthKit.handleResponse({id:'\(id)',error:'No se pudo serializar la respuesta de HealthKit.'});") }
            return
        }
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.RumboHealthKit && window.RumboHealthKit.handleResponse(\(string));")
        }
    }
}

private extension HKWorkoutActivityType {
    var name: String {
        switch self {
        case .running: return "Running"
        case .walking: return "Walking"
        case .cycling: return "Cycling"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "Strength training"
        case .swimming: return "Swimming"
        case .rowing: return "Rowing"
        case .yoga: return "Yoga"
        case .highIntensityIntervalTraining: return "HIIT"
        default: return "Workout"
        }
    }
}
