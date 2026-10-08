import { PontoEstudo, TipoEstudo } from '../types';
import { getDiaDaSemana, DIAS_SEMANA_CURTO } from './helpers';

export type AlternanciaSemana = 'toda_semana' | 'semana_a' | 'semana_b';

export interface FixedWeeklySlot {
  id: string;
  materia: string;
  tipoEstudo?: TipoEstudo | 'qualquer';
  alternancia: AlternanciaSemana;
}

// 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
export type FixedWeeklySchedule = Record<number, FixedWeeklySlot[]>;

export type ReorganizeStrategy = 'grade_fixa' | 'ciclo' | 'empurrar_atrasados';

export interface ScheduledDayItem {
  data: string;
  diaSemana: number;
  diaSemanaAbrev: string;
  topicos: PontoEstudo[];
}

export interface ScheduledWeekSummary {
  semanaNumero: number;
  grupoSemana: 'A' | 'B';
  dataInicio: string;
  dataFim: string;
  dias: ScheduledDayItem[];
  materiasPresentes: string[];
  totalTopicos: number;
  detalheTipos: {
    doutrina: number;
    leiSeca: number;
    jurisprudencia: number;
    outros: number;
  };
}

export interface ReorganizeResult {
  orderedPoints: PontoEstudo[];
  calculatedDates: string[];
  weeksSummary: ScheduledWeekSummary[];
  totalDaysCount: number;
  startDate: string;
  endDate: string;
  diasComEstudo: number;
  mediaTopicosPorDia: number;
}

export interface ReorganizeScheduleOptions {
  strategy: ReorganizeStrategy;
  startDate: string; // YYYY-MM-DD
  pointsByMateria: Record<string, PontoEstudo[]>;
  allTargetPoints?: PontoEstudo[]; // All target points in sequence
  
  // Specific to 'grade_fixa':
  fixedSchedule?: FixedWeeklySchedule;
  
  // Specific to 'ciclo':
  topicsPerDay?: number;
  studyDays?: number[]; // [1, 2, 3, 4, 5, 6]
  materiaOrder?: string[];
  avoidSameSubjectPerDay?: boolean;

  // Specific to 'empurrar_atrasados':
  pendingAtrasados?: PontoEstudo[];
  futurePending?: PontoEstudo[];

  // Occupied count by other unselected topics or schedules:
  occupiedCountByDate?: Record<string, number>;
}

export interface ReorganizePreset {
  id: string;
  nome: string;
  descricao?: string;
  isBuiltIn?: boolean;
  strategy: ReorganizeStrategy;
  
  // Grade Fixa Config
  fixedSchedule?: FixedWeeklySchedule;
  
  // Ciclo Config
  topicsPerDay?: number;
  studyDaysMode?: 'seg-sab' | 'seg-sex' | 'todos' | 'custom';
  customDays?: number[];
  avoidSameSubjectPerDay?: boolean;
  materiaOrder?: string[];

  createdAt: number;
  updatedAt: number;
}

export const REORG_PRESETS_STORAGE_KEY = 'estante_reorg_presets_v2';

export function getDefaultBuiltInPresets(): ReorganizePreset[] {
  return [
    {
      id: 'builtin_grade_juridica',
      nome: 'Grade Fixa Jurídica (Doutrina + Lei/Juris)',
      descricao: '2 matérias por dia de Seg a Sex (Doutrina e Lei Seca) + Jurisprudência aos Sábados',
      isBuiltIn: true,
      strategy: 'grade_fixa',
      fixedSchedule: {
        1: [
          { id: 's1', materia: '', tipoEstudo: 'doutrina', alternancia: 'toda_semana' },
          { id: 's2', materia: '', tipoEstudo: 'lei_seca', alternancia: 'toda_semana' }
        ],
        2: [
          { id: 's3', materia: '', tipoEstudo: 'doutrina', alternancia: 'toda_semana' },
          { id: 's4', materia: '', tipoEstudo: 'lei_seca', alternancia: 'toda_semana' }
        ],
        3: [
          { id: 's5', materia: '', tipoEstudo: 'doutrina', alternancia: 'toda_semana' },
          { id: 's6', materia: '', tipoEstudo: 'lei_seca', alternancia: 'toda_semana' }
        ],
        4: [
          { id: 's7', materia: '', tipoEstudo: 'doutrina', alternancia: 'toda_semana' },
          { id: 's8', materia: '', tipoEstudo: 'lei_seca', alternancia: 'toda_semana' }
        ],
        5: [
          { id: 's9', materia: '', tipoEstudo: 'doutrina', alternancia: 'toda_semana' },
          { id: 's10', materia: '', tipoEstudo: 'lei_seca', alternancia: 'toda_semana' }
        ],
        6: [
          { id: 's11', materia: '', tipoEstudo: 'jurisprudencia', alternancia: 'toda_semana' },
          { id: 's12', materia: '', tipoEstudo: 'jurisprudencia', alternancia: 'toda_semana' }
        ],
        0: []
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'builtin_grade_alternada',
      nome: 'Grade com Alternância A/B (Semana Sim / Não)',
      descricao: 'Matérias tronco toda semana e matérias específicas revezando em semanas alternadas (A / B)',
      isBuiltIn: true,
      strategy: 'grade_fixa',
      fixedSchedule: {
        1: [
          { id: 'a1', materia: '', tipoEstudo: 'qualquer', alternancia: 'toda_semana' },
          { id: 'a2', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_a' },
          { id: 'a3', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_b' }
        ],
        2: [
          { id: 'a4', materia: '', tipoEstudo: 'qualquer', alternancia: 'toda_semana' },
          { id: 'a5', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_a' },
          { id: 'a6', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_b' }
        ],
        3: [
          { id: 'a7', materia: '', tipoEstudo: 'qualquer', alternancia: 'toda_semana' },
          { id: 'a8', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_a' },
          { id: 'a9', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_b' }
        ],
        4: [
          { id: 'a10', materia: '', tipoEstudo: 'qualquer', alternancia: 'toda_semana' },
          { id: 'a11', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_a' },
          { id: 'a12', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_b' }
        ],
        5: [
          { id: 'a13', materia: '', tipoEstudo: 'qualquer', alternancia: 'toda_semana' },
          { id: 'a14', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_a' },
          { id: 'a15', materia: '', tipoEstudo: 'qualquer', alternancia: 'semana_b' }
        ],
        6: [
          { id: 'a16', materia: '', tipoEstudo: 'jurisprudencia', alternancia: 'toda_semana' }
        ],
        0: []
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'builtin_ciclo_2topicos',
      nome: 'Ciclo Rotativo Equitativo (2 tópicos/dia)',
      descricao: 'Rotação circular equilibrada de Segunda a Sábado com 2 tópicos diários de matérias diferentes',
      isBuiltIn: true,
      strategy: 'ciclo',
      topicsPerDay: 2,
      studyDaysMode: 'seg-sab',
      avoidSameSubjectPerDay: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    {
      id: 'builtin_ciclo_1topico',
      nome: 'Ciclo Suave (1 tópico/dia)',
      descricao: '1 matéria por dia em rotação contínua de Segunda a Sexta',
      isBuiltIn: true,
      strategy: 'ciclo',
      topicsPerDay: 1,
      studyDaysMode: 'seg-sex',
      avoidSameSubjectPerDay: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    }
  ];
}

export function loadReorganizePresets(): ReorganizePreset[] {
  try {
    const raw = localStorage.getItem(REORG_PRESETS_STORAGE_KEY);
    const builtIns = getDefaultBuiltInPresets();
    if (!raw) {
      localStorage.setItem(REORG_PRESETS_STORAGE_KEY, JSON.stringify(builtIns));
      return builtIns;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return builtIns;
    }

    return parsed;
  } catch (err) {
    console.error('Erro ao carregar presets de reorganização:', err);
    return getDefaultBuiltInPresets();
  }
}

export function saveReorganizePresetsToStorage(presets: ReorganizePreset[]): void {
  try {
    localStorage.setItem(REORG_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error('Erro ao salvar presets no localStorage:', err);
  }
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Cria cópia das filas de tópicos por matéria preservando a ordem pedagógica
 */
function cloneTopicQueues(pointsByMateria: Record<string, PontoEstudo[]>): Record<string, PontoEstudo[]> {
  const queues: Record<string, PontoEstudo[]> = {};
  Object.keys(pointsByMateria).forEach(mat => {
    queues[mat] = [...(pointsByMateria[mat] || [])];
  });
  return queues;
}

/**
 * Extrai da fila da matéria um tópico preferencialmente pelo tipo de estudo.
 * Se não encontrar o tipo solicitado, faz fallback para o próximo tópico da matéria.
 */
function pullTopicFromMateria(
  queue: PontoEstudo[],
  preferredTipo?: TipoEstudo | 'qualquer'
): PontoEstudo | null {
  if (!queue || queue.length === 0) return null;

  if (!preferredTipo || preferredTipo === 'qualquer') {
    return queue.shift() || null;
  }

  // Tenta achar pelo tipo solicitado
  const idx = queue.findIndex(p => p.tipoEstudo === preferredTipo);
  if (idx !== -1) {
    return queue.splice(idx, 1)[0];
  }

  // Fallback: consome o primeiro tópico disponível para não deixar o horário ocioso
  return queue.shift() || null;
}

/**
 * MOTOR 1: GRADE SEMANAL FIXA
 * Permite definir horários e disciplinas fixas por dia da semana,
 * com tipos de estudo (Doutrina, Jurisprudência, Lei Seca) e alternância de semanas (Semana A / B).
 */
export function calculateScheduleFixedWeekly(
  pointsByMateria: Record<string, PontoEstudo[]>,
  fixedSchedule: FixedWeeklySchedule,
  startDate: string,
  occupiedCountByDate: Record<string, number> = {}
): ReorganizeResult {
  const queues = cloneTopicQueues(pointsByMateria);
  const totalPoints = Object.values(queues).reduce((sum, q) => sum + q.length, 0);

  if (totalPoints === 0 || !startDate) {
    return {
      orderedPoints: [],
      calculatedDates: [],
      weeksSummary: [],
      totalDaysCount: 0,
      startDate,
      endDate: startDate,
      diasComEstudo: 0,
      mediaTopicosPorDia: 0
    };
  }

  const scheduledTopics: { ponto: PontoEstudo; data: string }[] = [];
  let remainingCount = totalPoints;

  // Determina a segunda-feira de ancoragem da primeira semana para cálculo exato de semanas civis (A / B)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const startObj = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
  const dayOfWeekStart = (startObj.getDay() + 6) % 7; // Segunda = 0, Domingo = 6
  const mondayAnchor = new Date(startObj);
  mondayAnchor.setDate(startObj.getDate() - dayOfWeekStart);

  let currentDate = new Date(startObj);
  let iterationCounter = 0;
  const maxDaysLimit = 2500; // ~7 anos limite de segurança absoluto

  // Identifica quais matérias estão cadastradas na grade fixa
  const materiasConfiguradasNaGrade = new Set<string>();
  Object.values(fixedSchedule).forEach(slots => {
    slots.forEach(s => {
      if (s.materia) materiasConfiguradasNaGrade.add(s.materia);
    });
  });

  while (remainingCount > 0 && iterationCounter < maxDaysLimit) {
    iterationCounter++;
    const dateStr = formatDateISO(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Segunda ...

    // Determina a semana atual relativa à ancoragem (Semana 1 = A, Semana 2 = B, Semana 3 = A...)
    const diffTime = currentDate.getTime() - mondayAnchor.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7); // 0, 1, 2, 3...
    const isSemanaA = weekIndex % 2 === 0;

    const slotsDoDia = fixedSchedule[dayOfWeek] || [];
    
    // Filtra slots ativos nesta semana
    const activeSlots = slotsDoDia.filter(slot => {
      if (slot.alternancia === 'toda_semana') return true;
      if (slot.alternancia === 'semana_a') return isSemanaA;
      if (slot.alternancia === 'semana_b') return !isSemanaA;
      return true;
    });

    if (activeSlots.length > 0) {
      for (const slot of activeSlots) {
        if (!slot.materia) continue;

        const queue = queues[slot.materia];
        if (queue && queue.length > 0) {
          const topic = pullTopicFromMateria(queue, slot.tipoEstudo);
          if (topic) {
            scheduledTopics.push({
              ponto: topic,
              data: dateStr
            });
            remainingCount--;
          }
        }
      }
    }

    // Se todas as matérias cadastradas na grade já tiverem terminado, mas existirem
    // matérias sem slot na grade, alocamos os tópicos restantes para não perder nenhum dado
    const materiasComSlotsRestantes = Array.from(materiasConfiguradasNaGrade).some(
      m => (queues[m] || []).length > 0
    );

    if (!materiasComSlotsRestantes && remainingCount > 0) {
      // Aloca as matérias restantes não configuradas de forma rotativa nos dias com estudo
      const materiasRestantes = Object.keys(queues).filter(m => (queues[m] || []).length > 0);
      if (materiasRestantes.length > 0 && slotsDoDia.length > 0) {
        for (let i = 0; i < slotsDoDia.length && remainingCount > 0; i++) {
          const mat = materiasRestantes[i % materiasRestantes.length];
          const topic = queues[mat]?.shift();
          if (topic) {
            scheduledTopics.push({ ponto: topic, data: dateStr });
            remainingCount--;
          }
        }
      }
    }

    // Avança 1 dia
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fallback de emergência (caso a grade não tivesse nenhum dia configurado):
  if (remainingCount > 0) {
    Object.keys(queues).forEach(mat => {
      const leftovers = queues[mat] || [];
      while (leftovers.length > 0) {
        const t = leftovers.shift()!;
        const dStr = formatDateISO(currentDate);
        scheduledTopics.push({ ponto: t, data: dStr });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }

  const finalPoints = scheduledTopics.map(item => ({
    ...item.ponto,
    data: item.data
  }));

  const dates = finalPoints.map(p => p.data);
  const weeksSummary = buildWeeksSummaryFromPoints(finalPoints);
  const uniqueDatesCount = new Set(dates).size;

  return {
    orderedPoints: finalPoints,
    calculatedDates: dates,
    weeksSummary,
    totalDaysCount: uniqueDatesCount,
    startDate,
    endDate: dates[dates.length - 1] || startDate,
    diasComEstudo: uniqueDatesCount,
    mediaTopicosPorDia: uniqueDatesCount > 0 ? Number((finalPoints.length / uniqueDatesCount).toFixed(1)) : 0
  };
}

/**
 * MOTOR 2: CICLO ROTATIVO EQUITATIVO (MÉTODO ALEXANDRE MEIRELLES)
 * Rotação contínua e justa sem inanição (starvation) e sem travamentos de semana.
 */
export function calculateScheduleCycle(
  pointsByMateria: Record<string, PontoEstudo[]>,
  options: {
    startDate: string;
    topicsPerDay: number;
    studyDays: number[];
    materiaOrder: string[];
    avoidSameSubjectPerDay?: boolean;
    occupiedCountByDate?: Record<string, number>;
  }
): ReorganizeResult {
  const {
    startDate,
    topicsPerDay = 1,
    studyDays = [1, 2, 3, 4, 5, 6],
    materiaOrder,
    avoidSameSubjectPerDay = true,
    occupiedCountByDate = {}
  } = options;

  const queues = cloneTopicQueues(pointsByMateria);
  const totalPoints = Object.values(queues).reduce((sum, q) => sum + q.length, 0);

  if (totalPoints === 0 || !startDate) {
    return {
      orderedPoints: [],
      calculatedDates: [],
      weeksSummary: [],
      totalDaysCount: 0,
      startDate,
      endDate: startDate,
      diasComEstudo: 0,
      mediaTopicosPorDia: 0
    };
  }

  const scheduledTopics: { ponto: PontoEstudo; data: string }[] = [];
  let remainingCount = totalPoints;

  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  let currentDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);

  // Ponteiro contínuo do ciclo circular de matérias
  let cycleSubjectIndex = 0;
  let safetyCounter = 0;
  const maxDays = 2500;

  while (remainingCount > 0 && safetyCounter < maxDays) {
    safetyCounter++;
    const dateStr = formatDateISO(currentDate);
    const dayOfWeek = currentDate.getDay();

    const isStudyDay = studyDays.includes(dayOfWeek);
    const occupied = occupiedCountByDate[dateStr] || 0;
    const slotsAvailableToday = Math.max(0, topicsPerDay - occupied);

    if (isStudyDay && slotsAvailableToday > 0) {
      const scheduledTodaySubjects = new Set<string>();
      let slotsFilledToday = 0;

      // Percorre as matérias para preencher a meta de hoje
      let subjectPassCount = 0;
      const orderLength = materiaOrder.length;

      while (slotsFilledToday < slotsAvailableToday && remainingCount > 0 && subjectPassCount < orderLength * 2) {
        subjectPassCount++;
        const targetMateria = materiaOrder[cycleSubjectIndex % orderLength];
        const queue = queues[targetMateria];

        const canScheduleSubject = !avoidSameSubjectPerDay || 
          !scheduledTodaySubjects.has(targetMateria) || 
          // Se todas as matérias restantes já foram usadas hoje, permite repetir
          materiaOrder.filter(m => (queues[m] || []).length > 0).every(m => scheduledTodaySubjects.has(m));

        if (queue && queue.length > 0 && canScheduleSubject) {
          const topic = queue.shift()!;
          scheduledTopics.push({ ponto: topic, data: dateStr });
          scheduledTodaySubjects.add(targetMateria);
          slotsFilledToday++;
          remainingCount--;
        }

        // Avança o ponteiro circular do ciclo para a próxima matéria
        cycleSubjectIndex = (cycleSubjectIndex + 1) % orderLength;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const finalPoints = scheduledTopics.map(item => ({
    ...item.ponto,
    data: item.data
  }));

  const dates = finalPoints.map(p => p.data);
  const weeksSummary = buildWeeksSummaryFromPoints(finalPoints);
  const uniqueDatesCount = new Set(dates).size;

  return {
    orderedPoints: finalPoints,
    calculatedDates: dates,
    weeksSummary,
    totalDaysCount: uniqueDatesCount,
    startDate,
    endDate: dates[dates.length - 1] || startDate,
    diasComEstudo: uniqueDatesCount,
    mediaTopicosPorDia: uniqueDatesCount > 0 ? Number((finalPoints.length / uniqueDatesCount).toFixed(1)) : 0
  };
}

/**
 * MOTOR 3: EMPURRAR ATRASADOS (AJUSTE RÁPIDO)
 * Mantém a ordem original das matérias e apenas empurra os tópicos atrasados
 * para frente a partir de hoje / nova data, respeitando os dias de estudo e slots.
 */
export function calculateSchedulePushAtrasados(
  allPendingPoints: PontoEstudo[],
  options: {
    startDate: string;
    studyDays: number[];
    topicsPerDay: number;
    occupiedCountByDate?: Record<string, number>;
  }
): ReorganizeResult {
  const {
    startDate,
    studyDays = [1, 2, 3, 4, 5, 6],
    topicsPerDay = 2,
    occupiedCountByDate = {}
  } = options;

  if (allPendingPoints.length === 0 || !startDate) {
    return {
      orderedPoints: [],
      calculatedDates: [],
      weeksSummary: [],
      totalDaysCount: 0,
      startDate,
      endDate: startDate,
      diasComEstudo: 0,
      mediaTopicosPorDia: 0
    };
  }

  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  let currentDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);

  const updatedPoints: PontoEstudo[] = [];
  const calculatedDates: string[] = [];

  let currentDaySlotsFilled = 0;

  for (let i = 0; i < allPendingPoints.length; i++) {
    // Procura o próximo dia de estudo com vaga
    while (true) {
      const dStr = formatDateISO(currentDate);
      const isStudyDay = studyDays.includes(currentDate.getDay());
      const occupied = occupiedCountByDate[dStr] || 0;

      if (isStudyDay && currentDaySlotsFilled + occupied < topicsPerDay) {
        break;
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDaySlotsFilled = 0;
    }

    const assignedDate = formatDateISO(currentDate);
    const pt = allPendingPoints[i];

    updatedPoints.push({
      ...pt,
      data: assignedDate,
      updatedAt: Date.now()
    });
    calculatedDates.push(assignedDate);
    currentDaySlotsFilled++;
  }

  const weeksSummary = buildWeeksSummaryFromPoints(updatedPoints);
  const uniqueDatesCount = new Set(calculatedDates).size;

  return {
    orderedPoints: updatedPoints,
    calculatedDates,
    weeksSummary,
    totalDaysCount: uniqueDatesCount,
    startDate,
    endDate: calculatedDates[calculatedDates.length - 1] || startDate,
    diasComEstudo: uniqueDatesCount,
    mediaTopicosPorDia: uniqueDatesCount > 0 ? Number((updatedPoints.length / uniqueDatesCount).toFixed(1)) : 0
  };
}

/**
 * Constrói o sumário semanal a partir dos pontos calculados
 */
export function buildWeeksSummaryFromPoints(points: PontoEstudo[]): ScheduledWeekSummary[] {
  if (points.length === 0) return [];

  const byDate: Record<string, PontoEstudo[]> = {};
  points.forEach(p => {
    if (!p.data) return;
    if (!byDate[p.data]) byDate[p.data] = [];
    byDate[p.data].push(p);
  });

  const sortedDates = Object.keys(byDate).sort();
  if (sortedDates.length === 0) return [];

  const weeks: ScheduledWeekSummary[] = [];

  let currentWeekDays: ScheduledDayItem[] = [];
  let currentMondayStr = '';
  let weekNum = 1;

  sortedDates.forEach(dateStr => {
    const { abreviado, index } = getDiaDaSemana(dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeek = (dateObj.getDay() + 6) % 7; // Segunda = 0
    const mondayObj = new Date(dateObj);
    mondayObj.setDate(dateObj.getDate() - dayOfWeek);
    const mondayStr = formatDateISO(mondayObj);

    if (currentMondayStr && mondayStr !== currentMondayStr) {
      if (currentWeekDays.length > 0) {
        weeks.push(createWeekSummaryObject(weekNum, currentWeekDays));
        weekNum++;
      }
      currentWeekDays = [];
    }

    currentMondayStr = mondayStr;
    currentWeekDays.push({
      data: dateStr,
      diaSemana: index,
      diaSemanaAbrev: abreviado,
      topicos: byDate[dateStr]
    });
  });

  if (currentWeekDays.length > 0) {
    weeks.push(createWeekSummaryObject(weekNum, currentWeekDays));
  }

  return weeks;
}

function createWeekSummaryObject(weekNum: number, days: ScheduledDayItem[]): ScheduledWeekSummary {
  const allTopics = days.flatMap(d => d.topicos);
  const materias = Array.from(new Set(allTopics.map(t => t.materia)));
  const isSemanaA = weekNum % 2 !== 0;

  const detalheTipos = {
    doutrina: allTopics.filter(t => t.tipoEstudo === 'doutrina').length,
    leiSeca: allTopics.filter(t => t.tipoEstudo === 'lei_seca').length,
    jurisprudencia: allTopics.filter(t => t.tipoEstudo === 'jurisprudencia').length,
    outros: allTopics.filter(t => !t.tipoEstudo).length
  };

  return {
    semanaNumero: weekNum,
    grupoSemana: isSemanaA ? 'A' : 'B',
    dataInicio: days[0]?.data || '',
    dataFim: days[days.length - 1]?.data || '',
    dias: days,
    materiasPresentes: materias,
    totalTopicos: allTopics.length,
    detalheTipos
  };
}

/**
 * Função unificada para backward compatibility e acesso central
 */
export function calculateSmartSchedule(
  pointsByMateria: Record<string, PontoEstudo[]>,
  options: any
): ReorganizeResult {
  if (options.strategy === 'grade_fixa' && options.fixedSchedule) {
    return calculateScheduleFixedWeekly(
      pointsByMateria,
      options.fixedSchedule,
      options.startDate,
      options.occupiedCountByDate
    );
  }

  if (options.strategy === 'empurrar_atrasados' && options.allTargetPoints) {
    return calculateSchedulePushAtrasados(
      options.allTargetPoints,
      {
        startDate: options.startDate,
        studyDays: options.studyDays || [1, 2, 3, 4, 5, 6],
        topicsPerDay: options.topicsPerDay || 2,
        occupiedCountByDate: options.occupiedCountByDate
      }
    );
  }

  // Padrão: Ciclo Equitativo
  return calculateScheduleCycle(pointsByMateria, {
    startDate: options.startDate,
    topicsPerDay: options.topicsPerDay || 1,
    studyDays: options.studyDays || [1, 2, 3, 4, 5, 6],
    materiaOrder: options.materiaOrder || Object.keys(pointsByMateria),
    avoidSameSubjectPerDay: options.avoidSameSubjectPerDay !== false,
    occupiedCountByDate: options.occupiedCountByDate
  });
}
