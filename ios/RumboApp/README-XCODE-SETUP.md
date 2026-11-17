# RUMBO 4.0 iOS · Apple HealthKit

El proyecto Xcode ya está incluido en `ios/RumboAppProject/RUMBO.xcodeproj`. No hay que crear un proyecto nuevo ni reemplazar la interfaz RUMBO 4.0.

## Abrir y compilar
1. Abre `ios/RumboAppProject/RUMBO.xcodeproj` en Xcode.
2. Selecciona el esquema `RUMBO` y un simulador iPhone para validar la interfaz.
3. Para instalarlo en tu iPhone, selecciona el dispositivo físico y configura tu Personal Team en **Signing & Capabilities**. El identificador actual es `com.rumbo.app`; si Apple exige uno propio, cámbialo en el target.
4. El target ya incluye la capacidad HealthKit, el permiso de lectura y la carpeta azul `rumbo-next` como recurso del bundle. Esa carpeta es la aplicación RUMBO 4.0, con su interfaz y módulos actuales.
5. Ejecuta la app en un iPhone real, entra en **Lifestyle → Apple Health**, pulsa **Connect Apple Health** y después **Refresh data**. Autoriza los tipos de datos que quieras compartir.

## Datos leídos
- Pasos, distancia caminando/corriendo y energía activa.
- Frecuencia cardiaca media, frecuencia cardiaca en reposo y HRV SDNN.
- Sueño y entrenamientos recientes (hasta 30 días).
- Los datos procedentes del Apple Watch aparecen cuando se sincronizan con Salud en el iPhone y el usuario autoriza su lectura.

Fitness y Nutrición muestran un resumen contextual local. La puntuación de recuperación es experimental, no médica; la actividad no cambia automáticamente calorías ni menús. Los datos permanecen en el dispositivo: no se suben a Supabase ni al asistente de IA.

## Límites y validación
- La web/PWA abierta en Safari no puede leer HealthKit. Hace falta la app nativa iOS.
- iOS no revela si el usuario denegó permisos de lectura; una autorización completada no demuestra que haya muestras disponibles.
- La actualización en segundo plano depende de iOS y no está garantizada por hora.
- GitHub Actions compila el target para simulador sin firma. La lectura real de Salud y la sincronización del Apple Watch requieren una prueba física en tu iPhone.
- Una cuenta Apple gratuita permite pruebas locales; TestFlight/App Store requiere membresía de pago.
