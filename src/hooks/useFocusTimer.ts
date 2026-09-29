import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { AppState, PontoEstudo, SessaoEstudo, TipoEstudo } from '../types';
import { uid } from '../utils/helpers';

export interface ActiveTimerState {
  isRunning: boolean;
  mode: 'cronometro' | 'pomodoro' | 'pausa';
  secondsElapsed: number;
  targetSeconds: number;
  materia: string;
  assunto: string;
  pontoId?: string;
  cronogramaId?: string;
  marcarComoLido: boolean;
  notas: string;
  tipoEstudo?: TipoEstudo;
}

export type TimerStartConfig = Omit<ActiveTimerState, 'isRunning' | 'secondsElapsed'>;

const INITIAL_TIMER: ActiveTimerState = {
  isRunning: false,
  mode: 'pomodoro',
  secondsElapsed: 0,
  targetSeconds: 50 * 60,
  materia: '',
  assunto: '',
  marcarComoLido: true,
  notas: ''
};

// Focus timer (kept at App level so it continues running across tabs) and study session handlers
export function useFocusTimer(setState: Dispatch<SetStateAction<AppState>>) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>(INITIAL_TIMER);

  // Focus configuration states
  const [focusTargetPonto, setFocusTargetPonto] = useState<PontoEstudo | null>(null);
  const [isFocusDurationModalOpen, setIsFocusDurationModalOpen] = useState(false);

  useEffect(() => {
    if (!activeTimer.isRunning) return;
    // Advance by wall-clock time so background-tab throttling or sleep doesn't make the timer drift
    let lastTick = Date.now();
    const interval = setInterval(() => {
      const delta = Math.floor((Date.now() - lastTick) / 1000);
      if (delta <= 0) return;
      lastTick += delta * 1000;
      setActiveTimer(prev => {
        if (!prev.isRunning) return prev;
        return { ...prev, secondsElapsed: prev.secondsElapsed + delta };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer.isRunning]);

  const startTimer = useCallback((cfg: TimerStartConfig) => {
    setActiveTimer({ ...cfg, isRunning: true, secondsElapsed: 0 });
  }, []);

  const pauseTimer = useCallback(() => {
    setActiveTimer(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resumeTimer = useCallback(() => {
    setActiveTimer(prev => ({ ...prev, isRunning: true }));
  }, []);

  const resetTimer = useCallback(() => {
    setActiveTimer(prev => ({ ...prev, isRunning: false, secondsElapsed: 0 }));
  }, []);

  const handleStartFocus = useCallback((ponto: PontoEstudo) => {
    setFocusTargetPonto(ponto);
    setIsFocusDurationModalOpen(true);
  }, []);

  const handleCloseFocusDuration = useCallback(() => {
    setIsFocusDurationModalOpen(false);
    setFocusTargetPonto(null);
  }, []);

  const handleConfirmStartFocus = useCallback((minutes: number, mode: 'pomodoro' | 'cronometro') => {
    if (!focusTargetPonto) return;
    setActiveTimer({
      isRunning: true,
      mode: mode,
      secondsElapsed: 0,
      targetSeconds: minutes * 60,
      materia: focusTargetPonto.materia,
      assunto: focusTargetPonto.titulo,
      pontoId: focusTargetPonto.id,
      cronogramaId: focusTargetPonto.cronogramaId,
      marcarComoLido: true,
      notas: focusTargetPonto.notas || '',
      tipoEstudo: focusTargetPonto.tipoEstudo
    });
    setIsFocusDurationModalOpen(false);
    setFocusTargetPonto(null);
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, activeTab: 'foco' }
    }));
  }, [focusTargetPonto, setState]);

  const handleDeleteSessao = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      sessoesEstudo: (prev.sessoesEstudo || []).filter(s => s.id !== id)
    }));
  }, [setState]);

  const handleUpdateSessao = useCallback((id: string, updated: Partial<SessaoEstudo>) => {
    setState(prev => ({
      ...prev,
      sessoesEstudo: (prev.sessoesEstudo || []).map(s => s.id === id ? { ...s, ...updated } : s)
    }));
  }, [setState]);

  const handleSaveSessao = useCallback((novaSessaoData: Omit<SessaoEstudo, 'id'>, marcarPontoLidoId?: string) => {
    setState(prev => {
      let cronogramaId = novaSessaoData.cronogramaId;
      if (!cronogramaId && novaSessaoData.pontoId) {
        const associatedPoint = prev.pontos.find(p => p.id === novaSessaoData.pontoId);
        if (associatedPoint) {
          cronogramaId = associatedPoint.cronogramaId;
        }
      }
      if (!cronogramaId && prev.activeCronogramaId && prev.activeCronogramaId !== 'all') {
        cronogramaId = prev.activeCronogramaId;
      }
      if (!cronogramaId && prev.cronogramas.length > 0) {
        const matchingPoint = prev.pontos.find(p => p.materia === novaSessaoData.materia);
        if (matchingPoint && matchingPoint.cronogramaId) {
          cronogramaId = matchingPoint.cronogramaId;
        } else {
          cronogramaId = prev.cronogramas[0].id;
        }
      }

      const novaSessao: SessaoEstudo = {
        ...novaSessaoData,
        cronogramaId,
        id: uid()
      };

      let nextPontos = prev.pontos;
      if (marcarPontoLidoId) {
        nextPontos = prev.pontos.map(p => p.id === marcarPontoLidoId ? { ...p, lido: true } : p);
      }
      return {
        ...prev,
        pontos: nextPontos,
        sessoesEstudo: [novaSessao, ...(prev.sessoesEstudo || [])]
      };
    });
  }, [setState]);

  return {
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    focusTargetPonto,
    isFocusDurationModalOpen,
    handleStartFocus,
    handleCloseFocusDuration,
    handleConfirmStartFocus,
    handleSaveSessao,
    handleUpdateSessao,
    handleDeleteSessao
  };
}
