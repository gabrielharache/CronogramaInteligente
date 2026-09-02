import React, { useState, useEffect, useMemo } from 'react';
import { 
  SmartEditalHierarchy, 
  SmartSubjectGroup, 
  SmartTopicItem, 
  InterleavedScheduleOptions, 
  buildStructuredStudyPlan,
  calcularDiasRestantes,
  formatarDataBr,
  hojeStr,
  uid
} from '../../utils/helpers';
import { EditalStatus, TipoEstudo } from '../../types';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Calendar, 
  Check, 
  Clock, 
  Scale, 
  Gavel, 
  HelpCircle, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  ListOrdered,
  FileCode,
  Edit2
} from 'lucide-react';

interface EditalSmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: SmartEditalHierarchy | null;
  onConfirmImport: (payload: {
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
  }) => void;
}

export const EditalSmartImportModal: React.FC<EditalSmartImportModalProps> = ({
  isOpen,
  onClose,
  hierarchy,
  onConfirmImport
}) => {
  // Metadata state
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [banca, setBanca] = useState('');
  const [dataProva, setDataProva] = useState('');
  const [status, setStatus] = useState<EditalStatus>('Pretendo fazer');

  // Subjects state
  const [materias, setMaterias] = useState<SmartSubjectGroup[]>([]);
  const [collapsedMap, setCollapsedMap] = useState<{ [id: string]: boolean }>({});
  
  // Schedule options
  const [startDate, setStartDate] = useState(hojeStr());
  const [topicsPerDay, setTopicsPerDay] = useState(2);
  const [studyDaysMode, setStudyDaysMode] = useState<'seg-sex' | 'seg-sab' | 'todos'>('seg-sab');
  const [sequenceMode, setSequenceMode] = useState<'intercalado' | 'sequencial'>('intercalado');

  const [activeTab, setActiveTab] = useState<'estrutura' | 'planejamento'>('estrutura');
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize from hierarchy prop
  useEffect(() => {
    if (hierarchy && isOpen) {
      setNome(hierarchy.nome || 'Novo Concurso');
      setCargo(hierarchy.cargo || '');
      setBanca(hierarchy.banca || '');
      setDataProva(hierarchy.dataProva || '');
      setStatus(hierarchy.status || 'Pretendo fazer');
      setMaterias(hierarchy.materias || []);
      setStartDate(hojeStr());

      // Expand all by default
      const initialCollapse: { [id: string]: boolean } = {};
      (hierarchy.materias || []).forEach(m => {
        initialCollapse[m.id] = false;
      });
      setCollapsedMap(initialCollapse);
    }
  }, [hierarchy, isOpen]);

  // Derived statistics
  const totalSelectedTopics = useMemo(() => {
    return materias.reduce((acc, m) => {
      if (!m.selected) return acc;
      return acc + m.topicos.filter(t => t.selected).length;
    }, 0);
  }, [materias]);

  const totalSelectedSubjects = useMemo(() => {
    return materias.filter(m => m.selected && m.topicos.some(t => t.selected)).length;
  }, [materias]);

  const leiSecaCount = useMemo(() => {
    return materias.reduce((acc, m) => {
      if (!m.selected) return acc;
      return acc + m.topicos.filter(t => t.selected && t.tipoEstudo === 'lei_seca').length;
    }, 0);
  }, [materias]);

  const jurisCount = useMemo(() => {
    return materias.reduce((acc, m) => {
      if (!m.selected) return acc;
      return acc + m.topicos.filter(t => t.selected && t.tipoEstudo === 'jurisprudencia').length;
    }, 0);
  }, [materias]);

  // Projected completion date
  const projectedPlan = useMemo(() => {
    const opts: InterleavedScheduleOptions = {
      startDate,
      topicsPerDay,
      studyDaysMode,
      sequenceMode
    };
    return buildStructuredStudyPlan(materias, opts);
  }, [materias, startDate, topicsPerDay, studyDaysMode, sequenceMode]);

  const lastPlannedDate = projectedPlan.pontoData.length > 0
    ? projectedPlan.pontoData[projectedPlan.pontoData.length - 1].data
    : startDate;

  const totalStudyDays = projectedPlan.pontoData.length > 0 ? projectedPlan.pontoData.length : 0;
  const examCountdown = calcularDiasRestantes(dataProva);

  // Handlers for modifying subject/topic hierarchy
  const toggleSubject = (subjId: string) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        const nextSel = !m.selected;
        return {
          ...m,
          selected: nextSel,
          topicos: m.topicos.map(t => ({ ...t, selected: nextSel }))
        };
      }
      return m;
    }));
  };

  const toggleTopic = (subjId: string, topicId: string) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        const nextTopics = m.topicos.map(t => {
          if (t.id === topicId) return { ...t, selected: !t.selected };
          return t;
        });
        const anySelected = nextTopics.some(t => t.selected);
        return {
          ...m,
          selected: anySelected,
          topicos: nextTopics
        };
      }
      return m;
    }));
  };

  const updateSubjectName = (subjId: string, newName: string) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        return {
          ...m,
          nome: newName,
          topicos: m.topicos.map(t => ({ ...t, materia: newName }))
        };
      }
      return m;
    }));
  };

  const updateTopicTitle = (subjId: string, topicId: string, newTitle: string) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        return {
          ...m,
          topicos: m.topicos.map(t => t.id === topicId ? { ...t, titulo: newTitle } : t)
        };
      }
      return m;
    }));
  };

  const updateTopicType = (subjId: string, topicId: string, newType: TipoEstudo) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        return {
          ...m,
          topicos: m.topicos.map(t => t.id === topicId ? { ...t, tipoEstudo: newType } : t)
        };
      }
      return m;
    }));
  };

  const deleteTopic = (subjId: string, topicId: string) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        return {
          ...m,
          topicos: m.topicos.filter(t => t.id !== topicId)
        };
      }
      return m;
    }));
  };

  const deleteSubject = (subjId: string) => {
    setMaterias(prev => prev.filter(m => m.id !== subjId));
  };

  const addTopicToSubject = (subjId: string) => {
    setMaterias(prev => prev.map(m => {
      if (m.id === subjId) {
        const newTopic: SmartTopicItem = {
          id: uid() + Math.random().toString(36).slice(2, 6),
          titulo: 'Novo tópico de estudo',
          materia: m.nome,
          tipoEstudo: 'doutrina',
          selected: true
        };
        return {
          ...m,
          topicos: [...m.topicos, newTopic]
        };
      }
      return m;
    }));
  };

  const addNewSubject = () => {
    const newSubj: SmartSubjectGroup = {
      id: uid() + Math.random().toString(36).slice(2, 6),
      nome: 'Nova Disciplina',
      cor: '#8C1C2C',
      selected: true,
      topicos: [
        {
          id: uid() + Math.random().toString(36).slice(2, 6),
          titulo: 'Introdução e Conceitos Fundamentais',
          materia: 'Nova Disciplina',
          tipoEstudo: 'doutrina',
          selected: true
        }
      ]
    };
    setMaterias(prev => [...prev, newSubj]);
  };

  const toggleCollapse = (subjId: string) => {
    setCollapsedMap(prev => ({ ...prev, [subjId]: !prev[subjId] }));
  };

  const handleSelectAll = (select: boolean) => {
    setMaterias(prev => prev.map(m => ({
      ...m,
      selected: select,
      topicos: m.topicos.map(t => ({ ...t, selected: select }))
    })));
  };

  const handleConfirm = () => {
    if (totalSelectedTopics === 0) {
      alert('Por favor, selecione ao menos um tópico para gerar o cronograma.');
      return;
    }

    onConfirmImport({
      edital: {
        nome: nome.trim() || 'Concurso',
        cargo: cargo.trim(),
        banca: banca.trim(),
        dataProva,
        status,
        conteudo: hierarchy?.rawText || ''
      },
      cronograma: {
        nome: `${nome.trim()}${cargo ? ` (${cargo.trim()})` : ''}`,
        descricao: `Edital com ${totalSelectedSubjects} matérias e ${totalSelectedTopics} tópicos estruturados`,
        dataProva,
        cor: '#8C1C2C'
      },
      studyPlan: projectedPlan.pontoData
    });

    onClose();
  };

  if (!isOpen || !hierarchy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-zinc-900 text-white shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-base sm:text-lg text-zinc-900 leading-tight">
                  Estruturador Inteligente de Edital (.md)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Leitura Concluída
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                O edital foi lido e decomposto em matérias, assuntos, artigos de lei seca e referências.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Quick-Edit Bar */}
        <div className="p-4 bg-zinc-100/70 border-b border-zinc-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              Concurso / Órgão
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: TCE-MA ou TJ-SP"
              className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 font-semibold focus:outline-hidden focus:border-zinc-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              Cargo / Área
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex.: Auditor / Analista"
              className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              Banca Examinadora
            </label>
            <input
              type="text"
              value={banca}
              onChange={(e) => setBanca(e.target.value)}
              placeholder="Ex.: FGV, Cebraspe, FCC"
              className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
              Data da Prova
            </label>
            <input
              type="date"
              value={dataProva}
              onChange={(e) => setDataProva(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900 shadow-2xs"
            />
          </div>
        </div>

        {/* Intelligence Statistics Strip */}
        <div className="px-5 py-2.5 bg-white border-b border-zinc-200 flex items-center justify-between gap-3 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-2 text-zinc-700 flex-wrap">
            <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              <Layers className="w-3.5 h-3.5 text-zinc-600" />
              {totalSelectedSubjects} Matérias
            </span>

            <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              <BookOpen className="w-3.5 h-3.5 text-zinc-600" />
              {totalSelectedTopics} Tópicos
            </span>

            {leiSecaCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                <Scale className="w-3.5 h-3.5 text-amber-700" />
                {leiSecaCount} com Lei Seca
              </span>
            )}

            {jurisCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                <Gavel className="w-3.5 h-3.5 text-purple-700" />
                {jurisCount} Jurisprudência/Súmula
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('estrutura')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'estrutura'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              1. Matérias & Assuntos
            </button>
            <button
              onClick={() => setActiveTab('planejamento')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'planejamento'
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>2. Distribuição do Ciclo</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-zinc-50/50 space-y-4">
          {activeTab === 'estrutura' ? (
            <div className="space-y-3.5">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filtrar matérias ou assuntos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 w-64 shadow-2xs"
                  />
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {materias.length} disciplinas identificadas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 hover:underline"
                  >
                    Marcar todos
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 hover:underline"
                  >
                    Desmarcar todos
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={addNewSubject}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-900 bg-zinc-200/80 hover:bg-zinc-300 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Disciplina</span>
                  </button>
                </div>
              </div>

              {/* Subject Groups List */}
              <div className="space-y-3">
                {materias
                  .filter(m => {
                    if (!searchTerm) return true;
                    const st = searchTerm.toLowerCase();
                    return m.nome.toLowerCase().includes(st) || m.topicos.some(t => t.titulo.toLowerCase().includes(st));
                  })
                  .map(subj => {
                    const isCollapsed = collapsedMap[subj.id];
                    const selectedCount = subj.topicos.filter(t => t.selected).length;

                    return (
                      <div 
                        key={subj.id}
                        className={`bg-white border rounded-xl shadow-2xs overflow-hidden transition-all ${
                          subj.selected ? 'border-zinc-200 hover:border-zinc-300' : 'border-zinc-200/60 opacity-60'
                        }`}
                      >
                        {/* Subject Group Header */}
                        <div className="p-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={subj.selected}
                              onChange={() => toggleSubject(subj.id)}
                              className="w-4 h-4 rounded text-zinc-900 accent-zinc-900 cursor-pointer shrink-0"
                            />

                            <span 
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs" 
                              style={{ backgroundColor: subj.cor || '#8C1C2C' }} 
                            />

                            <input
                              type="text"
                              value={subj.nome}
                              onChange={(e) => updateSubjectName(subj.id, e.target.value)}
                              className="font-sans font-bold text-sm text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:bg-white focus:outline-hidden px-1 py-0.5 rounded transition-colors flex-1"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-700">
                              {selectedCount} de {subj.topicos.length} tópicos
                            </span>

                            <button
                              type="button"
                              onClick={() => addTopicToSubject(subj.id)}
                              className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
                              title="Adicionar tópico nesta matéria"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteSubject(subj.id)}
                              className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Remover matéria inteira"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCollapse(subj.id)}
                              className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
                            >
                              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Topics List */}
                        {!isCollapsed && (
                          <div className="p-2 divide-y divide-zinc-100">
                            {subj.topicos.length === 0 ? (
                              <p className="p-3 text-xs text-zinc-400 italic text-center">
                                Nenhum tópico cadastrado nesta matéria.
                              </p>
                            ) : (
                              subj.topicos.map(topic => (
                                <div 
                                  key={topic.id}
                                  className={`p-2 flex items-start gap-2.5 rounded-lg transition-colors ${
                                    topic.selected ? 'hover:bg-zinc-50' : 'opacity-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={topic.selected}
                                    onChange={() => toggleTopic(subj.id, topic.id)}
                                    className="w-3.5 h-3.5 mt-1 rounded text-zinc-900 accent-zinc-900 cursor-pointer shrink-0"
                                  />

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <input
                                      type="text"
                                      value={topic.titulo}
                                      onChange={(e) => updateTopicTitle(subj.id, topic.id, e.target.value)}
                                      className="w-full text-xs font-medium text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-900 focus:bg-white focus:outline-hidden px-1 py-0.5 rounded transition-all"
                                    />

                                    {/* Badges for Legal & Jurisprudence info */}
                                    <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                                      {topic.artigosLei && (
                                        <span className="inline-flex items-center gap-1 font-mono font-medium px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                          <Scale className="w-2.5 h-2.5" />
                                          {topic.artigosLei}
                                        </span>
                                      )}

                                      {topic.jurisprudenciaRef && (
                                        <span className="inline-flex items-center gap-1 font-mono font-medium px-1.5 py-0.2 rounded bg-purple-50 border border-purple-200 text-purple-800">
                                          <Gavel className="w-2.5 h-2.5" />
                                          {topic.jurisprudenciaRef}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Type Selector Pill */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <select
                                      value={topic.tipoEstudo}
                                      onChange={(e) => updateTopicType(subj.id, topic.id, e.target.value as TipoEstudo)}
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer ${
                                        topic.tipoEstudo === 'lei_seca' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                                        topic.tipoEstudo === 'jurisprudencia' ? 'bg-purple-50 text-purple-900 border-purple-200' :
                                        topic.tipoEstudo === 'questoes' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                                        'bg-zinc-100 text-zinc-700 border-zinc-200'
                                      }`}
                                    >
                                      <option value="doutrina">Doutrina / Teoria</option>
                                      <option value="lei_seca">Lei Seca</option>
                                      <option value="jurisprudencia">Jurisprudência</option>
                                      <option value="questoes">Questões</option>
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => deleteTopic(subj.id, topic.id)}
                                      className="p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-colors"
                                      title="Excluir este tópico"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Planejamento & Distribuição do Ciclo Tab */
            <div className="space-y-4">
              <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-4 shadow-2xs">
                <h3 className="font-sans font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-zinc-700" />
                  <span>Configuração da Distribuição do Cronograma</span>
                </h3>

                {/* Sequence mode (Ciclo Intercalado vs Sequencial) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Modo de Estudo no Cronograma
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSequenceMode('intercalado')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        sequenceMode === 'intercalado'
                          ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
                          Ciclo Intercalado (Recomendado)
                        </span>
                        {sequenceMode === 'intercalado' && (
                          <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Alterna diariamente entre as diferentes matérias do edital. Mantém o contato contínuo com todas as disciplinas até a prova.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSequenceMode('sequencial')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        sequenceMode === 'sequencial'
                          ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                          <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                          Bloco Sequencial por Matéria
                        </span>
                        {sequenceMode === 'sequencial' && (
                          <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Estuda todos os assuntos de uma matéria do início ao fim antes de iniciar a próxima matéria do edital.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Cadence Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-100 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Data de início
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Tópicos por dia
                    </label>
                    <select
                      value={topicsPerDay}
                      onChange={(e) => setTopicsPerDay(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                    >
                      <option value={1}>1 tópico por dia (~1h a 1h30)</option>
                      <option value={2}>2 tópicos por dia (~2h a 3h)</option>
                      <option value={3}>3 tópicos por dia (~3h a 4h)</option>
                      <option value={4}>4 tópicos por dia (~4h a 5h)</option>
                      <option value={5}>5 tópicos por dia (Imersão total)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Dias de estudo na semana
                    </label>
                    <select
                      value={studyDaysMode}
                      onChange={(e) => setStudyDaysMode(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="seg-sex">Segunda a Sexta (5 dias)</option>
                      <option value="seg-sab">Segunda a Sábado (6 dias)</option>
                      <option value="todos">Todos os dias (7 dias)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="p-4 rounded-xl bg-zinc-900 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-sans font-bold text-sm">
                      Projeção de Conclusão do Edital
                    </h4>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {totalSelectedTopics} tópicos programados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Início do Cronograma</span>
                    <span className="font-mono font-bold text-sm text-zinc-100">{formatarDataBr(startDate)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Término do Edital</span>
                    <span className="font-mono font-bold text-sm text-emerald-400">{formatarDataBr(lastPlannedDate)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Data da Prova</span>
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      {dataProva ? formatarDataBr(dataProva) : 'Não informada'}
                    </span>
                  </div>
                </div>

                {dataProva && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {lastPlannedDate <= dataProva
                        ? `Excelente! Você terminará o edital antes da prova (${examCountdown.texto}), com tempo hábil para revisões finais e simulados!`
                        : `Atenção: Com este ritmo (${topicsPerDay} tópicos/dia), o cronograma ultrapassa a data da prova. Recomendamos aumentar para ${topicsPerDay + 1} tópicos/dia ou selecionar dias extras de estudo.`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 bg-zinc-50 shrink-0">
          <div className="text-xs text-zinc-500">
            <span className="font-bold text-zinc-900">{totalSelectedTopics}</span> tópicos em <span className="font-bold text-zinc-900">{totalSelectedSubjects}</span> matérias serão criados
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold bg-zinc-900 hover:bg-black text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Gerar Cronograma Estruturado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
