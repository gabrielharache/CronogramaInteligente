import { useState, useMemo, useEffect } from 'react';
import { PontoEstudo, Cronograma } from '../../../types';
import { hojeStr } from '../../../utils/helpers';
import {
  calculateSmartSchedule,
  MateriaFrequencyMode,
  MateriaReorgConfig,
  ReorganizePreset,
  loadReorganizePresets,
  saveReorganizePresetsToStorage,
  getDefaultBuiltInPresets
} from '../../../utils/scheduleReorganizer';

export interface ReorganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pontos: PontoEstudo[];
  activeCronograma?: Cronograma;
  materiasCores?: Record<string, string>;
  onApplyReorganize: (updatedPoints: PontoEstudo[]) => void;
  globalMateriaOrder?: string[];
  onUpdateMateriaOrder?: (order: string[]) => void;
}

export const DIAS_OPTIONS = [
  { id: 1, label: 'Seg', full: 'Segunda-feira' },
  { id: 2, label: 'Ter', full: 'Terça-feira' },
  { id: 3, label: 'Qua', full: 'Quarta-feira' },
  { id: 4, label: 'Qui', full: 'Quinta-feira' },
  { id: 5, label: 'Sex', full: 'Sexta-feira' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
  { id: 0, label: 'Dom', full: 'Domingo' }
];

// All state, derived schedule and handlers of the reorganize modal; the tab components consume its return value
export function useReorganizeModal({
  isOpen,
  onClose,
  pontos,
  activeCronograma,
  materiasCores = {},
  onApplyReorganize,
  globalMateriaOrder,
  onUpdateMateriaOrder
}: ReorganizeModalProps) {
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
    if (!target) return;

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

  const handleRestoreDefaultPresets = () => {
    const defaults = getDefaultBuiltInPresets();
    const customOnes = presets.filter(p => !p.isBuiltIn);
    const merged = [...defaults, ...customOnes];
    setPresets(merged);
    saveReorganizePresetsToStorage(merged);
    if (merged.length > 0) {
      handleSelectPreset(merged[0]);
    }
    showFeedback("Presets padrões restaurados!", "info");
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

  return {
    startDate,
    setStartDate,
    scope,
    setScope,
    topicsPerDay,
    setTopicsPerDay,
    studyDaysMode,
    setStudyDaysMode,
    customDays,
    setCustomDays,
    avoidSameSubjectPerDay,
    setAvoidSameSubjectPerDay,
    distributionMode,
    setDistributionMode,
    pointsByMateria,
    setPointsByMateria,
    materiaOrder,
    setMateriaOrder,
    materiaConfigs,
    setMateriaConfigs,
    activeTabSection,
    setActiveTabSection,
    selectedPreviewWeek,
    setSelectedPreviewWeek,
    previewViewMode,
    setPreviewViewMode,
    editingDaysMateria,
    setEditingDaysMateria,
    presets,
    setPresets,
    activePresetId,
    setActivePresetId,
    isPresetModified,
    setIsPresetModified,
    feedbackMsg,
    setFeedbackMsg,
    saveModalOpen,
    setSaveModalOpen,
    savePresetName,
    setSavePresetName,
    savePresetDesc,
    setSavePresetDesc,
    presetToDelete,
    setPresetToDelete,
    manageModalOpen,
    setManageModalOpen,
    activePreset,
    showFeedback,
    selectedMateriasForReorg,
    setSelectedMateriasForReorg,
    allAvailableMaterias,
    isConcluido,
    pendingPointsCount,
    completedPointsCount,
    targetPoints,
    activeStudyDays,
    handleSelectPreset,
    handleApplyPreset,
    handleOpenSaveModal,
    handleConfirmSavePreset,
    handleUpdateCurrentPreset,
    handleUpdatePresetById,
    handleDeletePreset,
    handleRestoreDefaultPresets,
    handleMoveMateria,
    handleMoveTopicInMateria,
    handleUpdateMateriaFreq,
    handleToggleMateriaIntercalationGroup,
    handleToggleMateriaAllowedDay,
    handleToggleCustomDay,
    calculationResult,
    orderedPoints,
    calculatedDates,
    weeksSummary,
    endDate,
    currentPreviewWeekObj,
    freqSummary,
    handleExecute,
    isOpen,
    onClose,
    pontos,
    activeCronograma,
    materiasCores,
    onApplyReorganize,
    globalMateriaOrder,
    onUpdateMateriaOrder
  };
}

export type ReorganizeController = ReturnType<typeof useReorganizeModal>;
