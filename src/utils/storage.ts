import { AppState, PontoEstudo, Edital, Cronograma } from '../types';
import { DEFAULT_SUBJECT_COLORS, RAW_SEED_PONTOS, RAW_SEED_EDITAIS, DEFAULT_CRONOGRAMAS } from '../data/seed';
import { uid } from './helpers';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const GUEST_STORAGE_KEY = 'estante_estudos_app_v4';

export const getUserStorageKey = (userId?: string): string => {
  return userId ? `estante_estudos_user_${userId}` : GUEST_STORAGE_KEY;
};

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
    ui: {
      view: 'semanal',
      activeTab: 'pontos',
      tipoEstudoFilter: 'todos'
    },
    migs: ['v4-visual-identity', 'v3-multi-cronogramas']
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
    ui: {
      view: 'semanal',
      activeTab: 'pontos',
      tipoEstudoFilter: 'todos'
    },
    migs: ['v4-visual-identity']
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

  const migratedPontos: PontoEstudo[] = parsed.pontos.map((p: any) => ({
    id: p.id || uid(),
    cronogramaId: p.cronogramaId || cronogramas[0]?.id || 'cronograma-principal',
    data: p.data || '',
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
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now()
  }));

  const materiasCores = parsed.materiasCores || {};

  const editais: Edital[] = Array.isArray(parsed.editais) ? parsed.editais : [];

  const ui = {
    view: parsed.ui?.view || 'semanal',
    activeTab: parsed.ui?.activeTab || 'pontos',
    calMes: parsed.ui?.calMes,
    tipoEstudoFilter: parsed.ui?.tipoEstudoFilter || 'todos'
  };

  return {
    cronogramas,
    activeCronogramaId,
    pontos: migratedPontos,
    editais,
    materiasCores,
    ui,
    migs: ['v4-user-isolated']
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
