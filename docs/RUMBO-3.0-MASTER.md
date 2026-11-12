# RUMBO 3.0 — Documento maestro de producto
**Estado:** definición funcional inicial / auditoría técnica en curso  
**Rama de trabajo:** `redesign/rumbo-os-v4`  
**Producción:** no modificar `main`, dominios ni despliegues de producción durante esta fase.

## 1. Visión
RUMBO es un sistema operativo personal y familiar para profesionales de la aviación. Su propósito no es exigir más introducción manual de datos, sino convertir la información autorizada del usuario (roster, calendario, preferencias, objetivos, actividad, menús y presupuesto) en planes coordinados y acciones revisables.

**Principio de producto:** la aplicación trabaja para el usuario. Captura una vez, reutiliza el contexto, propone un plan y aprende de las correcciones, manteniendo siempre control, transparencia y privacidad.

## 2. Usuarios y espacios
- **Espacio personal:** perfil profesional, roster, vuelos, logbook, salud/bienestar, entrenamiento, nutrición personal, objetivos y finanzas privadas.
- **Espacio familiar compartido:** calendarios y disponibilidad compartida, comidas, recetas, compras, tareas, colegio, reservas, viajes y presupuesto doméstico.
- **Perfiles individuales:** cada miembro dispone de identidad, preferencias y permisos propios. La pareja no recibe automáticamente acceso al logbook, datos profesionales, métricas de salud o información privada del piloto.
- **Perfil profesional configurable:** aerolínea/operador, tipo de operación, zona horaria, flota, formatos de roster y reglas locales. RUMBO no se limita a una aerolínea.

## 3. Sistemas funcionales
### 3.1 Aviation
Roster mensual, importación PDF/imagen/CSV/ICS, extracción asistida, revisión de confianza, vuelos y sectores, mapa mundial de rutas, aeropuertos y países, logbook, estadísticas, escalas, documentos, calendario y ventanas de disponibilidad. No sustituye EFB, despacho, documentación operacional ni sistemas oficiales de la compañía.

### 3.2 Health & Recovery
Registro opcional de sueño, actividad, esfuerzo percibido, energía y recuperación; integración autorizada con Apple Health/HealthKit u otras fuentes compatibles; recomendaciones prudentes de descanso y hábitos. No diagnostica, no certifica aptitud para volar y no sustituye FRMS, límites de servicio ni consejo médico.

### 3.3 Training
Perfil de entrenamiento, objetivos, experiencia, equipamiento, ejercicios, progresión, fuerza, cardio y movilidad. El plan mensual/semanal se adapta al roster, descanso reportado y preferencias. El usuario confirma o ajusta sesiones; se registra adherencia y progresión. No recomendar intensidad alta si hay señales de recuperación insuficiente.

### 3.4 Nutrition
Objetivos y preferencias personales, alergias/restricciones, hidratación, comidas adaptadas a turnos y viajes. Recomendaciones generales; planes clínicos o terapéuticos requieren profesional cualificado.

### 3.5 Family & Home
Calendario compartido con permisos, disponibilidad, Family Week, colegio, documentos, reservas, tareas, actividades, recetas, menú semanal, lista de compra colaborativa y planificación de vacaciones. Los cambios de roster recalculan disponibilidad, no publican automáticamente datos privados.

### 3.6 Household Finance
Presupuesto doméstico, categorías, gastos recurrentes, cesta de supermercado, coste estimado de menús, objetivos de ahorro y comparación real vs presupuesto. Empezar con entrada manual/importación de extractos; evaluar proveedores bancarios compatibles con el país antes de prometer conexión bancaria automática.

### 3.7 Travel & Experiences
Mapa familiar de países visitados y deseados, destinos, POI, ideas por destino, vacaciones y recuerdos compartidos.

### 3.8 Goals & Progress
Objetivos personales/familiares, hábitos, revisión semanal y mensual, métricas de progreso y recomendaciones.

## 4. RUMBO AI — arquitectura de agentes
Un orquestador central coordina especialistas con contexto autorizado:
1. **Aviation Planner:** interpreta roster, detecta servicios/descansos y disponibilidad.
2. **Recovery Coach:** contextualiza sueño y recuperación; solo orientación de bienestar.
3. **Training Coach:** planifica y ajusta sesiones y progresión.
4. **Nutrition Coach:** preferencias, comidas y objetivos.
5. **Family & Home Planner:** calendario, menú, compras y tareas.
6. **Household Finance Coach:** presupuesto y ahorro cotidiano.
7. **Life Planner:** coordina prioridades y prepara plan diario/semanal/mensual.

### Flujo de inteligencia
Ingesta → extracción estructurada → validación del usuario → contexto autorizado → planificación → propuesta explicada → aprobación/ejecución → registro de resultado → aprendizaje de preferencias.

### Reglas de ejecución
- Proponer por defecto; ejecutar solo acciones previamente autorizadas.
- Requieren confirmación: compras, pagos, transferencias, compromisos externos, cambios de calendario de otros miembros, envío de mensajes y modificaciones irreversibles.
- Cada recomendación debe explicar datos utilizados, supuestos, confianza y motivo.
- Permitir editar, rechazar, deshacer y consultar historial.
- Nunca inferir aptitud para volar ni alterar restricciones operacionales.

## 5. Motor mensual
1. Importar roster y detectar eventos.
2. Mostrar incidencias y campos dudosos para validación.
3. Construir calendario laboral y ventanas familiares.
4. Preparar propuesta de entrenamiento y recuperación.
5. Preparar menú personal/familiar y cantidades.
6. Consolidar ingredientes y generar lista de compra.
7. Preparar previsión doméstica y presupuesto.
8. Generar plan mensual y revisión semanal.
9. Recalcular solo los elementos afectados cuando cambie un vuelo o compromiso.

## 6. Datos y entidades principales
- UserProfile, Household, HouseholdMember, Role, Permission
- CrewProfile, RosterImport, Duty, FlightSector, Airport, Route, LogbookEntry
- SleepRecord, ActivityRecord, RecoveryCheckIn, TrainingPlan, Workout, Exercise, WorkoutResult
- NutritionProfile, FoodPreference, Recipe, MealPlan, Meal, Ingredient, ShoppingList, ShoppingItem
- CalendarEvent, AvailabilityWindow, FamilyTask, SchoolDocument, Reservation
- HouseholdBudget, Expense, RecurringExpense, SavingsGoal
- TravelDestination, VisitedCountry, WishlistDestination, Trip
- AIRecommendation, PlanVersion, Approval, ActionLog, Feedback

Los registros deben incluir propietario, ámbito (privado/familiar), permisos, fuente, fecha de actualización y trazabilidad. Evitar duplicar entidades cuando se puedan referenciar desde distintos módulos.

## 7. Integraciones y estrategia
- Firebase existente: auditar Auth, Firestore/Realtime Database, Storage, Functions, reglas y backups antes de migrar o cambiar esquemas.
- Calendarios: importación/exportación ICS y conectores autorizados; sincronización bidireccional solo tras definir conflictos y permisos.
- Roster: PDF, imagen, CSV, ICS y formatos específicos por operador; extracción siempre revisable.
- Salud: HealthKit/Apple Health cuando se autorice; no pedir datos manuales que ya estén conectados.
- IA: proveedor intercambiable detrás de una capa de servicio; esquemas estructurados, herramientas con permisos, evaluación y límites de coste.
- Finanzas: CSV/OFX cuando proceda; investigar disponibilidad regional para Qatar antes de elegir Open Banking.
- AppDeck Family Office: fase futura, integración explícita y de solo lectura inicialmente, solo métricas agregadas y autorizadas. Mantener proyectos, bases y credenciales separados.

## 8. Privacidad, seguridad y confianza
- Separación estricta personal/familiar/profesional.
- Acceso mínimo necesario y permisos por miembro.
- Cifrado en tránsito y reposo; secretos solo en servidor.
- Registro de accesos y acciones de IA.
- Exportación, borrado y retención configurables.
- Consentimiento explícito para salud, calendario, documentos y finanzas.
- No mostrar datos de un miembro a otro por defecto.
- Nunca usar información de salud para decisiones operacionales.

## 9. Diseño de experiencia
Dirección visual: aviation-led, premium, técnica, legible y calmada.
- Midnight Navy #101C2B
- Graphite Blue #1C2C3D
- Aviation Cyan #36B8C5
- Amber #E5A85C
- Cloud White #E9EEF3
- Diseño de escritorio con paneles y mapa; iPad como experiencia principal táctil; móvil para acciones rápidas.
- Evitar estética de organizador doméstico genérico y evitar exceso de elementos de cabina/simulador.
- La vista de inicio prioriza: situación del día, siguiente servicio, plan personal, disponibilidad familiar y recomendaciones pendientes.

## 10. Fases
0. Auditoría de código, Firebase, funciones, datos y backups.
1. Nueva interfaz y sistema de navegación; experiencia responsive escritorio/iPad/móvil.
2. Aviation Intelligence: roster, logbook, mapa y disponibilidad.
3. Health & Training: recuperación y entrenador adaptativo.
4. Nutrition & Family Home: menú, recetas, compra y tareas.
5. Household Finance: presupuesto y ahorro doméstico.
6. RUMBO AI: orquestación, aprobaciones, memoria de preferencias y evaluación.
7. Travel, Goals y conexiones ampliadas.
8. Integración con Family Office mediante contrato seguro y limitado.

## 11. Criterios de aceptación
- Ninguna funcionalidad original se elimina sin inventario, equivalencia y aprobación posterior del usuario.
- Ningún dato real se sustituye por fixtures/demo.
- Importaciones muestran vista previa y permiten corregir.
- Recomendaciones muestran fuente y motivo.
- La IA no ejecuta acciones sensibles sin aprobación.
- iPad, escritorio y móvil tienen layouts diseñados, no solo escalados.
- Pruebas de autenticación, sincronización, permisos, backups y restauración.
- Producción permanece intacta hasta completar auditoría, pruebas y aceptación.

## 12. Estado técnico conocido al iniciar v4
- Repositorio: gonzaloontiveros1988/RUMBO-APP; rama principal main.
- Rama de trabajo creada desde redesign/rumbo-family-os-v3: redesign/rumbo-os-v4.
- index.html es un monolito de aproximadamente 3.08 MB; el conector no ha permitido leer su contenido porque está minificado/no accesible por líneas. Requiere inspección local o extracción por Git blob/checkout antes de integración.
- family-preview.html es un prototipo separado de aproximadamente 32.6 KB, con datos de demostración y sin conexión Firebase. No es la aplicación funcional.
- La auditoría de Firebase, módulos originales, reglas y backups está pendiente. No afirmar que se ha verificado la integridad de estos elementos hasta inspeccionarlos.
- No se modificará main ni se reasignarán dominios de producción.

## 13. Auditoría funcional del código original (lectura estática del index.html de main)
La inspección del HTML original de 3.066.277 caracteres confirma que RUMBO ya contiene mucho más producto del que mostraba el prototipo previo. No se debe reconstruir ignorando estas capacidades.

### Capacidades existentes identificadas en el código
- **Inicio:** mapa mundial de vuelos, resumen de actividad, calendario/roster, tablero semanal familiar, vigencia de documentos y checklist pre-vuelo.
- **Salud y hábitos:** datos de salud, estado de ánimo, rutinas de sueño, meditación, respiración, seguimiento y programas de bienestar.
- **Nutrición:** objetivo de calorías/macros, registro alimentario, menú semanal personal, menú familiar de cenas, batch cooking, alternativas de comida en vuelo, snacks y seguimiento corporal.
- **Compra y cocina:** planificador de compra, cantidades por personas, despensa, recetario familiar, recetas guardadas y exportación PDF de la compra.
- **Entrenamiento:** rutina de gimnasio, rutina de layover, estiramientos y contenidos de movilidad.
- **Familia:** clases/horarios escolares, checklist del colegio, calendario escolar, contactos, cumpleaños, vacunas/revisiones, documentos y medicación infantil, coordinación de recogidas, diario de niños, tareas domésticas y ayuda del hogar.
- **Aviación:** modos pre-vuelo/crucero/post-vuelo/jetlag/escala/documentos; relojes; información de destino; WOCL; snacks; METAR/TAF; clima/luz; maleta; comida/cafeína; IM SAFE; registro y tendencia de fatiga.
- **Roster y logbook:** calendario mensual, detalle diario, alertas de descanso, logbook y mapas.
- **Economía:** ingresos, gastos, dietas, presupuesto, cartera de efectivo, ahorro, pensión, gastos fijos, importación CSV de extractos, conversión de divisas y exportación CSV.
- **Viajes y progreso:** mapa familiar de viajes, destinos, POI, objetivos, resumen semanal/mensual y generación PDF.
- **Otras funciones:** documentos, contactos de tripulación, bids/escenarios, vacaciones, relojes y utilidades de bienestar.

### Estado y persistencia identificados
- El estado principal se inicializa desde `localStorage` con clave `rumbo_v1` y se compone sobre `DEFAULT_STATE`.
- Firebase JS compat se usa para Authentication, Firestore y Storage.
- La autenticación se inicia anónimamente; persistencia local de sesión.
- La sincronización compartida utiliza Firestore `syncData/{syncCode}`, con un documento que contiene `state` y `updatedAt`; listener en tiempo real.
- El código de sincronización se guarda localmente como `rumbo_sync_code`.
- El payload de sincronización excluye caché POI, backups automáticos y ciertas claves económicas/privadas.
- Las claves excluidas explícitamente de la nube incluyen sueldo, pensión y determinados saldos/objetivos de ahorro.
- Las fotos del diario de lugares pueden subirse a Firebase Storage; caché y fotos locales no subidas permanecen en dispositivo.
- El comentario de implementación indica que el documento Firestore debe mantenerse por debajo de 1 MB.
- El sistema local conserva más datos que el payload remoto. Es esencial preservar esta distinción en cualquier migración.

### Riesgos y comprobaciones pendientes
- La auditoría ha sido estática sobre el código; no se han consultado las reglas reales de Firestore/Storage, índices, configuración de Authentication, cuotas, backups ni consola Firebase.
- El modelo de sincronización por código compartido necesita una revisión de seguridad: fortaleza/entropía del código, reglas, aislamiento entre hogares, colisiones, recuperación y control de acceso. No asumir que autenticación anónima + código compartido equivale a una identidad familiar segura.
- El documento único de Firestore puede alcanzar límites de tamaño y genera riesgo de conflictos de escritura/última actualización. Antes de ampliar datos o perfiles compartidos conviene diseñar colecciones por hogar/usuario y migración versionada, manteniendo compatibilidad hacia atrás.
- La aplicación incluye datos de salud y de menores, así como información financiera privada. Requiere controles de acceso y consentimiento antes de cualquier nueva sincronización.
- El prototipo `rumbo-os-preview.html` es una interfaz aislada con datos ilustrativos, sin autenticación ni conexión al estado original. No se debe confundir con una migración funcional.

### Decisión de migración
No sustituir `index.html` en bloque. Primero inventariar funciones, claves de estado, eventos y módulos; después construir adaptadores que lean/escriban el modelo existente de forma controlada; luego migrar módulo a módulo con exportación, copia previa, pruebas de ida/vuelta y rollback. Mantener la aplicación legacy accesible hasta superar la validación de equivalencia.
