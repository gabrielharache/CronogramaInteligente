import React, { useState } from 'react';
import { PontoEstudo, Dificuldade, TipoEstudo } from '../types';
import { 
  formatarDataBr, 
  hojeStr, 
  calcularPercentualAcerto,
  calcularDificuldadeAutomatica,
  getDificuldadeInfo,
  addDays
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
  ChevronUp
} from 'lucide-react';

interface StudyPointCardProps {
  ponto: PontoEstudo;
  materiaCor: string;
  onUpdate: (updated: Partial<PontoEstudo>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate?: () => void;
}

export const StudyPointCard: React.FC<StudyPointCardProps> = ({
  ponto,
  materiaCor,
  onUpdate,
  onDelete,
  onEdit,
  onDuplicate
}) => {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  const hoje = hojeStr();
  const isHoje = ponto.data === hoje;
  const isConcluido = ponto.lido && ponto.qFeitas;
  const pctAcerto = calcularPercentualAcerto(ponto);
  const difAuto = calcularDificuldadeAutomatica(ponto);
  const difInfo = getDificuldadeInfo(difAuto);

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

  const dayInfo = getDayInfo(ponto.data);

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
      className={`group relative py-3.5 px-4 sm:px-5 hover:bg-zinc-50/70 transition-colors border-b border-zinc-100 last:border-b-0 ${
        isConcluido ? 'bg-zinc-50/40' : ''
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Left Day Indicator: Seg 31/08 */}
        <div className="w-12 sm:w-14 shrink-0 text-left pt-0.5">
          <div className="text-xs text-zinc-400 font-medium">
            {dayInfo.weekday}
          </div>
          <div className="text-xs sm:text-sm font-mono font-bold text-zinc-800">
            {dayInfo.dayMonth}
          </div>
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

            {isHoje && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#831843] text-white">
                HOJE
              </span>
            )}
          </div>

          {/* Title in bold serif */}
          <h3 
            className={`font-serif text-base sm:text-[17px] font-bold text-zinc-900 leading-snug tracking-tight ${
              ponto.lido ? 'line-through text-zinc-400 font-serif' : ''
            }`}
          >
            {ponto.titulo}
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
              className="hover:text-zinc-800 hover:underline cursor-pointer transition-colors"
            >
              {ponto.showNotes ? 'Fechar anotação' : 'Anotar'}
            </button>
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
        </div>

        {/* Right Quick Controls on Hover */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"
              title="Duplicar para revisão"
            >
              <Layers className="w-3.5 h-3.5" />
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
