'use strict';

// Definición de los temas de consulta.
// Cada tema tiene: preguntas específicas para el formulario, orientación
// general (con citas normativas) y la documentación útil para la entrevista.
//
// IMPORTANTE: los textos de orientación son información general. Revisalos y
// adaptalos a tu criterio profesional antes de publicar la app.

const SI_NO = ['Sí', 'No'];
const SI_NO_NS = ['Sí', 'No', 'No sé'];

const temas = [
  {
    id: 'alimentos',
    titulo: 'Cuota alimentaria',
    resumen: 'Reclamo, fijación, aumento o incumplimiento de la cuota alimentaria de hijas e hijos.',
    campos: [
      { id: 'rol', label: '¿Cuál es tu situación?', type: 'select', required: true,
        options: ['Quiero reclamar alimentos', 'Me están reclamando alimentos', 'Quiero modificar una cuota existente'] },
      { id: 'hijos', label: 'Cantidad y edades de las hijas/os', type: 'text', required: true, max: 200,
        placeholder: 'Ej.: 2 hijos, de 5 y 9 años' },
      { id: 'cuota_actual', label: '¿Existe hoy una cuota fijada o acordada?', type: 'select', required: true,
        options: ['No hay cuota', 'Hay un acuerdo informal', 'Hay un convenio homologado o sentencia'] },
      { id: 'cumplimiento', label: '¿Se está pagando?', type: 'select', required: false,
        options: ['Se paga completa', 'Se paga en parte o con atraso', 'No se paga', 'No corresponde'] },
      { id: 'trabajo_otro', label: '¿Sabés a qué se dedica o dónde trabaja el otro progenitor?', type: 'text',
        required: false, max: 300 },
    ],
    orientacion: [
      'Ambos progenitores deben alimentos a sus hijas e hijos hasta los 21 años (art. 658 CCyC), y la obligación puede extenderse hasta los 25 si estudian o se capacitan y eso les impide sostenerse (art. 663 CCyC).',
      'Los alimentos comprenden manutención, educación, esparcimiento, vestimenta, habitación, asistencia y gastos por enfermedad (art. 659 CCyC). Las tareas cotidianas de cuidado que realiza el progenitor conviviente tienen valor económico y son un aporte (art. 660 CCyC).',
      'Durante el proceso se pueden pedir alimentos provisorios (art. 544 CCyC). Lo que se fije se debe desde la demanda o desde la interpelación fehaciente, si la demanda se inicia dentro de los seis meses (art. 669 CCyC).',
      'Ante el incumplimiento, el juez puede disponer medidas para asegurar el pago (art. 553 CCyC), entre ellas la inscripción en el Registro de Deudores Alimentarios Morosos de la Provincia (Ley 13.074).',
    ],
    documentacion: [
      'DNI propio y de las hijas/os',
      'Partidas de nacimiento de las hijas/os',
      'Comprobantes de gastos (escuela, salud, alquiler, actividades)',
      'Datos laborales del otro progenitor (empleador, CUIL, actividad), si los tenés',
      'Acuerdos, convenios o sentencias anteriores',
      'Comprobantes de pagos recibidos o constancias de falta de pago',
    ],
  },
  {
    id: 'cuidado',
    titulo: 'Cuidado personal y comunicación con los hijos',
    resumen: 'Con quién viven las hijas/os, régimen de comunicación ("visitas"), plan de parentalidad y autorizaciones.',
    campos: [
      { id: 'hijos', label: 'Cantidad y edades de las hijas/os', type: 'text', required: true, max: 200 },
      { id: 'convivencia', label: '¿Con quién conviven hoy?', type: 'select', required: true,
        options: ['Conmigo', 'Con el otro progenitor', 'Alternan entre ambos', 'Con otro familiar'] },
      { id: 'objetivo', label: '¿Qué necesitás resolver?', type: 'select', required: true,
        options: ['Definir el cuidado personal', 'Fijar o modificar el régimen de comunicación',
          'Hacer cumplir un régimen que no se respeta', 'Autorización para viajar o mudarse', 'Otro'] },
      { id: 'acuerdo_previo', label: '¿Hay algún acuerdo o resolución judicial previa?', type: 'select',
        required: false, options: SI_NO_NS },
    ],
    orientacion: [
      'La responsabilidad parental se rige por el interés superior del niño, su autonomía progresiva y su derecho a ser oído (art. 639 CCyC).',
      'El cuidado personal puede ser compartido (alternado o indistinto) o unipersonal (arts. 649 y 650 CCyC). La ley prioriza el cuidado compartido indistinto, salvo que no sea posible o resulte perjudicial (art. 651 CCyC).',
      'Si el cuidado es unipersonal, el otro progenitor tiene el derecho y el deber de mantener una fluida comunicación con la hija o el hijo (art. 652 CCyC).',
      'Los progenitores pueden presentar un plan de parentalidad que organice la convivencia, la comunicación y la toma de decisiones (art. 655 CCyC).',
      'Salir del país con una hija o hijo menor de edad requiere el consentimiento de ambos progenitores o autorización judicial (art. 645 CCyC).',
    ],
    documentacion: [
      'DNI propio y de las hijas/os',
      'Partidas de nacimiento de las hijas/os',
      'Constancias escolares y de salud',
      'Acuerdos o resoluciones judiciales anteriores',
      'Mensajes u otras constancias relevantes sobre el conflicto',
    ],
  },
  {
    id: 'divorcio',
    titulo: 'Divorcio',
    resumen: 'Divorcio de común acuerdo o unilateral, convenio regulador, bienes, vivienda y compensación económica.',
    campos: [
      { id: 'modalidad', label: '¿El divorcio lo piden ambos o solo una de las partes?', type: 'select',
        required: true, options: ['Ambos', 'Solo yo', 'Me notificaron un pedido de divorcio'] },
      { id: 'acuerdo', label: '¿Hay acuerdo sobre los efectos (hijos, bienes, vivienda)?', type: 'select',
        required: true, options: ['Acuerdo total', 'Acuerdo parcial', 'Sin acuerdo'] },
      { id: 'hijos_menores', label: '¿Tienen hijas/os menores de edad o con capacidad restringida?', type: 'select',
        required: true, options: SI_NO },
      { id: 'bienes', label: '¿Hay bienes para dividir (inmuebles, vehículos, etc.)?', type: 'select',
        required: true, options: SI_NO_NS },
      { id: 'fecha_matrimonio', label: 'Año aproximado del matrimonio', type: 'text', required: false, max: 20 },
    ],
    orientacion: [
      'El divorcio puede pedirlo uno solo o ambos cónyuges, sin expresar causa y sin plazo mínimo de matrimonio (arts. 436 y 437 CCyC).',
      'Toda petición de divorcio debe acompañar una propuesta que regule sus efectos; sin ella no se le da trámite. El desacuerdo sobre esos efectos no impide que se dicte la sentencia de divorcio (art. 438 CCyC).',
      'El convenio regulador puede incluir la atribución de la vivienda, la distribución de los bienes, la compensación económica y lo relativo a los hijos (art. 439 CCyC).',
      'Quien sufra un desequilibrio económico manifiesto por la ruptura puede reclamar una compensación económica (art. 441 CCyC). Ojo: caduca a los seis meses de la sentencia de divorcio (art. 442 CCyC).',
    ],
    documentacion: [
      'DNI de ambos cónyuges (si es posible)',
      'Acta o libreta de matrimonio',
      'Partidas de nacimiento de las hijas/os',
      'Títulos o documentación de bienes (escrituras, títulos de vehículos)',
      'Último domicilio conyugal',
    ],
  },
  {
    id: 'union',
    titulo: 'Unión convivencial',
    resumen: 'Parejas no casadas: registración, pactos, vivienda y derechos al terminar la convivencia.',
    campos: [
      { id: 'registrada', label: '¿La unión está inscripta en el Registro de las Personas?', type: 'select',
        required: true, options: SI_NO_NS },
      { id: 'duracion', label: '¿Cuánto tiempo convivieron o conviven?', type: 'text', required: true, max: 100 },
      { id: 'vigente', label: '¿La convivencia sigue vigente?', type: 'select', required: true,
        options: ['Sí', 'No, terminó hace menos de 6 meses', 'No, terminó hace más de 6 meses'] },
      { id: 'motivo', label: '¿Sobre qué querés consultar?', type: 'select', required: true,
        options: ['Registrar la unión o hacer un pacto', 'Vivienda', 'Compensación económica', 'Bienes', 'Otro'] },
    ],
    orientacion: [
      'La unión convivencial exige, entre otros requisitos, que ambas personas sean mayores de edad y convivan al menos dos años (art. 510 CCyC). Su inscripción sirve como prueba de la unión (art. 512 CCyC).',
      'La pareja puede celebrar pactos de convivencia sobre la contribución a los gastos, la vivienda y la división de bienes si la unión termina (arts. 513 y 514 CCyC).',
      'Si la unión está inscripta, ninguno puede disponer de la vivienda familiar ni de sus muebles indispensables sin el asentimiento del otro (art. 522 CCyC).',
      'Al terminar la convivencia puede reclamarse una compensación económica (art. 524 CCyC), que caduca a los seis meses (art. 525 CCyC), y pedirse la atribución de la vivienda familiar por un plazo máximo de dos años (art. 526 CCyC).',
    ],
    documentacion: [
      'DNI',
      'Constancia de inscripción de la unión, si existe',
      'Pruebas de la convivencia (facturas de servicios, contratos, testigos)',
      'Pacto de convivencia, si lo hubo',
      'Documentación de la vivienda y de otros bienes',
    ],
  },
  {
    id: 'violencia',
    titulo: 'Violencia familiar',
    urgente: true,
    resumen: 'Medidas de protección (exclusión del hogar, prohibición de acercamiento) y denuncias.',
    campos: [
      { id: 'peligro', label: '¿Estás en peligro en este momento?', type: 'select', required: true, options: SI_NO },
      { id: 'denuncia', label: '¿Hiciste alguna denuncia?', type: 'select', required: true, options: SI_NO },
      { id: 'medidas', label: '¿Tenés medidas de protección vigentes?', type: 'select', required: true,
        options: SI_NO_NS },
      { id: 'menores', label: '¿Hay niñas, niños o adolescentes involucrados?', type: 'select', required: true,
        options: SI_NO },
    ],
    orientacion: [
      'Si estás en peligro ahora, llamá al 911. La Línea 144 brinda atención, contención y asesoramiento gratuito las 24 horas en situaciones de violencia de género. La Línea 102 atiende situaciones que afectan derechos de niñas, niños y adolescentes.',
      'La Ley 12.569 de la Provincia de Buenos Aires permite pedir medidas de protección urgentes, como la exclusión del agresor del hogar o la prohibición de acercamiento. La denuncia puede hacerse en la comisaría (incluida la Comisaría de la Mujer y la Familia) o directamente ante el juzgado competente, incluidos los Juzgados de Paz.',
      'La Ley 26.485 de protección integral a las mujeres complementa estas herramientas.',
    ],
    documentacion: [
      'DNI',
      'Copias de denuncias anteriores, si las hay',
      'Certificados médicos o constancias de atención',
      'Mensajes, fotos u otras pruebas que tengas guardadas de forma segura',
      'Datos de posibles testigos',
      'Resoluciones o medidas de protección vigentes',
    ],
  },
  {
    id: 'filiacion',
    titulo: 'Filiación y reconocimiento',
    resumen: 'Reconocimiento de hijos, reclamación o impugnación de la filiación, pruebas de ADN.',
    campos: [
      { id: 'objetivo', label: '¿Qué necesitás?', type: 'select', required: true,
        options: ['Que se reconozca a mi hija/o', 'Reconocer a una hija/o', 'Impugnar una filiación', 'Otro'] },
      { id: 'edad_hijo', label: 'Edad de la hija/o', type: 'text', required: false, max: 50 },
    ],
    orientacion: [
      'Una hija o hijo puede ser reconocido en cualquier momento (arts. 570 y 571 CCyC). Si no hay reconocimiento voluntario, puede iniciarse una acción de reclamación de la filiación (art. 582 CCyC).',
      'El derecho a reclamar la filiación no prescribe, aunque los derechos patrimoniales ya adquiridos sí están sujetos a prescripción (art. 576 CCyC).',
      'La negativa a someterse a las pruebas genéticas constituye un indicio grave contrario a quien se niega (art. 579 CCyC).',
      'La falta de reconocimiento puede dar lugar a una reparación del daño causado a la hija o hijo (art. 587 CCyC).',
    ],
    documentacion: [
      'DNI',
      'Partida de nacimiento de la hija/o',
      'Constancias de la relación (mensajes, fotos, testigos)',
    ],
  },
  {
    id: 'otro',
    titulo: 'Otra consulta de familia',
    resumen: 'Adopción, tutela, autorizaciones, capacidad, parentesco u otros temas.',
    campos: [],
    orientacion: [
      'Contanos tu situación con el mayor detalle posible y te indicaremos los pasos a seguir.',
    ],
    documentacion: [
      'DNI',
      'Toda documentación que tengas relacionada con la consulta',
    ],
  },
];

const temasPorId = new Map(temas.map((t) => [t.id, t]));

module.exports = { temas, temasPorId };
