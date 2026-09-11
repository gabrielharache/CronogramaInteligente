import { PontoEstudo } from '../types';
import { getDiaDaSemana, DIAS_SEMANA_CURTO } from './helpers';

export type MateriaFrequencyMode = 
  | 'toda_semana'   // Aparece toda semana (Matéria tronco/obrigatória)
  | 'duas_vezes'    // 2x por semana (Alta prioridade / maior carga)
  | 'intercalada'   // Intercalada (Semana sim, semana não — alternando entre grupos)
  | 'padrao'        // Rotação normal de ciclo
  | 'bloco';        // Estuda em bloco contínuo antes de avançar

export interface MateriaReorgConfig {
  materia: string;
  frequencia: MateriaFrequencyMode;
  diasPermitidos?: number[]; // 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 0=Dom
  grupoIntercalacao?: 'A' | 'B'; // A = semanas ímpares (1, 3, 5...), B = semanas pares (2, 4, 6...)
}

export interface ReorganizeScheduleOptions {
  startDate: string; // YYYY-MM-DD
  topicsPerDay: number; // 1, 2, 3
  studyDays: number[]; // e.g. [1, 2, 3, 4, 5, 6]
  distributionMode: 'smart_cycle' | 'cycle' | 'sequential';
  materiaConfigs: Record<string, MateriaReorgConfig>;
  materiaOrder: string[]; // Array of subject names in priority sequence
  avoidSameSubjectPerDay?: boolean;
}

export interface ScheduledDayItem {
  data: string;
  diaSemana: number;
  diaSemanaAbrev: string;
  topicos: PontoEstudo[];
}

export interface ScheduledWeekSummary {
  semanaNumero: number;
  dataInicio: string;
  dataFim: string;
  dias: ScheduledDayItem[];
  materiasPresentes: string[];
  materiasTodaSemana: string[];
  materiasIntercaladas: string[];
  materiasDuasVezes: string[];
  totalTopicos: number;
}

export interface ReorganizeResult {
  orderedPoints: PontoEstudo[];
  calculatedDates: string[];
  weeksSummary: ScheduledWeekSummary[];
  totalDaysCount: number;
  startDate: string;
  endDate: string;
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Distributes study topics according to sophisticated combination rules:
 * - Toda semana: guaranteed presence every week
 * - Intercalada: alternates between weeks (Group A on odd weeks, Group B on even weeks)
 * - 2x por semana: higher study cadence
 * - Bloco: exhausted sequentially
 * - Padrão: normal round-robin cycle
 */
export function calculateSmartSchedule(
  pointsByMateria: Record<string, PontoEstudo[]>,
  options: ReorganizeScheduleOptions
): ReorganizeResult {
  const {
    startDate,
    topicsPerDay,
    studyDays,
    distributionMode,
    materiaConfigs,
    materiaOrder,
    avoidSameSubjectPerDay = true
  } = options;

  // Deep clone subject topic queues so we can consume them
  const queues: Record<string, PontoEstudo[]> = {};
  materiaOrder.forEach(mat => {
    queues[mat] = [...(pointsByMateria[mat] || [])];
  });

  const totalPointsCount = Object.values(queues).reduce((acc, list) => acc + list.length, 0);

  if (totalPointsCount === 0 || !startDate) {
    return {
      orderedPoints: [],
      calculatedDates: [],
      weeksSummary: [],
      totalDaysCount: 0,
      startDate,
      endDate: startDate
    };
  }

  // Sequential Mode (Subject by Subject)
  if (distributionMode === 'sequential') {
    const flatList: PontoEstudo[] = [];
    materiaOrder.forEach(mat => {
      flatList.push(...(queues[mat] || []));
    });

    const dates = generateDatesList(flatList.length, startDate, topicsPerDay, studyDays);
    const updatedPoints = flatList.map((p, i) => ({ ...p, data: dates[i] }));
    const weeks = buildWeeksSummary(updatedPoints);

    return {
      orderedPoints: updatedPoints,
      calculatedDates: dates,
      weeksSummary: weeks,
      totalDaysCount: new Set(dates).size,
      startDate,
      endDate: dates[dates.length - 1] || startDate
    };
  }

  // Classic Round-Robin Cycle (without weekly cadence rules)
  if (distributionMode === 'cycle') {
    const flatList: PontoEstudo[] = [];
    let hasMore = true;
    let topicIdx = 0;

    while (hasMore) {
      hasMore = false;
      materiaOrder.forEach(mat => {
        const list = pointsByMateria[mat];
        if (list && topicIdx < list.length) {
          flatList.push(list[topicIdx]);
          hasMore = true;
        }
      });
      topicIdx++;
    }

    const dates = generateDatesList(flatList.length, startDate, topicsPerDay, studyDays);
    const updatedPoints = flatList.map((p, i) => ({ ...p, data: dates[i] }));
    const weeks = buildWeeksSummary(updatedPoints);

    return {
      orderedPoints: updatedPoints,
      calculatedDates: dates,
      weeksSummary: weeks,
      totalDaysCount: new Set(dates).size,
      startDate,
      endDate: dates[dates.length - 1] || startDate
    };
  }

  // SMART CYCLE: Weekly combination engine (Toda semana, Intercaladas, 2x por semana, etc.)
  const scheduledTopics: { ponto: PontoEstudo; data: string }[] = [];
  const assignedDatesSet = new Set<string>();

  // Prepare calendar traversal
  let currentDate = new Date(startDate + 'T12:00:00');
  let currentWeekNumber = 1;
  let remainingTopicsCount = totalPointsCount;

  // Track round-robin index for standard rotation
  let standardRotationIdx = 0;

  // Maximum safe loop iteration guard (e.g. 500 weeks ~ 10 years)
  let safetyLoopCounter = 0;

  while (remainingTopicsCount > 0 && safetyLoopCounter < 500) {
    safetyLoopCounter++;

    // Find the study days for the current calendar week (Monday to Sunday)
    // First, determine Monday of this current week
    const currentDayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const daysSinceMonday = (currentDayOfWeek + 6) % 7;
    const weekStartMonday = new Date(currentDate);
    weekStartMonday.setDate(currentDate.getDate() - daysSinceMonday);

    // Collect valid study days within this calendar week
    const weekStudyDays: { dateStr: string; dateObj: Date; dayOfWeek: number }[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = new Date(weekStartMonday);
      checkDay.setDate(weekStartMonday.getDate() + dayOffset);
      const dayOfWeek = checkDay.getDay();
      const dateStr = formatDateISO(checkDay);

      // Must be >= startDate and in studyDays
      if (dateStr >= startDate && studyDays.includes(dayOfWeek)) {
        weekStudyDays.push({
          dateStr,
          dateObj: checkDay,
          dayOfWeek
        });
      }
    }

    // If no study days left in this week (e.g. started on a Sunday that is not a study day), advance to next Monday
    if (weekStudyDays.length === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const isOddWeek = currentWeekNumber % 2 !== 0;

    // Determine target subjects and quotas for this week
    const weekMateriaQuotas: { materia: string; quota: number; fixedDays?: number[] }[] = [];

    materiaOrder.forEach(mat => {
      const availableCount = (queues[mat] || []).length;
      if (availableCount === 0) return;

      const cfg = materiaConfigs[mat] || { materia: mat, frequencia: 'padrao' };

      if (cfg.frequencia === 'toda_semana') {
        weekMateriaQuotas.push({
          materia: mat,
          quota: 1,
          fixedDays: cfg.diasPermitidos
        });
      } else if (cfg.frequencia === 'duas_vezes') {
        weekMateriaQuotas.push({
          materia: mat,
          quota: Math.min(2, availableCount),
          fixedDays: cfg.diasPermitidos
        });
      } else if (cfg.frequencia === 'intercalada') {
        // Alternates between weeks: Group A on odd weeks, Group B on even weeks
        const group = cfg.grupoIntercalacao || 'A';
        const isEligibleThisWeek = (group === 'A' && isOddWeek) || (group === 'B' && !isOddWeek);
        if (isEligibleThisWeek) {
          weekMateriaQuotas.push({
            materia: mat,
            quota: 1,
            fixedDays: cfg.diasPermitidos
          });
        }
      } else if (cfg.frequencia === 'bloco') {
        // Continuous block until finished
        weekMateriaQuotas.push({
          materia: mat,
          quota: Math.min(weekStudyDays.length, availableCount),
          fixedDays: cfg.diasPermitidos
        });
      }
    });

    // Total slots available in this week
    const totalWeeklySlots = weekStudyDays.length * topicsPerDay;
    let slotsFilledThisWeek = weekMateriaQuotas.reduce((acc, q) => acc + q.quota, 0);

    // If weekly quotas exceed weekly slots, scale down lowest priority quotas
    if (slotsFilledThisWeek > totalWeeklySlots) {
      // Keep toda_semana and intercalada, reduce duas_vezes if needed
      let excess = slotsFilledThisWeek - totalWeeklySlots;
      for (let i = weekMateriaQuotas.length - 1; i >= 0 && excess > 0; i--) {
        if (weekMateriaQuotas[i].quota > 1) {
          weekMateriaQuotas[i].quota--;
          excess--;
          slotsFilledThisWeek--;
        }
      }
    }

    // If there are still free slots in the week, pull from 'padrao' or remaining subjects with topics
    if (slotsFilledThisWeek < totalWeeklySlots) {
      const candidates = materiaOrder.filter(mat => {
        const available = (queues[mat] || []).length;
        const currentQuota = weekMateriaQuotas.find(q => q.materia === mat)?.quota || 0;
        return available > currentQuota;
      });

      let addedAny = true;
      while (slotsFilledThisWeek < totalWeeklySlots && candidates.length > 0 && addedAny) {
        addedAny = false;
        for (let i = 0; i < candidates.length && slotsFilledThisWeek < totalWeeklySlots; i++) {
          const mat = candidates[(standardRotationIdx + i) % candidates.length];
          const available = (queues[mat] || []).length;
          const entry = weekMateriaQuotas.find(q => q.materia === mat);

          if (entry) {
            if (entry.quota < available) {
              entry.quota++;
              slotsFilledThisWeek++;
              addedAny = true;
            }
          } else {
            weekMateriaQuotas.push({
              materia: mat,
              quota: 1,
              fixedDays: materiaConfigs[mat]?.diasPermitidos
            });
            slotsFilledThisWeek++;
            addedAny = true;
          }
        }
        standardRotationIdx = (standardRotationIdx + 1) % (candidates.length || 1);
      }
    }

    // Now distribute the chosen subjects across the week's study days
    const dayAllocations: Record<string, PontoEstudo[]> = {};
    weekStudyDays.forEach(d => {
      dayAllocations[d.dateStr] = [];
    });

    // 1. First, assign subjects with specific fixed days
    weekMateriaQuotas.forEach(entry => {
      if (entry.fixedDays && entry.fixedDays.length > 0) {
        const matchingDays = weekStudyDays.filter(d => entry.fixedDays!.includes(d.dayOfWeek));
        for (const targetDay of matchingDays) {
          if (entry.quota > 0 && dayAllocations[targetDay.dateStr].length < topicsPerDay) {
            const topic = queues[entry.materia]?.shift();
            if (topic) {
              dayAllocations[targetDay.dateStr].push(topic);
              entry.quota--;
              remainingTopicsCount--;
            }
          }
        }
      }
    });

    // 2. Distribute remaining quotas across available days
    // Flatten quotas into tokens
    const tokensToDistribute: string[] = [];
    weekMateriaQuotas.forEach(entry => {
      for (let q = 0; q < entry.quota; q++) {
        tokensToDistribute.push(entry.materia);
      }
    });

    // Sort tokens to interleave different subjects
    const interleavedTokens: string[] = [];
    const groupedTokens: Record<string, number> = {};
    tokensToDistribute.forEach(m => {
      groupedTokens[m] = (groupedTokens[m] || 0) + 1;
    });

    let hasTokens = true;
    while (hasTokens) {
      hasTokens = false;
      materiaOrder.forEach(mat => {
        if (groupedTokens[mat] && groupedTokens[mat] > 0) {
          interleavedTokens.push(mat);
          groupedTokens[mat]--;
          hasTokens = true;
        }
      });
    }

    // Place tokens into days, avoiding same subject on same day if possible
    interleavedTokens.forEach(mat => {
      const topic = queues[mat]?.shift();
      if (!topic) return;

      // Find best day: day with < topicsPerDay and without this subject
      let bestDay = weekStudyDays.find(d => {
        const currentList = dayAllocations[d.dateStr];
        return currentList.length < topicsPerDay && (!avoidSameSubjectPerDay || !currentList.some(p => p.materia === mat));
      });

      // Fallback: any day with < topicsPerDay
      if (!bestDay) {
        bestDay = weekStudyDays.find(d => dayAllocations[d.dateStr].length < topicsPerDay);
      }

      if (bestDay) {
        dayAllocations[bestDay.dateStr].push(topic);
        remainingTopicsCount--;
      } else {
        // Week is full, return topic to queue
        queues[mat].unshift(topic);
      }
    });

    // Commit allocations to scheduledTopics
    weekStudyDays.forEach(d => {
      const pts = dayAllocations[d.dateStr];
      if (pts && pts.length > 0) {
        pts.forEach(p => {
          scheduledTopics.push({
            ponto: p,
            data: d.dateStr
          });
          assignedDatesSet.add(d.dateStr);
        });
      }
    });

    // Advance to next Monday
    const nextMonday = new Date(weekStartMonday);
    nextMonday.setDate(weekStartMonday.getDate() + 7);
    currentDate = nextMonday;
    currentWeekNumber++;
  }

  // Ensure all remaining points (if any edge cases left) are assigned
  if (remainingTopicsCount > 0) {
    materiaOrder.forEach(mat => {
      const leftover = queues[mat] || [];
      while (leftover.length > 0) {
        const pt = leftover.shift()!;
        // Pick next valid day
        while (!studyDays.includes(currentDate.getDay())) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        const dStr = formatDateISO(currentDate);
        scheduledTopics.push({
          ponto: pt,
          data: dStr
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }

  const finalPoints = scheduledTopics.map(item => ({
    ...item.ponto,
    data: item.data
  }));

  const dates = finalPoints.map(p => p.data);
  const weeksSummary = buildWeeksSummary(finalPoints, materiaConfigs);

  return {
    orderedPoints: finalPoints,
    calculatedDates: dates,
    weeksSummary,
    totalDaysCount: new Set(dates).size,
    startDate,
    endDate: dates[dates.length - 1] || startDate
  };
}

/**
 * Builds structured summary of scheduled study weeks
 */
export function buildWeeksSummary(
  points: PontoEstudo[],
  configs: Record<string, MateriaReorgConfig> = {}
): ScheduledWeekSummary[] {
  if (points.length === 0) return [];

  // Group by date
  const byDate: Record<string, PontoEstudo[]> = {};
  points.forEach(p => {
    if (!p.data) return;
    if (!byDate[p.data]) byDate[p.data] = [];
    byDate[p.data].push(p);
  });

  const sortedDates = Object.keys(byDate).sort();
  if (sortedDates.length === 0) return [];

  const weeks: ScheduledWeekSummary[] = [];

  // Group by calendar weeks (Monday to Sunday)
  let currentWeekDays: ScheduledDayItem[] = [];
  let currentMondayStr = '';
  let weekNum = 1;

  sortedDates.forEach(dateStr => {
    const { abreviado, index } = getDiaDaSemana(dateStr);
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = (dateObj.getDay() + 6) % 7; // Monday = 0
    const mondayObj = new Date(dateObj);
    mondayObj.setDate(dateObj.getDate() - dayOfWeek);
    const mondayStr = formatDateISO(mondayObj);

    if (currentMondayStr && mondayStr !== currentMondayStr) {
      // Save completed week
      if (currentWeekDays.length > 0) {
        weeks.push(createWeekSummary(weekNum, currentWeekDays, configs));
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
    weeks.push(createWeekSummary(weekNum, currentWeekDays, configs));
  }

  return weeks;
}

function createWeekSummary(
  weekNum: number,
  days: ScheduledDayItem[],
  configs: Record<string, MateriaReorgConfig>
): ScheduledWeekSummary {
  const allTopics = days.flatMap(d => d.topicos);
  const materias = Array.from(new Set(allTopics.map(t => t.materia)));

  const materiasTodaSemana = materias.filter(m => configs[m]?.frequencia === 'toda_semana');
  const materiasIntercaladas = materias.filter(m => configs[m]?.frequencia === 'intercalada');
  const materiasDuasVezes = materias.filter(m => configs[m]?.frequencia === 'duas_vezes');

  return {
    semanaNumero: weekNum,
    dataInicio: days[0]?.data || '',
    dataFim: days[days.length - 1]?.data || '',
    dias: days,
    materiasPresentes: materias,
    materiasTodaSemana,
    materiasIntercaladas,
    materiasDuasVezes,
    totalTopicos: allTopics.length
  };
}

/**
 * Sequential list of dates matching study days and topics per day
 */
function generateDatesList(
  totalItems: number,
  startDate: string,
  topicsPerDay: number,
  studyDays: number[]
): string[] {
  const dates: string[] = [];
  if (totalItems <= 0 || !startDate) return dates;

  let current = new Date(startDate + 'T12:00:00');
  let itemsOnDay = 0;

  for (let i = 0; i < totalItems; i++) {
    while (!studyDays.includes(current.getDay())) {
      current.setDate(current.getDate() + 1);
      itemsOnDay = 0;
    }

    dates.push(formatDateISO(current));
    itemsOnDay++;

    if (itemsOnDay >= topicsPerDay) {
      current.setDate(current.getDate() + 1);
      itemsOnDay = 0;
    }
  }

  return dates;
}
