import React, { useState, useMemo, useEffect } from 'react';
import { PontoEstudo, Cronograma } from '../../types';
import { hojeStr, formatarDataBr, getDiaDaSemana } from '../../utils/helpers';
import { 
  calculateSmartSchedule, 
  MateriaFrequencyMode, 
  MateriaReorgConfig, 
  ScheduledWeekSummary,
  ReorganizePreset,
  loadReorganizePresets,
  saveReorganizePresetsToStorage
} from '../../utils/scheduleReorganizer';
import { 
  X, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Layers,
  BookOpen,
  ArrowUpDown,
  Shuffle,
  CalendarDays,
  Zap,
  Sliders,
  Check,
  Info,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Bookmark,
  BookmarkPlus,
  Save,
  Trash2,
  AlertCircle
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

const DIAS_OPTIONS = [
  { id: 1, label: 'Seg', full: 'Segunda-feira' },
  { id: 2, label: 'Ter', full: 'Terça-feira' },
  { id: 3, label: 'Qua', full: 'Quarta-feira' },
  { id: 4, label: 'Qui', full: 'Quinta-feira' },
  { id: 5, label: 'Sex', full: 'Sexta-feira' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
  { id: 0, label: 'Dom', full: 'Domingo' }
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
  const [startDate, setStartDate] = useState<string>(hojeStr());
  const [scope, setScope] = useState<'pending' | 'all'>('pending');
  const [topicsPerDay, setTopicsPerDay] = useState<number>(1);
  const [studyDaysMode, setStudyDaysMode] = useState<'seg-sab' | 'seg-sex' | 'todos' | 'custom'>('seg-sab');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [avoidSameSubjectPerDay, setAvoidSameSubjectPerDay] = useState<boolean>(true);

  // Distribution Strategy
  const [distributionMode, setDistributionMode] = useState<'smart_cycle' | 'cycle' | 'sequential'>('smart_cycle');

  // Subjects and topic queues
  const [pointsByMateria, setPointsByMateria] = useState<Record<string, PontoEstudo[]>>({});
  const [materiaOrder, setMateriaOrder] = useState<string[]>([]);
  const [materiaConfigs, setMateriaConfigs] = useState<Record<string, MateriaReorgConfig>>({});

  // Sub-sections in modal
  const [activeTabSection, setActiveTabSection] = useState<'regras' | 'pre-requisitos' | 'preview'>('regras');
  const [selectedPreviewWeek, setSelectedPreviewWeek] = useState<number>(1);
  const [previewViewMode, setPreviewViewMode] = useState<'semanal' | 'lista'>('semanal');
  const [editingDaysMateria, setEditingDaysMateria] = useState<string | null>(null);

  // Presets State Management
  const [presets, setPresets] = useState<ReorganizePreset[]>(() => loadReorganizePresets());
  const [activePresetId, setActivePresetId] = useState<string>('builtin_concurseiro');
  const [isPresetModified, setIsPresetModified] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Modals for Presets
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [savePresetName, setSavePresetName] = useState<string>('');
  const [savePresetDesc, setSavePresetDesc] = useState<string>('');
  const [presetToDelete, setPresetToDelete] = useState<ReorganizePreset | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false);

  const activePreset = useMemo(() => {
    return presets.find(p => p.id === activePresetId) || presets[0];
  }, [presets, activePresetId]);

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3500);
  };

  const [selectedMateriasForReorg, setSelectedMateriasForReorg] = useState<string[]>([]);

  const allAvailableMaterias = useMemo(() => {
    return Array.from(new Set(pontos.map(p => p.materia))).sort((a, b) => String(a).localeCompare(String(b), 'pt'));
  }, [pontos]);

  // Sync selectedMateriasForReorg when modal opens
  useEffect(() => {
    if (isOpen) {
      const subjects = Array.from(new Set(pontos.map(p => p.materia))).sort((a, b) => String(a).localeCompare(String(b), 'pt'));
      setSelectedMateriasForReorg(subjects);
    }
  }, [isOpen, pontos]);

  // Helper to check if a point is marked completed
  const isConcluido = (p: PontoEstudo) => Boolean(p.lido || (p.qFeitas && Number(p.qTotal) > 0));

  const pendingPointsCount = useMemo(() => {
    return pontos.filter(p => !isConcluido(p)).length;
  }, [pontos]);

  const completedPointsCount = useMemo(() => {
    return pontos.filter(p => isConcluido(p)).length;
  }, [pontos]);

  // Target points according to scope and selected subjects
  const targetPoints = useMemo(() => {
    const base = scope === 'pending'
      ? pontos.filter(p => !isConcluido(p))
      : [...pontos];
    return base.filter(p => selectedMateriasForReorg.includes(p.materia));
  }, [pontos, scope, selectedMateriasForReorg]);

  // Active study days array
  const activeStudyDays = useMemo(() => {
    if (studyDaysMode === 'seg-sex') return [1, 2, 3, 4, 5];
    if (studyDaysMode === 'seg-sab') return [1, 2, 3, 4, 5, 6];
    if (studyDaysMode === 'todos') return [1, 2, 3, 4, 5, 6, 0];
    return customDays;
  }, [studyDaysMode, customDays]);

  // Sync state whenever modal opens or target scope changes
  useEffect(() => {
    if (isOpen) {
      const grouped: Record<string, PontoEstudo[]> = {};
      const order: string[] = [];
      targetPoints.forEach(p => {
        if (!grouped[p.materia]) {
          grouped[p.materia] = [];
          order.push(p.materia);
        }
        grouped[p.materia].push(p);
      });

      // Sort topics by logical ordem or creation
      Object.keys(grouped).forEach(mat => {
        grouped[mat].sort((a, b) => {
          const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
          const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
          if (oA !== oB) return oA - oB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });
      });

      setPointsByMateria(grouped);

      // Sort order by globalMateriaOrder if available
      if (globalMateriaOrder && globalMateriaOrder.length > 0) {
        const orderMap = new Map<string, number>(globalMateriaOrder.map((m, idx) => [m, idx]));
        order.sort((a, b) => {
          const idxA = orderMap.has(a) ? orderMap.get(a)! : 9999;
          const idxB = orderMap.has(b) ? orderMap.get(b)! : 9999;
          if (idxA !== idxB) return idxA - idxB;
          return a.localeCompare(b, 'pt');
        });
      } else {
        order.sort((a, b) => a.localeCompare(b, 'pt'));
      }

      setMateriaOrder(order);

      // Default smart configs: top subjects get 'toda_semana', others get 'intercalada'
      const configs: Record<string, MateriaReorgConfig> = {};
      const sortedByCount = [...order].sort((a, b) => (grouped[b]?.length || 0) - (grouped[a]?.length || 0));
      
      const todaSemanaCount = Math.max(1, Math.min(3, Math.floor(order.length / 2)));
      let intercalatedCounter = 0;

      sortedByCount.forEach((mat, idx) => {
        if (idx < todaSemanaCount) {
          configs[mat] = {
            materia: mat,
            frequencia: 'toda_semana'
          };
        } else {
          configs[mat] = {
            materia: mat,
            frequencia: 'intercalada',
            grupoIntercalacao: intercalatedCounter % 2 === 0 ? 'A' : 'B'
          };
          intercalatedCounter++;
        }
      });

      setMateriaConfigs(configs);
    }
  }, [isOpen, targetPoints]);

  // Presets Handlers
  const handleSelectPreset = (preset: ReorganizePreset) => {
    setActivePresetId(preset.id);
    setIsPresetModified(false);

    setDistributionMode(preset.distributionMode);
    setTopicsPerDay(preset.topicsPerDay);
    setStudyDaysMode(preset.studyDaysMode);
    if (preset.customDays && preset.customDays.length > 0) {
      setCustomDays(preset.customDays);
    }
    setAvoidSameSubjectPerDay(preset.avoidSameSubjectPerDay !== false);

    if (preset.isBuiltIn) {
      // Dynamic generation based on built-in rules
      if (preset.id === 'builtin_concurseiro') {
        const updatedConfigs: Record<string, MateriaReorgConfig> = {};
        const sortedByCount = [...materiaOrder].sort(
          (a, b) => (pointsByMateria[b]?.length || 0) - (pointsByMateria[a]?.length || 0)
        );
        const todaSemanaCount = Math.max(1, Math.min(3, Math.ceil(materiaOrder.length / 2)));
        let interCount = 0;
        sortedByCount.forEach((mat, idx) => {
          if (idx < todaSemanaCount) {
            updatedConfigs[mat] = { materia: mat, frequencia: 'toda_semana' };
          } else {
            updatedConfigs[mat] = {
              materia: mat,
              frequencia: 'intercalada',
              grupoIntercalacao: interCount % 2 === 0 ? 'A' : 'B'
            };
            interCount++;
          }
        });
        setMateriaConfigs(updatedConfigs);
      } else if (preset.id === 'builtin_uniforme') {
        const updatedConfigs: Record<string, MateriaReorgConfig> = {};
        materiaOrder.forEach(mat => {
          updatedConfigs[mat] = { materia: mat, frequencia: 'padrao' };
        });
        setMateriaConfigs(updatedConfigs);
      } else if (preset.id === 'builtin_intensivo') {
        const updatedConfigs: Record<string, MateriaReorgConfig> = {};
        const sortedByCount = [...materiaOrder].sort(
          (a, b) => (pointsByMateria[b]?.length || 0) - (pointsByMateria[a]?.length || 0)
        );
        sortedByCount.forEach((mat, idx) => {
          if (idx < 2) {
            updatedConfigs[mat] = { materia: mat, frequencia: 'duas_vezes' };
          } else {
            updatedConfigs[mat] = { materia: mat, frequencia: 'toda_semana' };
          }
        });
        setMateriaConfigs(updatedConfigs);
      } else if (preset.id === 'builtin_sequencial') {
        const updatedConfigs: Record<string, MateriaReorgConfig> = {};
        materiaOrder.forEach(mat => {
          updatedConfigs[mat] = { materia: mat, frequencia: 'bloco' };
        });
        setMateriaConfigs(updatedConfigs);
      }
    } else {
      // Custom user preset
      const updatedConfigs: Record<string, MateriaReorgConfig> = {};
      materiaOrder.forEach(mat => {
        if (preset.materiaConfigs && preset.materiaConfigs[mat]) {
          updatedConfigs[mat] = { ...preset.materiaConfigs[mat] };
        } else {
          updatedConfigs[mat] = {
            materia: mat,
            frequencia: preset.distributionMode === 'sequential' ? 'bloco' : 'padrao'
          };
        }
      });
      setMateriaConfigs(updatedConfigs);

      if (preset.materiaOrder && preset.materiaOrder.length > 0) {
        const reordered: string[] = [];
        preset.materiaOrder.forEach(mat => {
          if (materiaOrder.includes(mat)) {
            reordered.push(mat);
          }
        });
        materiaOrder.forEach(mat => {
          if (!reordered.includes(mat)) {
            reordered.push(mat);
          }
        });
        setMateriaOrder(reordered);
      }
    }

    showFeedback(`Preset "${preset.nome}" aplicado com sucesso!`, 'info');
  };

  const handleApplyPreset = (presetType: 'concurseiro' | 'uniforme' | 'intensivo') => {
    const found = presets.find(p => p.id === `builtin_${presetType}`);
    if (found) {
      handleSelectPreset(found);
    }
  };

  const handleOpenSaveModal = () => {
    const defaultName = activePreset && !activePreset.isBuiltIn
      ? `${activePreset.nome} (Cópia)`
      : activeCronograma?.nome
        ? `Ciclo ${activeCronograma.nome}`
        : 'Meu Ciclo Personalizado';

    setSavePresetName(defaultName);
    setSavePresetDesc('');
    setSaveModalOpen(true);
  };

  const handleConfirmSavePreset = () => {
    if (!savePresetName.trim()) return;

    const newPreset: ReorganizePreset = {
      id: `preset_custom_${Date.now()}`,
      nome: savePresetName.trim(),
      descricao: savePresetDesc.trim() || undefined,
      isBuiltIn: false,
      distributionMode,
      topicsPerDay,
      studyDaysMode,
      customDays: studyDaysMode === 'custom' ? customDays : undefined,
      avoidSameSubjectPerDay,
      materiaConfigs: { ...materiaConfigs },
      materiaOrder: [...materiaOrder],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    saveReorganizePresetsToStorage(updated);
    setActivePresetId(newPreset.id);
    setIsPresetModified(false);
    setSaveModalOpen(false);
    showFeedback(`Preset "${newPreset.nome}" salvo com sucesso!`, 'success');
  };

  const handleUpdateCurrentPreset = () => {
    if (!activePreset) return;

    if (activePreset.isBuiltIn) {
      setSavePresetName(`${activePreset.nome} (Personalizado)`);
      setSavePresetDesc(`Baseado no modelo ${activePreset.nome}`);
      setSaveModalOpen(true);
      return;
    }

    const updatedPresets = presets.map(p => {
      if (p.id === activePreset.id) {
        return {
          ...p,
          distributionMode,
          topicsPerDay,
          studyDaysMode,
          customDays: studyDaysMode === 'custom' ? customDays : undefined,
          avoidSameSubjectPerDay,
          materiaConfigs: { ...materiaConfigs },
          materiaOrder: [...materiaOrder],
          updatedAt: Date.now()
        };
      }
      return p;
    });

    setPresets(updatedPresets);
    saveReorganizePresetsToStorage(updatedPresets);
    setIsPresetModified(false);
    showFeedback(`Preset "${activePreset.nome}" atualizado com sucesso!`, 'success');
  };

  const handleUpdatePresetById = (presetId: string) => {
    const target = presets.find(p => p.id === presetId);
    if (!target || target.isBuiltIn) return;

    const updatedPresets = presets.map(p => {
      if (p.id === presetId) {
        return {
          ...p,
          distributionMode,
          topicsPerDay,
          studyDaysMode,
          customDays: studyDaysMode === 'custom' ? customDays : undefined,
          avoidSameSubjectPerDay,
          materiaConfigs: { ...materiaConfigs },
          materiaOrder: [...materiaOrder],
          updatedAt: Date.now()
        };
      }
      return p;
    });

    setPresets(updatedPresets);
    saveReorganizePresetsToStorage(updatedPresets);
    if (activePresetId === presetId) {
      setIsPresetModified(false);
    }
    showFeedback(`Preset "${target.nome}" atualizado com a configuração atual!`, 'success');
  };

  const handleDeletePreset = (presetId: string) => {
    const target = presets.find(p => p.id === presetId);
    if (!target || target.isBuiltIn) return;

    const updated = presets.filter(p => p.id !== presetId);
    setPresets(updated);
    saveReorganizePresetsToStorage(updated);
    if (activePresetId === presetId) {
      const fallback = updated.find(p => p.id === 'builtin_concurseiro') || updated[0];
      if (fallback) {
        handleSelectPreset(fallback);
      }
    }
    setPresetToDelete(null);
    showFeedback(`Preset "${target.nome}" excluído.`, 'info');
  };

  // Reordering functions
  const handleMoveMateria = (materia: string, direction: 'up' | 'down') => {
    const idx = materiaOrder.indexOf(materia);
    if (idx === -1) return;

    let swapWith = -1;
    if (direction === 'up' && idx > 0) swapWith = idx - 1;
    else if (direction === 'down' && idx < materiaOrder.length - 1) swapWith = idx + 1;

    if (swapWith === -1) return;

    const nextOrder = [...materiaOrder];
    const temp = nextOrder[idx];
    nextOrder[idx] = nextOrder[swapWith];
    nextOrder[swapWith] = temp;
    setMateriaOrder(nextOrder);
    onUpdateMateriaOrder?.(nextOrder);
    setIsPresetModified(true);
  };

  const handleMoveTopicInMateria = (materia: string, topicId: string, direction: 'up' | 'down') => {
    const list = pointsByMateria[materia];
    if (!list) return;

    const idx = list.findIndex(p => p.id === topicId);
    if (idx === -1) return;

    let swapWith = -1;
    if (direction === 'up' && idx > 0) swapWith = idx - 1;
    else if (direction === 'down' && idx < list.length - 1) swapWith = idx + 1;

    if (swapWith === -1) return;

    const nextList = [...list];
    const temp = nextList[idx];
    nextList[idx] = nextList[swapWith];
    nextList[swapWith] = temp;

    setPointsByMateria(prev => ({
      ...prev,
      [materia]: nextList
    }));
  };

  const handleUpdateMateriaFreq = (materia: string, freq: MateriaFrequencyMode) => {
    setIsPresetModified(true);
    setMateriaConfigs(prev => ({
      ...prev,
      [materia]: {
        ...(prev[materia] || { materia }),
        frequencia: freq,
        grupoIntercalacao: freq === 'intercalada' ? (prev[materia]?.grupoIntercalacao || 'A') : undefined
      }
    }));
  };

  const handleToggleMateriaIntercalationGroup = (materia: string) => {
    setIsPresetModified(true);
    setMateriaConfigs(prev => {
      const current = prev[materia] || { materia, frequencia: 'intercalada', grupoIntercalacao: 'A' };
      const nextGroup = current.grupoIntercalacao === 'A' ? 'B' : 'A';
      return {
        ...prev,
        [materia]: {
          ...current,
          grupoIntercalacao: nextGroup
        }
      };
    });
  };

  const handleToggleMateriaAllowedDay = (materia: string, day: number) => {
    setIsPresetModified(true);
    setMateriaConfigs(prev => {
      const current = prev[materia] || { materia, frequencia: 'padrao' };
      const allowed = current.diasPermitidos ? [...current.diasPermitidos] : [];
      const hasDay = allowed.includes(day);
      const nextAllowed = hasDay ? allowed.filter(d => d !== day) : [...allowed, day];

      return {
        ...prev,
        [materia]: {
          ...current,
          diasPermitidos: nextAllowed.length > 0 ? nextAllowed : undefined
        }
      };
    });
  };

  const handleToggleCustomDay = (day: number) => {
    setIsPresetModified(true);
    setCustomDays(prev => {
      const exists = prev.includes(day);
      if (exists && prev.length === 1) return prev; // Keep at least 1 day
      return exists ? prev.filter(d => d !== day) : [...prev, day].sort();
    });
  };

  // Run the smart reorganization engine
  const calculationResult = useMemo(() => {
    if (!startDate || targetPoints.length === 0) {
      return {
        orderedPoints: [],
        calculatedDates: [],
        weeksSummary: [],
        totalDaysCount: 0,
        startDate,
        endDate: startDate
      };
    }

    // Expand divided points so they occupy multiple slots during calculation
    const expandedPointsByMateria: Record<string, PontoEstudo[]> = {};
    Object.keys(pointsByMateria).forEach(mat => {
      expandedPointsByMateria[mat] = [];
      (pointsByMateria[mat] || []).forEach(p => {
        const sessionsCount = p.datas && p.datas.length > 1 ? p.datas.length : 1;
        for (let i = 0; i < sessionsCount; i++) {
          expandedPointsByMateria[mat].push(p);
        }
      });
    });

    // Determine occupied count by date for unselected subjects
    const occupiedCountByDate: Record<string, number> = {};
    pontos.forEach(p => {
      if (!selectedMateriasForReorg.includes(p.materia) && p.data) {
        occupiedCountByDate[p.data] = (occupiedCountByDate[p.data] || 0) + 1;
      }
    });

    return calculateSmartSchedule(expandedPointsByMateria, {
      startDate,
      topicsPerDay,
      studyDays: activeStudyDays,
      distributionMode,
      materiaConfigs,
      materiaOrder,
      avoidSameSubjectPerDay,
      occupiedCountByDate
    });
  }, [
    startDate,
    targetPoints.length,
    pointsByMateria,
    topicsPerDay,
    activeStudyDays,
    distributionMode,
    materiaConfigs,
    materiaOrder,
    avoidSameSubjectPerDay,
    pontos,
    selectedMateriasForReorg
  ]);

  const { orderedPoints, calculatedDates, weeksSummary, endDate } = calculationResult;

  // Selected week for preview
  const currentPreviewWeekObj = useMemo(() => {
    if (weeksSummary.length === 0) return null;
    const found = weeksSummary.find(w => w.semanaNumero === selectedPreviewWeek);
    return found || weeksSummary[0];
  }, [weeksSummary, selectedPreviewWeek]);

  // Frequency count badges
  const freqSummary = useMemo(() => {
    let todaSemana = 0;
    let intercaladasA = 0;
    let intercaladasB = 0;
    let duasVezes = 0;
    let padrao = 0;
    let bloco = 0;

    materiaOrder.forEach(mat => {
      const cfg = materiaConfigs[mat]?.frequencia || 'padrao';
      if (cfg === 'toda_semana') todaSemana++;
      else if (cfg === 'intercalada') {
        if (materiaConfigs[mat]?.grupoIntercalacao === 'B') intercaladasB++;
        else intercaladasA++;
      } else if (cfg === 'duas_vezes') duasVezes++;
      else if (cfg === 'bloco') bloco++;
      else padrao++;
    });

    return { todaSemana, intercaladasA, intercaladasB, duasVezes, padrao, bloco };
  }, [materiaOrder, materiaConfigs]);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (calculatedDates.length !== orderedPoints.length || orderedPoints.length === 0) return;

    // Group calculated dates by point ID to preserve divisions
    const datesByPointId: Record<string, string[]> = {};
    orderedPoints.forEach((p, idx) => {
      if (!datesByPointId[p.id]) {
        datesByPointId[p.id] = [];
      }
      datesByPointId[p.id].push(calculatedDates[idx]);
    });

    // Create unique updated points with multiple dates if relevant
    const uniqueUpdatedPoints: PontoEstudo[] = [];
    const processedIds = new Set<string>();

    orderedPoints.forEach(p => {
      if (processedIds.has(p.id)) return;
      processedIds.add(p.id);

      const dates = datesByPointId[p.id] || [];
      uniqueUpdatedPoints.push({
        ...p,
        data: dates[0] || '',
        datas: dates.length > 1 ? dates : undefined,
        updatedAt: Date.now()
      });
    });

    const selectedSubjects = selectedMateriasForReorg;
    const finalPoints: PontoEstudo[] = [];

    // For unselected subjects, we just copy them from the original 'pontos' array without any modification!
    const unselectedSubjects = Array.from(new Set(pontos.map(p => p.materia)))
      .filter(m => !selectedSubjects.includes(m));
    
    unselectedSubjects.forEach(materia => {
      const originalSubjectPoints = pontos.filter(p => p.materia === materia);
      finalPoints.push(...originalSubjectPoints);
    });

    // Only omit topics of SELECTED subjects if they weren't scheduled
    const orderedIds = new Set(orderedPoints.map(p => p.id));
    const omittedPoints = pontos
      .filter(p => selectedSubjects.includes(p.materia) && !orderedIds.has(p.id))
      .map(p => ({
        ...p,
        data: '', // Taken off calendar, preserved in materias tab
        datas: undefined,
        updatedAt: Date.now()
      }));

    const updatedPointsMap = new Map(uniqueUpdatedPoints.map(p => [p.id, p]));

    selectedSubjects.forEach(materia => {
      // Completed / omitted topics of this subject
      const subjectOmitted = omittedPoints
        .filter(p => p.materia === materia)
        .sort((a, b) => {
          const oA = typeof a.ordem === 'number' ? a.ordem : 999999;
          const oB = typeof b.ordem === 'number' ? b.ordem : 999999;
          if (oA !== oB) return oA - oB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });

      // Scheduled topics of this subject in user-adjusted queue order
      const processedSubjectIds = new Set<string>();
      const scheduledInQueue: PontoEstudo[] = [];

      (pointsByMateria[materia] || []).forEach(p => {
        if (processedSubjectIds.has(p.id)) return;
        processedSubjectIds.add(p.id);
        const updated = updatedPointsMap.get(p.id);
        if (updated) {
          scheduledInQueue.push(updated);
        }
      });

      // Prerequisites first, then scheduled topics
      const combined = [...subjectOmitted, ...scheduledInQueue];
      combined.forEach((p, idx) => {
        finalPoints.push({
          ...p,
          ordem: idx + 1
        });
      });
    });

    onApplyReorganize(finalPoints);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-zinc-900 text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <div>
              <h2 className="font-sans font-bold text-base text-zinc-900 leading-tight">
                Reorganizar Cronograma com Combinação Inteligente
              </h2>
              <p className="text-[11px] text-zinc-500">
                Configure matérias fixas toda semana, intercaladas (semana sim/não) e simule a grade.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Control Bar: Schedule, Scope & Primary Tabs */}
        <div className="px-5 py-3 border-b border-zinc-150 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Cronograma:</span>
            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
              {activeCronograma ? activeCronograma.nome : 'Todos os tópicos'}
            </span>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center gap-1.5 p-0.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <button
              type="button"
              onClick={() => setScope('pending')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                scope === 'pending'
                  ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/70'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Apenas Pendentes ({pendingPointsCount})
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                scope === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/70'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todos ({pontos.length})
            </button>
          </div>

          {/* Navigation Tabs between Sections */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTabSection('regras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'regras'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Regras & Frequência ({materiaOrder.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabSection('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'preview'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Pré-visualização Semanal ({weeksSummary.length} sem.)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabSection('pre-requisitos')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'pre-requisitos'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordem de Tópicos</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 bg-zinc-50/40">
          {/* SECTION 1: Base Parameters (Date, Pace, Days) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                1. Parâmetros de Calendário & Ritmo Diário
              </span>
              <span className="text-[11px] text-zinc-500">
                {targetPoints.length} tópicos selecionados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Data de Início *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setStartDate(hojeStr())}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Hoje
                  </button>
                </div>
              </div>

              {/* Topics per day */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Ritmo de Estudo Diário
                </label>
                <select
                  value={topicsPerDay}
                  onChange={(e) => {
                    setTopicsPerDay(Number(e.target.value));
                    setIsPresetModified(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                >
                  <option value={1}>1 tópico por dia (Recomendado)</option>
                  <option value={2}>2 tópicos por dia (Intensivo)</option>
                  <option value={3}>3 tópicos por dia (Reta Final)</option>
                </select>
              </div>

              {/* Study Days Mode */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Dias de Estudo na Semana
                </label>
                <select
                  value={studyDaysMode}
                  onChange={(e) => {
                    setStudyDaysMode(e.target.value as any);
                    setIsPresetModified(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                >
                  <option value="seg-sab">Segunda a Sábado (Folga Domingo)</option>
                  <option value="seg-sex">Segunda a Sexta (Folga Fim de Semana)</option>
                  <option value="todos">Todos os dias (Sem pausas)</option>
                  <option value="custom">Personalizado (Selecionar dias)</option>
                </select>
              </div>
            </div>

            {/* Custom Day Selector if 'custom' is active */}
            {studyDaysMode === 'custom' && (
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-150">
                <span className="text-xs font-medium text-zinc-700">Selecione os dias da semana ativos:</span>
                <div className="flex items-center gap-1">
                  {DIAS_OPTIONS.map(d => {
                    const isSelected = customDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleCustomDay(d.id)}
                        className={`w-9 h-8 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                        }`}
                        title={d.full}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diversification rule */}
            {topicsPerDay > 1 && (
              <label className="flex items-center gap-2 text-xs text-zinc-700 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidSameSubjectPerDay}
                  onChange={(e) => {
                    setAvoidSameSubjectPerDay(e.target.checked);
                    setIsPresetModified(true);
                  }}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="font-medium">
                  Evitar a mesma matéria no mesmo dia (estudar matérias diferentes a cada turno diário)
                </span>
              </label>
            )}

            {/* Subject Selection for Reorganization */}
            <div className="border-t border-zinc-100 pt-3.5 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                    Matérias para Reorganizar
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Selecione quais matérias serão redistribuídas. As desmarcadas não sofrerão nenhuma alteração no calendário.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMateriasForReorg(allAvailableMaterias)}
                    className="px-2 py-1 text-[10px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
                  >
                    Selecionar Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMateriasForReorg([])}
                    className="px-2 py-1 text-[10px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                {allAvailableMaterias.map(materia => {
                  const isSelected = selectedMateriasForReorg.includes(materia);
                  const cor = materiasCores[materia] || '#d97706';
                  const totalCount = pontos.filter(p => p.materia === materia).length;
                  const pendingCount = pontos.filter(p => p.materia === materia && !isConcluido(p)).length;

                  return (
                    <button
                      key={materia}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMateriasForReorg(prev => prev.filter(m => m !== materia));
                        } else {
                          setSelectedMateriasForReorg(prev => [...prev, materia]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-50 border-zinc-300 shadow-2xs hover:bg-zinc-100'
                          : 'bg-zinc-100/50 border-zinc-200 opacity-60 hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by button click
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 shrink-0 cursor-pointer"
                        />
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: cor }} 
                        />
                        <span className="text-xs font-semibold text-zinc-900 truncate">
                          {materia}
                        </span>
                      </div>
                      <div className="text-right shrink-0 pl-2 flex flex-col justify-center">
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">
                          {pendingCount}/{totalCount}
                        </span>
                        {!isSelected && (
                          <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-tight leading-none mt-0.5">
                            Fixa
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback banner */}
          {feedbackMsg && (
            <div className={`p-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
              feedbackMsg.type === 'error' ? 'bg-red-50 text-red-900 border-red-300' :
              'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Info className="w-4 h-4 text-amber-600 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFeedbackMsg(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB CONTENT A: Rules, Combinations & Subject Frequencies */}
          {activeTabSection === 'regras' && (
            <div className="space-y-4">
              {/* SECTION: PRESETS DE ORGANIZAÇÃO (Salvar, Atualizar, Excluir, Gerenciar) */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bookmark className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        2. Presets de Organização
                      </span>
                      {activePreset && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          activePreset.isBuiltIn
                            ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {activePreset.isBuiltIn ? '⚙️ Padrão' : '★ Personalizado'}: <strong>{activePreset.nome}</strong>
                        </span>
                      )}
                      {isPresetModified && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          Modificado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Aplique combinações predefinidas ou salve sua própria metodologia com frequências e dias personalizados.
                    </p>
                  </div>

                  {/* Actions: Atualizar, Salvar Novo, Gerenciar */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!activePreset?.isBuiltIn ? (
                      <>
                        <button
                          type="button"
                          onClick={handleUpdateCurrentPreset}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isPresetModified
                              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-xs'
                              : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                          }`}
                          title="Sobrescrever este preset com as configurações da tela"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isPresetModified ? 'text-zinc-950' : 'text-zinc-500'}`} />
                          <span>Atualizar Preset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetToDelete(activePreset)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                          title="Excluir este preset personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      isPresetModified && (
                        <button
                          type="button"
                          onClick={handleOpenSaveModal}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Salvar alterações em um novo preset"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-amber-600" />
                          <span>Salvar como Novo Preset</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={handleOpenSaveModal}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Salvar Preset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManageModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Gerenciar ({presets.length})</span>
                    </button>
                  </div>
                </div>

                {/* Carousel / Chips of Presets */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  {presets.map(p => {
                    const isSelected = activePresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs ring-1 ring-zinc-900'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                        title={p.descricao || p.nome}
                      >
                        {p.isBuiltIn ? (
                          p.id === 'builtin_concurseiro' ? <span>🎯</span> :
                          p.id === 'builtin_uniforme' ? <span>⚖️</span> :
                          p.id === 'builtin_intensivo' ? <span>⚡</span> :
                          <span>📦</span>
                        ) : (
                          <span className="text-amber-400 font-bold">★</span>
                        )}
                        <span>{p.nome}</span>
                        {isSelected && isPresetModified && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Distribution Mode selector cards */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  3. Estratégia de Combinação
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDistributionMode('smart_cycle');
                      setIsPresetModified(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      distributionMode === 'smart_cycle'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-1 ring-zinc-900'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <Sparkles className={`w-4 h-4 ${distributionMode === 'smart_cycle' ? 'text-amber-300' : 'text-amber-600'}`} />
                      <span>Ciclo Inteligente (Avançado)</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${distributionMode === 'smart_cycle' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      Permite matérias obrigatórias toda semana, intercaladas semana sim/não, 2x por semana ou em bloco.
                    </p>
                    <span className="absolute top-2 right-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950">
                      Recomendado
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDistributionMode('cycle');
                      setIsPresetModified(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      distributionMode === 'cycle'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-1 ring-zinc-900'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <Shuffle className={`w-4 h-4 ${distributionMode === 'cycle' ? 'text-blue-300' : 'text-blue-600'}`} />
                      <span>Ciclo Tradicional</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${distributionMode === 'cycle' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      Alterna uma matéria por dia em rotação contínua (round-robin) sem pesos específicos por semana.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDistributionMode('sequential');
                      setIsPresetModified(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      distributionMode === 'sequential'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-1 ring-zinc-900'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <BookOpen className={`w-4 h-4 ${distributionMode === 'sequential' ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      <span>Sequencial (Bloco a Bloco)</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${distributionMode === 'sequential' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      Esgota todos os tópicos de uma matéria antes de iniciar a próxima.
                    </p>
                  </button>
                </div>
              </div>

              {/* Subject Combination Rules (only visible when in smart_cycle) */}
              {distributionMode === 'smart_cycle' && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                        4. Regras de Frequência das Matérias
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Defina quais matérias caem toda semana e quais serão intercaladas entre si.
                      </p>
                    </div>

                    {/* Active preset status indicator */}
                    <div className="flex items-center gap-1.5 bg-zinc-100 p-1 px-2 rounded-lg border border-zinc-200 text-[11px] text-zinc-600">
                      <span>Preset ativo:</span>
                      <strong className="text-zinc-900">{activePreset?.nome}</strong>
                    </div>
                  </div>

                  {/* Summary of active rules */}
                  <div className="flex items-center gap-2 flex-wrap text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                    <span className="text-[11px] font-semibold text-zinc-500">Configuração Atual:</span>
                    {freqSummary.todaSemana > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px]">
                        <Zap className="w-3 h-3 text-amber-600" />
                        {freqSummary.todaSemana} Toda Semana
                      </span>
                    )}
                    {(freqSummary.intercaladasA > 0 || freqSummary.intercaladasB > 0) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-semibold text-[11px]">
                        <Shuffle className="w-3 h-3 text-purple-600" />
                        {freqSummary.intercaladasA + freqSummary.intercaladasB} Intercaladas ({freqSummary.intercaladasA} Grupo A / {freqSummary.intercaladasB} Grupo B)
                      </span>
                    )}
                    {freqSummary.duasVezes > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold text-[11px]">
                        ⚡ {freqSummary.duasVezes} 2x por semana
                      </span>
                    )}
                    {freqSummary.bloco > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-semibold text-[11px]">
                        📦 {freqSummary.bloco} Em Bloco
                      </span>
                    )}
                    {freqSummary.padrao > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-semibold text-[11px]">
                        🔄 {freqSummary.padrao} Rotação Regular
                      </span>
                    )}
                  </div>

                  {/* Subjects Table with Frequency controls */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {materiaOrder.map((materia, idx) => {
                      const count = pointsByMateria[materia]?.length || 0;
                      const cfg = materiaConfigs[materia] || { materia, frequencia: 'padrao' };
                      const cor = materiasCores[materia] || '#d97706';
                      const isEditingDays = editingDaysMateria === materia;

                      return (
                        <div 
                          key={materia}
                          className="p-2.5 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {/* Subject Info */}
                            <div className="flex items-center gap-2 min-w-[200px] flex-1">
                              <span className="font-mono text-[11px] text-zinc-400">#{idx + 1}</span>
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" 
                                style={{ backgroundColor: cor }} 
                              />
                              <span className="text-xs font-bold text-zinc-900 truncate">
                                {materia}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-medium">
                                ({count} tópicos)
                              </span>
                            </div>

                            {/* Frequency Mode Dropdown / Button Group */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <select
                                value={cfg.frequencia}
                                onChange={(e) => handleUpdateMateriaFreq(materia, e.target.value as any)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                  cfg.frequencia === 'toda_semana'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                    : cfg.frequencia === 'intercalada'
                                    ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold'
                                    : cfg.frequencia === 'duas_vezes'
                                    ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                                    : cfg.frequencia === 'bloco'
                                    ? 'bg-zinc-800 text-white border-zinc-800 font-bold'
                                    : 'bg-white text-zinc-700 border-zinc-200'
                                }`}
                              >
                                <option value="toda_semana">🌟 Toda Semana (Obrigatória)</option>
                                <option value="intercalada">🔀 Intercalada (Alternar Semanas)</option>
                                <option value="duas_vezes">⚡ 2x por Semana (Reforço)</option>
                                <option value="padrao">🔄 Rotação Regular</option>
                                <option value="bloco">📦 Em Bloco Contínuo</option>
                              </select>

                              {/* Intercalation Group Toggle (Group A or Group B) */}
                              {cfg.frequencia === 'intercalada' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleMateriaIntercalationGroup(materia)}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                                    cfg.grupoIntercalacao === 'A'
                                      ? 'bg-purple-600 text-white border-purple-700'
                                      : 'bg-indigo-600 text-white border-indigo-700'
                                  }`}
                                  title={
                                    cfg.grupoIntercalacao === 'A' 
                                      ? 'Grupo A: Estudada nas semanas 1, 3, 5...' 
                                      : 'Grupo B: Estudada nas semanas 2, 4, 6...'
                                  }
                                >
                                  {cfg.grupoIntercalacao === 'A' ? 'Grupo A (Semana 1, 3...)' : 'Grupo B (Semana 2, 4...)'}
                                </button>
                              )}

                              {/* Optional: Fixed Days Trigger */}
                              <button
                                type="button"
                                onClick={() => setEditingDaysMateria(isEditingDays ? null : materia)}
                                className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                                  cfg.diasPermitidos && cfg.diasPermitidos.length > 0
                                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                                }`}
                                title="Fixar matéria em dias específicos da semana"
                              >
                                {cfg.diasPermitidos && cfg.diasPermitidos.length > 0
                                  ? `${cfg.diasPermitidos.length} dia(s) fixo(s)`
                                  : 'Fixar dias'}
                              </button>

                              {/* Priority Reordering Buttons */}
                              <div className="flex items-center gap-0.5 border border-zinc-200 rounded-md bg-white p-0.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveMateria(materia, 'up')}
                                  className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                                  title="Subir prioridade"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === materiaOrder.length - 1}
                                  onClick={() => handleMoveMateria(materia, 'down')}
                                  className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                                  title="Descer prioridade"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Inline Day Picker Popover if open */}
                          {isEditingDays && (
                            <div className="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between flex-wrap gap-2 animate-in slide-in-from-top-1 duration-150">
                              <span className="text-[11px] text-zinc-600 font-medium">
                                Dias permitidos para <strong>{materia}</strong> (deixe vazio para livre distribuição):
                              </span>
                              <div className="flex items-center gap-1">
                                {DIAS_OPTIONS.map(d => {
                                  const isChecked = Boolean(cfg.diasPermitidos?.includes(d.id));
                                  return (
                                    <button
                                      key={d.id}
                                      type="button"
                                      onClick={() => handleToggleMateriaAllowedDay(materia, d.id)}
                                      className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-zinc-900 text-white'
                                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                      }`}
                                    >
                                      {d.label}
                                    </button>
                                  );
                                })}
                                {cfg.diasPermitidos && cfg.diasPermitidos.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMateriaConfigs(prev => ({
                                        ...prev,
                                        [materia]: { ...prev[materia], diasPermitidos: undefined }
                                      }));
                                    }}
                                    className="text-[10px] text-red-600 hover:underline ml-1 cursor-pointer"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT B: Interactive Weekly Preview */}
          {activeTabSection === 'preview' && (
            <div className="space-y-4">
              {/* Metrics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-zinc-800">
                <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
                    Data de Início
                  </span>
                  <strong className="text-xs text-zinc-900 font-bold">{formatarDataBr(startDate)}</strong>
                </div>

                <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
                    Previsão de Fim
                  </span>
                  <strong className="text-xs text-emerald-700 font-bold">{formatarDataBr(endDate)}</strong>
                </div>

                <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
                    Duração Total
                  </span>
                  <strong className="text-xs text-zinc-900 font-bold">
                    {weeksSummary.length} semanas ({targetPoints.length} tópicos)
                  </strong>
                </div>

                <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
                    Ritmo Médio
                  </span>
                  <strong className="text-xs text-blue-700 font-bold">
                    {topicsPerDay} tópico(s) / dia
                  </strong>
                </div>
              </div>

              {/* Weekly Navigator Bar */}
              <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Navegar Semanas da Simulação
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      (Clique para ver a rotação)
                    </span>
                  </div>

                  {/* Mode switcher: Week view vs Full list */}
                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('semanal')}
                      className={`px-2 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                        previewViewMode === 'semanal'
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Visão Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('lista')}
                      className={`px-2 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                        previewViewMode === 'lista'
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Lista Completa
                    </button>
                  </div>
                </div>

                {/* Week pills pagination */}
                {previewViewMode === 'semanal' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {weeksSummary.map(w => {
                      const isSelected = w.semanaNumero === selectedPreviewWeek;
                      const isOdd = w.semanaNumero % 2 !== 0;
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
                          <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                            isSelected ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            {isOdd ? 'Ímpar (A)' : 'Par (B)'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Current Week Visual Detail */}
              {previewViewMode === 'semanal' && currentPreviewWeekObj && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
                  {/* Week Header & Combination badges */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">
                        Semana {currentPreviewWeekObj.semanaNumero}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        ({formatarDataBr(currentPreviewWeekObj.dataInicio)} até {formatarDataBr(currentPreviewWeekObj.dataFim)})
                      </span>
                    </div>

                    <span className="text-xs text-zinc-600 font-semibold">
                      {currentPreviewWeekObj.totalTopicos} tópicos distribuídos
                    </span>
                  </div>

                  {/* Highlights of combinations in this specific week */}
                  <div className="space-y-1.5 p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Composição desta Semana:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {currentPreviewWeekObj.materiasTodaSemana.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-amber-800 font-semibold flex items-center gap-0.5">
                            <Zap className="w-3 h-3 text-amber-600" /> Toda Semana:
                          </span>
                          {currentPreviewWeekObj.materiasTodaSemana.map(m => (
                            <span 
                              key={m}
                              className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-300/80 bg-amber-50 text-amber-900"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      {currentPreviewWeekObj.materiasIntercaladas.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-purple-800 font-semibold flex items-center gap-0.5">
                            <Shuffle className="w-3 h-3 text-purple-600" /> Intercaladas nesta semana:
                          </span>
                          {currentPreviewWeekObj.materiasIntercaladas.map(m => (
                            <span 
                              key={m}
                              className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-purple-300/80 bg-purple-50 text-purple-900"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      {currentPreviewWeekObj.materiasDuasVezes.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-blue-800 font-semibold flex items-center gap-0.5">
                            ⚡ 2x na semana:
                          </span>
                          {currentPreviewWeekObj.materiasDuasVezes.map(m => (
                            <span 
                              key={m}
                              className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-blue-300/80 bg-blue-50 text-blue-900"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day by Day Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {currentPreviewWeekObj.dias.map(dayItem => (
                      <div 
                        key={dayItem.data}
                        className="p-3 bg-zinc-50/50 border border-zinc-200 rounded-xl space-y-2 flex flex-col"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-150">
                          <span className="font-bold text-xs text-zinc-900">
                            {dayItem.diaSemanaAbrev}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500 font-medium">
                            {formatarDataBr(dayItem.data)}
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1">
                          {dayItem.topicos.map(topic => {
                            const cor = materiasCores[topic.materia] || '#d97706';
                            return (
                              <div 
                                key={topic.id}
                                className="p-2 bg-white border border-zinc-200 rounded-lg shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span 
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white truncate max-w-[150px]"
                                    style={{ backgroundColor: cor }}
                                  >
                                    {topic.materia}
                                  </span>
                                  {topic.tipoEstudo && (
                                    <span className="text-[9px] uppercase font-bold text-zinc-400">
                                      {topic.tipoEstudo === 'lei_seca' ? 'Lei' : topic.tipoEstudo === 'jurisprudencia' ? 'Juris' : 'Doutrina'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-800 font-medium line-clamp-2 leading-tight">
                                  {topic.titulo}
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

              {/* Full List Mode */}
              {previewViewMode === 'lista' && (
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2 max-h-96 overflow-y-auto">
                  <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider pb-1 border-b border-zinc-100">
                    Cronograma Completo ({orderedPoints.length} Tópicos)
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {orderedPoints.map((pt, idx) => {
                      const cor = materiasCores[pt.materia] || '#d97706';
                      return (
                        <div key={pt.id} className="py-2 px-1 flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 truncate flex-1">
                            <span className="font-mono text-[10px] text-zinc-400 w-8">#{idx + 1}</span>
                            <span 
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                              style={{ backgroundColor: cor }}
                            >
                              {pt.materia}
                            </span>
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

          {/* TAB CONTENT C: Topics Logical Order & Prerequisites */}
          {activeTabSection === 'pre-requisitos' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
              <div className="border-b border-zinc-100 pb-2">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                  Ordem Pedagógica Interna dos Tópicos
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Os tópicos de cada matéria serão agendados rigorosamente nesta sequência. Suba os pré-requisitos fundamentais para virem antes dos avançados.
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {materiaOrder.map(materia => {
                  const topics = pointsByMateria[materia] || [];
                  const cor = materiasCores[materia] || '#d97706';

                  return (
                    <div key={materia} className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/70">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
                          <span className="text-xs font-bold text-zinc-900">{materia}</span>
                          <span className="text-[11px] text-zinc-500">({topics.length} itens)</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {topics.map((t, tIdx) => (
                          <div 
                            key={t.id}
                            className="p-1.5 px-2 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <span className="truncate text-zinc-800 flex-1 mr-2 text-[11px]">
                              <span className="font-mono text-zinc-400 mr-1.5">#{tIdx + 1}</span>
                              {t.titulo}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={tIdx === 0}
                                onClick={() => handleMoveTopicInMateria(materia, t.id, 'up')}
                                className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={tIdx === topics.length - 1}
                                onClick={() => handleMoveTopicInMateria(materia, t.id, 'down')}
                                className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scope note if pending topics */}
          {scope === 'pending' && completedPointsCount > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{completedPointsCount} tópico(s) concluído(s)</strong> serão retirados do calendário e continuarão intactos na <strong>aba Matérias</strong> com todo o progresso e estatísticas preservados.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Previsão: <strong>{formatarDataBr(startDate)}</strong> ➔ <strong>{formatarDataBr(endDate)}</strong></span>
            <span>•</span>
            <span><strong>{orderedPoints.length}</strong> tópicos</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={targetPoints.length === 0 || orderedPoints.length === 0}
              onClick={handleExecute}
              className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Reorganização Inteligente</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL 1: Salvar Novo Preset */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Salvar Preset de Organização</h4>
                  <p className="text-[11px] text-zinc-500">Grave esta configuração para reutilizar em qualquer cronograma.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nome do Preset *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ciclo Reta Final 2x, Ciclo Padrão PF..."
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Descrição ou Observação (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 2 tópicos/dia, Segunda a Sexta, Português e Dir. Adm toda semana..."
                  value={savePresetDesc}
                  onChange={(e) => setSavePresetDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white resize-none"
                />
              </div>

              {/* Summary of what is being saved */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5 text-zinc-600">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Resumo dos parâmetros a salvar:
                </span>
                <div className="flex items-center justify-between">
                  <span>Estratégia:</span>
                  <strong className="text-zinc-800 capitalize">
                    {distributionMode === 'smart_cycle' ? 'Ciclo Inteligente' : distributionMode === 'cycle' ? 'Ciclo Tradicional' : 'Sequencial'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ritmo diário:</span>
                  <strong className="text-zinc-800">{topicsPerDay} tópico(s) por dia</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dias de estudo:</span>
                  <strong className="text-zinc-800">
                    {studyDaysMode === 'seg-sab' ? 'Segunda a Sábado' : studyDaysMode === 'seg-sex' ? 'Segunda a Sexta' : studyDaysMode === 'todos' ? 'Todos os dias' : `${customDays.length} dias selecionados`}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Regras de matérias:</span>
                  <strong className="text-zinc-800">{Object.keys(materiaConfigs).length} matérias configuradas</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!savePresetName.trim()}
                onClick={handleConfirmSavePreset}
                className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-300" />
                <span>Salvar Preset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Confirmar Exclusão de Preset */}
      {presetToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Excluir Preset?</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Deseja remover o preset <strong>"{presetToDelete.nome}"</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setPresetToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePreset(presetToDelete.id)}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: Gerenciar Todos os Presets */}
      {manageModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
            <div className="p-4 px-5 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Gerenciar Presets de Organização</h4>
                  <p className="text-xs text-zinc-500">Selecione, atualize ou remova seus modelos salvos.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Presets Disponíveis ({presets.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setManageModalOpen(false);
                    handleOpenSaveModal();
                  }}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Novo Preset</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {presets.map(p => {
                  const isActive = activePresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300'
                          : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-zinc-900 truncate">
                            {p.nome}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.isBuiltIn
                              ? 'bg-zinc-200/80 text-zinc-700'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {p.isBuiltIn ? '⚙️ Padrão' : '★ Personalizado'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                              Em Uso
                            </span>
                          )}
                        </div>
                        {p.descricao && (
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            {p.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-0.5 flex-wrap">
                          <span>Modo: <strong className="text-zinc-700 capitalize">{p.distributionMode}</strong></span>
                          <span>•</span>
                          <span>Ritmo: <strong className="text-zinc-700">{p.topicsPerDay} tópicos/dia</strong></span>
                          <span>•</span>
                          <span>Dias: <strong className="text-zinc-700">{p.studyDaysMode}</strong></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectPreset(p);
                              setManageModalOpen(false);
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition-colors cursor-pointer"
                          >
                            Aplicar
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Ativo</span>
                          </span>
                        )}

                        {!p.isBuiltIn && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdatePresetById(p.id)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-white rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                              title="Atualizar este preset com a configuração atual da tela"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPresetToDelete(p)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                              title="Excluir preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 px-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500">
                Seus presets personalizados ficam salvos no seu navegador para uso contínuo.
              </span>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
