import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SessaoEstudo, PontoEstudo, TipoEstudo } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Flame, 
  Calendar,
  Sparkles,
  Award,
  ChevronDown,
  Scale,
  Landmark,
  AlertTriangle,
  X,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { hojeStr, formatarDataBr } from '../utils/helpers';

interface FocusTimerViewProps {
  sessoesEstudo?: SessaoEstudo[];
  onSaveSessao?: (sessao: Omit<SessaoEstudo, 'id'>, marcarPontoLidoId?: string) => void;
  onDeleteSessao?: (id: string) => void;
  onUpdateSessao?: (id: string, updated: Partial<SessaoEstudo>) => void;
  materias?: string[];
  materiasCores?: Record<string, string>;
  pontos?: PontoEstudo[];
  // External timer state if running in background
  activeTimer?: {
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
  };
  onStartTimer?: (config: {
    mode: 'cronometro' | 'pomodoro' | 'pausa';
    targetSeconds: number;
    materia: string;
    assunto: string;
    pontoId?: string;
    marcarComoLido: boolean;
    notas: string;
    tipoEstudo?: TipoEstudo;
  }) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onResetTimer?: () => void;
}

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  sessoesEstudo = [],
  onSaveSessao = (_sessao, _marcarPontoLidoId) => {},
  onDeleteSessao = (_id) => {},
  onUpdateSessao = (_id, _updated) => {},
  materias = [],
  materiasCores = {},
  pontos = [],
  activeTimer: incomingActiveTimer,
  onStartTimer = (_config) => {},
  onPauseTimer = () => {},
  onResumeTimer = () => {},
  onResetTimer = () => {}
}) => {
  const activeTimer = useMemo(() => {
    return incomingActiveTimer || {
      isRunning: false,
      mode: 'pomodoro' as const,
      secondsElapsed: 0,
      targetSeconds: 50 * 60,
      materia: materias[0] || 'Constitucional',
      assunto: '',
      pontoId: '',
      marcarComoLido: true,
      notas: ''
    };
  }, [incomingActiveTimer, materias]);

  // Local configuration inputs when timer is not running
  const [selectedMateria, setSelectedMateria] = useState<string>(() => activeTimer.materia || materias[0] || 'Constitucional');
  const [selectedPontoId, setSelectedPontoId] = useState<string>(() => activeTimer.pontoId || '');
  const [customAssunto, setCustomAssunto] = useState<string>(() => activeTimer.assunto || '');
  const [timerMode, setTimerMode] = useState<'cronometro' | 'pomodoro'>('pomodoro');
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(50); // Default 50 minutes
  const [marcarComoLido, setMarcarComoLido] = useState<boolean>(true);
  const [sessionNotas, setSessionNotas] = useState<string>('');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [selectedTipoEstudo, setSelectedTipoEstudo] = useState<TipoEstudo | undefined>(undefined);
  const [showShortSessionModal, setShowShortSessionModal] = useState<boolean>(false);

  // History Edit State
  const [editingSessao, setEditingSessao] = useState<SessaoEstudo | null>(null);
  const [editSessaoMateria, setEditSessaoMateria] = useState('');
  const [editSessaoAssunto, setEditSessaoAssunto] = useState('');

  const handleStartEditSessao = (sessao: SessaoEstudo) => {
    setEditingSessao(sessao);
    setEditSessaoMateria(sessao.materia);
    setEditSessaoAssunto(sessao.assunto);
  };

  // Play pleasant chime with Web Audio API
  const playChime = () => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (_) {}
  };

  // Filter study points belonging to selected subject
  const availablePontosForSubject = useMemo(() => {
    return pontos.filter(p => p.materia === selectedMateria);
  }, [pontos, selectedMateria]);

  // When study point is selected, sync topic name
  const handleSelectPonto = (pontoId: string) => {
    setSelectedPontoId(pontoId);
    const p = pontos.find(item => item.id === pontoId);
    if (p) {
      setCustomAssunto(p.titulo);
      if (p.tipoEstudo) {
        setSelectedTipoEstudo(p.tipoEstudo);
      }
    }
  };

  // Determine current active mode and target time (reactive to preset button / minutes changes even before starting)
  const isTimerFresh = !activeTimer.isRunning && activeTimer.secondsElapsed === 0;
  const currentMode = isTimerFresh ? timerMode : activeTimer.mode;
  const currentTargetSeconds = isTimerFresh 
    ? (timerMode === 'pomodoro' ? pomodoroMinutes * 60 : 0)
    : activeTimer.targetSeconds;

  // Time calculations
  const displaySeconds = useMemo(() => {
    if (isTimerFresh) {
      return currentMode === 'cronometro' ? 0 : currentTargetSeconds;
    }
    if (activeTimer.mode === 'cronometro') {
      return activeTimer.secondsElapsed;
    } else {
      // Countdown
      return Math.max(0, activeTimer.targetSeconds - activeTimer.secondsElapsed);
    }
  }, [isTimerFresh, currentMode, currentTargetSeconds, activeTimer.mode, activeTimer.secondsElapsed, activeTimer.targetSeconds]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Progress percentage
  const progressPct = useMemo(() => {
    if (isTimerFresh) return 0;
    if (activeTimer.targetSeconds <= 0) return 0;
    return Math.min(100, Math.round((activeTimer.secondsElapsed / activeTimer.targetSeconds) * 100));
  }, [isTimerFresh, activeTimer.secondsElapsed, activeTimer.targetSeconds]);

  // Check completion of countdown timer
  useEffect(() => {
    if (activeTimer.isRunning && activeTimer.mode !== 'cronometro' && activeTimer.secondsElapsed >= activeTimer.targetSeconds && activeTimer.targetSeconds > 0) {
      playChime();
      try {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    }
  }, [activeTimer.isRunning, activeTimer.secondsElapsed, activeTimer.targetSeconds, activeTimer.mode]);

  // Handle start
  const handleStart = () => {
    const topicToUse = customAssunto.trim() || 
      (selectedPontoId ? (pontos.find(p => p.id === selectedPontoId)?.titulo || 'Estudo Focado') : 'Estudo Geral');

    onStartTimer({
      mode: timerMode,
      targetSeconds: timerMode === 'pomodoro' ? pomodoroMinutes * 60 : 0,
      materia: selectedMateria,
      assunto: topicToUse,
      pontoId: selectedPontoId || undefined,
      marcarComoLido: marcarComoLido,
      notas: sessionNotas,
      tipoEstudo: selectedTipoEstudo
    });
  };

  // Execute save session logic
  const executeSaveSession = () => {
    const duracaoLiquida = activeTimer.secondsElapsed;
    const agora = Date.now();
    const finalMateria = activeTimer.materia || selectedMateria;
    const finalAssunto = activeTimer.assunto || customAssunto || 'Estudo Focado';

    // Try to resolve cronogramaId from selected point if activeTimer has no cronogramaId
    const associatedPoint = activeTimer.pontoId ? pontos.find(p => p.id === activeTimer.pontoId) : undefined;
    const resolvedCronogramaId = activeTimer.cronogramaId || associatedPoint?.cronogramaId;

    onSaveSessao({
      materia: finalMateria,
      assunto: finalAssunto,
      pontoId: activeTimer.pontoId,
      cronogramaId: resolvedCronogramaId,
      duracaoSegundos: duracaoLiquida,
      data: hojeStr(),
      inicioTimestamp: agora - duracaoLiquida * 1000,
      fimTimestamp: agora,
      tipoTimer: activeTimer.mode === 'cronometro' ? 'cronometro' : 'pomodoro',
      notas: activeTimer.notas || sessionNotas || undefined,
      tipoEstudo: activeTimer.tipoEstudo || selectedTipoEstudo
    }, activeTimer.marcarComoLido ? activeTimer.pontoId : undefined);

    onResetTimer();
    playChime();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (_) {}
  };

  // Handle Finish and Save study session
  const handleFinishAndSave = () => {
    const duracaoLiquida = activeTimer.secondsElapsed;
    if (duracaoLiquida < 30) {
      setShowShortSessionModal(true);
      return;
    }
    executeSaveSession();
  };

  // Today stats
  const hoje = hojeStr();
  const sessoesHoje = useMemo(() => {
    return sessoesEstudo.filter(s => s.data === hoje);
  }, [sessoesEstudo, hoje]);

  const segundosHoje = sessoesHoje.reduce((acc, s) => acc + s.duracaoSegundos, 0);

  // Subject colors
  const activeColor = materiasCores[activeTimer.materia || selectedMateria] || '#8C1C2C';

  return (
    <div className="space-y-6">
      {/* Fullscreen Zen Mode Wrapper */}
      <div className={`${isZenMode ? 'fixed inset-0 z-50 bg-[#0c0c0e] text-white flex flex-col justify-center items-center p-6 overflow-y-auto' : ''}`}>
        
        {/* Top Header inside Zen Mode */}
        {isZenMode && (
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title={isSoundEnabled ? "Desativar alerta sonoro" : "Ativar alerta sonoro"}
            >
              {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsZenMode(false)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Sair do modo tela cheia"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {!isZenMode && (
          <div className="flex items-center justify-end gap-2">
            {/* Top Controls */}
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSoundEnabled 
                  ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-400'
              }`}
              title={isSoundEnabled ? "Alerta sonoro ativado" : "Alerta sonoro silenciado"}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSoundEnabled ? 'Som Ativado' : 'Silencioso'}</span>
            </button>

            <button
              onClick={() => setIsZenMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-3xs transition-colors cursor-pointer"
              title="Abrir cronômetro em modo imersivo"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Modo Imersivo</span>
            </button>
          </div>
        )}

        {/* Main Central Timer Stage */}
        <div className={`mt-4 rounded-2xl border transition-all ${
          isZenMode 
            ? 'border-zinc-800 bg-zinc-900/60 p-8 sm:p-12 max-w-xl w-full text-center shadow-2xl backdrop-blur-md' 
            : 'border-zinc-200/90 bg-white p-6 sm:p-8 shadow-3xs'
        }`}>
          {/* Active Context Header (Materia & Assunto) */}
          <div className="text-center mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-3xs"
                style={{
                  backgroundColor: `${activeColor}15`,
                  color: activeColor,
                  border: `1px solid ${activeColor}40`
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor }} />
                <span>{activeTimer.materia || selectedMateria}</span>
              </div>

              {(activeTimer.tipoEstudo || selectedTipoEstudo) && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-3xs ${
                  (activeTimer.tipoEstudo || selectedTipoEstudo) === 'doutrina'
                    ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                    : (activeTimer.tipoEstudo || selectedTipoEstudo) === 'lei_seca'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  {(activeTimer.tipoEstudo || selectedTipoEstudo) === 'doutrina' && <BookOpen className="w-3 h-3 text-zinc-600" />}
                  {(activeTimer.tipoEstudo || selectedTipoEstudo) === 'lei_seca' && <Scale className="w-3 h-3 text-amber-700" />}
                  {(activeTimer.tipoEstudo || selectedTipoEstudo) === 'jurisprudencia' && <Landmark className="w-3 h-3 text-emerald-700" />}
                  <span>
                    {(activeTimer.tipoEstudo || selectedTipoEstudo) === 'doutrina' ? 'Doutrina' : (activeTimer.tipoEstudo || selectedTipoEstudo) === 'lei_seca' ? 'Lei Seca' : 'Jurisprudência'}
                  </span>
                </div>
              )}
            </div>

            <h3 className={`font-serif font-bold text-lg sm:text-xl md:text-2xl mt-2 tracking-tight ${
              isZenMode ? 'text-white' : 'text-zinc-900'
            }`}>
              {activeTimer.assunto || customAssunto || (selectedPontoId ? pontos.find(p => p.id === selectedPontoId)?.titulo : 'Selecione um tópico para focar')}
            </h3>

            {activeTimer.isRunning && (
              <p className="text-xs text-amber-500 font-mono mt-1 font-semibold flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Sessão ativa em andamento... Mantenha o foco!</span>
              </p>
            )}
          </div>

          {/* Digital Clock with Circular Progress Visual */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Circular SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                <circle
                  cx="120"
                  cy="120"
                  r="104"
                  className={isZenMode ? 'stroke-zinc-800' : 'stroke-zinc-100'}
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="104"
                  stroke={activeColor}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={653}
                  strokeDashoffset={653 - (653 * (currentMode === 'cronometro' ? Math.min(100, (activeTimer.secondsElapsed % 3600) / 36) : progressPct)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Inside Clock Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight select-none ${
                  isZenMode ? 'text-white' : 'text-zinc-900'
                }`}>
                  {formatTime(displaySeconds)}
                </span>

                <span className={`text-[11px] font-mono uppercase tracking-widest mt-1 ${
                  isZenMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {currentMode === 'cronometro' ? 'Tempo Líquido' : 'Tempo Restante'}
                </span>

                {currentMode === 'pomodoro' && currentTargetSeconds > 0 && (
                  <span className={`text-[10px] font-mono mt-0.5 ${isZenMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Meta: {Math.round(currentTargetSeconds / 60)} min {!isTimerFresh ? `(${progressPct}%)` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Play / Pause / Resume / Finish / Reset */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 flex-wrap">
            {!activeTimer.isRunning && activeTimer.secondsElapsed === 0 && (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all cursor-pointer transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Iniciar Foco</span>
              </button>
            )}

            {activeTimer.isRunning && (
              <button
                onClick={onPauseTimer}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>Pausar</span>
              </button>
            )}

            {!activeTimer.isRunning && activeTimer.secondsElapsed > 0 && (
              <button
                onClick={onResumeTimer}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continuar</span>
              </button>
            )}

            {/* Finish & Save Session */}
            {activeTimer.secondsElapsed > 0 && (
              <button
                onClick={handleFinishAndSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
                title="Salvar horas líquidas e contabilizar nas estatísticas"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Sessão</span>
              </button>
            )}

            {/* Reset / Discard */}
            {activeTimer.secondsElapsed > 0 && (
              <button
                onClick={onResetTimer}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isZenMode ? 'text-zinc-400 hover:text-white bg-zinc-800' : 'text-zinc-500 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50'
                }`}
                title="Descartar cronômetro atual"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Panel (only visible when not in full Zen mode and timer is NOT actively running) */}
      {!isZenMode && !activeTimer.isRunning && activeTimer.secondsElapsed === 0 && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 shadow-3xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h4 className="font-serif font-bold text-base text-zinc-900">
              Configurações da Sessão de Foco
            </h4>
            <span className="text-[11px] font-mono text-zinc-500">
              Personalize o temporizador e o assunto
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode selection */}
            <div>
              <label className="block font-bold text-xs text-zinc-700 mb-1.5">
                Modo do Temporizador
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimerMode('pomodoro')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    timerMode === 'pomodoro'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-zinc-900 shadow-3xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <div>Temporizador / Pomodoro</div>
                  <div className="text-[10px] text-zinc-500 font-normal mt-0.5">Contagem regressiva com meta</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTimerMode('cronometro')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    timerMode === 'cronometro'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-zinc-900 shadow-3xs'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <div>Cronômetro Livre</div>
                  <div className="text-[10px] text-zinc-500 font-normal mt-0.5">Contagem progressiva aberta</div>
                </button>
              </div>
            </div>

            {/* Duration presets if Pomodoro */}
            {timerMode === 'pomodoro' ? (
              <div>
                <label className="block font-bold text-xs text-zinc-700 mb-1.5">
                  Duração da Sessão (Minutos)
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[25, 45, 50, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setPomodoroMinutes(mins)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        pomodoroMinutes === mins
                          ? 'bg-zinc-900 text-white shadow-2xs'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={pomodoroMinutes}
                      onChange={(e) => setPomodoroMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 bg-zinc-50 border border-zinc-200 rounded-lg p-1.5 text-xs font-mono font-bold text-center focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-500">min</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500">
                No modo cronômetro, o tempo será contado progressivamente a partir de zero até você decidir pausar ou salvar a sessão.
              </div>
            )}
          </div>

          {/* Subject & Study Point selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Matéria */}
            <div>
              <label className="block font-bold text-xs text-zinc-700 mb-1.5">
                Matéria do Estudo
              </label>
              <select
                value={selectedMateria}
                onChange={(e) => {
                  setSelectedMateria(e.target.value);
                  setSelectedPontoId('');
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                {materias.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Ponto de Estudo ou Assunto Livre */}
            <div>
              <label className="block font-bold text-xs text-zinc-700 mb-1.5">
                Vincular ao Cronograma (Opcional)
              </label>
              <select
                value={selectedPontoId}
                onChange={(e) => handleSelectPonto(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="">Digitar assunto manualmente...</option>
                {availablePontosForSubject.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.data ? `${p.data.slice(8, 10)}/${p.data.slice(5, 7)} — ` : ''}{p.titulo} {p.lido ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Topic Name */}
          <div>
            <label className="block font-bold text-xs text-zinc-700 mb-1">
              Nome do Assunto / Tópico
            </label>
            <input
              type="text"
              placeholder="Ex: Controle Concentrado de Constitucionalidade (ADI, ADC e ADPF)"
              value={customAssunto}
              onChange={(e) => setCustomAssunto(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          {/* Tipo de Estudo (Doutrina, Lei Seca, Jurisprudência) */}
          <div className="pt-1">
            <label className="block font-bold text-xs text-zinc-700 mb-1.5 flex items-center gap-1">
              <span>Tipo de Estudo / Classificação</span>
              <span className="text-[10px] text-zinc-400 font-normal font-sans">(Opcional)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTipoEstudo(selectedTipoEstudo === 'doutrina' ? undefined : 'doutrina')}
                className={`py-2 px-2 rounded-lg border text-center text-[10px] sm:text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedTipoEstudo === 'doutrina'
                    ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Doutrina</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTipoEstudo(selectedTipoEstudo === 'lei_seca' ? undefined : 'lei_seca')}
                className={`py-2 px-2 rounded-lg border text-center text-[10px] sm:text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedTipoEstudo === 'lei_seca'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Lei Seca</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTipoEstudo(selectedTipoEstudo === 'jurisprudencia' ? undefined : 'jurisprudencia')}
                className={`py-2 px-2 rounded-lg border text-center text-[10px] sm:text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedTipoEstudo === 'jurisprudencia'
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Jurisprudência</span>
              </button>
            </div>
          </div>

          {/* Option to mark topic as read on finish */}
          {selectedPontoId && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="check-marcar-lido"
                checked={marcarComoLido}
                onChange={(e) => setMarcarComoLido(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="check-marcar-lido" className="text-xs font-medium text-zinc-700 cursor-pointer">
                Ao finalizar a sessão, marcar automaticamente este ponto como <strong>estudado/lido</strong> no cronograma.
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-bold text-xs text-zinc-700 mb-1">
              Metas / Anotações da Sessão (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Ler doutrina págs 40-75 e fazer 30 questões comentadas"
              value={sessionNotas}
              onChange={(e) => setSessionNotas(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Today's Stats & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Horas Hoje */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estudo Líquido Hoje</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {formatTime(segundosHoje)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({(segundosHoje / 3600).toFixed(1)}h)
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {sessoesHoje.length} {sessoesHoje.length === 1 ? 'sessão concluída' : 'sessões concluídas'} hoje
          </div>
        </div>

        {/* Card 2: Total Geral Acumulado */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Histórico Geral</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-blue-900">
              {formatTime(sessoesEstudo.reduce((a, s) => a + s.duracaoSegundos, 0))}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({(sessoesEstudo.reduce((a, s) => a + s.duracaoSegundos, 0) / 3600).toFixed(1)}h)
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Contabilizado em {sessoesEstudo.length} sessões registradas
          </div>
        </div>

        {/* Card 3: Matéria em Foco */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Matéria em Foco</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 truncate">
              {selectedMateria}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: materiasCores[selectedMateria] || '#18181B' }} />
            <span>Cor configurada no cronograma</span>
          </div>
        </div>
      </div>

      {/* Recent Sessions History Table */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-4 sm:p-5 shadow-3xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-zinc-900">
              Histórico Recente de Sessões de Foco
            </h3>
            <p className="text-xs text-zinc-500">
              Sessões de estudo líquido concluídas e computadas no seu desempenho.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
            {sessoesEstudo.length} sessões
          </span>
        </div>

        {sessoesEstudo.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-xs">
            Nenhuma sessão de estudo registrada ainda. Inicie seu primeiro temporizador de foco acima!
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
            {sessoesEstudo.slice().reverse().map(sessao => {
              const cor = materiasCores[sessao.materia] || '#18181B';
              const formattedDuration = formatTime(sessao.duracaoSegundos);

              return (
                <div
                  key={sessao.id}
                  className="p-3 bg-zinc-50/70 border border-zinc-200 hover:border-zinc-300 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0 shadow-3xs" 
                      style={{ backgroundColor: cor }} 
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-bold text-xs uppercase tracking-wider"
                          style={{ color: cor }}
                        >
                          {sessao.materia}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {formatarDataBr(sessao.data)}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/60 text-zinc-700 uppercase">
                          {sessao.tipoTimer}
                        </span>
                        {sessao.tipoEstudo && (
                          <span className={`text-[9px] font-bold font-sans px-1.5 py-0.2 rounded uppercase tracking-wider border shrink-0 ${
                            sessao.tipoEstudo === 'doutrina'
                              ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                              : sessao.tipoEstudo === 'lei_seca'
                              ? 'bg-amber-100 text-amber-950 border-amber-200'
                              : 'bg-emerald-100 text-emerald-950 border-emerald-200'
                          }`}>
                            {sessao.tipoEstudo === 'doutrina' ? 'Doutrina' : sessao.tipoEstudo === 'lei_seca' ? 'Lei Seca' : 'Jurisprudência'}
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-xs text-zinc-900 leading-snug truncate mt-0.5">
                        {sessao.assunto}
                      </div>

                      {sessao.notas && (
                        <div className="text-[11px] text-zinc-500 font-sans italic truncate mt-0.5">
                          "{sessao.notas}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-zinc-900">
                        {formattedDuration}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        líquido
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartEditSessao(sessao)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Editar registro de sessão"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteSessao(sessao.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Excluir este registro de sessão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Sessão Curta (< 30s) */}
      {showShortSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowShortSessionModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-zinc-900 mb-1">
              Sessão Curta de Estudo
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed mb-6">
              Esta sessão durou apenas <span className="font-mono font-bold text-zinc-900">{activeTimer.secondsElapsed} segundos</span> (menos de 30 segundos). Deseja registrá-la no seu histórico de horas líquidas ou prefere descartar?
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowShortSessionModal(false);
                  onResetTimer();
                }}
                className="px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                Descartar Sessão
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShortSessionModal(false);
                  executeSaveSession();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Registrar Mesmo Assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Sessão do Histórico */}
      {editingSessao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div 
            className="bg-white border border-zinc-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
                  <Clock className="w-3.5 h-3.5" />
                </span>
                <h2 className="font-sans font-semibold text-base text-zinc-900">
                  Personalizar registro do histórico
                </h2>
              </div>
              <button
                onClick={() => setEditingSessao(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-600 text-xs leading-relaxed">
                Você está editando uma sessão de estudo líquido realizada. Apenas a <strong>Matéria</strong> e o <strong>Assunto</strong> podem ser personalizados.
              </div>

              {/* Assunto */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Assunto estudado *
                </label>
                <input
                  type="text"
                  required
                  value={editSessaoAssunto}
                  onChange={(e) => setEditSessaoAssunto(e.target.value)}
                  placeholder="Ex.: Direito Constitucional - ADI"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>

              {/* Matéria */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Matéria *
                </label>
                <select
                  value={editSessaoMateria}
                  onChange={(e) => setEditSessaoMateria(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium cursor-pointer"
                >
                  {materias.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingSessao(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editSessaoAssunto.trim()) return;
                    onUpdateSessao(editingSessao.id, {
                      materia: editSessaoMateria,
                      assunto: editSessaoAssunto.trim()
                    });
                    setEditingSessao(null);
                  }}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-2xs transition-colors"
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
