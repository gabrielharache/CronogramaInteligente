import React, { useState, useMemo, useEffect } from 'react';
import { PontoEstudo, Cronograma } from '../../types';
import { hojeStr, formatarDataBr, distributePlannedDates } from '../../utils/helpers';
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
  ArrowUpDown
} from 'lucide-react';

interface ReorganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pontos: PontoEstudo[]; // Points of the active schedule
  activeCronograma?: Cronograma;
  onApplyReorganize: (updatedPoints: PontoEstudo[]) => void;
}

export const ReorganizeModal: React.FC<ReorganizeModalProps> = ({
  isOpen,
  onClose,
  pontos,
  activeCronograma,
  onApplyReorganize
}) => {
  const [startDate, setStartDate] = useState<string>(hojeStr());
  const [scope, setScope] = useState<'all' | 'pending'>('all');
  const [topicsPerDay, setTopicsPerDay] = useState<number>(1);
  const [studyDaysMode, setStudyDaysMode] = useState<'seg-sab' | 'seg-sex' | 'todos'>('seg-sab');
  
  // Advanced Reorganization States
  const [distributionMode, setDistributionMode] = useState<'sequential' | 'cycle'>('cycle');
  const [pointsByMateria, setPointsByMateria] = useState<Record<string, PontoEstudo[]>>({});
  const [materiaOrder, setMateriaOrder] = useState<string[]>([]);
  const [isQueueConfigOpen, setIsQueueConfigOpen] = useState<boolean>(false);

  // Filter target points based on scope
  const targetPoints = useMemo(() => {
    if (scope === 'pending') {
      return pontos.filter(p => !(p.lido && p.qFeitas));
    }
    return [...pontos];
  }, [pontos, scope]);

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
      setPointsByMateria(grouped);
      setMateriaOrder(order);
    }
  }, [isOpen, targetPoints]);

  // Reordering functions
  const handleMoveMateria = (materia: string, direction: 'up' | 'down') => {
    const idx = materiaOrder.indexOf(materia);
    if (idx === -1) return;

    let swapWith = -1;
    if (direction === 'up' && idx > 0) {
      swapWith = idx - 1;
    } else if (direction === 'down' && idx < materiaOrder.length - 1) {
      swapWith = idx + 1;
    }

    if (swapWith === -1) return;

    const nextOrder = [...materiaOrder];
    const temp = nextOrder[idx];
    nextOrder[idx] = nextOrder[swapWith];
    nextOrder[swapWith] = temp;
    setMateriaOrder(nextOrder);
  };

  const handleMoveTopicInMateria = (materia: string, topicId: string, direction: 'up' | 'down') => {
    const list = pointsByMateria[materia];
    if (!list) return;

    const idx = list.findIndex(p => p.id === topicId);
    if (idx === -1) return;

    let swapWith = -1;
    if (direction === 'up' && idx > 0) {
      swapWith = idx - 1;
    } else if (direction === 'down' && idx < list.length - 1) {
      swapWith = idx + 1;
    }

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

  // Build simulated logical sequence list based on distributionMode and custom ordering
  const orderedPoints = useMemo(() => {
    const flatList: PontoEstudo[] = [];
    if (materiaOrder.length === 0) return flatList;

    const remainingGrouped = { ...pointsByMateria };

    if (distributionMode === 'sequential') {
      // Process subject by subject
      materiaOrder.forEach(materia => {
        const list = remainingGrouped[materia];
        if (list) {
          flatList.push(...list);
        }
      });
    } else {
      // Cycle: Interleaved round-robin
      let hasMore = true;
      let idx = 0;
      while (hasMore) {
        hasMore = false;
        materiaOrder.forEach(materia => {
          const list = remainingGrouped[materia];
          if (list && idx < list.length) {
            flatList.push(list[idx]);
            hasMore = true;
          }
        });
        idx++;
      }
    }
    return flatList;
  }, [pointsByMateria, materiaOrder, distributionMode]);

  // Calculate simulated dates in real-time
  const calculatedDates = useMemo(() => {
    if (!startDate || orderedPoints.length === 0) return [];
    return distributePlannedDates(orderedPoints.length, {
      startDate,
      topicsPerDay,
      studyDaysMode
    });
  }, [startDate, orderedPoints.length, topicsPerDay, studyDaysMode]);

  const endDateStr = calculatedDates.length > 0 ? calculatedDates[calculatedDates.length - 1] : '';

  if (!isOpen) return null;

  const handleExecute = () => {
    if (calculatedDates.length !== orderedPoints.length) return;

    // Apply the newly calculated date to each point in the precise ordered queue
    const updatedPoints = orderedPoints.map((p, idx) => ({
      ...p,
      data: calculatedDates[idx],
      updatedAt: Date.now()
    }));

    onApplyReorganize(updatedPoints);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              Reorganizar Cronograma Automaticamente
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-0.5">
              Cronograma Selecionado
            </span>
            <div className="text-xs font-bold text-zinc-900">
              {activeCronograma ? activeCronograma.nome : 'Todos os tópicos'}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Altere os parâmetros abaixo para gerar uma nova distribuição inteligente que atenda à sua rotina.
            </p>
          </div>

          {/* 1. Start Date & Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                1. Data de Início dos Estudos *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setStartDate(hojeStr())}
                  className="px-2.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium rounded-lg transition-colors shrink-0"
                >
                  Hoje
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                2. O que deseja reorganizar?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`p-1.5 rounded-lg border text-center text-xs transition-all ${
                    scope === 'all'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-2xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div className="font-semibold text-[11px]">Tudo ({pontos.length})</div>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('pending')}
                  className={`p-1.5 rounded-lg border text-center text-xs transition-all ${
                    scope === 'pending'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-2xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div className="font-semibold text-[11px]">
                    Pendentes ({pontos.filter(p => !(p.lido && p.qFeitas)).length})
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Rhythm and Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                3. Ritmo de Estudos
              </label>
              <select
                value={topicsPerDay}
                onChange={(e) => setTopicsPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
              >
                <option value={1}>1 tópico por dia (Recomendado)</option>
                <option value={2}>2 tópicos por dia (Intensivo)</option>
                <option value={3}>3 tópicos por dia (Reta Final)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                4. Dias de estudo na semana
              </label>
              <select
                value={studyDaysMode}
                onChange={(e) => setStudyDaysMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
              >
                <option value="seg-sab">Segunda a Sábado (Folga Domingo)</option>
                <option value="seg-sex">Segunda a Sexta (Folga Fim de Semana)</option>
                <option value="todos">Todos os dias (Sem pausas)</option>
              </select>
            </div>
          </div>

          {/* 3. Distribution Modes (Sequential vs Ciclo de Estudos) */}
          <div className="border-t border-zinc-150 pt-3.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
              5. Modo de Distribuição & Ciclo de Estudos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDistributionMode('cycle')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  distributionMode === 'cycle'
                    ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-sm'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Layers className={`w-3.5 h-3.5 ${distributionMode === 'cycle' ? 'text-blue-300' : 'text-blue-600'}`} />
                  <span>Ciclo de Estudos (Alternar Matérias)</span>
                </div>
                <p className={`text-[10px] leading-relaxed ${distributionMode === 'cycle' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Muda de matéria a cada dia (ex: Const ➔ Adm ➔ Civil ➔ Const...). Evita a exaustão de estudar um bloco massivo de uma matéria só.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDistributionMode('sequential')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  distributionMode === 'sequential'
                    ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-sm'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ArrowUpDown className={`w-3.5 h-3.5 ${distributionMode === 'sequential' ? 'text-amber-300' : 'text-amber-600'}`} />
                  <span>Modo Sequencial (Matéria por Matéria)</span>
                </div>
                <p className={`text-[10px] leading-relaxed ${distributionMode === 'sequential' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Agenda todos os tópicos de uma única matéria em sequência lógica antes de iniciar a próxima.
                </p>
              </button>
            </div>
          </div>

          {/* 4. Priority Queue Configurator (Prerequisites) */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
            <button
              type="button"
              onClick={() => setIsQueueConfigOpen(!isQueueConfigOpen)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-700 hover:bg-zinc-100/80 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                <span>Ajustar Ordem de Prioridade & Pré-requisitos ({materiaOrder.length} Matérias)</span>
              </div>
              <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-full">
                {isQueueConfigOpen ? 'Ocultar' : 'Ajustar'}
              </span>
            </button>

            {isQueueConfigOpen && (
              <div className="p-4 border-t border-zinc-200 space-y-4 bg-white animate-in slide-in-from-top-1 duration-200">
                {/* Subject Priority Ordering */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    A. Ordem das Matérias (Sequência do Ciclo)
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-2.5">
                    Defina qual matéria vem primeiro. Use os botões 🔼/🔽 para reordenar o fluxo do ciclo.
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {materiaOrder.map((materia, idx) => (
                      <div 
                        key={materia} 
                        className="p-2 border border-zinc-150 rounded-lg flex items-center justify-between text-xs bg-zinc-50/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-400">#{idx + 1}</span>
                          <span className="font-semibold text-zinc-800">{materia}</span>
                          <span className="text-[10px] text-zinc-500">({pointsByMateria[materia]?.length || 0} tópicos)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveMateria(materia, 'up')}
                            className="p-1 hover:bg-zinc-200 rounded disabled:opacity-30 cursor-pointer text-zinc-500"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === materiaOrder.length - 1}
                            onClick={() => handleMoveMateria(materia, 'down')}
                            className="p-1 hover:bg-zinc-200 rounded disabled:opacity-30 cursor-pointer text-zinc-500"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic Priority Ordering */}
                <div className="border-t border-zinc-150 pt-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    B. Ordem Lógica Interna (Pré-requisitos dos Tópicos)
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-2.5">
                    Os tópicos de cada matéria serão estudados nesta ordem exata. Suba os tópicos mais fundamentais para garantir os pré-requisitos antes dos avançados!
                  </p>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {materiaOrder.map(materia => {
                      const topics = pointsByMateria[materia] || [];
                      return (
                        <div key={materia} className="p-2.5 border border-zinc-200 rounded-lg bg-zinc-50/30">
                          <div className="text-[11px] font-bold text-zinc-900 border-b border-zinc-100 pb-1 mb-1.5">
                            {materia} <span className="font-normal text-zinc-500">({topics.length} itens)</span>
                          </div>
                          <div className="space-y-1">
                            {topics.map((t, tIdx) => (
                              <div 
                                key={t.id} 
                                className="p-1.5 px-2 bg-white border border-zinc-150 rounded flex items-center justify-between text-[11px]"
                              >
                                <span className="truncate text-zinc-700 flex-1 mr-2">
                                  <span className="font-mono text-zinc-400 mr-1.5">#{tIdx + 1}</span>
                                  {t.titulo}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={tIdx === 0}
                                    onClick={() => handleMoveTopicInMateria(materia, t.id, 'up')}
                                    className="p-0.5 hover:bg-zinc-100 rounded disabled:opacity-30 cursor-pointer text-zinc-500"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={tIdx === topics.length - 1}
                                    onClick={() => handleMoveTopicInMateria(materia, t.id, 'down')}
                                    className="p-0.5 hover:bg-zinc-100 rounded disabled:opacity-30 cursor-pointer text-zinc-500"
                                  >
                                    <ChevronDown className="w-3 h-3" />
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
              </div>
            )}
          </div>

          {/* Real-time Calculation Summary */}
          {targetPoints.length > 0 && calculatedDates.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Simulação da Nova Linha do Tempo</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5 font-mono text-emerald-800">
                <div className="bg-white p-2 rounded-md border border-emerald-100">
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">Início</span>
                  <strong className="text-xs text-zinc-900">{formatarDataBr(startDate)}</strong>
                </div>
                <div className="bg-white p-2 rounded-md border border-emerald-100">
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">Previsão de Fim</span>
                  <strong className="text-xs text-emerald-700">{formatarDataBr(endDateStr)}</strong>
                </div>
              </div>

              {/* Sample first 4 topics */}
              <div className="pt-0.5">
                <span className="text-[10px] font-semibold uppercase text-emerald-800 block mb-1">
                  Sequência do Plano Gerado (Primeiros 4 dias):
                </span>
                <div className="bg-white rounded-lg border border-emerald-200 divide-y divide-zinc-100 overflow-hidden">
                  {orderedPoints.slice(0, 4).map((pt, idx) => (
                    <div key={pt.id} className="p-2 px-3 flex items-center justify-between text-[11px]">
                      <div className="truncate mr-2 text-zinc-700">
                        <strong className="text-zinc-900 mr-1">[{pt.materia}]</strong>
                        <span>{pt.titulo}</span>
                      </div>
                      <span className="font-mono text-emerald-700 font-bold shrink-0">
                        ➔ {formatarDataBr(calculatedDates[idx])}
                      </span>
                    </div>
                  ))}
                  {orderedPoints.length > 4 && (
                    <div className="p-1.5 bg-zinc-50 text-[10px] text-zinc-500 text-center font-semibold uppercase tracking-wider">
                      + {orderedPoints.length - 4} tópicos organizados no mesmo padrão
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {targetPoints.length === 0 && (
            <div className="p-3 bg-zinc-100 text-zinc-600 text-xs text-center rounded-lg">
              Nenhum ponto de estudo encontrado para o escopo selecionado.
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-150">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={targetPoints.length === 0}
              onClick={handleExecute}
              className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Aplicar Reorganização Inteligente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
