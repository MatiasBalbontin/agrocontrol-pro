export interface ContractKeyDefinition {
  key: string;
  label: string;
  category: 'Empresa' | 'Trabajador' | 'Faena' | 'Fechas y Ciudad' | 'Condiciones y Pago';
  description: string;
}

export const CONTRACT_KEYS_BY_CATEGORY: {
  category: 'Empresa' | 'Trabajador' | 'Faena' | 'Fechas y Ciudad' | 'Condiciones y Pago';
  keys: { key: string; label: string; example: string }[];
}[] = [
  {
    category: 'Empresa',
    keys: [
      { key: '{{EMPRESA_NOMBRE}}', label: 'Razón Social', example: 'Agrícola & Servicios del Valle SpA' },
      { key: '{{EMPRESA_RUT}}', label: 'RUT Empresa', example: '76.890.123-K' },
      { key: '{{EMPRESA_DOMICILIO}}', label: 'Domicilio Legal', example: 'Av. Libertador Bernardo O\'Higgins 1420, Curicó' },
      { key: '{{EMPRESA_REPRESENTANTE}}', label: 'Representante Legal', example: 'Juan Ignacio Valenzuela Prieto' },
      { key: '{{EMPRESA_REPRESENTANTE_RUT}}', label: 'RUT Representante', example: '12.345.678-9' },
    ],
  },
  {
    category: 'Trabajador',
    keys: [
      { key: '{{TRABAJADOR_NOMBRE}}', label: 'Nombre Completo', example: 'Rodrigo Esteban Morales Silva' },
      { key: '{{TRABAJADOR_RUT}}', label: 'RUT Trabajador', example: '18.452.193-4' },
      { key: '{{TRABAJADOR_NACIMIENTO}}', label: 'Nacimiento / Edad', example: '14 de mayo de 1995 (29 años)' },
      { key: '{{TRABAJADOR_ESTADO_CIVIL}}', label: 'Estado Civil', example: 'Soltero(a)' },
      { key: '{{TRABAJADOR_DOMICILIO}}', label: 'Domicilio Trabajador', example: 'Población Santa Inés, Pasaje Los Aromos 245' },
      { key: '{{TRABAJADOR_TELEFONO}}', label: 'Teléfono', example: '+56 9 8765 4321' },
    ],
  },
  {
    category: 'Faena',
    keys: [
      { key: '{{LABOR}}', label: 'Labor / Cargo', example: 'Cosecha y Recolección' },
      { key: '{{FAENA_NOMBRE}}', label: 'Nombre de Faena', example: 'Faena Fundo Los Lingues' },
      { key: '{{FAENA_UBICACION}}', label: 'Ubicación de Faena', example: 'Camino Los Lingues Km 4.5, San Fernando' },
    ],
  },
  {
    category: 'Fechas y Ciudad',
    keys: [
      { key: '{{CIUDAD_FIRMA}}', label: 'Ciudad de Firma', example: 'Curicó' },
      { key: '{{FECHA_INGRESO}}', label: 'Fecha de Ingreso', example: '15 de octubre de 2026' },
      { key: '{{FECHA_TERMINO}}', label: 'Fecha de Término / Caducidad', example: '30 de diciembre de 2026' },
    ],
  },
  {
    category: 'Condiciones y Pago',
    keys: [
      { key: '{{MODALIDAD_CONTRATO}}', label: 'Modalidad de Contrato', example: 'contrato de trabajo por faena determinada' },
      { key: '{{MODALIDAD_PAGO}}', label: 'Modalidad de Pago', example: 'diaria a razón' },
      { key: '{{VALOR_TARIFA}}', label: 'Tarifa / Remuneración', example: '28.000' },
      { key: '{{JORNADA_SEMANAL}}', label: 'Jornada Semanal', example: '40' },
      { key: '{{JORNADA_DIARIA}}', label: 'Jornada Diaria', example: '8' },
      { key: '{{AFP}}', label: 'AFP', example: 'Habitat' },
      { key: '{{SALUD}}', label: 'Salud', example: 'Fonasa (Tramo B)' },
    ],
  },
];

export const DEFAULT_CONTRACT_TEMPLATE = `# CONTRATO DE TRABAJO

En {{CIUDAD_FIRMA}}, a {{FECHA_INGRESO}}, entre {{EMPRESA_NOMBRE}}, RUT {{EMPRESA_RUT}} con domicilio en {{EMPRESA_DOMICILIO}}, representada legalmente por don {{EMPRESA_REPRESENTANTE}} rut: {{EMPRESA_REPRESENTANTE_RUT}}, en adelante denominado "El Empleador";

Y {{TRABAJADOR_NOMBRE}} Cédula de identidad N°{{TRABAJADOR_RUT}} nacido en {{TRABAJADOR_NACIMIENTO}}, estado civil {{TRABAJADOR_ESTADO_CIVIL}}, domiciliado en {{TRABAJADOR_DOMICILIO}}, en adelante denominado "El Trabajador", se ha convenido el siguiente {{MODALIDAD_CONTRATO}}:

### 1. Naturaleza del contrato
El presente contrato es de carácter temporal o de temporada y se celebra exclusivamente para la ejecución de una faena determinada, específicamente las labores {{LABOR}}, conforme al artículo 159 N°5 del Código del Trabajo.

La prestación de servicios es discontinua e intermitente, y la citación para trabajar queda sujeta a las necesidades y requerimientos diarios u horarios de la faena específica que se identifica en el punto 2. Solo se devengará remuneración por los días efectivamente citados y trabajados.

El trabajador declara conocer que este contrato tiene carácter de temporal o de temporada, conforme al artículo 159 N°5 del Código del Trabajo.

### 2. Función y lugar de trabajo
El trabajador se compromete a ejecutar las funciones {{LABOR}} en el predio o instalación ubicada en {{FAENA_NOMBRE}}, {{FAENA_UBICACION}}, pudiendo ser trasladado dentro de la misma comuna o faena agrícola, siempre que ello no implique menoscabo.

### 3. Jornada de trabajo
La jornada ordinaria máxima será de hasta {{JORNADA_SEMANAL}} horas semanales, distribuidas entre lunes y viernes, con un máximo de {{JORNADA_DIARIA}} horas diarias.

**3.1.** Horario: El horario de inicio y término de la jornada será determinado y notificado por El Empleador al Trabajador según las necesidades de la faena, respetando siempre los límites legales.

La jornada diaria incluirá media hora de colación que no será imputable a la jornada laboral, y por ende, no será remunerada, conforme al artículo 34 del Código del Trabajo.

**3.2. De la Citación:** El Trabajador se obliga a confirmar su disponibilidad para la faena con una antelación mínima de 24 horas si así se le requiere, quedando la obligación de prestar servicios estrictamente condicionada a la citación expresa del Empleador para un día determinado.

### 4. Remuneración
El empleador pagará al trabajador una remuneración {{MODALIDAD_PAGO}} de \${{VALOR_TARIFA}} pesos chilenos, por cada día efectivamente trabajado, conforme al artículo 44 del Código del Trabajo.

El pago se efectuará por períodos vencidos, dentro de los primeros diez días hábiles del mes siguiente, con los descuentos previsionales y de salud correspondientes.

**4.1. Semana Corrida:** El pago de la Semana Corrida, conforme al artículo 45 del Código del Trabajo, solo procederá si se cumplen copulativamente todos los requisitos establecidos por la ley y la jurisprudencia administrativa vigente de la Dirección del Trabajo (DT), especialmente el de continuidad y exclusividad de la remuneración diaria. Dada la naturaleza intermitente y discontinua del presente contrato, el derecho al pago estará supeditado a la estricta interpretación de la DT.

### 5. Cotizaciones previsionales y de salud
El empleador efectuará las retenciones y pagos previsionales correspondientes a {{AFP}}, salud ({{SALUD}}), y seguro de cesantía, conforme a las leyes vigentes.

Asimismo, el trabajador se encontrará cubierto por la mutualidad correspondiente (Ley 16.744 sobre accidentes del trabajo y enfermedades profesionales).

### 6. Feriado proporcional
En caso de término del contrato, el trabajador tendrá derecho al pago de feriado proporcional conforme al artículo 73 del Código del Trabajo. Este se calculará a razón de 1,25 días hábiles por cada mes completo trabajado. El pago de la tasa especial superior de 2,5 días hábiles por mes solo aplicará si la Dirección del Trabajo, en razón de la faena específica y su duración, la califica expresamente como de temporada bajo la interpretación que concede dicha tasa.

### 7. Causal de término
Este contrato finalizará, sin necesidad de desahucio ni pago de indemnización, por la causal del artículo 159 N°5 del Código del Trabajo, esto es, conclusión total de la faena específica que dio origen a la contratación.

### 8. Reglamento interno y obligaciones
El trabajador declara haber recibido copia del Reglamento Interno de Higiene y Seguridad de la empresa, y comprometerse a cumplir las instrucciones, medidas preventivas y protocolos de seguridad establecidos.

### 9. Domicilio y jurisdicción
Para todos los efectos derivados del presente contrato, las partes fijan domicilio en la comuna de {{CIUDAD_FIRMA}} y se someten a la jurisdicción de los Tribunales de Justicia de {{CIUDAD_FIRMA}}.

### 10. Declaración y firma
Ambas partes declaran haber leído íntegramente este contrato, firmando dos ejemplares del mismo, quedando uno en poder del trabajador.

<br><br>

**EL EMPLEADOR**

<br>
Firma: ____________________________________________
<br>
RUT: {{EMPRESA_RUT}}
<br><br><br>

**EL TRABAJADOR**

<br>
Firma: ____________________________________________
<br>
RUT: {{TRABAJADOR_RUT}}`;

import { Worker, Branch, AppSettings } from '../types';
import { formatFullChileanDate } from '../utils/formatters';

export function fillContractTemplate(
  template: string,
  worker: Worker,
  branch?: Branch,
  settings?: AppSettings
): string {
  let content = template || DEFAULT_CONTRACT_TEMPLATE;

  // Empresa
  content = content.replace(/\{\{EMPRESA_NOMBRE\}\}/g, settings?.companyName || 'Agrícola & Servicios del Valle SpA');
  content = content.replace(/\{\{EMPRESA_RUT\}\}/g, settings?.companyRut || '76.890.123-K');
  content = content.replace(/\{\{EMPRESA_DOMICILIO\}\}/g, settings?.companyAddress || 'Curicó, Región del Maule');
  content = content.replace(/\{\{EMPRESA_REPRESENTANTE\}\}/g, settings?.companyRepresentative || 'Juan Ignacio Valenzuela Prieto');
  content = content.replace(/\{\{EMPRESA_REPRESENTANTE_RUT\}\}/g, settings?.companyRepresentativeRut || settings?.companyRut || '12.345.678-9');

  // Trabajador
  content = content.replace(/\{\{TRABAJADOR_NOMBRE\}\}/g, worker.name || 'TRABAJADOR');
  content = content.replace(/\{\{TRABAJADOR_RUT\}\}/g, worker.rut || '');
  
  const nacimientoStr = worker.birthDate 
    ? `${formatFullChileanDate(worker.birthDate)} (${worker.age} años)` 
    : `${worker.age} años`;
  content = content.replace(/\{\{TRABAJADOR_NACIMIENTO\}\}/g, nacimientoStr);
  content = content.replace(/\{\{TRABAJADOR_ESTADO_CIVIL\}\}/g, worker.maritalStatus || 'Soltero(a)');
  content = content.replace(/\{\{TRABAJADOR_DOMICILIO\}\}/g, worker.address || 'Domicilio registrado en ficha');
  content = content.replace(/\{\{TRABAJADOR_TELEFONO\}\}/g, worker.phone || 'No registrado');

  // Faena
  content = content.replace(/\{\{LABOR\}\}/g, worker.labor || 'Labores Agrícolas');
  content = content.replace(/\{\{FAENA_NOMBRE\}\}/g, branch?.name || 'Faena Agrícola');
  content = content.replace(/\{\{FAENA_UBICACION\}\}/g, branch?.location || 'Ubicación de Faena');

  // Fechas y Ciudad
  content = content.replace(/\{\{CIUDAD_FIRMA\}\}/g, settings?.signatureCity || 'Curicó');
  content = content.replace(/\{\{FECHA_INGRESO\}\}/g, formatFullChileanDate(worker.hireDate) || 'Fecha de Ingreso');
  
  let terminoStr = 'Conclusión de la faena específica';
  if (worker.contractType === 'INDEFINIDO') {
    terminoStr = 'Indefinido';
  } else if (worker.contractEndDate) {
    terminoStr = formatFullChileanDate(worker.contractEndDate);
  }
  content = content.replace(/\{\{FECHA_TERMINO\}\}/g, terminoStr);

  // Condiciones y Pago
  let modalidadContrato = 'contrato de trabajo por faena determinada';
  if (worker.contractType === 'INDEFINIDO') {
    modalidadContrato = 'contrato de trabajo a plazo indefinido';
  } else if (worker.contractType === 'PLAZO_FIJO') {
    modalidadContrato = 'contrato de trabajo a plazo fijo';
  }
  content = content.replace(/\{\{MODALIDAD_CONTRATO\}\}/g, modalidadContrato);

  let modalidadPago = worker.paymentMode !== 'DÍA' ? 'a trato según rendimiento diario' : 'diaria a razón';
  content = content.replace(/\{\{MODALIDAD_PAGO\}\}/g, modalidadPago);

  const tarifaStr = worker.unitRate 
    ? worker.unitRate.toLocaleString('es-CL') 
    : '28.000';
  content = content.replace(/\{\{VALOR_TARIFA\}\}/g, tarifaStr);

  content = content.replace(/\{\{JORNADA_SEMANAL\}\}/g, worker.weeklyHours ? worker.weeklyHours.replace(/[^0-9]/g, '') || '40' : '40');
  content = content.replace(/\{\{JORNADA_DIARIA\}\}/g, worker.dailySchedule ? worker.dailySchedule.replace(/[^0-9]/g, '').slice(0, 1) || '8' : '8');
  content = content.replace(/\{\{AFP\}\}/g, worker.afp || 'Habitat');
  content = content.replace(/\{\{SALUD\}\}/g, worker.health || 'Fonasa');

  return content;
}
