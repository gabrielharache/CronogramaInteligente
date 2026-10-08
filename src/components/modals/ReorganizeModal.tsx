import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PontoEstudo, Cronograma, TipoEstudo } from '../../types';
import { hojeStr, formatarDataBr, getDiaDaSemana } from '../../utils/helpers';
import { 
  FixedWeeklySchedule,
  FixedWeeklySlot,
  ReorganizeStrategy,
  ReorganizePreset,
  ScheduledWeekSummary,
  loadReorganizePresets,
  saveReorganizePresetsToStorage,
  getDefaultBuiltInPresets,
  calculateScheduleFixedWeekly,
  calculateScheduleCycle,
  calculateSchedulePushAtrasados,
  REORG_PRESETS_STORAGE_KEY
} from '../../utils/scheduleReorganizer';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  BookOpen, 
  Shuffle, 
  CalendarDays, 
  Zap, 
  Check, 
  Info, 
  Bookmark, 
  BookmarkPlus, 
  ArrowRight,
  Scale,
  FileText,
  Gavel,
  Sliders,
  RefreshCw,
  Clock,
  AlertCircle,
  Split
} from 'lucide-react';

interface ReorganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pontos: PontoEstudo[];
  activeCronograma?: Cronograma;
  materiasCores?: Record<string, string>;
  onApplyReorganize: (updatedPoints: PontoEstudo[]) => void;
  globalMateriaOrder?: string[];
  onUpdateMateriaOrder?: (order: string[]) => void;
}

const DIAS_CONFIG = [
  { id: 1, label: 'Segunda-feira', abrev: 'Seg', isFimDeSemana: false },
  { id: 2, label: 'Terça-feira', abrev: 'Ter', isFimDeSemana: false },
  { id: 3, label: 'Quarta-feira', abrev: 'Qua', isFimDeSemana: false },
  { id: 4, label: 'Quinta-feira', abrev: 'Qui', isFimDeSemana: false },
  { id: 5, label: 'Sexta-feira', abrev: 'Sex', isFimDeSemana: false },
  { id: 6, label: 'Sábado', abrev: 'Sáb', isFimDeSemana: true },
  { id: 0, label: 'Domingo', abrev: 'Dom', isFimDeSemana: true }
];

export const ReorganizeModal: React.FC<ReorganizeModalProps> = ({
  isOpen,
  onClose,
  pontos,
  activeCronograma,
  materiasCores = {},
  onApplyReorganize,
  globalMateriaOrder,
  onUpdateMateriaOrder
}) => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'grade_fixa' | 'ciclo' | 'empurrar' | 'preview'>('grade_fixa');
  const [startDate, setStartDate] = useState<string>(hojeStr());
  const [scope, setScope] = useState<'pending' | 'all'>('pending');

  // Strategy Mode
  const [strategy, setStrategy] = useState<ReorganizeStrategy>('grade_fixa');

  // Split management toggle: preserve multi-session splits or unify them
  const [preserveSplitSessions, setPreserveSplitSessions] = useState<boolean>(true);

  // Subjects Selection
  const allMaterias = useMemo(() => {
    return (Array.from(new Set(pontos.map(p => p.materia))) as string[]).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [pontos]);

  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);

  // Presets
  const [presets, setPresets] = useState<ReorganizePreset[]>(() => loadReorganizePresets());
  const [activePresetId, setActivePresetId] = useState<string>('builtin_grade_juridica');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');
  const [savePresetDesc, setSavePresetDesc] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Grade Semanal Fixa State (0=Dom a 6=Sáb)
  const [fixedSchedule, setFixedSchedule] = useState<FixedWeeklySchedule>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    0: []
  });

  // Ciclo Rotativo State
  const [topicsPerDay, setTopicsPerDay] = useState<number>(2);
  const [studyDaysMode, setStudyDaysMode] = useState<'seg-sab' | 'seg-sex' | 'todos' | 'custom'>('seg-sab');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [avoidSameSubjectPerDay, setAvoidSameSubjectPerDay] = useState<boolean>(true);
  const [materiaOrder, setMateriaOrder] = useState<string[]>([]);

  // Preview Selected Week
  const [selectedPreviewWeek, setSelectedPreviewWeek] = useState<number>(1);
  const [previewViewMode, setPreviewViewMode] = useState<'semanal' | 'lista'>('semanal');

  // Helper check for completed points
  const isConcluido = useCallback((p: PontoEstudo) => {
    return Boolean(p.lido || (p.qFeitas && Number(p.qTotal) > 0));
  }, []);

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Sync state on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectedMaterias(allMaterias);

      // Order materias
      let order = [...allMaterias];
      if (globalMateriaOrder && globalMateriaOrder.length > 0) {
        const orderMap = new Map<string, number>(globalMateriaOrder.map((m, idx) => [m, idx]));
        order.sort((a, b) => {
          const idxA = orderMap.has(a) ? orderMap.get(a)! : 9999;
          const idxB = orderMap.has(b) ? orderMap.get(b)! : 9999;
          if (idxA !== idxB) return idxA - idxB;
          return a.localeCompare(b, 'pt');
        });
      }
      setMateriaOrder(order);

      // Initialize default fixed schedule if empty
      setFixedSchedule(prev => {
        const hasAnySlot = Object.values(prev).some((slots: FixedWeeklySlot[]) => slots.length > 0);
        if (hasAnySlot) return prev;

        const initial: FixedWeeklySchedule = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
        const subjects = order.length > 0 ? order : ['Direito Constitucional', 'Direito Administrativo'];
        
        let subIdx = 0;
        [1, 2, 3, 4, 5].forEach(day => {
          if (subjects.length > 0) {
            const mat1 = subjects[subIdx % subjects.length];
            initial[day].push({
              id: `slot_${day}_1`,
              materia: mat1,
              tipoEstudo: 'doutrina',
              alternancia: 'toda_semana'
            });
            subIdx++;

            if (subjects.length > 1) {
              const mat2 = subjects[subIdx % subjects.length];
              initial[day].push({
                id: `slot_${day}_2`,
                materia: mat2,
                tipoEstudo: 'lei_seca',
                alternancia: 'toda_semana'
              });
              subIdx++;
            }
          }
        });

        // Sábado com jurisprudência
        if (subjects.length > 0) {
          initial[6].push({
            id: `slot_6_1`,
            materia: subjects[subIdx % subjects.length],
            tipoEstudo: 'jurisprudencia',
            alternancia: 'toda_semana'
          });
        }

        return initial;
      });
    }
  }, [isOpen, allMaterias, globalMateriaOrder]);

  // Points breakdown
  const pendingPoints = useMemo(() => {
    return pontos.filter(p => !isConcluido(p) && selectedMaterias.includes(p.materia));
  }, [pontos, selectedMaterias, isConcluido]);

  const completedPoints = useMemo(() => {
    return pontos.filter(p => isConcluido(p));
  }, [pontos, isConcluido]);

  // Identify topics that have been divided into multiple sessions (Split)
  const dividedPointsCount = useMemo(() => {
    return pendingPoints.filter(p => p.datas && p.datas.length > 1).length;
  }, [pendingPoints]);

  // Identify subjects with topics but NO slot configured on the fixed schedule
  const materiasConfiguradasNaGrade = useMemo(() => {
    const set = new Set<string>();
    Object.values(fixedSchedule).forEach((slots: FixedWeeklySlot[]) => {
      slots.forEach(s => {
        if (s.materia) set.add(s.materia);
      });
    });
    return set;
  }, [fixedSchedule]);

  const materiasSemSlot = useMemo(() => {
    return selectedMaterias.filter(m => !materiasConfiguradasNaGrade.has(m));
  }, [selectedMaterias, materiasConfiguradasNaGrade]);

  // Points with past dates that are not finished (Atrasados)
  const atrasadosPoints = useMemo(() => {
    const today = hojeStr();
    return pontos.filter(p => !isConcluido(p) && p.data && p.data < today && selectedMaterias.includes(p.materia));
  }, [pontos, selectedMaterias, isConcluido]);

  // Active study days for Ciclo mode
  const activeCycleStudyDays = useMemo(() => {
    if (studyDaysMode === 'seg-sex') return [1, 2, 3, 4, 5];
    if (studyDaysMode === 'seg-sab') return [1, 2, 3, 4, 5, 6];
    if (studyDaysMode === 'todos') return [1, 2, 3, 4, 5, 6, 0];
    return customDays;
  }, [studyDaysMode, customDays]);

  // Group pending points by subject with logical order
  const pointsByMateria = useMemo(() => {
    const grouped: Record<string, PontoEstudo[]> = {};
    selectedMaterias.forEach(mat => {
      grouped[mat] = [];
    });

    const targetList = scope === 'pending'
      ? pontos.filter(p => !isConcluido(p) && selectedMaterias.includes(p.materia))
      : pontos.filter(p => selectedMaterias.includes(p.materia));

    targetList.forEach(p => {
      if (!grouped[p.materia]) grouped[p.materia] = [];
      grouped[p.materia].push(p);
    });

    // Sort logically by ordem or createdAt
    Object.keys(grouped).forEach(mat => {
      grouped[mat].sort((a, b) => {
        const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
        const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
        if (oA !== oB) return oA - oB;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    });

    return grouped;
  }, [pontos, selectedMaterias, scope, isConcluido]);

  // Occupied count by date from unselected materias
  const occupiedCountByDate = useMemo(() => {
    const occupied: Record<string, number> = {};
    pontos.forEach(p => {
      if (!selectedMaterias.includes(p.materia) && p.data) {
        occupied[p.data] = (occupied[p.data] || 0) + 1;
      }
    });
    return occupied;
  }, [pontos, selectedMaterias]);

  // Calculate schedule based on current strategy
  const calculationResult = useMemo(() => {
    if (!startDate || pendingPoints.length === 0) {
      return {
        orderedPoints: [],
        calculatedDates: [],
        weeksSummary: [],
        totalDaysCount: 0,
        startDate,
        endDate: startDate,
        diasComEstudo: 0,
        mediaTopicosPorDia: 0,
        datesByPointId: {}
      };
    }

    if (strategy === 'grade_fixa') {
      return calculateScheduleFixedWeekly(
        pointsByMateria,
        fixedSchedule,
        startDate,
        occupiedCountByDate,
        preserveSplitSessions
      );
    }

    if (strategy === 'empurrar_atrasados') {
      const sortedPending = [...pendingPoints].sort((a, b) => {
        if (a.data && b.data && a.data !== b.data) return a.data.localeCompare(b.data);
        const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
        const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
        return oA - oB;
      });

      return calculateSchedulePushAtrasados(sortedPending, {
        startDate,
        studyDays: activeCycleStudyDays,
        topicsPerDay,
        occupiedCountByDate
      });
    }

    // Default: Ciclo
    return calculateScheduleCycle(pointsByMateria, {
      startDate,
      topicsPerDay,
      studyDays: activeCycleStudyDays,
      materiaOrder: materiaOrder.filter(m => selectedMaterias.includes(m)),
      avoidSameSubjectPerDay,
      occupiedCountByDate,
      preserveSplitSessions
    });
  }, [
    strategy,
    pointsByMateria,
    fixedSchedule,
    startDate,
    occupiedCountByDate,
    pendingPoints,
    activeCycleStudyDays,
    topicsPerDay,
    materiaOrder,
    selectedMaterias,
    avoidSameSubjectPerDay,
    preserveSplitSessions
  ]);

  const { orderedPoints, calculatedDates, weeksSummary, endDate, diasComEstudo, mediaTopicosPorDia, datesByPointId } = calculationResult;

  // Selected preview week object
  const currentPreviewWeek = useMemo(() => {
    if (weeksSummary.length === 0) return null;
    return weeksSummary.find(w => w.semanaNumero === selectedPreviewWeek) || weeksSummary[0];
  }, [weeksSummary, selectedPreviewWeek]);

  // Handlers for Grade Semanal Fixa
  const handleAddSlotToDay = (dayOfWeek: number, subjectName?: string) => {
    const targetMateria = subjectName || materiaOrder[0] || allMaterias[0] || 'Geral';
    const newSlot: FixedWeeklySlot = {
      id: `slot_${dayOfWeek}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      materia: targetMateria,
      tipoEstudo: 'qualquer',
      alternancia: 'toda_semana'
    };

    setFixedSchedule(prev => ({
      ...prev,
      [dayOfWeek]: [...(prev[dayOfWeek] || []), newSlot]
    }));
  };

  const handleRemoveSlot = (dayOfWeek: number, slotId: string) => {
    setFixedSchedule(prev => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).filter(s => s.id !== slotId)
    }));
  };

  const handleUpdateSlot = (dayOfWeek: number, slotId: string, updates: Partial<FixedWeeklySlot>) => {
    setFixedSchedule(prev => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).map(s => s.id === slotId ? { ...s, ...updates } : s)
    }));
  };

  // Auto-distribute all subjects across available study days
  const handleAutoDistributeGrade = () => {
    const subjects = materiaOrder.filter(m => selectedMaterias.includes(m));
    if (subjects.length === 0) return;

    const newSchedule: FixedWeeklySchedule = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    let subIdx = 0;

    // Se temos mais matérias que dias, usa alternância A/B ou múltiplos slots por dia
    const daysAvailable = [1, 2, 3, 4, 5];
    const slotsPerDay = subjects.length > 8 ? 2 : Math.max(1, Math.ceil(subjects.length / daysAvailable.length));

    daysAvailable.forEach(day => {
      for (let s = 0; s < slotsPerDay && subIdx < subjects.length; s++) {
        const mat = subjects[subIdx];
        newSchedule[day].push({
          id: `auto_${day}_${s + 1}`,
          materia: mat,
          tipoEstudo: s === 0 ? 'doutrina' : 'lei_seca',
          alternancia: 'toda_semana'
        });
        subIdx++;
      }
    });

    // Se ainda restam matérias não alocadas, coloca no Sábado ou alterna na Semana B
    if (subIdx < subjects.length) {
      // Sábado
      while (subIdx < subjects.length && (newSchedule[6] || []).length < 2) {
        newSchedule[6].push({
          id: `auto_6_${subIdx}`,
          materia: subjects[subIdx],
          tipoEstudo: 'jurisprudencia',
          alternancia: 'toda_semana'
        });
        subIdx++;
      }
    }

    // Se ainda restam, alterna como Semana B nos dias de semana
    if (subIdx < subjects.length) {
      daysAvailable.forEach(day => {
        if (subIdx < subjects.length) {
          newSchedule[day].push({
            id: `auto_${day}_b`,
            materia: subjects[subIdx],
            tipoEstudo: 'qualquer',
            alternancia: 'semana_b'
          });
          subIdx++;
        }
      });
    }

    setFixedSchedule(newSchedule);
    showFeedback('Todas as suas matérias foram distribuídas na grade!', 'info');
  };

  const handleClearGrade = () => {
    setFixedSchedule({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] });
    showFeedback('Grade semanal limpa.', 'info');
  };

  // Handlers for Presets
  const handleSelectPreset = (preset: ReorganizePreset) => {
    setActivePresetId(preset.id);
    setStrategy(preset.strategy);

    if (preset.strategy === 'grade_fixa' && preset.fixedSchedule) {
      const mapped: FixedWeeklySchedule = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
      const subList = materiaOrder.length > 0 ? materiaOrder : allMaterias;

      Object.entries(preset.fixedSchedule).forEach(([dayStr, slots]) => {
        const d = Number(dayStr);
        mapped[d] = slots.map((s, idx) => ({
          ...s,
          id: `slot_${d}_${Date.now()}_${idx}`,
          materia: s.materia || subList[idx % subList.length] || allMaterias[0] || 'Geral'
        }));
      });
      setFixedSchedule(mapped);
    } else if (preset.strategy === 'ciclo') {
      if (preset.topicsPerDay) setTopicsPerDay(preset.topicsPerDay);
      if (preset.studyDaysMode) setStudyDaysMode(preset.studyDaysMode);
      if (preset.customDays) setCustomDays(preset.customDays);
      setAvoidSameSubjectPerDay(preset.avoidSameSubjectPerDay !== false);
    }

    showFeedback(`Preset "${preset.nome}" aplicado com sucesso!`, 'info');
  };

  const handleConfirmSavePreset = () => {
    if (!savePresetName.trim()) return;

    const newPreset: ReorganizePreset = {
      id: `preset_${Date.now()}`,
      nome: savePresetName.trim(),
      descricao: savePresetDesc.trim() || undefined,
      isBuiltIn: false,
      strategy,
      fixedSchedule: strategy === 'grade_fixa' ? fixedSchedule : undefined,
      topicsPerDay: strategy === 'ciclo' ? topicsPerDay : undefined,
      studyDaysMode: strategy === 'ciclo' ? studyDaysMode : undefined,
      customDays: studyDaysMode === 'custom' ? customDays : undefined,
      avoidSameSubjectPerDay,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    saveReorganizePresetsToStorage(updated);
    setActivePresetId(newPreset.id);
    setSaveModalOpen(false);
    showFeedback(`Preset "${newPreset.nome}" salvo!`, 'success');
  };

  // Execution Handler - 100% ROBUST & PROPERLY SYNCS MULTI-SESSION SPLITS!
  const handleExecute = () => {
    if (orderedPoints.length === 0) return;

    const finalPointsList: PontoEstudo[] = [];

    // 1. Process all original points
    pontos.forEach(p => {
      // COMPLETED POINTS: Always keep their original data and progress intact!
      if (isConcluido(p)) {
        finalPointsList.push(p);
        return;
      }

      // UNSELECTED MATERIAS: Keep original data intact!
      if (!selectedMaterias.includes(p.materia)) {
        finalPointsList.push(p);
        return;
      }

      // REORGANIZED PENDING POINTS:
      if (datesByPointId[p.id] && datesByPointId[p.id].length > 0) {
        const assignedDates = datesByPointId[p.id];
        
        // Se preserva divisão e tinha múltiplas datas calculadas, sincroniza datas e data
        if (preserveSplitSessions && assignedDates.length > 1) {
          finalPointsList.push({
            ...p,
            data: assignedDates[0],
            datas: assignedDates,
            updatedAt: Date.now()
          });
        } else {
          // Unificado ou ponto comum de 1 sessão
          finalPointsList.push({
            ...p,
            data: assignedDates[0],
            datas: undefined, // Limpa o array antigo de split para não ficar preso no passado!
            updatedAt: Date.now()
          });
        }
      } else {
        // Fallback: keep intact
        finalPointsList.push(p);
      }
    });

    onApplyReorganize(finalPointsList);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Reorganizar Cronograma
                </h3>
                {activeCronograma && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                    {activeCronograma.nome}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Grade semanal com matérias fixas por dia, alternância A/B e sincronização de tópicos divididos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strategy Switcher Bar */}
        <div className="bg-zinc-100/70 border-b border-zinc-200 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setStrategy('grade_fixa');
                setActiveTab('grade_fixa');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                strategy === 'grade_fixa' && activeTab === 'grade_fixa'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>1. Grade Semanal Fixa</span>
              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">Recomendado</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStrategy('ciclo');
                setActiveTab('ciclo');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                strategy === 'ciclo' && activeTab === 'ciclo'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Ciclo Livre (Meta Diária)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStrategy('empurrar_atrasados');
                setActiveTab('empurrar');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'empurrar'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Empurrar Atrasados</span>
              {atrasadosPoints.length > 0 && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-bold">
                  {atrasadosPoints.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>4. Pré-visualização</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-200 px-1.5 py-0.2 rounded font-mono">
                {orderedPoints.length}
              </span>
            </button>
          </div>

          {/* Quick Date Anchor */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Início:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Feedback Banner */}
          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold border flex items-center justify-between animate-in fade-in ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-blue-50 text-blue-900 border-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
              <button onClick={() => setFeedbackMsg(null)} className="p-1 text-zinc-400 hover:text-zinc-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SPLIT / DIVISÃO DE MATÉRIAS NOTICE & CONTROLS */}
          {dividedPointsCount > 0 && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-100 text-indigo-700 rounded-md">
                  <Split className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-indigo-950 block">
                    {dividedPointsCount} assunto(s) com divisão em múltiplas sessões detectado(s)
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    Você pode manter as sessões separadas nos seus dias de estudo ou unificá-las em uma data única.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 font-semibold text-indigo-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preserveSplitSessions}
                    onChange={e => setPreserveSplitSessions(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-600 cursor-pointer"
                  />
                  <span>Reagendar cada parte em dias separados</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 1: GRADE SEMANAL FIXA */}
          {activeTab === 'grade_fixa' && (
            <div className="space-y-4">
              {/* Presets and Actions Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    Defina sua Grade por Dia da Semana
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Adicione quantas matérias quiser em cada dia. O número de matérias alocadas no dia define a carga de estudo daquele dia.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDistributeGrade}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Preencher automaticamente com todas as suas matérias cadastradas"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Auto-distribuir todas</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearGrade}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 hover:bg-red-50 text-zinc-600 hover:text-red-700 border border-zinc-200 transition-colors cursor-pointer"
                  >
                    Limpar Grade
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSavePresetName(`Grade ${activeCronograma?.nome || 'Personalizada'}`);
                      setSaveModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Salvar Modelo</span>
                  </button>
                </div>
              </div>

              {/* Warning if there are subjects with NO slots configured */}
              {materiasSemSlot.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>{materiasSemSlot.length} matéria(s) sem dia fixo na grade:</strong> {materiasSemSlot.join(', ')}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoDistributeGrade}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Distribuir na Grade Automaticamente
                  </button>
                </div>
              )}

              {/* Presets Quick Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">Modelos:</span>
                {presets.map(p => {
                  const isSelected = activePresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {p.isBuiltIn ? <span>⭐</span> : <span className="text-amber-500">★</span>}
                      <span>{p.nome}</span>
                    </button>
                  );
                })}
              </div>

              {/* 7 Days Visual Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
                {DIAS_CONFIG.map(dia => {
                  const slots = fixedSchedule[dia.id] || [];
                  const isRestDay = slots.length === 0;

                  return (
                    <div 
                      key={dia.id}
                      className={`rounded-2xl border p-3 flex flex-col transition-all ${
                        dia.isFimDeSemana 
                          ? 'bg-zinc-50/60 border-zinc-200' 
                          : 'bg-white border-zinc-200 shadow-2xs hover:border-zinc-300'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-900">
                            {dia.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isRestDay 
                              ? 'bg-zinc-100 text-zinc-500' 
                              : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {slots.length} {slots.length === 1 ? 'tópico' : 'tópicos'}
                          </span>
                        </div>
                      </div>

                      {/* Slots List in this Day */}
                      <div className="space-y-2 py-2.5 flex-1 min-h-[90px]">
                        {slots.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-3 text-zinc-400">
                            <Clock className="w-5 h-5 mb-1 opacity-40" />
                            <span className="text-[11px] font-medium">Dia livre / Sem estudo</span>
                          </div>
                        ) : (
                          slots.map(slot => {
                            const cor = materiasCores[slot.materia] || '#d97706';

                            return (
                              <div 
                                key={slot.id}
                                className="p-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl space-y-2 group hover:border-zinc-300 transition-all"
                              >
                                {/* Slot Header: Subject Dropdown + Delete */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span 
                                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: cor }} 
                                    />
                                    <select
                                      value={slot.materia}
                                      onChange={e => handleUpdateSlot(dia.id, slot.id, { materia: e.target.value })}
                                      className="w-full text-xs font-bold bg-transparent border-0 text-zinc-900 focus:outline-hidden cursor-pointer truncate p-0"
                                    >
                                      {allMaterias.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlot(dia.id, slot.id)}
                                    className="text-zinc-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Remover matéria deste dia"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Slot Controls: Tipo de Estudo & Alternância A/B */}
                                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-200/60 text-[10px]">
                                  {/* Tipo de Estudo */}
                                  <select
                                    value={slot.tipoEstudo || 'qualquer'}
                                    onChange={e => handleUpdateSlot(dia.id, slot.id, { tipoEstudo: e.target.value as any })}
                                    className="px-1.5 py-1 bg-white border border-zinc-200 rounded-md font-semibold text-zinc-700 focus:outline-hidden cursor-pointer"
                                    title="Preferência de tipo de estudo para este horário"
                                  >
                                    <option value="qualquer">📚 Qualquer tipo</option>
                                    <option value="doutrina">📖 Doutrina</option>
                                    <option value="lei_seca">⚖️ Lei Seca</option>
                                    <option value="jurisprudencia">🏛️ Jurisprudência</option>
                                  </select>

                                  {/* Alternância A/B */}
                                  <select
                                    value={slot.alternancia}
                                    onChange={e => handleUpdateSlot(dia.id, slot.id, { alternancia: e.target.value as any })}
                                    className={`px-1.5 py-1 border rounded-md font-semibold focus:outline-hidden cursor-pointer ${
                                      slot.alternancia === 'toda_semana' 
                                        ? 'bg-white border-zinc-200 text-zinc-700' 
                                        : slot.alternancia === 'semana_a' 
                                        ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold' 
                                        : 'bg-indigo-50 text-indigo-900 border-indigo-300 font-bold'
                                    }`}
                                    title="Frequência semanal deste slot"
                                  >
                                    <option value="toda_semana">🔁 Toda semana</option>
                                    <option value="semana_a">🅰️ Semana A (ímpar)</option>
                                    <option value="semana_b">🅱️ Semana B (par)</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add Slot Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSlotToDay(dia.id)}
                        className="w-full mt-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-900" />
                        <span>Adicionar matéria</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CICLO LIVRE ROTATIVO */}
          {activeTab === 'ciclo' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-zinc-900">
                  Configurações do Ciclo Contínuo
                </h4>
                <p className="text-xs text-zinc-500">
                  Neste modo, as matérias rodam continuamente em fila circular sem amarração rígida a dias da semana.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Meta Diária */}
                  <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Meta Diária (Tópicos por Dia)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTopicsPerDay(n)}
                          className={`w-9 h-9 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            topicsPerDay === n 
                              ? 'bg-zinc-900 text-white shadow-xs' 
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dias de Estudo */}
                  <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Dias de Estudo
                    </label>
                    <select
                      value={studyDaysMode}
                      onChange={e => setStudyDaysMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800"
                    >
                      <option value="seg-sab">Segunda a Sábado (6 dias)</option>
                      <option value="seg-sex">Segunda a Sexta (5 dias)</option>
                      <option value="todos">Todos os dias (7 dias)</option>
                    </select>
                  </div>

                  {/* Evitar mesma matéria no mesmo dia */}
                  <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-zinc-800">Intercalar Matérias</span>
                      <span className="text-[11px] text-zinc-500">Evita a mesma disciplina duas vezes no mesmo dia</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={avoidSameSubjectPerDay}
                      onChange={e => setAvoidSameSubjectPerDay(e.target.checked)}
                      className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Fila de Prioridade das Matérias */}
              <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                  Ordem de Rotação das Matérias no Ciclo
                </span>
                <p className="text-xs text-zinc-500">
                  As matérias do topo começam antes. Use as setas para ajustar quem tem maior precedência no ciclo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  {materiaOrder.map((mat, idx) => {
                    const cor = materiasCores[mat] || '#d97706';
                    const count = (pointsByMateria[mat] || []).length;

                    return (
                      <div 
                        key={mat}
                        className="p-2 px-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-zinc-400 text-[10px]">#{idx + 1}</span>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                          <span className="font-bold text-zinc-800 truncate">{mat}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">({count})</span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const next = [...materiaOrder];
                              const temp = next[idx];
                              next[idx] = next[idx - 1];
                              next[idx - 1] = temp;
                              setMateriaOrder(next);
                              onUpdateMateriaOrder?.(next);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === materiaOrder.length - 1}
                            onClick={() => {
                              const next = [...materiaOrder];
                              const temp = next[idx];
                              next[idx] = next[idx + 1];
                              next[idx + 1] = temp;
                              setMateriaOrder(next);
                              onUpdateMateriaOrder?.(next);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMPURRAR ATRASADOS */}
          {activeTab === 'empurrar' && (
            <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900">
                    Ajuste Rápido de Atrasos
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Reancore seu cronograma a partir de hoje sem reembaralhar as disciplinas ou apagar seu histórico.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-700">Tópicos pendentes de datas passadas (Atrasados):</span>
                  <span className="font-bold font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    {atrasadosPoints.length} tópicos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-700">Total de tópicos a reorganizar:</span>
                  <span className="font-bold font-mono text-zinc-900">
                    {pendingPoints.length} tópicos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-700">Nova data de início da sequência:</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    {formatarDataBr(startDate)}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Esta operação mantém rigorosamente a ordem pedagógica dos seus tópicos. Ela apenas pega os itens pendentes e os distribui a partir de hoje nos seus dias de estudo usuais.
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: PRÉ-VISUALIZAÇÃO INTERATIVA */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Metrics Summary Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Início Previsto</span>
                  <strong className="text-xs text-zinc-900">{formatarDataBr(startDate)}</strong>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Término Previsto</span>
                  <strong className="text-xs text-emerald-700">{formatarDataBr(endDate)}</strong>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Duração</span>
                  <strong className="text-xs text-zinc-900">{weeksSummary.length} semanas ({diasComEstudo} dias)</strong>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Média Diária</span>
                  <strong className="text-xs text-blue-700">{mediaTopicosPorDia} tópicos / dia</strong>
                </div>
              </div>

              {/* Week Navigator */}
              <div className="bg-white border border-zinc-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Semanas do Cronograma
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      (Clique para ver a rotação de cada semana)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('semanal')}
                      className={`px-2 py-0.5 font-semibold rounded cursor-pointer ${
                        previewViewMode === 'semanal' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                      }`}
                    >
                      Visão Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('lista')}
                      className={`px-2 py-0.5 font-semibold rounded cursor-pointer ${
                        previewViewMode === 'lista' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                      }`}
                    >
                      Lista Completa
                    </button>
                  </div>
                </div>

                {previewViewMode === 'semanal' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {weeksSummary.map(w => {
                      const isSelected = w.semanaNumero === selectedPreviewWeek;
                      return (
                        <button
                          key={w.semanaNumero}
                          type="button"
                          onClick={() => setSelectedPreviewWeek(w.semanaNumero)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-zinc-900 text-white shadow-xs'
                              : 'bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <span>Semana {w.semanaNumero}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                            isSelected ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            Semana {w.grupoSemana}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Current Preview Week Cards */}
              {previewViewMode === 'semanal' && currentPreviewWeek && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">
                        Semana {currentPreviewWeek.semanaNumero} (Semana {currentPreviewWeek.grupoSemana})
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        ({formatarDataBr(currentPreviewWeek.dataInicio)} até {formatarDataBr(currentPreviewWeek.dataFim)})
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-700">
                      {currentPreviewWeek.totalTopicos} tópicos distribuídos
                    </span>
                  </div>

                  {/* Day cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {currentPreviewWeek.dias.map(d => (
                      <div key={d.data} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-zinc-200/60">
                          <span className="text-xs font-bold text-zinc-900">{d.diaSemanaAbrev}</span>
                          <span className="text-[11px] font-mono text-zinc-500">{formatarDataBr(d.data)}</span>
                        </div>

                        <div className="space-y-1.5">
                          {d.topicos.map((t, tIdx) => {
                            const cor = materiasCores[t.materia] || '#d97706';
                            const datesForT = datesByPointId[t.id] || [];
                            const sessionIdx = datesForT.indexOf(d.data);

                            return (
                              <div key={`${t.id}_${d.data}_${tIdx}`} className="p-2 bg-white border border-zinc-200 rounded-lg text-xs space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span 
                                      className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white truncate max-w-[130px]"
                                      style={{ backgroundColor: cor }}
                                    >
                                      {t.materia}
                                    </span>
                                    {datesForT.length > 1 && sessionIdx !== -1 && (
                                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                        Parte {sessionIdx + 1}/{datesForT.length}
                                      </span>
                                    )}
                                  </div>
                                  {t.tipoEstudo && (
                                    <span className="text-[9px] uppercase font-bold text-zinc-400">
                                      {t.tipoEstudo === 'lei_seca' ? 'Lei' : t.tipoEstudo === 'jurisprudencia' ? 'Juris' : 'Doutrina'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-800 font-medium line-clamp-2 leading-snug">
                                  {t.titulo}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full List View */}
              {previewViewMode === 'lista' && (
                <div className="bg-white border border-zinc-200 rounded-xl p-3 space-y-2 max-h-80 overflow-y-auto">
                  <div className="divide-y divide-zinc-100">
                    {orderedPoints.map((pt, idx) => {
                      const cor = materiasCores[pt.materia] || '#d97706';
                      const datesForPt = datesByPointId[pt.id] || [];
                      const sessionIdx = datesForPt.indexOf(calculatedDates[idx]);

                      return (
                        <div key={`${pt.id}_${idx}`} className="py-2 px-1 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 truncate flex-1">
                            <span className="font-mono text-[10px] text-zinc-400 w-7">#{idx + 1}</span>
                            <span 
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                              style={{ backgroundColor: cor }}
                            >
                              {pt.materia}
                            </span>
                            {datesForPt.length > 1 && sessionIdx !== -1 && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded shrink-0">
                                Parte {sessionIdx + 1}/{datesForPt.length}
                              </span>
                            )}
                            <span className="text-zinc-800 truncate font-medium">{pt.titulo}</span>
                          </div>
                          <span className="font-mono text-zinc-900 font-bold shrink-0 text-[11px] bg-zinc-100 px-2 py-0.5 rounded">
                            {formatarDataBr(calculatedDates[idx])}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safe Guard Notice Banner */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Garantia de Histórico:</strong> Seus <strong>{completedPoints.length} tópicos concluídos</strong> terão suas datas passadas 100% preservadas e continuarão intactos no calendário.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
              Protegido
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Previsão: <strong>{formatarDataBr(startDate)}</strong> ➔ <strong>{formatarDataBr(endDate)}</strong></span>
            <span>•</span>
            <span><strong>{orderedPoints.length}</strong> tópicos a reorganizar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={orderedPoints.length === 0}
              onClick={handleExecute}
              className="px-5 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Aplicar Reorganização</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: Salvar Preset */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-zinc-900">Salvar Modelo de Grade</h4>
              </div>
              <button onClick={() => setSaveModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nome do Modelo *</label>
                <input
                  type="text"
                  value={savePresetName}
                  onChange={e => setSavePresetName(e.target.value)}
                  placeholder="Ex: Minha Grade Policial, Ciclo Magistratura..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Descrição (opcional)</label>
                <textarea
                  rows={2}
                  value={savePresetDesc}
                  onChange={e => setSavePresetDesc(e.target.value)}
                  placeholder="Ex: 2 matérias por dia de Seg a Sex com Doutrina e Lei Seca..."
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!savePresetName.trim()}
                onClick={handleConfirmSavePreset}
                className="px-4 py-1.5 text-xs font-bold bg-zinc-900 text-white rounded-lg disabled:opacity-50"
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
