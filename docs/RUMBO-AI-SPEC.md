# RUMBO AI — Especificación funcional y de automatización
**Versión:** 0.1 · **Estado:** diseño funcional, pendiente de implementación y pruebas.

## Objetivo
Convertir los datos que el usuario ya introduce en RUMBO en propuestas útiles y, cuando exista permiso, acciones concretas. El asistente debe minimizar formularios y tareas repetitivas, reutilizar datos autorizados y pedir confirmación solo cuando sea necesaria.

## 1. Orquestador y especialistas
### Aviation Planner
**Entradas:** roster validado, zona horaria, perfil de operador, vuelos, vacaciones, calendario compartido autorizado.  
**Salidas:** calendario normalizado, siguiente servicio, ventanas de disponibilidad, cambios detectados, preparación personal y conflictos.  
**Límites:** no calcula ni certifica aptitud para volar; no sustituye documentación ni procedimientos operacionales.

### Recovery Coach
**Entradas:** horario de servicio, sueño y actividad autorizados, autoinforme de energía/esfuerzo, zona horaria.  
**Salidas:** sugerencias de sueño, siesta, luz, cafeína e intensidad de actividad, con incertidumbre explícita.  
**Límites:** orientación general; no diagnostica trastornos del sueño, no emite alertas de aptitud operacional.

### Training Coach
**Entradas:** objetivos, nivel, restricciones declaradas, equipamiento, sesiones anteriores, disponibilidad y señales de recuperación.  
**Salidas:** plan mensual, microciclo semanal, sesión diaria, alternativas de viaje/layover, progresión y revisión.  
**Límites:** evitar progresiones agresivas y adaptar o recomendar descanso ante dolor, enfermedad o fatiga relevante.

### Nutrition Coach
**Entradas:** objetivos, preferencias, alergias, restricciones, alimentos disponibles, roster y comidas familiares.  
**Salidas:** guía nutricional, estructura de comidas, hidratación y opciones para vuelo/escala.  
**Límites:** no crear dietas terapéuticas para condiciones médicas sin profesional cualificado.

### Family & Home Planner
**Entradas:** calendarios autorizados, miembros, tareas, recetas, despensa, presupuesto doméstico.  
**Salidas:** Family Week, menú, batch cooking, lista de compra, tareas y propuestas de actividades.  
**Límites:** no revelar eventos privados; cambios que afecten a otro miembro requieren permiso.

### Household Finance Coach
**Entradas:** presupuesto, movimientos importados y validados, gastos recurrentes, categorías y objetivos de ahorro.  
**Salidas:** previsión doméstica, desviaciones, coste de cesta/menú y oportunidades de ahorro.  
**Límites:** no transferir, comprar, invertir ni ejecutar pagos; no mezclar con el trading ni con el Family Office.

### Life Planner
Coordina a los especialistas y produce el plan diario, semanal y mensual priorizado. Resuelve conflictos con preferencias del usuario, no mediante reglas ocultas.

## 2. Flujo de roster a plan mensual
1. El usuario carga PDF, imagen, CSV o ICS.
2. El parser extrae duties, report times, sectores, aeropuertos, horarios locales y estado de reserva.
3. Normaliza husos horarios y fechas; cada evento conserva fuente y zona horaria.
4. Presenta una vista previa con campos inciertos resaltados.
5. El usuario confirma/corrige; solo entonces se guarda como roster validado.
6. Aviation Planner actualiza calendario y disponibilidad compartida según permisos.
7. Recovery Coach y Training Coach proponen sesiones y descansos.
8. Nutrition Coach y Family Planner generan menú y batch cooking.
9. Shopping Planner consolida ingredientes, despensa, cantidades y lista.
10. Finance Coach estima coste y lo compara con presupuesto.
11. Life Planner muestra un plan mensual y una agenda semanal que el usuario puede aprobar.
12. Cambios de roster recalculan únicamente las dependencias afectadas y muestran qué ha cambiado.

## 3. Niveles de autonomía
- **Nivel 0 — Consultar:** responder preguntas sobre datos existentes.
- **Nivel 1 — Recomendar:** crear propuestas sin modificar datos.
- **Nivel 2 — Preparar:** generar borradores de eventos, menús, compras y tareas.
- **Nivel 3 — Ejecutar con permiso:** guardar cambios autorizados, enviar invitaciones o actualizar calendarios.
- **Nivel 4 — Automatización acotada:** ejecutar reglas preaprobadas de bajo riesgo y notificar resultados.

Nunca permitir ejecución automática de pagos, compras, transferencias, inversión, cambios de permisos, borrado de datos o divulgación de información privada.

## 4. Contrato de recomendación
Cada salida de IA debe incluir:
- `recommendation_id`, usuario y ámbito (personal/familiar).
- Tipo de recomendación y fecha/hora de creación.
- Datos fuente y fecha de actualización.
- Supuestos, incertidumbre y nivel de confianza.
- Acción sugerida y efecto esperado.
- Si requiere aprobación y qué permiso la autoriza.
- Estado: draft, approved, rejected, executed, failed, superseded.
- Resultado y feedback posterior.

## 5. Memoria y aprendizaje
Guardar preferencias explícitas y feedback estructurado (recetas favoritas, duración de entrenamiento, horario preferido, ejercicios evitados, presupuesto objetivo). No inferir rasgos sensibles ni guardar información de salud adicional sin consentimiento. El usuario puede revisar, corregir y borrar preferencias.

## 6. Evaluación y calidad
- Exactitud de extracción del roster por campo y formato.
- Tasa de correcciones manuales.
- Proporción de recomendaciones aceptadas/modificadas/rechazadas.
- Adherencia y progresión del entrenamiento, sin incentivar sobreentrenamiento.
- Desperdicio y coste estimado frente al real de menús.
- Precisión de presupuestos frente a movimientos validados.
- Conflictos de calendario detectados y falsos positivos.
- Latencia y coste por plan.
- Auditoría de acciones, permisos y errores.

## 7. Diseño técnico
- Capa de proveedor de IA intercambiable.
- Esquemas JSON validados para extracción y planes.
- Herramientas separadas por dominio y permisos.
- Contexto recuperado solo desde fuentes autorizadas.
- Tareas largas en segundo plano con estado visible.
- Idempotencia, reintentos, registro y rollback.
- Evaluación offline con casos sintéticos y datos anonimizados antes de producción.

## 8. Ejemplo de resultado mensual
El usuario recibe:
- Calendario laboral y familiar validado.
- Plan de entrenamiento con alternativas por jornada.
- Recomendaciones de recuperación y autocheck-ins.
- Menú personal y familiar.
- Batch cooking y lista de compra.
- Presupuesto estimado y objetivo de ahorro.
- Resumen de cambios y decisiones pendientes.

Todos los datos de ejemplo deben identificarse como demostración hasta que el usuario conecte fuentes reales.
