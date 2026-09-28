import React, { useState, useMemo } from 'react';
import { PontoEstudo, Dificuldade, TipoEstudo, BateriaQuestoes, RevisaoAgendada, TipoRevisaoEspacada } from '../types';
import { 
  formatarDataBr, 
  hojeStr, 
  calcularPercentualAcerto,
  calcularDificuldadeAutomatica,
  getDificuldadeInfo,
  addDays,
  uid,
  calcularEvolucaoQuestoes,
  gerarRevisoesCiclo,
  calcularStatusRevisao,
  REVISOES_ESPACADAS_CONFIG
} from '../utils/helpers';
import { 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Calendar, 
  Layers,
  FileText,
  Scale,
  Landmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Play,
  GripVertical,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  CheckCircle2,
  Plus,
  AlertCircle,
  CalendarClock
} from 'lucide-react';

interface StudyPointCardProps {
  ponto: PontoEstudo;
  materiaCor: string;
  onUpdate: (updated: Partial<PontoEstudo>) => void;
  onDelete: () => void;
  onEdit: () => void;
  overrideDate?: string;
  onDuplicate?: () => void;
  onSplit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onStartFocus?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  dragHandleProps?: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

export const StudyPointCard: React.FC<StudyPointCardProps> = ({
  ponto,
  materiaCor,
  onUpdate,
  onDelete,
  onEdit,
  overrideDate,
  onDuplicate,
  onSplit,
  onMoveUp,
  onMoveDown,
  onStartFocus,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  dragHandleProps
}) => {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  // Question evolution new batch form state
  const [isAddingNewBatch, setIsAddingNewBatch] = useState(false);
  const [newBatchAcertos, setNewBatchAcertos] = useState<number | ''>('');
  const [newBatchTotal, setNewBatchTotal] = useState<number | ''>('');
  const [newBatchData, setNewBatchData] = useState<string>(hojeStr());
  const [newBatchTipo, setNewBatchTipo] = useState<string>('');
  const [newBatchNotas, setNewBatchNotas] = useState<string>('');

  // Spaced repetition custom date state
  const [isAddingCustomRevision, setIsAddingCustomRevision] = useState(false);
  const [customRevisionDate, setCustomRevisionDate] = useState<string>(addDays(hojeStr(), 14));

  const hoje = hojeStr();
  const isHoje = ponto.data === hoje;
  const isConcluido = ponto.lido && ponto.qFeitas;
  const pctAcerto = calcularPercentualAcerto(ponto);
  const difAuto = calcularDificuldadeAutomatica(ponto);
  const difInfo = getDificuldadeInfo(difAuto);

  // Unified question history
  const historicoQuestoes = useMemo<BateriaQuestoes[]>(() => {
    if (ponto.historicoQuestoes && ponto.historicoQuestoes.length > 0) {
      return ponto.historicoQuestoes;
    }
    if (ponto.qFeitas && ponto.qTotal && Number(ponto.qTotal) > 0) {
      const acertos = typeof ponto.qAcertos === 'number' ? ponto.qAcertos : (parseInt(String(ponto.qAcertos), 10) || 0);
      const total = typeof ponto.qTotal === 'number' ? ponto.qTotal : (parseInt(String(ponto.qTotal), 10) || 1);
      const pct = Math.round((Math.min(acertos, total) / total) * 100);
      return [{
        id: 'initial-' + ponto.id,
        data: ponto.data || hoje,
        qAcertos: acertos,
        qTotal: total,
        pct,
        dif: ponto.dif || calcularDificuldadeAutomatica(ponto),
        tipo: '1ª Bateria (Base)',
        createdAt: ponto.createdAt || Date.now()
      }];
    }
    return [];
  }, [ponto.historicoQuestoes, ponto.qFeitas, ponto.qTotal, ponto.qAcertos, ponto.dif, ponto.data, ponto.id, ponto.createdAt, hoje]);

  const evolucao = useMemo(() => calcularEvolucaoQuestoes(historicoQuestoes), [historicoQuestoes]);
  const revisoesEspacadas = useMemo(() => ponto.revisoesEspacadas || [], [ponto.revisoesEspacadas]);

  // Handlers for Question Batches
  const handleSaveNewBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const acertos = typeof newBatchAcertos === 'number' ? newBatchAcertos : parseInt(String(newBatchAcertos), 10) || 0;
    const total = typeof newBatchTotal === 'number' ? newBatchTotal : parseInt(String(newBatchTotal), 10) || 0;
    if (total <= 0) return;

    const acertosReal = Math.min(acertos, total);
    const pct = Math.round((acertosReal / total) * 100);
    const dif = calcularDificuldadeAutomatica({ qAcertos: acertosReal, qTotal: total });

    const novaBateria: BateriaQuestoes = {
      id: uid(),
      data: newBatchData || hoje,
      qAcertos: acertosReal,
      qTotal: total,
      pct,
      dif,
      tipo: newBatchTipo.trim() || `Bateria #${historicoQuestoes.length + 1}`,
      notas: newBatchNotas.trim() || undefined,
      createdAt: Date.now()
    };

    const nextHistorico = [...historicoQuestoes, novaBateria];
    onUpdate({
      historicoQuestoes: nextHistorico,
      qAcertos: acertosReal,
      qTotal: total,
      qFeitas: true,
      dif,
      updatedAt: Date.now()
    });

    // Reset form
    setNewBatchAcertos('');
    setNewBatchTotal('');
    setNewBatchTipo('');
    setNewBatchNotas('');
    setIsAddingNewBatch(false);
  };

  const handleDeleteBatch = (batchId: string) => {
    const nextHistorico = historicoQuestoes.filter(b => b.id !== batchId);
    if (nextHistorico.length === 0) {
      onUpdate({
        historicoQuestoes: [],
        qAcertos: '',
        qTotal: '',
        qFeitas: false,
        dif: null,
        updatedAt: Date.now()
      });
    } else {
      const last = nextHistorico[nextHistorico.length - 1];
      onUpdate({
        historicoQuestoes: nextHistorico,
        qAcertos: last.qAcertos,
        qTotal: last.qTotal,
        qFeitas: true,
        dif: last.dif || calcularDificuldadeAutomatica(last),
        updatedAt: Date.now()
      });
    }
  };

  // Handlers for Spaced Repetition
  const handleToggleSpacedReview = (tipo: TipoRevisaoEspacada) => {
    const existing = revisoesEspacadas.find(r => r.tipo === tipo);
    if (existing) {
      // Toggle concluded
      const nextConcluida = !existing.concluida;
      const nextList = revisoesEspacadas.map(r => 
        r.id === existing.id 
          ? { ...r, concluida: nextConcluida, concluidaEm: nextConcluida ? hoje : undefined } 
          : r
      );
      onUpdate({ revisoesEspacadas: nextList, updatedAt: Date.now() });
    } else {
      // Schedule new
      const config = REVISOES_ESPACADAS_CONFIG[tipo];
      const baseDate = ponto.data || hoje;
      const dataPrevista = addDays(baseDate, config.dias);
      const nova: RevisaoAgendada = {
        id: uid(),
        tipo,
        dataPrevista,
        concluida: false,
        createdAt: Date.now()
      };
      onUpdate({
        revisoesEspacadas: [...revisoesEspacadas, nova],
        updatedAt: Date.now()
      });
    }
  };

  const handleScheduleFullCycle = () => {
    const baseDate = ponto.data || hoje;
    const tipos: TipoRevisaoEspacada[] = ['24h', '7d', '30d', '60d'];
    const existingTipos = new Set(revisoesEspacadas.map(r => r.tipo));
    const novos: RevisaoAgendada[] = [];

    tipos.forEach(t => {
      if (!existingTipos.has(t)) {
        const config = REVISOES_ESPACADAS_CONFIG[t];
        novos.push({
          id: uid(),
          tipo: t,
          dataPrevista: addDays(baseDate, config.dias),
          concluida: false,
          createdAt: Date.now()
        });
      }
    });

    onUpdate({
      revisoesEspacadas: [...revisoesEspacadas, ...novos],
      updatedAt: Date.now()
    });
  };

  const handleRemoveSpacedReview = (id: string) => {
    onUpdate({
      revisoesEspacadas: revisoesEspacadas.filter(r => r.id !== id),
      updatedAt: Date.now()
    });
  };

  const handleAddCustomSpacedReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRevisionDate) return;
    const nova: RevisaoAgendada = {
      id: uid(),
      tipo: 'personalizada',
      dataPrevista: customRevisionDate,
      concluida: false,
      createdAt: Date.now()
    };
    onUpdate({
      revisoesEspacadas: [...revisoesEspacadas, nova],
      updatedAt: Date.now()
    });
    setIsAddingCustomRevision(false);
  };

  // Parse weekday and date label
  const getDayInfo = (dateStr: string) => {
    if (!dateStr) return { weekday: '—', dayMonth: '—' };
    const parts = dateStr.split('-');
    if (parts.length < 3) return { weekday: '—', dayMonth: '—' };
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayOfWeek = d.getDay();
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      weekday: weekdays[dayOfWeek],
      dayMonth: `${parts[2]}/${parts[1]}`
    };
  };

  const formatMultipleDates = (dates?: string[]) => {
    if (!dates || dates.length <= 1) return '';
    const formatted = dates.map(d => {
      const info = getDayInfo(d);
      return `${info.weekday} ${info.dayMonth}`;
    });
    const last = formatted[formatted.length - 1];
    const rest = formatted.slice(0, -1).join(', ');
    return `${rest} e ${last}`;
  };

  const getPartString = () => {
    if (!ponto.datas || ponto.datas.length <= 1) return '';
    const dateToFind = overrideDate || ponto.data;
    const idx = ponto.datas.indexOf(dateToFind);
    if (idx !== -1) {
      return `${idx + 1}/${ponto.datas.length}`;
    }
    return '';
  };

  const displayDate = overrideDate || ponto.data;
  const dayInfo = getDayInfo(displayDate);

  const handleDeleteClick = () => {
    if (deleteArmed) {
      onDelete();
    } else {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3500);
    }
  };

  const handleCopyNote = () => {
    if (!ponto.notas) return;
    navigator.clipboard.writeText(ponto.notas);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const toggleMainCheck = () => {
    const nextState = !ponto.lido;
    onUpdate({
      lido: nextState,
      // If turning on and questions weren't set, default questions to done
      qFeitas: nextState ? (ponto.qFeitas || false) : ponto.qFeitas
    });
  };

  const hasQuestionsDone = ponto.qFeitas && ponto.qTotal && Number(ponto.qTotal) > 0;

  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`group relative py-3.5 px-4 sm:px-5 hover:bg-zinc-50/70 transition-colors border-b border-zinc-100 last:border-b-0 ${
        isConcluido ? 'bg-zinc-50/40' : ''
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="p-1 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors shrink-0 mt-0.5"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Left Day Indicator */}
        <div className="w-12 sm:w-14 shrink-0 text-left pt-0.5">
          {!overrideDate && ponto.datas && ponto.datas.length > 1 ? (
            <div className="space-y-1.5 pr-1">
              {ponto.datas.map((dStr, idx) => {
                const info = getDayInfo(dStr);
                return (
                  <div key={idx} className="pb-1 border-b border-zinc-100 last:border-0 last:pb-0">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight leading-none mb-0.5">
                      {info.weekday}
                    </div>
                    <div className="text-xs font-mono font-bold text-zinc-800 leading-none">
                      {info.dayMonth}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : displayDate ? (
            <>
              <div className="text-xs text-zinc-400 font-medium">
                {dayInfo.weekday}
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-zinc-800">
                {dayInfo.dayMonth}
              </div>
            </>
          ) : (ponto.lido || ponto.qFeitas) ? (
            <>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                Feito
              </div>
              <div className="text-xs font-mono font-bold text-emerald-700">
                Concluído
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-zinc-400 font-medium">—</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-zinc-400">—</div>
            </>
          )}
        </div>

        {/* Custom Square Checkbox */}
        <button
          onClick={toggleMainCheck}
          className={`w-5 h-5 rounded-xs shrink-0 mt-0.5 border flex items-center justify-center transition-all cursor-pointer ${
            ponto.lido
              ? 'bg-[#15803d] border-[#15803d] text-white shadow-2xs'
              : 'border-zinc-300 bg-white hover:border-zinc-400'
          }`}
          title={ponto.lido ? "Marcar como pendente" : "Marcar como estudado"}
        >
          {ponto.lido && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Center Main Content */}
        <div className="flex-1 min-w-0">
          {/* Subject Badge & Type Pill */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            {/* Solid Subject Pill exactly like screenshot */}
            <span 
              className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded text-white shadow-2xs"
              style={{ backgroundColor: materiaCor || '#8C1C2C' }}
            >
              {ponto.materia}
            </span>

            {/* Logical order within the subject */}
            {typeof ponto.ordem === 'number' && (
              <span 
                className="inline-flex items-center text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200"
                title={`Ordem lógica no edital: Tópico #${ponto.ordem}`}
              >
                #{ponto.ordem}
              </span>
            )}

            {/* Optional Type Badge if Lei Seca or Jurisprudência */}
            {ponto.tipoEstudo === 'lei_seca' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                <Scale className="w-2.5 h-2.5 text-amber-700" />
                <span>Lei Seca</span>
              </span>
            )}
            {ponto.tipoEstudo === 'jurisprudencia' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                <Landmark className="w-2.5 h-2.5 text-emerald-700" />
                <span>Jurisprudência</span>
              </span>
            )}

            {/* Automatic Difficulty Badge if questions were answered */}
            {difAuto && (
              <span 
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${difInfo.badgeClass}`}
                title={`Classificação Automática: ${difInfo.label} (${difInfo.desc})`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${difInfo.dotColor}`} />
                <span>{difInfo.label}</span>
              </span>
            )}

            {/* Evolution Trend Badge */}
            {evolucao.totalBaterias > 1 && evolucao.delta !== null && (
              <button
                type="button"
                onClick={() => onUpdate({ showEvolution: !ponto.showEvolution })}
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  evolucao.trend === 'up'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : evolucao.trend === 'down'
                    ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                }`}
                title={`Evolução histórica: ${evolucao.primeira?.pct}% ➔ ${evolucao.ultima?.pct}% (${evolucao.delta > 0 ? '+' : ''}${evolucao.delta}%)`}
              >
                {evolucao.trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />}
                {evolucao.trend === 'down' && <TrendingDown className="w-2.5 h-2.5 text-rose-600" />}
                {evolucao.trend === 'stable' && <Minus className="w-2.5 h-2.5 text-zinc-500" />}
                <span>{evolucao.delta > 0 ? `+${evolucao.delta}%` : `${evolucao.delta}%`} ({evolucao.totalBaterias}ª bateria)</span>
              </button>
            )}

            {/* Spaced Repetition Indicator Badge */}
            {revisoesEspacadas.length > 0 && (
              <button
                type="button"
                onClick={() => onUpdate({ showSpacedRepetition: !ponto.showSpacedRepetition })}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Régua de repetição espaçada ativa"
              >
                <RotateCcw className="w-2.5 h-2.5 text-indigo-600" />
                <span>
                  {revisoesEspacadas.filter(r => r.concluida).length}/{revisoesEspacadas.length} Revisões
                </span>
              </button>
            )}

            {isHoje && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#831843] text-white">
                HOJE
              </span>
            )}
          </div>

          {/* Title in bold serif */}
          <h3 
            className={`font-serif text-base sm:text-[17px] font-bold text-zinc-900 leading-snug tracking-tight flex items-center flex-wrap gap-1.5 ${
              ponto.lido ? 'line-through text-zinc-400 font-serif' : ''
            }`}
          >
            <span>{ponto.titulo}</span>
            {getPartString() && (
              <span className="inline-flex items-center text-[10px] font-sans font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-sm" title={`Sessão ${getPartString()} da divisão deste assunto`}>
                Sessão {getPartString()}
              </span>
            )}
          </h3>

          {/* Subtitle / Notes / Reference */}
          {(ponto.notas || ponto.artigosLei || ponto.jurisprudenciaRef) && (
            <p className="font-serif italic text-xs sm:text-[13px] text-zinc-500 mt-0.5 leading-relaxed">
              {ponto.artigosLei ? `${ponto.artigosLei} — ` : ''}
              {ponto.jurisprudenciaRef ? `${ponto.jurisprudenciaRef} — ` : ''}
              {ponto.notas}
            </p>
          )}

          {/* Inline Action Links Row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-zinc-500">
            {/* Mudar o dia */}
            {isChangingDate ? (
              <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded">
                <input
                  type="date"
                  value={ponto.data || ''}
                  onChange={(e) => {
                    onUpdate({ data: e.target.value });
                    setIsChangingDate(false);
                  }}
                  className="bg-white border border-zinc-200 rounded px-1 py-0.5 text-xs text-zinc-800"
                />
                <button
                  onClick={() => setIsChangingDate(false)}
                  className="text-zinc-400 hover:text-zinc-600 px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsChangingDate(true)}
                className="hover:text-zinc-800 hover:underline cursor-pointer transition-colors"
              >
                Mudar o dia
              </button>
            )}

            <span>•</span>

            {/* Registrar questões / Questões 30/40 (75% - Fácil) */}
            {isEditingQuestions ? (
              <div className="inline-flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                <span className="text-[11px] font-medium text-zinc-600">Acertos/Total:</span>
                <input
                  type="number"
                  placeholder="Acertos"
                  value={ponto.qAcertos}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                    const newTotal = ponto.qTotal;
                    const newDif = calcularDificuldadeAutomatica({ qAcertos: val, qTotal: newTotal });
                    onUpdate({ qAcertos: val, qFeitas: true, dif: newDif });
                  }}
                  className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-white border border-zinc-200 rounded"
                />
                <span>/</span>
                <input
                  type="number"
                  placeholder="Total"
                  value={ponto.qTotal}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                    const newAcertos = ponto.qAcertos;
                    const newDif = calcularDificuldadeAutomatica({ qAcertos: newAcertos, qTotal: val });
                    onUpdate({ qTotal: val, qFeitas: true, dif: newDif });
                  }}
                  className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-white border border-zinc-200 rounded"
                />
                {pctAcerto !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${difInfo.badgeClass}`}>
                    {difInfo.label} ({pctAcerto}%)
                  </span>
                )}
                <button
                  onClick={() => setIsEditingQuestions(false)}
                  className="px-2 py-0.5 bg-zinc-900 text-white rounded text-[11px] font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  OK
                </button>
              </div>
            ) : hasQuestionsDone ? (
              <button
                onClick={() => setIsEditingQuestions(true)}
                className={`font-semibold hover:underline cursor-pointer flex items-center gap-1.5 text-xs ${difInfo.badgeText}`}
                title={`Classificação: ${difInfo.label} (${difInfo.desc}) — Clique para editar`}
              >
                <span>Questões {ponto.qAcertos || 0}/{ponto.qTotal} ({pctAcerto}% — {difInfo.label})</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingQuestions(true)}
                className="hover:text-zinc-800 hover:underline cursor-pointer transition-colors"
              >
                Registrar questões
              </button>
            )}

            <span>•</span>

            {/* Anotar */}
            <button
              onClick={() => onUpdate({ showNotes: !ponto.showNotes })}
              className={`hover:text-zinc-800 hover:underline cursor-pointer transition-colors ${ponto.showNotes ? 'font-bold text-zinc-900' : ''}`}
            >
              {ponto.showNotes ? 'Fechar anotação' : 'Anotar'}
            </button>

            <span>•</span>

            {/* Checklist */}
            <button
              onClick={() => onUpdate({ showChecklist: !ponto.showChecklist })}
              className={`hover:text-zinc-800 hover:underline cursor-pointer transition-colors ${ponto.showChecklist ? 'font-bold text-zinc-900' : ''}`}
            >
              Checklist {ponto.subTopicos && ponto.subTopicos.length > 0 ? `(${ponto.subTopicos.filter(st => st.concluido).length}/${ponto.subTopicos.length})` : ''}
            </button>

            <span>•</span>

            {/* Evolução de Questões */}
            <button
              type="button"
              onClick={() => onUpdate({ showEvolution: !ponto.showEvolution })}
              className={`hover:text-zinc-800 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1 ${ponto.showEvolution ? 'font-bold text-zinc-900' : ''}`}
              title="Ver histórico cumulativo de questões e evolução"
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Evolução {historicoQuestoes.length > 0 ? `(${historicoQuestoes.length})` : ''}</span>
            </button>

            <span>•</span>

            {/* Régua de Repetição Espaçada */}
            <button
              type="button"
              onClick={() => onUpdate({ showSpacedRepetition: !ponto.showSpacedRepetition })}
              className={`hover:text-zinc-800 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1 ${ponto.showSpacedRepetition ? 'font-bold text-indigo-900' : 'text-indigo-600'}`}
              title="Régua de repetição espaçada (R24h, R7d, R30d, R60d)"
            >
              <RotateCcw className="w-3 h-3 text-indigo-500" />
              <span>Revisão Espaçada {revisoesEspacadas.length > 0 ? `(${revisoesEspacadas.filter(r => r.concluida).length}/${revisoesEspacadas.length})` : ''}</span>
            </button>

            {onSplit && (
              <>
                <span>•</span>
                <button
                  onClick={onSplit}
                  className="hover:text-indigo-800 hover:underline cursor-pointer transition-colors font-semibold text-indigo-600"
                  title="Dividir este assunto em partes e agendar no calendário"
                >
                  Dividir
                </button>
              </>
            )}

            {onStartFocus && (
              <>
                <span>•</span>
                <button
                  onClick={onStartFocus}
                  className="text-amber-600 hover:text-amber-800 font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-amber-600" />
                  <span>Iniciar Foco</span>
                </button>
              </>
            )}
          </div>

          {/* Expanded Notes Section */}
          {ponto.showNotes && (
            <div className="mt-2.5 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Anotações / Resumo
                </span>
                {ponto.notas && (
                  <button
                    onClick={handleCopyNote}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 inline-flex items-center gap-1"
                  >
                    {copiedNote ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedNote ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                )}
              </div>
              <textarea
                value={ponto.notas || ''}
                onChange={(e) => onUpdate({ notas: e.target.value })}
                placeholder="Adicione resumos, artigos importantes ou anotações..."
                rows={2}
                className="w-full text-xs sm:text-sm p-2 bg-zinc-50 border border-zinc-200 rounded font-serif text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all resize-y"
              />
            </div>
          )}

          {/* Expanded Checklist Section */}
          {ponto.showChecklist && (
            <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Checklist de Sub-tópicos
                </span>
                {ponto.subTopicos && ponto.subTopicos.length > 0 && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    {Math.round((ponto.subTopicos.filter(s => s.concluido).length / ponto.subTopicos.length) * 100)}% concluído
                  </span>
                )}
              </div>

              {/* Add Sub-tópico Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('newSubtask') as HTMLInputElement;
                  const title = input.value.trim();
                  if (!title) return;
                  
                  const newSub = {
                    id: Math.random().toString(36).slice(2, 9),
                    titulo: title,
                    concluido: false
                  };
                  const currentList = ponto.subTopicos || [];
                  onUpdate({ subTopicos: [...currentList, newSub] });
                  input.value = '';
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  name="newSubtask"
                  placeholder="Novo sub-tópico (ex: Ler pág. 1-20, Responder 10 questões...)"
                  className="flex-1 text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded font-sans text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-zinc-950 text-white text-xs font-semibold rounded hover:bg-black transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </form>

              {/* Sub-tópicos List */}
              {ponto.subTopicos && ponto.subTopicos.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                  {ponto.subTopicos.map(st => (
                    <div 
                      key={st.id} 
                      className="flex items-center justify-between gap-2 p-1.5 bg-zinc-50/60 hover:bg-zinc-50 border border-zinc-150/50 rounded-md transition-all"
                    >
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={st.concluido}
                          onChange={() => {
                            const updatedList = ponto.subTopicos?.map(item => 
                              item.id === st.id ? { ...item, concluido: !item.concluido } : item
                            ) || [];
                            onUpdate({ subTopicos: updatedList });
                          }}
                          className="w-3.5 h-3.5 rounded-sm border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                        />
                        <span className={`text-xs text-zinc-700 truncate ${st.concluido ? 'line-through text-zinc-400' : ''}`}>
                          {st.titulo}
                        </span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const updatedList = ponto.subTopicos?.filter(item => item.id !== st.id) || [];
                          onUpdate({ subTopicos: updatedList });
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Remover sub-tópico"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-zinc-50/30 border border-dashed border-zinc-200 rounded-md">
                  <p className="text-[11px] text-zinc-400">Nenhum sub-tópico cadastrado. Adicione tarefas para dividir o estudo!</p>
                </div>
              )}
            </div>
          )}

          {/* Expanded Question Evolution Drawer */}
          {ponto.showEvolution && (
            <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-2.5 bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-150/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold text-zinc-800 uppercase tracking-wide">
                    Evolução & Histórico de Questões
                  </span>
                  {evolucao.totalBaterias > 0 && (
                    <span className="text-[10px] font-mono font-semibold bg-zinc-200/80 text-zinc-700 px-1.5 py-0.2 rounded">
                      {evolucao.totalBaterias} {evolucao.totalBaterias === 1 ? 'tentativa' : 'tentativas'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {evolucao.totalBaterias > 1 && evolucao.delta !== null && (
                    <div className="text-[11px] font-mono font-bold flex items-center gap-1">
                      <span className="text-zinc-500 font-sans font-normal text-[10px]">Evolução:</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${
                        evolucao.trend === 'up'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evolucao.trend === 'down'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-zinc-200 text-zinc-800'
                      }`}>
                        {evolucao.delta > 0 ? `+${evolucao.delta}%` : `${evolucao.delta}%`}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsAddingNewBatch(prev => !prev)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-2 py-0.5 rounded hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingNewBatch ? 'Fechar' : 'Nova Bateria'}</span>
                  </button>
                </div>
              </div>

              {/* Evolution Summary Progress Steps */}
              {historicoQuestoes.length > 0 && (
                <div className="bg-white p-2.5 rounded-md border border-zinc-200/70 shadow-3xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>Curva de Retenção:</span>
                    <span className="font-mono font-semibold text-zinc-700">
                      Média: {evolucao.mediaGeral !== null ? `${evolucao.mediaGeral}%` : '—'} ({evolucao.totalAcertos}/{evolucao.totalQuestoes})
                    </span>
                  </div>

                  {/* Horizontal mini timeline of attempts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {historicoQuestoes.map((b, idx) => {
                      const isLatest = idx === historicoQuestoes.length - 1;
                      const difClass = b.pct >= 70 ? 'bg-emerald-500' : b.pct >= 46 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div 
                          key={b.id || idx} 
                          className={`flex-1 min-w-[70px] max-w-[110px] p-1.5 rounded border text-center transition-all ${
                            isLatest ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight truncate">
                            #{idx + 1} {b.tipo || 'Bateria'}
                          </div>
                          <div className="font-mono text-xs font-extrabold text-zinc-900 my-0.5">
                            {b.pct}%
                          </div>
                          {/* Mini visual fill bar */}
                          <div className="w-full bg-zinc-200 rounded-full h-1 overflow-hidden">
                            <div className={`h-full ${difClass}`} style={{ width: `${b.pct}%` }} />
                          </div>
                          <div className="text-[9px] text-zinc-400 font-mono mt-0.5">
                            {b.qAcertos}/{b.qTotal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form to add a new question batch */}
              {isAddingNewBatch && (
                <form 
                  onSubmit={handleSaveNewBatch}
                  className="bg-white p-3 rounded-md border border-emerald-200 shadow-3xs space-y-2 animate-in fade-in duration-150"
                >
                  <div className="text-[11px] font-bold text-zinc-800 flex items-center justify-between">
                    <span>Registrar Nova Bateria de Exercícios</span>
                    <span className="text-[10px] text-zinc-400">Essa tentativa entrará no histórico e atualizará seu aproveitamento</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Acertos:</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex: 16"
                        required
                        value={newBatchAcertos}
                        onChange={(e) => setNewBatchAcertos(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full text-xs font-mono font-bold px-2 py-1 bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Total de Questões:</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 20"
                        required
                        value={newBatchTotal}
                        onChange={(e) => setNewBatchTotal(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full text-xs font-mono font-bold px-2 py-1 bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Data:</label>
                      <input
                        type="date"
                        value={newBatchData}
                        onChange={(e) => setNewBatchData(e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Tipo / Contexto:</label>
                      <input
                        type="text"
                        placeholder="Ex: Revisão R7d, Simulado..."
                        value={newBatchTipo}
                        onChange={(e) => setNewBatchTipo(e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">Anotação rápida desta bateria (opcional):</label>
                    <input
                      type="text"
                      placeholder="Ex: Errei prazo de decadência, revisar art. 205..."
                      value={newBatchNotas}
                      onChange={(e) => setNewBatchNotas(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBatch(false)}
                      className="px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                    >
                      Salvar Tentativa
                    </button>
                  </div>
                </form>
              )}

              {/* History list of attempts */}
              {historicoQuestoes.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                  {historicoQuestoes.map((b, idx) => {
                    const difInfoItem = getDificuldadeInfo(b.dif || calcularDificuldadeAutomatica(b));
                    return (
                      <div 
                        key={b.id || idx}
                        className="flex items-center justify-between gap-2 p-1.5 bg-white border border-zinc-200/80 rounded-md shadow-3xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-zinc-900 font-mono">
                                {b.qAcertos}/{b.qTotal} ({b.pct}%)
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${difInfoItem.badgeClass}`}>
                                {difInfoItem.label}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                • {formatarDataBr(b.data)}
                              </span>
                            </div>
                            {(b.tipo || b.notas) && (
                              <p className="text-[11px] text-zinc-500 truncate">
                                {b.tipo ? <strong className="text-zinc-700">{b.tipo}: </strong> : null}
                                {b.notas}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1 text-zinc-300 hover:text-rose-600 rounded transition-colors cursor-pointer shrink-0"
                          title="Remover esta tentativa do histórico"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-3 bg-white border border-dashed border-zinc-200 rounded-md">
                  <p className="text-[11px] text-zinc-400">Nenhuma bateria registrada ainda. Clique em "Nova Bateria" acima para iniciar!</p>
                </div>
              )}
            </div>
          )}

          {/* Expanded Spaced Repetition Drawer */}
          {ponto.showSpacedRepetition && (
            <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-2.5 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-150/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wide">
                    Régua de Repetição Espaçada
                  </span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded font-semibold">
                    Aparece na aba de Revisões
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleScheduleFullCycle}
                    className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors shadow-3xs cursor-pointer inline-flex items-center gap-1"
                    title="Agendar R24h (+1d), R7d (+7d), R30d (+30d) e R60d (+60d) de uma só vez!"
                  >
                    <CalendarClock className="w-3 h-3 text-indigo-600" />
                    <span>Ciclo Completo (24h/7d/30d/60d)</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 leading-tight">
                As datas agendadas <strong className="text-zinc-700">não poluem seu calendário</strong>, mas entram automaticamente na sua lista prioritária de estudos na aba <strong className="text-indigo-700">Revisões</strong>.
              </p>

              {/* 4 Stages Grid: 24h, 7d, 30d, 60d */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                {(['24h', '7d', '30d', '60d'] as TipoRevisaoEspacada[]).map((tipo) => {
                  const config = REVISOES_ESPACADAS_CONFIG[tipo];
                  const existing = revisoesEspacadas.find(r => r.tipo === tipo);

                  if (existing) {
                    const statusInfo = calcularStatusRevisao(existing);
                    return (
                      <div 
                        key={tipo}
                        className={`p-2 rounded-lg border flex flex-col justify-between transition-all ${
                          existing.concluida 
                            ? 'bg-emerald-50/60 border-emerald-200' 
                            : statusInfo.status === 'hoje'
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                            : statusInfo.status === 'atrasada'
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-white border-indigo-200/80 shadow-3xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-extrabold text-zinc-900 font-mono">
                            {config.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpacedReview(existing.id)}
                            className="text-zinc-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Desagendar esta revisão"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-[10px] text-zinc-500 font-mono mb-1.5">
                          {formatarDataBr(existing.dataPrevista)}
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-auto">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleSpacedReview(tipo)}
                            className={`p-1 rounded text-xs transition-colors cursor-pointer shrink-0 ${
                              existing.concluida
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                            title={existing.concluida ? "Marcar como pendente" : "Marcar como revisado"}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Not scheduled yet
                  const baseDate = ponto.data || hoje;
                  const previewDate = addDays(baseDate, config.dias);
                  return (
                    <div 
                      key={tipo}
                      className="p-2 rounded-lg border border-dashed border-zinc-300 bg-white/70 flex flex-col justify-between hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-zinc-600 font-mono">
                          {config.label}
                        </span>
                        <span className="text-[9px] text-zinc-400">+{config.dias}d</span>
                      </div>

                      <div className="text-[10px] text-zinc-400 font-mono mb-1.5">
                        {formatarDataBr(previewDate)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSpacedReview(tipo)}
                        className="w-full text-center py-1 px-1.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        + Agendar {config.label}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom Date Revision Trigger */}
              <div className="pt-1 flex items-center justify-between text-xs">
                {!isAddingCustomRevision ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomRevision(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agendar em data específica personalizada</span>
                  </button>
                ) : (
                  <form onSubmit={handleAddCustomSpacedReview} className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-indigo-200">
                    <span className="text-[11px] text-zinc-600 font-semibold">Data da revisão:</span>
                    <input
                      type="date"
                      required
                      value={customRevisionDate}
                      onChange={(e) => setCustomRevisionDate(e.target.value)}
                      className="text-xs bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5"
                    />
                    <button
                      type="submit"
                      className="px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Agendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomRevision(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 px-1"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Quick Controls on Hover */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"
              title="Subir na ordem lógica (Pré-requisito)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"
              title="Descer na ordem lógica"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onEdit}
            className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"
            title="Editar detalhes do ponto"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDeleteClick}
            className={`p-1 rounded transition-colors ${
              deleteArmed
                ? 'bg-rose-600 text-white hover:bg-rose-700 text-xs px-1.5 font-bold animate-pulse'
                : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title={deleteArmed ? "Confirmar exclusão" : "Excluir ponto"}
          >
            {deleteArmed ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
