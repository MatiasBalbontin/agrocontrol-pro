# Legión / AgroControl Pro - Sistema de Gestión Laboral y Recursos Humanos en Terreno

Sistema integral de gestión de personal, cuadrillas agrícolas, control de asistencia diaria, contratos de trabajo por faena (Código del Trabajo de Chile, Art. 159 N°5) e informes oficiales para contratistas agrícolas y empresas de servicios intensivos de mano de obra.

---

## 🎯 Capacidades Principales (Versión Web / Desktop)

### 1. Gestión de Faenas Operativas y Fundos
- **Administración descentralizada**: Registro y control independiente por predio, fundo, huerto o packing agrícola.
- **Asignación de jefatura**: Asociación de encargado de campo, ubicación física, teléfono de contacto y dotación activa.
- **Filtro global e individual**: Navegación instantánea entre el consolidado general de todas las faenas o la vista focalizada de una faena específica.

### 2. Cumplimiento Legal de Contratos y Alertas de Fiscalización
- **Regla de oro laboral**: Todo trabajador en faena debe contar obligatoriamente con su contrato de trabajo vigente y el documento de respaldo adjuntado en su ficha técnica.
- **Alertas visuales preventivas**: Indicador parpadeante (`animate-pulse`) en rojo `⚠️ Sin Contrato` o `⏳ Contrato Vencido` tanto en la nómina de trabajadores como en las tarjetas prioritarias del Dashboard.
- **Acción inmediata**: Acceso directo para regularizar o generar el contrato con un solo clic.

### 3. Plantilla Maestra de Contrato con Interpolación Dinámica (Art. 159 N°5)
- **Modelo legal oficial**: Plantilla estructurada en 10 cláusulas adaptadas rigurosamente al Código del Trabajo de Chile (Art. 159 N°5 para labores de temporada o faena determinada: citación intermitente, jornada, remuneración, semana corrida, feriado proporcional y mutualidad Ley 16.744).
- **Catálogo de llaves inteligentes para sustitución automática**:
  - **Empresa**: `{{EMPRESA_NOMBRE}}`, `{{EMPRESA_RUT}}`, `{{EMPRESA_DOMICILIO}}`, `{{EMPRESA_REPRESENTANTE}}`, `{{EMPRESA_REPRESENTANTE_RUT}}`
  - **Trabajador**: `{{TRABAJADOR_NOMBRE}}`, `{{TRABAJADOR_RUT}}`, `{{TRABAJADOR_NACIMIENTO}}`, `{{TRABAJADOR_ESTADO_CIVIL}}`, `{{TRABAJADOR_DOMICILIO}}`, `{{TRABAJADOR_TELEFONO}}`
  - **Faena**: `{{LABOR}}`, `{{FAENA_NOMBRE}}`, `{{FAENA_UBICACION}}`
  - **Fechas y Jurisdicción**: `{{CIUDAD_FIRMA}}`, `{{FECHA_INGRESO}}`, `{{FECHA_TERMINO}}`
  - **Condiciones y Remuneración**: `{{MODALIDAD_CONTRATO}}`, `{{MODALIDAD_PAGO}}`, `{{VALOR_TARIFA}}`, `{{JORNADA_SEMANAL}}`, `{{JORNADA_DIARIA}}`, `{{AFP}}`, `{{SALUD}}`
- **Editor en Configuración**: Texto base modificable por la administración con opción de restablecimiento al modelo oficial con un solo clic.
- **Impresión y vinculación exprés**: Generación instantánea de contrato en formato listo para firma física y botón *"Vincular como Contrato Vigente"* para anexarlo directamente al legajo del trabajador.

### 4. Ficha del Trabajador y Gestión Documental
- **Validación nativa de RUT chileno**: Algoritmo Módulo 11 con formateo automático (`XX.XXX.XXX-X`) y verificación de dígito verificador.
- **Enrolamiento ágil**: Datos obligatorios organizados para rápida confección contractual (RUT, nombre, faena, cargo, AFP, sistema de salud Fonasa/Isapre, jornada, tarifa) y campos complementarios opcionales (domicilio, estado civil, teléfono).
- **Legajo documental digital**: Resguardo de contratos firmados, papeletas de vacaciones o permisos, finiquitos laborales y cédulas de identidad.

### 5. Captura Diaria de Asistencia y Rendimiento en Terreno
- **Planilla rápida de asistencia**: Registro masivo de cuadrillas con casillas de verificación rápida y ajuste de unidades (días trabajados, kilos cosechados, horas o tareas).
- **Bloqueo y desbloqueo de jornada**: Protección contra modificaciones accidentales una vez cerrado el turno de faena.
- **Calendario operacional interactivo**: Visualización mensual y diaria de días con asistencia confirmada y acceso directo a las planillas históricas.

### 6. Informes Oficiales para Contabilidad y Dirección del Trabajo (DT)
- **Informe de Producción Detallado**: Planilla individual por trabajador con desglose de días o unidades laboradas y herramienta de ajuste supervisado de cantidades con justificación.
- **Informe General Físico**: Resumen ejecutivo consolidado que omite renglones en cero y totaliza rendimientos por faena y labor.
- **Informe Exprés de Altas**: Nómina de nuevos ingresos del período con estado de contrato, faena asignada y afiliación previsional (AFP/Salud).
- **Informe Exprés de Bajas**: Nómina de desvinculaciones con registro de causales legales de salida (conclusión de faena Art. 159 N°5, renuncia voluntaria, etc.) y estado de finiquito.
- **Formatos corporativos listos para impresión y exportación**: Diseños con membrete empresarial aptos para firma de supervisor y administración, además de exportación a Excel (`.xlsx` / `.csv`).

### 7. Bitácora de Auditoría e Integridad de Datos
- **Registro cronológico inmutable**: Registro automático de toda operación CRUD relevante (altas, bajas, reintegros, modificaciones de asistencia, respaldos y restauraciones).
- **Portabilidad total**: Respaldos completos en JSON y hojas de cálculo para resguardo independiente.

---

## 🛠️ Stack Tecnológico

El sistema está desarrollado como una aplicación web moderna, reactiva y autónoma, sin dependencias de servicios externos ni bloqueo de proveedores:

- **Frontend Core**: React 19 con TypeScript para tipado estático estricto.
- **Estilos y Diseño**: Tailwind CSS v4 con paleta visual adaptada para trabajo agrícola e industrial.
- **Tipografía**: Pila tipográfica nativa del sistema (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`) de alto rendimiento, sin conexiones ni telemetría a servidores externos.
- **Iconografía**: Lucide React.
- **Procesamiento de Archivos**: SheetJS (`xlsx`) para lectura y generación de planillas Excel/CSV.
- **Herramienta de Construcción**: Vite con recarga rápida de módulos (HMR).

---

## 📱 Roadmap Arquitectónico: Extensión a Dispositivos Móviles (Android & iOS)

> [!NOTE]
> Para consultar la especificación técnica completa de la futura aplicación móvil en React Native con Expo, consulte el documento: [MOBILE_ARCHITECTURE.md](file:///d:/Repos/agrocontrol-pro/MOBILE_ARCHITECTURE.md).
> El esquema maestro SQLITE compatible se encuentra en [src/services/db/schema.sql](file:///d:/Repos/agrocontrol-pro/src/services/db/schema.sql).

Para llevar la operación a fundos y faenas agrícolas sin cobertura de señal de internet, se proyecta la siguiente arquitectura móvil:

### 1. Motor de Persistencia Local Offline-First
- **Base de datos embebida**: Implementación con SQLite nativo o WatermelonDB para transacciones ultrarrápidas en dispositivo.
- **Seguridad y privacidad**: Cifrado local AES-256 en disco para proteger RUTs, datos personales y contratos de los trabajadores (cumplimiento Ley N° 19.628 y estándares de privacidad).
- **Esquema relacional**: Tablas para `faenas`, `trabajadores`, `documentos_adjuntos`, `asistencia_diaria`, `movimientos_altas_bajas` y `bitacora_auditoria`.

### 2. Sincronización Bidireccional Segura (Cloud Sync Engine)
- **Estrategia Delta Sync**:
  - Registro de cambios mediante vectores de versión (`updated_at`, UUIDs v4).
  - Cola de operaciones offline (`offline_mutation_queue`): Cuando el capataz o supervisor pasa lista en terreno sin señal, los registros se asientan localmente al instante.
  - Al recuperar señal (4G/5G/WiFi), la cola se procesa automáticamente hacia la base de datos central.
- **Resolución de conflictos**:
  - Mecanismo *Server-Authoritative with CRDT* o *Last-Write-Wins* para asistencia y rendimientos diarios.
  - Bloqueo de jornada guardada para evitar inconsistencias entre supervisores de una misma cuadrilla.

### 3. Escaneo y OCR de Cédulas y Contratos en Terreno
- **Captura fotográfica asistida**: Módulo nativo con detección automática de bordes de hojas físicas, recorte de perspectiva y compresión WebP.
- **Extracción de texto (OCR)**: Lectura óptica para extraer RUT, nombres y número de serie desde la cédula de identidad chilena, reduciendo el enrolamiento en terreno a pocos segundos.
- **Lectura de códigos QR**: Verificación de contratos y documentos electrónicos emitidos ante la Dirección del Trabajo (DT).

### 4. Firma Digital Táctil y Georreferenciación
- Firma ológrafa en pantalla táctil para contratos temporales, papeletas de entrega de EPP y comprobantes de asistencia.
- Incrustación de coordenadas GPS y estampa de tiempo dentro del documento PDF generado.

---

## 💻 Ejecución del Sistema

### Modo Aplicación de Escritorio (Sin Terminal ni Servidor)

Para que el cliente use la aplicación como un software nativo de escritorio sin abrir ventanas de consola negras ni levantar servidores manualmente:

1. **Crear acceso directo en el Escritorio (una sola vez)**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/crear_acceso_directo.ps1
   ```
   Esto creará el acceso directo **AgroControl Pro** en el escritorio de Windows.

2. **Uso diario**:
   - Doble clic en el icono **AgroControl Pro** de tu escritorio.
   - La aplicación abre su ventana nativa de escritorio inmediatamente.
   - No requiere servidor web, terminal ni archivos `.bat`.

3. **Actualizaciones desde GitHub**:
   - En **Ajustes > Actualizaciones (GitHub)**, haz clic en **"Descargar y Aplicar Actualización Ahora"**.
   - La app ejecuta el `git pull` en segundo plano y se reinicia automáticamente con la nueva versión.

---

### Modo Desarrollo Web (Navegador)

```bash
# Iniciar servidor de desarrollo en navegador
npm run dev

# Compilar bundle de producción
npm run build
```
