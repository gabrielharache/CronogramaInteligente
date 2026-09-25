import { AppState, PontoEstudo, Edital, Cronograma, BlocoHorario, SessaoEstudo } from '../types';
import { DEFAULT_SUBJECT_COLORS, RAW_SEED_PONTOS, RAW_SEED_EDITAIS, DEFAULT_CRONOGRAMAS } from '../data/seed';
import { uid } from './helpers';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const GUEST_STORAGE_KEY = 'estante_estudos_app_v4';

export const getUserStorageKey = (userId?: string): string => {
  return userId ? `estante_estudos_user_${userId}` : GUEST_STORAGE_KEY;
};

export function getDefaultGradeSemanal(): BlocoHorario[] {
  return [
    // Segunda a Sexta: Trabalho 08:00 - 12:00 e 13:00 - 17:00
    ...[1, 2, 3, 4, 5].flatMap(dia => [
      {
        id: `trab-m-${dia}`,
        diaSemana: dia,
        horaInicio: 8,
        horaFim: 12,
        categoria: 'trabalho' as const,
        titulo: 'Expediente de Trabalho',
        notas: 'Atividades profissionais e demandas da equipe'
      },
      {
        id: `trab-t-${dia}`,
        diaSemana: dia,
        horaInicio: 13,
        horaFim: 17,
        categoria: 'trabalho' as const,
        titulo: 'Expediente de Trabalho',
        notas: 'Atividades e processos'
      },
      {
        id: `estudo-n-${dia}`,
        diaSemana: dia,
        horaInicio: 19,
        horaFim: 22,
        categoria: 'estudo' as const,
        titulo: dia === 1 ? 'Direito Constitucional' : dia === 2 ? 'Direito Administrativo' : dia === 3 ? 'Processo Civil' : dia === 4 ? 'Direito Tributário' : 'Direito Civil',
        materia: dia === 1 ? 'Constitucional' : dia === 2 ? 'Administrativo' : dia === 3 ? 'Processo Civil' : dia === 4 ? 'Tributário' : 'Civil',
        notas: 'Leitura de doutrina e resolução de questões do ciclo'
      }
    ]),
    // Outros afazeres rotineiros (Almoço, Treino)
    ...[1, 2, 3, 4, 5].map(dia => ({
      id: `afaz-alm-${dia}`,
      diaSemana: dia,
      horaInicio: 12,
      horaFim: 13,
      categoria: 'afazeres' as const,
      titulo: 'Almoço & Descanso'
    })),
    ...[1, 3, 5].map(dia => ({
      id: `afaz-treino-${dia}`,
      diaSemana: dia,
      horaInicio: 17,
      horaFim: 18,
      categoria: 'afazeres' as const,
      titulo: 'Atividade Física / Academia'
    })),
    // Sábado: Estudos pela manhã e lazer à tarde
    {
      id: 'estudo-sab-1',
      diaSemana: 6,
      horaInicio: 8,
      horaFim: 12,
      categoria: 'estudo' as const,
      titulo: 'Simulado Semanal & Revisão',
      materia: 'Administrativo',
      notas: 'Revisão dos pontos da semana e questões'
    },
    {
      id: 'afaz-sab-lazer',
      diaSemana: 6,
      horaInicio: 14,
      horaFim: 19,
      categoria: 'afazeres' as const,
      titulo: 'Lazer e Família'
    },
    // Domingo: Revisão leve e descanso
    {
      id: 'estudo-dom-1',
      diaSemana: 0,
      horaInicio: 9,
      horaFim: 12,
      categoria: 'estudo' as const,
      titulo: 'Lei Seca e Jurisprudência (STF/STJ)',
      materia: 'Constitucional',
      notas: 'Leitura de informativos'
    },
    {
      id: 'afaz-dom-lazer',
      diaSemana: 0,
      horaInicio: 13,
      horaFim: 20,
      categoria: 'afazeres' as const,
      titulo: 'Descanso e Organização Pessoal'
    }
  ];
}

export function getDefaultSessoesEstudo(): SessaoEstudo[] {
  const agora = Date.now();
  return [
    {
      id: 'sessao-1',
      cronogramaId: 'cronograma-geral',
      materia: 'Constitucional',
      assunto: 'Teoria Geral da Constituição e Neoconstitucionalismo',
      duracaoSegundos: 5400, // 1h 30m
      data: '2026-09-01',
      inicioTimestamp: agora - 86400000 * 6,
      fimTimestamp: agora - 86400000 * 6 + 5400000,
      tipoTimer: 'pomodoro',
      notas: 'Finalizada leitura e 40 questões resolvidas.'
    },
    {
      id: 'sessao-2',
      cronogramaId: 'cronograma-geral',
      materia: 'Administrativo',
      assunto: 'Organização Administrativa (Parte 01)',
      duracaoSegundos: 7200, // 2h 00m
      data: '2026-08-31',
      inicioTimestamp: agora - 86400000 * 7,
      fimTimestamp: agora - 86400000 * 7 + 7200000,
      tipoTimer: 'cronometro',
      notas: 'Estudo focado em desconcentração vs descentralização.'
    },
    {
      id: 'sessao-3',
      cronogramaId: 'cronograma-geral',
      materia: 'Processo Civil',
      assunto: 'Normas Fundamentais e Princípios Processuais',
      duracaoSegundos: 3600, // 1h 00m
      data: '2026-09-02',
      inicioTimestamp: agora - 86400000 * 5,
      fimTimestamp: agora - 86400000 * 5 + 3600000,
      tipoTimer: 'pomodoro',
      notas: 'Art. 1º a 12 do CPC.'
    },
    {
      id: 'sessao-4',
      cronogramaId: 'cronograma-geral',
      materia: 'Civil',
      assunto: 'LINDB - Vigência e Aplicação da Lei',
      duracaoSegundos: 4500, // 1h 15m
      data: '2026-09-03',
      inicioTimestamp: agora - 86400000 * 4,
      fimTimestamp: agora - 86400000 * 4 + 4500000,
      tipoTimer: 'cronometro',
      notas: 'Leitura da LINDB com anotações doutrinárias.'
    },
    {
      id: 'sessao-5',
      cronogramaId: 'cronograma-geral',
      materia: 'Constitucional',
      assunto: 'Direitos e Deveres Individuais (Art. 5º)',
      duracaoSegundos: 5400, // 1h 30m
      data: '2026-09-07',
      inicioTimestamp: agora - 10800000,
      fimTimestamp: agora - 5400000,
      tipoTimer: 'pomodoro',
      notas: 'Foco nos incisos mais cobrados em prova.'
    }
  ];
}

// Cronograma totalmente vazio para novos usuários cadastrados
export function getEmptyUserState(): AppState {
  const defaultCronograma: Cronograma = {
    id: 'cronograma-principal',
    nome: 'Meu Cronograma',
    descricao: 'Cronograma pessoal de estudos',
    cor: '#3b82f6',
    createdAt: Date.now()
  };

  return {
    cronogramas: [defaultCronograma],
    activeCronogramaId: 'cronograma-principal',
    pontos: [],
    editais: [],
    materiasCores: {},
    gradeSemanal: [],
    sessoesEstudo: [],
    ui: {
      view: 'semanal',
      activeTab: 'pontos',
      tipoEstudoFilter: 'todos',
      sidebarCollapsed: false
    },
    migs: ['v4-visual-identity', 'v3-multi-cronogramas', 'v5-weekly-focus']
  };
}

// Estado com dados de exemplo (usado em modo visitante ou demonstração)
export function getInitialState(): AppState {
  const seedPontos: PontoEstudo[] = RAW_SEED_PONTOS.map(([data, materia, titulo, notas], index) => {
    const isFirstCompleted = index === 1; // 2026-09-01 Constitucional

    return {
      id: uid(),
      cronogramaId: 'cronograma-geral',
      data,
      materia,
      titulo,
      tipoEstudo: 'doutrina',
      notas: notas || '',
      lido: isFirstCompleted,
      qFeitas: isFirstCompleted,
      qTotal: isFirstCompleted ? 40 : '',
      qAcertos: isFirstCompleted ? 30 : '',
      dif: null,
      showNotes: false,
      ordem: index + 1,
      createdAt: Date.now() + index,
      updatedAt: Date.now() + index
    };
  });

  const seedEditais: Edital[] = RAW_SEED_EDITAIS.map(e => ({
    ...e,
    id: e.id || uid()
  }));

  return {
    cronogramas: [...DEFAULT_CRONOGRAMAS],
    activeCronogramaId: 'cronograma-geral',
    pontos: seedPontos,
    editais: seedEditais,
    materiasCores: { ...DEFAULT_SUBJECT_COLORS },
    gradeSemanal: getDefaultGradeSemanal(),
    sessoesEstudo: getDefaultSessoesEstudo(),
    ui: {
      view: 'semanal',
      activeTab: 'pontos',
      tipoEstudoFilter: 'todos',
      sidebarCollapsed: false
    },
    migs: ['v4-visual-identity', 'v5-weekly-focus']
  };
}

export function validateState(parsed: any, fallbackToEmpty = false): AppState {
  if (!parsed || !Array.isArray(parsed.pontos)) {
    return fallbackToEmpty ? getEmptyUserState() : getInitialState();
  }

  const cronogramas: Cronograma[] = Array.isArray(parsed.cronogramas) && parsed.cronogramas.length > 0
    ? parsed.cronogramas
    : [
        {
          id: 'cronograma-principal',
          nome: 'Meu Cronograma',
          cor: '#3b82f6',
          createdAt: Date.now()
        }
      ];

  const activeCronogramaId = parsed.activeCronogramaId || cronogramas[0]?.id || 'all';

  // Group by materia and cronograma to safely calculate or assign missing `ordem`
  const pointsByGroup: Record<string, any[]> = {};
  parsed.pontos.forEach((p: any, idx: number) => {
    const key = `${p.cronogramaId || 'default'}_${p.materia || 'Geral'}`;
    if (!pointsByGroup[key]) pointsByGroup[key] = [];
    pointsByGroup[key].push({ p, originalIdx: idx });
  });

  const calculatedOrdemMap = new Map<any, number>();
  Object.values(pointsByGroup).forEach(group => {
    // If points already have valid numbers in `ordem`, respect them
    const allHaveOrdem = group.every(item => typeof item.p.ordem === 'number' && !isNaN(item.p.ordem));
    if (allHaveOrdem) {
      group.forEach(item => {
        calculatedOrdemMap.set(item.p, item.p.ordem);
      });
    } else {
      // Sort by existing `createdAt` or original index to restore original pedagogical sequence
      const sorted = [...group].sort((a, b) => {
        if (typeof a.p.ordem === 'number' && typeof b.p.ordem === 'number') {
          return a.p.ordem - b.p.ordem;
        }
        if (typeof a.p.ordem === 'number') return -1;
        if (typeof b.p.ordem === 'number') return 1;
        const cA = a.p.createdAt || 0;
        const cB = b.p.createdAt || 0;
        if (cA !== cB) return cA - cB;
        return a.originalIdx - b.originalIdx;
      });
      sorted.forEach((item, seq) => {
        calculatedOrdemMap.set(item.p, seq + 1);
      });
    }
  });

  const migratedPontos: PontoEstudo[] = parsed.pontos.map((p: any, idx: number) => ({
    id: p.id || uid(),
    cronogramaId: p.cronogramaId || cronogramas[0]?.id || 'cronograma-principal',
    data: p.data || '',
    datas: Array.isArray(p.datas) ? p.datas : undefined,
    materia: p.materia || 'Geral',
    titulo: p.titulo || 'Sem título',
    tipoEstudo: p.tipoEstudo || 'doutrina',
    artigosLei: p.artigosLei || '',
    jurisprudenciaRef: p.jurisprudenciaRef || '',
    notas: p.notas || '',
    lido: Boolean(p.lido),
    qFeitas: Boolean(p.qFeitas),
    qTotal: p.qTotal ?? '',
    qAcertos: p.qAcertos ?? '',
    dif: p.dif || null,
    showNotes: Boolean(p.showNotes),
    showChecklist: p.showChecklist !== undefined ? Boolean(p.showChecklist) : undefined,
    subTopicos: Array.isArray(p.subTopicos) ? p.subTopicos : undefined,
    ordem: calculatedOrdemMap.get(p) ?? (idx + 1),
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now()
  }));

  const materiasCores = parsed.materiasCores || {};

  const editais: Edital[] = Array.isArray(parsed.editais) ? parsed.editais : [];

  const materiaOrder: string[] | undefined = Array.isArray(parsed.materiaOrder) ? parsed.materiaOrder : undefined;

  const gradeSemanal: BlocoHorario[] = Array.isArray(parsed.gradeSemanal)
    ? parsed.gradeSemanal
    : (fallbackToEmpty ? [] : getDefaultGradeSemanal());

  const rawSessoesEstudo: SessaoEstudo[] = Array.isArray(parsed.sessoesEstudo)
    ? parsed.sessoesEstudo
    : (fallbackToEmpty ? [] : getDefaultSessoesEstudo());

  const sessoesEstudo: SessaoEstudo[] = rawSessoesEstudo.map(s => {
    let cronogramaId = s.cronogramaId;
    if (!cronogramaId && s.pontoId) {
      const associatedPoint = migratedPontos.find(p => p.id === s.pontoId);
      if (associatedPoint) {
        cronogramaId = associatedPoint.cronogramaId;
      }
    }
    if (!cronogramaId && cronogramas.length > 0) {
      const matchingPoint = migratedPontos.find(p => p.materia === s.materia);
      if (matchingPoint && matchingPoint.cronogramaId) {
        cronogramaId = matchingPoint.cronogramaId;
      } else {
        cronogramaId = activeCronogramaId !== 'all' ? activeCronogramaId : cronogramas[0]?.id;
      }
    }
    return {
      ...s,
      cronogramaId
    };
  });

  const ui = {
    view: parsed.ui?.view || 'semanal',
    activeTab: parsed.ui?.activeTab || 'pontos',
    calMes: parsed.ui?.calMes,
    tipoEstudoFilter: parsed.ui?.tipoEstudoFilter || 'todos',
    sidebarCollapsed: Boolean(parsed.ui?.sidebarCollapsed)
  };

  return {
    cronogramas,
    activeCronogramaId,
    pontos: migratedPontos,
    editais,
    materiasCores,
    gradeSemanal,
    sessoesEstudo,
    materiaOrder,
    ui,
    migs: ['v4-user-isolated', 'v5-weekly-focus']
  };
}

// Carregamento síncrono do localStorage (para render inicial rápida)
export function loadLocalUserState(userId?: string): AppState {
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);

    if (raw) {
      const parsed = JSON.parse(raw);
      return validateState(parsed, Boolean(userId));
    }

    // Se for usuário autenticado mas sem cache local, retorna totalmente vazio
    if (userId) {
      return getEmptyUserState();
    }

    // Fallback legado para modo convidado
    const v2Raw = localStorage.getItem('estante_estudos_app_v2');
    if (v2Raw) {
      const parsed = JSON.parse(v2Raw);
      return validateState(parsed, false);
    }

    return getInitialState();
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return userId ? getEmptyUserState() : getInitialState();
  }
}

// Carregamento assíncrono com sincronização do Supabase
export async function fetchUserState(userId?: string): Promise<{ state: AppState; fromCloud: boolean; updatedAt?: string }> {
  const localState = loadLocalUserState(userId);

  if (!userId || !isSupabaseConfigured()) {
    return { state: localState, fromCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('user_schedules')
      .select('state, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error, using local state:', error.message);
      return { state: localState, fromCloud: false };
    }

    // Se usuário não possui registro no Supabase, é um novo usuário: inicializa vazio
    if (!data) {
      const emptyState = getEmptyUserState();
      // Salva estado vazio no Supabase para inicializar
      await saveUserState(emptyState, userId);
      return { state: emptyState, fromCloud: true };
    }

    const cloudState = validateState(data.state, true);
    // Atualiza cache local
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(cloudState));
    return { state: cloudState, fromCloud: true, updatedAt: data.updated_at };
  } catch (err) {
    console.error('Error in fetchUserState:', err);
    return { state: localState, fromCloud: false };
  }
}

// Salvamento exclusivo no localStorage (para rascunho local instantâneo)
export function saveLocalUserState(state: AppState, userId?: string): void {
  const key = getUserStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

// Salvamento na nuvem do Supabase
export async function saveCloudUserState(state: AppState, userId?: string): Promise<{ success: boolean; updatedAt?: string; error?: string }> {
  if (!userId || !isSupabaseConfigured()) {
    return { success: true, updatedAt: new Date().toISOString() };
  }

  try {
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('user_schedules')
      .upsert(
        {
          user_id: userId,
          state: state,
          updated_at: updatedAt
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Error saving state to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, updatedAt };
  } catch (err: any) {
    console.error('Unexpected error saving state to Supabase:', err);
    return { success: false, error: err?.message || 'Erro inesperado ao salvar no Supabase' };
  }
}

// Salvamento completo no localStorage e Supabase
export async function saveUserState(state: AppState, userId?: string): Promise<boolean> {
  saveLocalUserState(state, userId);
  const result = await saveCloudUserState(state, userId);
  return result.success;
}

// Exportar e Importar Backup JSON
export function exportBackup(state: AppState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `meu-cronograma-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateAndParseBackup(jsonStr: string): AppState | null {
  try {
    const obj = JSON.parse(jsonStr);
    if (obj && Array.isArray(obj.pontos)) {
      return validateState(obj, true);
    }
    return null;
  } catch {
    return null;
  }
}
