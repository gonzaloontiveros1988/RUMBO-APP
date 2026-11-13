# RUMBO 3.0 — Inventario técnico inicial y plan de migración
**Base auditada:** `main/index.html` (lectura estática del blob Git)  
**Rama de trabajo:** `redesign/rumbo-os-v4`  
**No se ha ejecutado ni modificado la aplicación original.**

## 1. Hallazgos confirmados
- El HTML principal contiene aproximadamente 3.07 millones de caracteres y concentra la aplicación en un monolito.
- El documento declara PWA instalable, manifest, iconos y service worker.
- El código incluye Firebase JS compat para App, Auth, Firestore y Storage.
- Persistencia local: `localStorage`, clave `rumbo_v1`.
- Identificación de sincronización: `rumbo_sync_code`.
- Firebase project ID declarado en el cliente: `rumbo-a12ac`. La configuración web cliente no equivale a una credencial administrativa; no se deben copiar secretos al frontend.
- Autenticación anónima y persistencia LOCAL.
- Sincronización por `syncData/{code}`, que escribe un objeto con `state` y `updatedAt`, y escucha cambios en tiempo real.
- Storage se utiliza para fotos del diario de lugares.
- El payload excluye POI cache, autoBackups y varias claves económicas privadas.
- El comentario de implementación contempla el límite de 1 MB por documento Firestore.
- La lógica de merge aplica una regla basada en `updatedAt`; se debe revisar riesgo de sobrescritura concurrente.

## 2. Inventario funcional de alto nivel
### Vistas raíz
- Inicio
- Timer / bienestar
- Aviación
- Roster / Logbook
- Economía
- Actividades
- Progreso

### Capacidades y submódulos visibles
- Mapa mundial de vuelos y logbook.
- Roster mensual y detalle por día.
- Checklist pre-vuelo y documentos.
- Prevuelo, crucero, postvuelo, jetlag, escala.
- METAR/TAF, clima/luz de destino, relojes y WOCL.
- IM SAFE y registro/tendencia de fatiga.
- Dieta, macros, registro de comidas, menú semanal, menú familiar, batch cooking, comida de vuelo y snacks.
- Recetas, despensa, lista de compra y exportación PDF.
- Rutinas de gimnasio, layover, estiramientos y postura.
- Calendario y horario familiar, colegio, contactos, vacunas/revisiones, documentos, medicación infantil, tareas, asistenta y diario de niños.
- Economía, gastos, ingresos, dietas, pensión, ahorro, presupuesto, importación CSV de banco y exportaciones.
- Mapa familiar de viajes, destinos, POI, actividades, objetivos y resúmenes.

## 3. Riesgos técnicos a validar antes de ampliar
1. **Monolito:** separar gradualmente UI, dominio, persistencia e integraciones sin reemplazo big-bang.
2. **Documento Firestore único:** crecimiento, concurrencia, contención y límite de tamaño. Diseñar almacenamiento por hogar/usuario y dominios, con migración versionada.
3. **Código compartido:** evaluar entropía, hashing, límites de intentos, reglas Firestore/Storage, aislamiento de hogares y revocación. No asumir que el código de sincronización es una identidad segura.
4. **Datos sensibles:** la app maneja datos de salud, bienestar, menores y economía. Requiere consentimiento, minimización y scopes claros.
5. **Reglas remotas:** inspeccionar reglas actuales de Firestore/Storage y Authentication en Firebase Console; no son verificables desde el frontend.
6. **Backups:** comprobar formato, cobertura, restauración, retención y recuperación en un entorno de prueba.
7. **Conflictos:** probar dos dispositivos editando simultáneamente; establecer merge por entidad y trazabilidad.
8. **Importadores:** probar roster, logbook, CSV y PDF con fixtures anonimizados; no alterar datos de producción durante pruebas.

## 4. Estrategia de migración
### Etapa A — Congelar y respaldar
- Registrar commit y hash del estado legacy.
- Exportar backup completo desde la app y validar que puede restaurarse en una copia de prueba.
- No hacer cambios sobre `main`.

### Etapa B — Inventario exhaustivo
- Mapear cada ID DOM, función, acción de usuario, clave de estado y flujo de datos.
- Documentar cada integración externa y cada permiso.
- Clasificar funciones: conservar, rediseñar visualmente, refactorizar o retirar solo con aceptación explícita.

### Etapa C — Capa de compatibilidad
- Crear adaptadores tipados para leer/escribir el estado legacy.
- Introducir versionado y migraciones idempotentes.
- Mantener exportación de backup legacy.
- Evitar escrituras desde la nueva interfaz hasta validar permisos, esquema y rollback.

### Etapa D — Integración por dominios
1. Navegación e Inicio.
2. Aviation / Roster / Logbook.
3. Health / Training / Nutrition.
4. Family / Home / Travel.
5. Household Finance / Progress.
6. RUMBO AI y automatizaciones.

### Etapa E — Validación
- Comparación funcional legacy vs nueva interfaz.
- Pruebas de datos y sincronización en entorno de staging.
- Restauración de backups y rollback.
- Accesibilidad y pruebas reales en iPad, escritorio y móvil.
- Solo tras aceptación explícita, planificar transición de producción.

## 5. Lo que NO se ha verificado
- Reglas de seguridad, índices, cuotas o estructura real de Firestore.
- Estado real de Firebase Storage.
- Contenido de backups existentes o si restauran sin pérdida.
- Funcionamiento de cada módulo en tiempo de ejecución.
- Compatibilidad con todas las versiones de iOS/iPadOS.
- Existencia de APIs de roster o calendario accesibles desde cada aerolínea.

## 6. Próximas tareas técnicas
- Crear entorno de staging y datos sintéticos aislados.
- Extraer el esquema completo de DEFAULT_STATE y sus mutaciones.
- Añadir pruebas de importación y exportación.
- Especificar contrato de roster normalizado.
- Diseñar modelo multiusuario y permisos por hogar.
- Definir adaptador de HealthKit y calendario.
- Diseñar evaluaciones de IA y costes por plan mensual.
