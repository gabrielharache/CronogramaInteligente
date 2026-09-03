import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, PontoEstudo, Edital, EditalStatus, TabMode, ViewMode, TipoEstudo, Cronograma } from './types';
import { loadLocalUserState, fetchUserState, saveUserState, exportBackup, getInitialState, getEmptyUserState } from './utils/storage';
import { uid, hojeStr, addDays, parseEditalMarkdown, parseMarkdownStudyPoints, distributePlannedDates, SmartEditalHierarchy, calcularDificuldadeAutomatica } from './utils/helpers';
import confetti from 'canvas-confetti';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';

// Components
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { SidebarProgresso } from './components/SidebarProgresso';
import { WeeklyListView } from './components/WeeklyListView';
import { CalendarView } from './components/CalendarView';
import { SubjectGroupView } from './components/SubjectGroupView';
import { EditaisView } from './components/EditaisView';
import { PerformanceView } from './components/PerformanceView';

// Modals
import { PontoModal } from './components/modals/PontoModal';
import { EditalModal } from './components/modals/EditalModal';
import { EditalSmartImportModal } from './components/modals/EditalSmartImportModal';
import { DetailPontoModal } from './components/modals/DetailPontoModal';
import { ReorganizeModal } from './components/modals/ReorganizeModal';
import { SubjectManagerModal } from './components/modals/SubjectManagerModal';
import { ImportBackupModal } from './components/modals/ImportBackupModal';
import { CronogramaManagerModal } from './components/modals/CronogramaManagerModal';
import { ExamDateModal } from './components/modals/ExamDateModal';

interface CronogramaDashboardProps {
  userId?: string;
}

function CronogramaDashboard({ userId }: CronogramaDashboardProps) {
  const [state, setState] = useState<AppState>(() => loadLocalUserState(userId));
  const [search, setSearch] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('todas');
  const [tipoEstudoFilter, setTipoEstudoFilter] = useState<TipoEstudo | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [diffFilter, setDiffFilter] = useState('todas');

  // Modal states
  const [isPontoModalOpen, setIsPontoModalOpen] = useState(false);
  const [editingPonto, setEditingPonto] = useState<PontoEstudo | null>(null);
  const [initialDateForNewPonto, setInitialDateForNewPonto] = useState<string | undefined>(undefined);
  const [initialMateriaForNewPonto, setInitialMateriaForNewPonto] = useState<string | undefined>(undefined);

  const [isEditalModalOpen, setIsEditalModalOpen] = useState(false);
  const [editingEdital, setEditingEdital] = useState<Edital | null>(null);
  const [isExamDateModalOpen, setIsExamDateModalOpen] = useState(false);

  // Smart Edital Structurer Modal
  const [smartImportHierarchy, setSmartImportHierarchy] = useState<SmartEditalHierarchy | null>(null);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);

  const [detailPonto, setDetailPonto] = useState<PontoEstudo | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isReorganizeModalOpen, setIsReorganizeModalOpen] = useState(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [importTargetEdital, setImportTargetEdital] = useState<Edital | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCronogramaManagerOpen, setIsCronogramaManagerOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Sync state with cloud when user logs in
  useEffect(() => {
    let isMounted = true;
    if (userId) {
      fetchUserState(userId).then(({ state: cloudState }) => {
        if (isMounted && cloudState) {
          setState(cloudState);
        }
      }).catch(err => {
        console.error('Error fetching cloud state:', err);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Sync state to localStorage & Supabase
  useEffect(() => {
    setIsSaving(true);
    saveUserState(state, userId);
    const timer = setTimeout(() => setIsSaving(false), 300);
    return () => clearTimeout(timer);
  }, [state, userId]);

  const handleResetToInitial = useCallback(() => {
    const initial = userId ? getEmptyUserState() : getInitialState();
    setState(initial);
    saveUserState(initial, userId);
  }, [userId]);

  // Filter points belonging to active schedule (or all if activeCronogramaId === 'all')
  const activeSchedulePoints = useMemo(() => {
    if (state.activeCronogramaId === 'all') {
      return state.pontos;
    }
    return state.pontos.filter(p => p.cronogramaId === state.activeCronogramaId);
  }, [state.pontos, state.activeCronogramaId]);

  // Unique list of subjects in the active schedule
  const materias = useMemo(() => {
    const fromPoints = activeSchedulePoints.map(p => p.materia);
    const fromColors = Object.keys(state.materiasCores);
    const set = new Set([...fromPoints, ...fromColors]);
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [activeSchedulePoints, state.materiasCores]);

  // Subject counts
  const materiasCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeSchedulePoints.forEach(p => {
      counts[p.materia] = (counts[p.materia] || 0) + 1;
    });
    return counts;
  }, [activeSchedulePoints]);

  // Global Subject counts (across all schedules)
  const globalMateriasCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.pontos.forEach(p => {
      counts[p.materia] = (counts[p.materia] || 0) + 1;
    });
    return counts;
  }, [state.pontos]);

  // Study type counts
  const tipoEstudoCounts = useMemo(() => {
    let doutrina = 0;
    let lei_seca = 0;
    let jurisprudencia = 0;

    activeSchedulePoints.forEach(p => {
      if (p.tipoEstudo === 'lei_seca') lei_seca++;
      else if (p.tipoEstudo === 'jurisprudencia') jurisprudencia++;
      else doutrina++;
    });

    return {
      todos: activeSchedulePoints.length,
      doutrina,
      lei_seca,
      jurisprudencia
    };
  }, [activeSchedulePoints]);

  // Filtered study points
  const filteredPontos = useMemo(() => {
    const q = search.trim().toLowerCase();

    return activeSchedulePoints.filter(p => {
      // Subject filter
      if (selectedMateria !== 'todas' && p.materia !== selectedMateria) {
        return false;
      }

      // Study type filter
      if (tipoEstudoFilter !== 'todos') {
        const pointTipo = p.tipoEstudo || 'doutrina';
        if (pointTipo !== tipoEstudoFilter) return false;
      }

      // Search query in title, subject, notes, law articles, or jurisprudence
      if (q) {
        const inTitulo = p.titulo.toLowerCase().includes(q);
        const inMateria = p.materia.toLowerCase().includes(q);
        const inNotas = (p.notas || '').toLowerCase().includes(q);
        const inArts = (p.artigosLei || '').toLowerCase().includes(q);
        const inJuris = (p.jurisprudenciaRef || '').toLowerCase().includes(q);
        if (!inTitulo && !inMateria && !inNotas && !inArts && !inJuris) return false;
      }

      // Status filter
      if (statusFilter === 'pendentes-leitura' && p.lido) return false;
      if (statusFilter === 'lidos' && !p.lido) return false;
      if (statusFilter === 'sem-questoes' && p.qFeitas) return false;
      if (statusFilter === 'questoes-feitas' && !p.qFeitas) return false;
      if (statusFilter === '100-concluido' && (!p.lido || !p.qFeitas)) return false;

      // Difficulty filter (Automatic based on performance: Fácil >= 70%, Médio 46-69%, Difícil <= 45%)
      const effectiveDif = calcularDificuldadeAutomatica(p);
      if (diffFilter === 'sem' && effectiveDif !== null) return false;
      if (['facil', 'medio', 'dificil'].includes(diffFilter) && effectiveDif !== diffFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999'));
  }, [activeSchedulePoints, selectedMateria, tipoEstudoFilter, search, statusFilter, diffFilter]);

  // Active Cronograma Object
  const activeCronogramaObj = useMemo(() => {
    return state.cronogramas.find(c => c.id === state.activeCronogramaId);
  }, [state.cronogramas, state.activeCronogramaId]);

  // Point Operations
  const handleUpdatePonto = useCallback((id: string, updated: Partial<PontoEstudo>) => {
    setState(prev => {
      const nextPontos = prev.pontos.map(p => {
        if (p.id === id) {
          const isBecomingFullyDone = (updated.lido ?? p.lido) && (updated.qFeitas ?? p.qFeitas) && !(p.lido && p.qFeitas);
          if (isBecomingFullyDone) {
            try {
              confetti({
                particleCount: 40,
                spread: 55,
                origin: { y: 0.8 },
                colors: ['#18181B', '#059669', '#2563EB', '#D97706']
              });
            } catch (_) {}
          }
          const merged = { ...p, ...updated, updatedAt: Date.now() };
          // Auto update dif if questions are updated
          if (updated.qTotal !== undefined || updated.qAcertos !== undefined) {
            merged.dif = calcularDificuldadeAutomatica(merged);
          }
          return merged;
        }
        return p;
      });
      return { ...prev, pontos: nextPontos };
    });
  }, []);

  const handleDeletePonto = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      pontos: prev.pontos.filter(p => p.id !== id)
    }));
  }, []);

  const handleMovePonto = useCallback((id: string, direction: 'up' | 'down') => {
    setState(prev => {
      const targetIdx = prev.pontos.findIndex(p => p.id === id);
      if (targetIdx === -1) return prev;

      const targetPonto = prev.pontos[targetIdx];
      const matchCriteria = (p: PontoEstudo) => 
        p.materia === targetPonto.materia && 
        p.cronogramaId === targetPonto.cronogramaId;

      const matchingIndices: number[] = [];
      prev.pontos.forEach((p, idx) => {
        if (matchCriteria(p)) {
          matchingIndices.push(idx);
        }
      });

      const positionInMatch = matchingIndices.indexOf(targetIdx);
      if (positionInMatch === -1) return prev;

      let swapWithIdx = -1;
      if (direction === 'up' && positionInMatch > 0) {
        swapWithIdx = matchingIndices[positionInMatch - 1];
      } else if (direction === 'down' && positionInMatch < matchingIndices.length - 1) {
        swapWithIdx = matchingIndices[positionInMatch + 1];
      }

      if (swapWithIdx === -1) return prev;

      const nextPontos = [...prev.pontos];
      const temp = nextPontos[targetIdx];
      nextPontos[targetIdx] = nextPontos[swapWithIdx];
      nextPontos[swapWithIdx] = temp;

      return {
        ...prev,
        pontos: nextPontos
      };
    });
  }, []);

  const handleSavePonto = useCallback((data: {
    id?: string;
    cronogramaId?: string;
    titulo: string;
    materia: string;
    tipoEstudo: TipoEstudo;
    artigosLei?: string;
    jurisprudenciaRef?: string;
    novaMateriaCor?: string;
    data: string;
    notas: string;
  }) => {
    setState(prev => {
      const updatedColors = { ...prev.materiasCores };
      if (data.novaMateriaCor) {
        updatedColors[data.materia] = data.novaMateriaCor;
      }

      const assignedCronogramaId = data.cronogramaId || 
        (prev.activeCronogramaId !== 'all' ? prev.activeCronogramaId : (prev.cronogramas[0]?.id || 'cronograma-geral'));

      if (data.id) {
        // Edit existing
        const nextPontos = prev.pontos.map(p => {
          if (p.id === data.id) {
            return {
              ...p,
              cronogramaId: assignedCronogramaId,
              titulo: data.titulo,
              materia: data.materia,
              tipoEstudo: data.tipoEstudo,
              artigosLei: data.artigosLei,
              jurisprudenciaRef: data.jurisprudenciaRef,
              data: data.data,
              notas: data.notas,
              updatedAt: Date.now()
            };
          }
          return p;
        });
        return { ...prev, pontos: nextPontos, materiasCores: updatedColors };
      } else {
        // Add new
        const newPonto: PontoEstudo = {
          id: uid(),
          cronogramaId: assignedCronogramaId,
          titulo: data.titulo,
          materia: data.materia,
          tipoEstudo: data.tipoEstudo,
          artigosLei: data.artigosLei,
          jurisprudenciaRef: data.jurisprudenciaRef,
          data: data.data,
          notas: data.notas,
          lido: false,
          qFeitas: false,
          qTotal: '',
          qAcertos: '',
          dif: null,
          showNotes: Boolean(data.notas),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        return {
          ...prev,
          pontos: [...prev.pontos, newPonto],
          materiasCores: updatedColors
        };
      }
    });
  }, []);

  const handleDuplicatePonto = useCallback((ponto: PontoEstudo) => {
    const duplicated: PontoEstudo = {
      ...ponto,
      id: uid(),
      titulo: `${ponto.titulo} (Revisão)`,
      data: ponto.data ? addDays(ponto.data, 7) : ponto.data,
      lido: false,
      qFeitas: false,
      qTotal: '',
      qAcertos: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      pontos: [...prev.pontos, duplicated]
    }));
  }, []);

  const handleMovePontoDate = useCallback((pontoId: string, newDate: string) => {
    handleUpdatePonto(pontoId, { data: newDate });
  }, [handleUpdatePonto]);

  // Edital Operations
  const handleUpdateEdital = useCallback((id: string, updated: Partial<Edital>) => {
    setState(prev => ({
      ...prev,
      editais: prev.editais.map(e => e.id === id ? { ...e, ...updated } : e)
    }));
  }, []);

  const handleDeleteEdital = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      editais: prev.editais.filter(e => e.id !== id),
      cronogramas: prev.cronogramas.map(c => c.editalId === id ? { ...c, editalId: undefined } : c)
    }));
  }, []);

  const handleSaveEdital = useCallback((editalData: {
    id?: string;
    nome: string;
    cargo: string;
    banca: string;
    dataProva: string;
    status: EditalStatus;
    conteudo: string;
  }) => {
    setState(prev => {
      if (editalData.id) {
        const nextEditais = prev.editais.map(e => {
          if (e.id === editalData.id) {
            return {
              ...e,
              nome: editalData.nome,
              cargo: editalData.cargo,
              banca: editalData.banca,
              dataProva: editalData.dataProva,
              status: editalData.status,
              conteudo: editalData.conteudo
            };
          }
          return e;
        });
        return { ...prev, editais: nextEditais };
      } else {
        const newEdital: Edital = {
          id: uid(),
          nome: editalData.nome,
          cargo: editalData.cargo,
          banca: editalData.banca,
          dataProva: editalData.dataProva,
          status: editalData.status,
          conteudo: editalData.conteudo
        };
        return {
          ...prev,
          editais: [...prev.editais, newEdital]
        };
      }
    });
  }, []);

  const handleLaunchSmartStructurer = useCallback((hierarchy: SmartEditalHierarchy) => {
    setSmartImportHierarchy(hierarchy);
    setIsSmartImportOpen(true);
    setIsEditalModalOpen(false);
  }, []);

  const handleConfirmSmartImport = useCallback((payload: {
    edital: {
      nome: string;
      cargo: string;
      banca: string;
      dataProva: string;
      status: EditalStatus;
      conteudo: string;
    };
    cronograma: {
      nome: string;
      descricao: string;
      dataProva: string;
      cor: string;
    };
    studyPlan: Array<{
      materia: string;
      titulo: string;
      tipoEstudo: TipoEstudo;
      artigosLei?: string;
      jurisprudenciaRef?: string;
      notas?: string;
      data: string;
    }>;
  }) => {
    const newEditalId = uid();
    const newCroId = uid();

    const newEdital: Edital = {
      id: newEditalId,
      nome: payload.edital.nome,
      cargo: payload.edital.cargo,
      banca: payload.edital.banca,
      dataProva: payload.edital.dataProva,
      status: payload.edital.status,
      conteudo: payload.edital.conteudo,
      createdAt: Date.now()
    };

    const newCronograma: Cronograma = {
      id: newCroId,
      nome: payload.cronograma.nome,
      descricao: payload.cronograma.descricao,
      editalId: newEditalId,
      dataProva: payload.cronograma.dataProva,
      cor: payload.cronograma.cor || '#8C1C2C',
      createdAt: Date.now()
    };

    const newPontos: PontoEstudo[] = payload.studyPlan.map((p, idx) => ({
      id: uid() + idx + Math.random().toString(36).slice(2, 6),
      cronogramaId: newCroId,
      data: p.data,
      materia: p.materia,
      titulo: p.titulo,
      tipoEstudo: p.tipoEstudo,
      artigosLei: p.artigosLei || '',
      jurisprudenciaRef: p.jurisprudenciaRef || '',
      notas: p.notas || '',
      lido: false,
      qFeitas: false,
      qTotal: '',
      qAcertos: '',
      dif: null,
      showNotes: Boolean(p.notas),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    setState(prev => {
      const nextColors = { ...prev.materiasCores };
      newPontos.forEach(p => {
        if (!nextColors[p.materia]) {
          nextColors[p.materia] = '#8C1C2C';
        }
      });

      return {
        ...prev,
        editais: [newEdital, ...prev.editais],
        cronogramas: [...prev.cronogramas, newCronograma],
        pontos: [...prev.pontos, ...newPontos],
        materiasCores: nextColors,
        activeCronogramaId: newCroId,
        ui: {
          ...prev.ui,
          activeTab: 'cronograma'
        }
      };
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, []);

  const handleImportEditalFromMd = useCallback((parsed: ReturnType<typeof parseEditalMarkdown>) => {
    const newEditalId = uid();
    const newEdital: Edital = {
      id: newEditalId,
      nome: parsed.nome,
      cargo: parsed.cargo,
      banca: parsed.banca,
      dataProva: parsed.dataProva,
      status: parsed.status,
      conteudo: parsed.conteudo,
      createdAt: Date.now()
    };

    // Check if there are markdown study points in the content
    const parsedPoints = parseMarkdownStudyPoints(parsed.conteudo);
    const newCroId = uid();
    const newCronograma: Cronograma = {
      id: newCroId,
      nome: `${parsed.nome}${parsed.cargo ? ` (${parsed.cargo})` : ''}`,
      descricao: `Cronograma gerado a partir do edital ${parsed.nome}`,
      editalId: newEditalId,
      dataProva: parsed.dataProva,
      cor: '#8C1C2C',
      createdAt: Date.now()
    };

    let newPontoItems: PontoEstudo[] = [];
    if (parsedPoints.length > 0) {
      const dates = distributePlannedDates(parsedPoints.length, {
        startDate: hojeStr(),
        topicsPerDay: 2,
        studyDaysMode: 'seg-sab'
      });

      newPontoItems = parsedPoints.map((p, idx) => ({
        id: uid() + idx,
        cronogramaId: newCroId,
        data: p.data || dates[idx] || hojeStr(),
        materia: p.materia || 'Geral',
        titulo: p.titulo,
        tipoEstudo: p.tipoEstudo || 'doutrina',
        artigosLei: p.artigosLei || '',
        jurisprudenciaRef: p.jurisprudenciaRef || '',
        notas: p.notas || '',
        lido: false,
        qFeitas: false,
        qTotal: '',
        qAcertos: '',
        dif: null,
        showNotes: Boolean(p.notas),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
    }

    setState(prev => {
      // Collect new subject colors if any
      const nextMateriasCores = { ...prev.materiasCores };
      newPontoItems.forEach(p => {
        if (!nextMateriasCores[p.materia]) {
          nextMateriasCores[p.materia] = '#52525b';
        }
      });

      return {
        ...prev,
        editais: [newEdital, ...prev.editais],
        cronogramas: [...prev.cronogramas, newCronograma],
        pontos: [...prev.pontos, ...newPontoItems],
        materiasCores: nextMateriasCores,
        activeCronogramaId: newCroId
      };
    });
  }, []);

  // Cronograma Operations
  const handleSelectCronograma = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeCronogramaId: id
    }));
  }, []);

  const handleSaveCronograma = useCallback((data: {
    id?: string;
    nome: string;
    descricao?: string;
    editalId?: string;
    dataProva?: string;
    cor?: string;
  }) => {
    setState(prev => {
      if (data.id) {
        const nextList = prev.cronogramas.map(c => {
          if (c.id === data.id) {
            return {
              ...c,
              nome: data.nome,
              descricao: data.descricao,
              editalId: data.editalId,
              dataProva: data.dataProva,
              cor: data.cor
            };
          }
          return c;
        });
        return { ...prev, cronogramas: nextList };
      } else {
        const newId = `cronograma-${uid()}`;
        const newCro: Cronograma = {
          id: newId,
          nome: data.nome,
          descricao: data.descricao,
          editalId: data.editalId,
          dataProva: data.dataProva,
          cor: data.cor || '#8C1C2C',
          createdAt: Date.now()
        };
        return {
          ...prev,
          cronogramas: [...prev.cronogramas, newCro],
          activeCronogramaId: newId
        };
      }
    });
  }, []);

  const handleSaveExamDate = useCallback((newDate: string, editalIdToUpdate?: string) => {
    setState(prev => {
      // 1. Update active cronograma date
      let nextCronogramas = prev.cronogramas;
      if (prev.activeCronogramaId !== 'all') {
        nextCronogramas = prev.cronogramas.map(c => {
          if (c.id === prev.activeCronogramaId) {
            return { ...c, dataProva: newDate, editalId: editalIdToUpdate || c.editalId };
          }
          return c;
        });
      }

      // 2. Update target edital date if provided
      let nextEditais = prev.editais;
      if (editalIdToUpdate) {
        nextEditais = prev.editais.map(e => {
          if (e.id === editalIdToUpdate) {
            return { ...e, dataProva: newDate };
          }
          return e;
        });
      }

      return {
        ...prev,
        cronogramas: nextCronogramas,
        editais: nextEditais
      };
    });
  }, []);

  const handleDeleteCronograma = useCallback((id: string) => {
    setState(prev => {
      const nextCro = prev.cronogramas.filter(c => c.id !== id);
      const nextPontos = prev.pontos.filter(p => p.cronogramaId !== id);
      const nextActiveId = prev.activeCronogramaId === id ? (nextCro[0]?.id || 'all') : prev.activeCronogramaId;
      return {
        ...prev,
        cronogramas: nextCro,
        pontos: nextPontos,
        activeCronogramaId: nextActiveId
      };
    });
  }, []);

  const handleSwitchToCronograma = useCallback((cronogramaId: string) => {
    setState(prev => ({
      ...prev,
      activeCronogramaId: cronogramaId,
      ui: { ...prev.ui, activeTab: 'pontos' }
    }));
  }, []);

  const handleCriarCronogramaParaEdital = useCallback((edital: Edital) => {
    const newId = `cronograma-${uid()}`;
    const newCro: Cronograma = {
      id: newId,
      nome: `${edital.nome} (${edital.cargo})`,
      descricao: `Cronograma personalizado para o concurso ${edital.nome}`,
      editalId: edital.id,
      cor: '#14524A',
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      cronogramas: [...prev.cronogramas, newCro],
      activeCronogramaId: newId,
      ui: { ...prev.ui, activeTab: 'pontos' }
    }));
  }, []);

  const handleOpenImportForEdital = useCallback((edital: Edital) => {
    setImportTargetEdital(edital);
    setIsImportModalOpen(true);
  }, []);

  // Reorganize Application
  const handleApplyReorganize = useCallback((reorgData: Record<string, string> | PontoEstudo[]) => {
    setState(prev => {
      const activeId = prev.activeCronogramaId;
      let nextPontos: PontoEstudo[];

      if (Array.isArray(reorgData)) {
        // Remove old points of the active schedule, append the new ones in the exact sorted array sequence
        const otherPoints = prev.pontos.filter(p => !(activeId === 'all' || p.cronogramaId === activeId));
        nextPontos = [...otherPoints, ...reorgData];
      } else if (reorgData && typeof reorgData === 'object') {
        nextPontos = prev.pontos.map(p => {
          if ((activeId === 'all' || p.cronogramaId === activeId) && reorgData[p.id]) {
            return {
              ...p,
              data: reorgData[p.id],
              updatedAt: Date.now()
            };
          }
          return p;
        });
      } else {
        nextPontos = prev.pontos;
      }

      return {
        ...prev,
        pontos: nextPontos
      };
    });
  }, []);

  // Subject Manager Operations
  const handleUpdateSubjectColor = useCallback((materia: string, novaCor: string) => {
    setState(prev => ({
      ...prev,
      materiasCores: {
        ...prev.materiasCores,
        [materia]: novaCor
      }
    }));
  }, []);

  const handleAddSubject = useCallback((materia: string, cor: string) => {
    setState(prev => ({
      ...prev,
      materiasCores: {
        ...prev.materiasCores,
        [materia]: cor
      }
    }));
  }, []);

  const handleDeleteSubject = useCallback((materia: string) => {
    setState(prev => {
      const nextColors = { ...prev.materiasCores };
      delete nextColors[materia];

      return {
        ...prev,
        pontos: prev.pontos.filter(p => p.materia !== materia),
        materiasCores: nextColors
      };
    });
  }, []);

  const handleRenameSubject = useCallback((antigoNome: string, novoNome: string) => {
    setState(prev => {
      const nextColors = { ...prev.materiasCores };
      if (nextColors[antigoNome] !== undefined) {
        nextColors[novoNome] = nextColors[antigoNome];
        delete nextColors[antigoNome];
      }

      const nextPoints = prev.pontos.map(p => {
        if (p.materia === antigoNome) {
          return {
            ...p,
            materia: novoNome,
            updatedAt: Date.now()
          };
        }
        return p;
      });

      return {
        ...prev,
        pontos: nextPoints,
        materiasCores: nextColors
      };
    });
  }, []);

  // Import points to specific schedule
  const handleImportPointsToSchedule = useCallback((
    points: PontoEstudo[],
    destination: {
      type: 'new_cronograma' | 'append_current' | 'replace_current';
      newCronogramaNome?: string;
      newCronogramaEditalId?: string;
      targetCronogramaId?: string;
    }
  ) => {
    setState(prev => {
      let targetCronId = destination.targetCronogramaId || prev.activeCronogramaId;
      const nextCronogramas = [...prev.cronogramas];

      if (destination.type === 'new_cronograma') {
        const newId = destination.targetCronogramaId || `cronograma-${uid()}`;
        targetCronId = newId;
        const newCro: Cronograma = {
          id: newId,
          nome: destination.newCronogramaNome || 'Novo Cronograma',
          editalId: destination.newCronogramaEditalId || undefined,
          cor: '#3b82f6',
          createdAt: Date.now()
        };
        nextCronogramas.push(newCro);
      }

      const newPoints: PontoEstudo[] = points.map((item, idx) => ({
        id: item.id || (uid() + idx),
        cronogramaId: targetCronId,
        data: item.data || '',
        materia: item.materia || 'Geral',
        titulo: item.titulo || 'Tópico de Estudo',
        tipoEstudo: item.tipoEstudo || 'doutrina',
        artigosLei: item.artigosLei || '',
        jurisprudenciaRef: item.jurisprudenciaRef || '',
        notas: item.notas || '',
        lido: item.lido || false,
        qFeitas: item.qFeitas || false,
        qTotal: item.qTotal || '',
        qAcertos: item.qAcertos || '',
        dif: item.dif || null,
        showNotes: Boolean(item.notas),
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      }));

      let nextPontos = [...prev.pontos];
      if (destination.type === 'replace_current') {
        // Remove existing points of this schedule
        nextPontos = nextPontos.filter(p => p.cronogramaId !== targetCronId);
      }
      nextPontos.push(...newPoints);

      // Collect new subject colors if any
      const nextColors = { ...prev.materiasCores };
      newPoints.forEach(p => {
        if (!nextColors[p.materia]) {
          nextColors[p.materia] = '#52525b';
        }
      });

      return {
        ...prev,
        cronogramas: nextCronogramas,
        pontos: nextPontos,
        materiasCores: nextColors,
        activeCronogramaId: targetCronId,
        ui: { ...prev.ui, activeTab: 'pontos' }
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <Header
        state={state}
        activeTab={state.ui.activeTab}
        onTabChange={(tab) => setState(prev => ({ ...prev, ui: { ...prev.ui, activeTab: tab } }))}
        onExport={() => exportBackup(state)}
        onOpenImport={() => {
          setImportTargetEdital(null);
          setIsImportModalOpen(true);
        }}
        onOpenReorganize={() => setIsReorganizeModalOpen(true)}
        onOpenSubjectManager={() => setIsSubjectManagerOpen(true)}
        onOpenCronogramaManager={() => setIsCronogramaManagerOpen(true)}
        onSelectCronograma={handleSelectCronograma}
        onOpenExamDateModal={() => setIsExamDateModalOpen(true)}
        onResetToInitial={handleResetToInitial}
        onUpdatePonto={handleUpdatePonto}
        isSaving={isSaving}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Pontos de Estudo */}
        {state.ui.activeTab === 'pontos' && (
          <div className={`flex flex-col ${state.ui.view === 'calendario' ? '' : 'lg:flex-row'} items-start gap-6`}>
            {/* Left Column: Progresso, Por Matéria & Navegar (displayed when in weekly or subject view) */}
            {state.ui.view !== 'calendario' && (
              <SidebarProgresso
                pontos={activeSchedulePoints}
                materias={materias}
                materiasCores={state.materiasCores}
                selectedMateria={selectedMateria}
                onSelectMateria={setSelectedMateria}
                onViewModeChange={(v) => setState(prev => ({ ...prev, ui: { ...prev.ui, view: v } }))}
              />
            )}

            {/* Right Column / Full Width: Filter Bar & Dynamic View */}
            <div className="flex-1 min-w-0 w-full">
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                selectedMateria={selectedMateria}
                onMateriaChange={setSelectedMateria}
                materias={materias}
                materiasCores={state.materiasCores}
                materiasCounts={materiasCounts}
                cronogramas={state.cronogramas}
                activeCronogramaId={state.activeCronogramaId}
                onCronogramaChange={handleSelectCronograma}
                onOpenCronogramaManager={() => setIsCronogramaManagerOpen(true)}
                tipoEstudoFilter={tipoEstudoFilter}
                onTipoEstudoFilterChange={setTipoEstudoFilter}
                tipoEstudoCounts={tipoEstudoCounts}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                diffFilter={diffFilter}
                onDiffFilterChange={setDiffFilter}
                viewMode={state.ui.view}
                onViewModeChange={(v) => setState(prev => ({ ...prev, ui: { ...prev.ui, view: v } }))}
                onNovoPonto={() => {
                  setEditingPonto(null);
                  setInitialDateForNewPonto(undefined);
                  setInitialMateriaForNewPonto(selectedMateria !== 'todas' ? selectedMateria : undefined);
                  setIsPontoModalOpen(true);
                }}
                totalFiltrados={filteredPontos.length}
                totalGeral={activeSchedulePoints.length}
              />

              {/* View 1: Semanal (Accordion cards matching screenshot) */}
              {state.ui.view === 'semanal' && (
                <WeeklyListView
                  pontos={filteredPontos}
                  allPontos={activeSchedulePoints}
                  materiasCores={state.materiasCores}
                  onUpdatePonto={handleUpdatePonto}
                  onDeletePonto={handleDeletePonto}
                  onEditPonto={(p) => {
                    setEditingPonto(p);
                    setIsPontoModalOpen(true);
                  }}
                  onDuplicatePonto={handleDuplicatePonto}
                  onNovoPonto={() => {
                    setEditingPonto(null);
                    setIsPontoModalOpen(true);
                  }}
                />
              )}

              {/* View 2: Calendário Contínuo */}
              {state.ui.view === 'calendario' && (
                <CalendarView
                  pontos={filteredPontos}
                  allPontos={activeSchedulePoints}
                  materiasCores={state.materiasCores}
                  onSelectPonto={(p) => {
                    setDetailPonto(p);
                    setIsDetailModalOpen(true);
                  }}
                  onMovePontoDate={handleMovePontoDate}
                  onNovoPontoNaData={(dateStr) => {
                    setEditingPonto(null);
                    setInitialDateForNewPonto(dateStr);
                    setIsPontoModalOpen(true);
                  }}
                  onUpdatePonto={handleUpdatePonto}
                />
              )}

              {/* View 3: Agrupado por Matéria */}
              {state.ui.view === 'materias' && (
                <SubjectGroupView
                  pontos={filteredPontos}
                  materiasCores={state.materiasCores}
                  onUpdatePonto={handleUpdatePonto}
                  onDeletePonto={handleDeletePonto}
                  onEditPonto={(p) => {
                    setEditingPonto(p);
                    setIsPontoModalOpen(true);
                  }}
                  onDuplicatePonto={handleDuplicatePonto}
                  onNovoPontoNaMateria={(mat) => {
                    setEditingPonto(null);
                    setInitialMateriaForNewPonto(mat);
                    setIsPontoModalOpen(true);
                  }}
                  onMovePonto={handleMovePonto}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Editais & Concursos */}
        {state.ui.activeTab === 'editais' && (
          <EditaisView
            editais={state.editais}
            cronogramas={state.cronogramas}
            pontos={state.pontos}
            onUpdateEdital={handleUpdateEdital}
            onDeleteEdital={handleDeleteEdital}
            onEditEdital={(e) => {
              setEditingEdital(e);
              setIsEditalModalOpen(true);
            }}
            onNovoEdital={() => {
              setEditingEdital(null);
              setIsEditalModalOpen(true);
            }}
            onSwitchToCronograma={handleSwitchToCronograma}
            onCriarCronogramaParaEdital={handleCriarCronogramaParaEdital}
            onOpenImportForEdital={handleOpenImportForEdital}
            onOpenSmartImport={handleLaunchSmartStructurer}
          />
        )}

        {/* TAB 3: Desempenho & Estatísticas */}
        {state.ui.activeTab === 'desempenho' && (
          <PerformanceView
            pontos={activeSchedulePoints}
            materiasCores={state.materiasCores}
            onSelectPonto={(p) => {
              setDetailPonto(p);
              setIsDetailModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Clean Notion Footer */}
      <footer className="mt-auto border-t border-zinc-200/80 bg-white py-4 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Estante de Estudos • Cronograma por Edital, Doutrina, Lei Seca & Jurisprudência
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportBackup(state)}
              className="text-zinc-900 hover:underline font-semibold cursor-pointer"
            >
              Exportar Backup (JSON)
            </button>
            <span>•</span>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Alimentar / Importar
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EditalSmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => {
          setIsSmartImportOpen(false);
          setSmartImportHierarchy(null);
        }}
        hierarchy={smartImportHierarchy}
        onConfirmImport={handleConfirmSmartImport}
      />

      <PontoModal
        isOpen={isPontoModalOpen}
        onClose={() => {
          setIsPontoModalOpen(false);
          setEditingPonto(null);
          setInitialDateForNewPonto(undefined);
          setInitialMateriaForNewPonto(undefined);
        }}
        ponto={editingPonto}
        materias={materias}
        materiasCores={state.materiasCores}
        cronogramas={state.cronogramas}
        activeCronogramaId={state.activeCronogramaId}
        onSave={handleSavePonto}
        initialDate={initialDateForNewPonto}
        initialMateria={initialMateriaForNewPonto}
      />

      <CronogramaManagerModal
        isOpen={isCronogramaManagerOpen}
        onClose={() => setIsCronogramaManagerOpen(false)}
        cronogramas={state.cronogramas}
        activeCronogramaId={state.activeCronogramaId}
        pontos={state.pontos}
        editais={state.editais}
        onSelectCronograma={handleSelectCronograma}
        onSaveCronograma={handleSaveCronograma}
        onDeleteCronograma={handleDeleteCronograma}
        onNovoEdital={() => {
          setEditingEdital(null);
          setIsEditalModalOpen(true);
        }}
        onEditEdital={(e) => {
          setEditingEdital(e);
          setIsEditalModalOpen(true);
        }}
        onDeleteEdital={handleDeleteEdital}
      />

      <ExamDateModal
        isOpen={isExamDateModalOpen}
        onClose={() => setIsExamDateModalOpen(false)}
        activeCronograma={activeCronogramaObj}
        editais={state.editais}
        currentDateStr={activeCronogramaObj?.dataProva || ''}
        onSaveDate={handleSaveExamDate}
      />

      <EditalModal
        isOpen={isEditalModalOpen}
        onClose={() => {
          setIsEditalModalOpen(false);
          setEditingEdital(null);
        }}
        edital={editingEdital}
        onSave={handleSaveEdital}
        onOpenSmartStructurer={handleLaunchSmartStructurer}
      />

      <DetailPontoModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailPonto(null);
        }}
        ponto={detailPonto}
        materiaCor={detailPonto ? (state.materiasCores[detailPonto.materia] || '#18181B') : '#18181B'}
        onUpdatePonto={handleUpdatePonto}
        onDeletePonto={handleDeletePonto}
        onEditPonto={(p) => {
          setEditingPonto(p);
          setIsPontoModalOpen(true);
        }}
        onDuplicatePonto={handleDuplicatePonto}
      />

      <ReorganizeModal
        isOpen={isReorganizeModalOpen}
        onClose={() => setIsReorganizeModalOpen(false)}
        pontos={activeSchedulePoints}
        activeCronograma={activeCronogramaObj}
        onApplyReorganize={handleApplyReorganize}
      />

      <SubjectManagerModal
        isOpen={isSubjectManagerOpen}
        onClose={() => setIsSubjectManagerOpen(false)}
        materias={materias}
        materiasCores={state.materiasCores}
        materiasCounts={globalMateriasCounts}
        onUpdateCor={handleUpdateSubjectColor}
        onAddMateria={handleAddSubject}
        onDeleteMateria={handleDeleteSubject}
        onRenameMateria={handleRenameSubject}
      />

      <ImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportTargetEdital(null);
        }}
        cronogramas={state.cronogramas}
        activeCronogramaId={state.activeCronogramaId}
        editais={state.editais}
        targetEdital={importTargetEdital}
        onImportFullBackup={(newState) => setState(newState)}
        onImportPointsToSchedule={handleImportPointsToSchedule}
      />
    </div>
  );
}

function MainAppContent() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex flex-col items-center justify-center text-zinc-900 font-sans">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mb-3" />
        <p className="text-zinc-500 text-sm font-medium">Carregando seu cronograma...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthPage />;
  }

  return <CronogramaDashboard userId={user?.id} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

