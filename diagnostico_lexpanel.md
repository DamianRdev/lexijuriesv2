# Diagnóstico Técnico y UX/UI: LexPanel

Este documento detalla el análisis de la arquitectura frontend, UX/UI, calidad de código y preparación para escalabilidad de la aplicación **LexPanel** (desarrollada sobre TanStack Start, React 19, y Tailwind CSS v4).

---

## 1. Resumen Ejecutivo

LexPanel cuenta con una sólida base estética y de maquetación construida sobre **TanStack Start**, **React 19**, **Tailwind CSS v4** y **Radix UI**. Visualmente tiene un aspecto limpio y moderno, pero a nivel de código y arquitectura se comporta actualmente como una **plantilla estática enriquecida**.
La lógica de negocio está ausente, los datos simulados se importan directamente en los componentes, no se aprovechan las capacidades de persistencia o llamadas asíncronas con TanStack Query (que está instalado pero sin usar), y los estados de navegación (filtros) se pierden al navegar. Además, se observa deuda técnica en la duplicación de subcomponentes de presentación y en la implementación artesanal de elementos interactivos (como el calendario) habiendo primitivas robustas ya instaladas en el proyecto.

---

## 2. Qué Está Bien Resuelto

- **Configuración del Entorno y Estilos Modernos:** El uso de **Tailwind CSS v4** mediante `@tailwindcss/vite` e importación directa en `styles.css` está bien planteado. Los tokens de diseño en formato `oklch` (como el color primario de acento verde azulado profundo) dan una identidad sobria y profesional adecuada para el rubro legal.
- **Sistema de Rutas Moderno:** La estructura de carpetas en `src/routes` mediante **TanStack Router** (`$id.tsx` y layouts como `__root.tsx`) es excelente y está lista para soportar renderizado en el servidor (SSR) y optimización de carga.
- **Componentes UI base:** Se dispone de una gran variedad de componentes shadcn/ui en `src/components/ui` listos para usar (como inputs, dialogs, accordions, badges, etc.).
- **Responsive de navegación:** El `AppShell.tsx` resuelve de forma correcta la responsividad ocultando la barra lateral en móviles mediante un panel drawer lateral dinámico.

---

## 3. Qué Está Flojo o Incompleto

- **Interacciones sin lógica de persistencia:** Botones críticos como "Guardar nota" en `causas.$id.tsx` o "Nueva Causa" en `causas.tsx` no hacen nada; no modifican el estado simulado ni disparan modales.
- **Información procesal hardcodeada:** El banner de alerta en `index.tsx` que advierte de "3 vencimientos críticos" está escrito en texto plano fijo en lugar de calcularse a partir de la fecha y el estado real de los vencimientos de la base de datos.
- **Desperdicio de TanStack Query:** Aunque el `QueryClientProvider` envuelve el root en `__root.tsx`, no existe ni una sola query (`useQuery`) o mutación (`useMutation`). Todo lee directamente importaciones estáticas de `mockData.ts`.
- **Ausencia de Entidades Clave en el Modelo de Negocio:** El archivo de modelos `mockData.ts` modela `Causa`, `Vencimiento` y `Abogado`, pero carece de un modelo de `Cliente` o `Contacto`. Las causas muestran carátulas genéricas pero no asocian a qué cliente (actor o demandado) pertenece ni su información de contacto.

---

## 4. Problemas Técnicos Detectados

- **Duplicación de componentes visuales:** El componente de presentación `ToggleRow` está duplicado exactamente en:
  - `src/routes/equipo.tsx` (Líneas 77-117)
  - `src/routes/configuracion.tsx` (Líneas 285-326)
- **Reinvención del Calendario:** En `vencimientos.tsx` (Líneas 30-58), se calcula la grilla de días del mes manualmente usando aritmética de fechas y renderizado nativo con CSS Grid. Esto es deuda técnica considerando que ya existe `calendar.tsx` e `input-otp` / `date-fns` en el proyecto.
- **Pérdida de estado en los filtros:** En `causas.tsx` (Líneas 18-29), el filtrado se guarda en un `useState` local. Si el abogado busca un expediente, entra a ver el detalle y regresa con el botón del navegador, su búsqueda y filtros se pierden. Debería usar parámetros de búsqueda en la URL (`useSearch` de TanStack Router).
- **Consistencia de fechas rota:** En `index.tsx` (Línea 25), la constante `today` está fijada en el `23 de Mayo de 2026`. Sin embargo, la tabla "Movimientos de Hoy" muestra eventos ocurridos el `26 de Mayo de 2026` y `25 de Mayo de 2026` (fechas del futuro respecto al "hoy" del dashboard).
- **Spaghetti Code en Rutas:** Las páginas en `src/routes` contienen subcomponentes locales mezclados (por ejemplo, `Field`, `TabBtn`, `EmptyState` en `causas.$id.tsx`). A medida que crezca el código, estas páginas se volverán inmanejables.
- **Nomenclatura Híbrida (Spanglish):** El archivo de tipos mezcla términos en inglés y español. Ejemplo: `abogadoId`, `causaId`, `ultimoMovimientoFecha` en interfaces de `mockData.ts`.

---

## 5. Problemas de UX/UI Detectados

- **Dashboard Genérico:** La pantalla inicial no resalta flujos de trabajo clave para un abogado. No hay un contador de "Plazos de gracia" (las primeras 2 horas del día para presentar escritos judiciales en Argentina/CABA), ni indicativos claros de qué expedientes tienen novedades en portales oficiales (PJN / MEV).
- **Falta de Tareas Operativas (To-Do):** El sistema muestra vencimientos procesales (fechas límite impuestas por el juzgado) pero no permite gestionar tareas internas del estudio (ej. "Llamar a perito", "Preparar borrador de apelación").
- **Calendario No Interactivo:** En `vencimientos.tsx`, los puntos de colores en los días indican vencimientos, pero hacer clic en ellos no abre un popup ni filtra la lista inferior para ese día específico.
- **Overflow e incomodidad en tablas en móvil:** La tabla de causas procesales carece de una visualización optimizada para dispositivos móviles (cards colapsables) y depende de un scroll horizontal incómodo.

---

## 6. Riesgos si sigo construyendo sin Refactor

- **Bloqueo para Integrar Backend:** Si continúas desarrollando vistas basándote en la importación directa de `causas` de `mockData.ts`, cuando quieras conectar Supabase, PostgreSQL o una API externa, tendrás que reescribir prácticamente el 80% del estado y lógica de presentación de todas las páginas.
- **Colapso de Mantenibilidad en Rutas:** Agregar más tabs, modales de edición de causas y formularios en los mismos archivos de rutas actuales creará archivos de más de 1000 líneas difíciles de leer e imposibles de testear unitariamente.
- **Inconsistencias visuales:** Si cada ruta implementa sus propios componentes de interruptores, alertas o tarjetas vacías en lugar de reutilizar abstracciones compartidas, la interfaz comenzará a verse desalineada.

---

## 7. Mejoras Rápidas de Alto Impacto (Quick Wins)

1. **Unificar componentes repetidos:** Extraer el componente `ToggleRow` a un archivo compartido en `src/components` y usarlo en Configuración y Equipo.
2. **Sincronizar el banner de alertas del Dashboard:** Reemplazar el cálculo estático de alertas críticas en `index.tsx` por una función que filtre la lista real de `vencimientos` y cuente cuántos están en estado `"Crítico"`.
3. **Persistir filtros de causas en la URL:** Modificar la ruta `/causas` para que use el método de validación de parámetros de búsqueda (`validateSearch` y `useSearch` de TanStack Router). De esta forma, los filtros serán compartibles y persistentes.
4. **Hacer dinámicas las fechas del Dashboard:** Ajustar la constante `today` para usar `new Date()` (o simular una fecha coherente del lote de pruebas) para evitar que los "movimientos de hoy" figuren en fechas posteriores al encabezado.

---

## 8. Mejoras Estructurales Recomendadas

- **Arquitectura de Componentes / Capas:** Separar las páginas de la siguiente manera:
  ```text
  src/
  ├── components/          # Componentes globales reutilizables (Sidebar, Shell, ToggleRow)
  │   └── ui/              # Primitives de Radix y Estilos atómicos (Badge, Button)
  ├── features/            # Lógica y subcomponentes específicos del dominio de negocio
  │   ├── causas/          # Componentes como CausaCard, MovimientosTimeline, DetalleTabs
  │   ├── vencimientos/    # Calendario y listas específicas de vencimientos
  │   └── configuracion/   # Formularios de datos del estudio y preferencias
  ├── hooks/               # Hooks reutilizables (useCausas, useVencimientos)
  └── routes/              # EXCLUSIVAMENTE configuraciones de ruta, loaders y lazy-loading
  ```
- **Introducción de la capa de Servicios y React Query:** Crear funciones de fetching asíncronas para causas y vencimientos (que inicialmente apunten a promesas que resuelven los mocks con delay) y cargarlas mediante `useQuery`. Esto preparará la app para que la migración a una base de datos real sea tan simple como cambiar la URL del endpoint en los servicios.
- **Modelado de Clientes y Tareas:** Ampliar el esquema de datos en `mockData.ts` para soportar la entidad `Cliente` y asociarla a las causas para que el software responda a la estructura de un estudio jurídico real.

---

## 9. Orden Ideal de Trabajo

1. **Fase 1: Refactor UI & Quick Wins** (Unificar `ToggleRow`, banner dinámico, filtros URL).
2. **Fase 2: Arquitectura en Capas** (Separar `routes/` de componentes y lógica de negocio).
3. **Fase 3: Capa de Datos** (Implementar TanStack Query + Loaders simulados).
4. **Fase 4: Expansión de Negocio** (Entidad Clientes, Tareas y notas interactivas).
5. **Fase 5: Conexión a Base de Datos / Backend Real**.

---

## 10. Lista Concreta de Archivos a Modificar Primero

1. **`src/routes/causas.tsx`:** Implementar la búsqueda en URL mediante TanStack Router `validateSearch`.
2. **`src/routes/index.tsx`:** Corregir la coherencia de fechas entre `today` y los movimientos, y calcular dinámicamente el banner de alerta leyendo el array de `vencimientos`.
3. **`src/components/ToggleRow.tsx` (Crear nuevo):** Extraer la lógica duplicada de `configuracion.tsx` y `equipo.tsx`.
4. **`src/lib/mockData.ts`:** Refactorizar nombres de campos spanglish y añadir la estructura relacional para asociar causas con clientes reales.
