import React, { useState, useEffect } from 'react';
import { Cronograma, Edital } from '../../types';
import { hojeStr, formatarDataBr, addDays } from '../../utils/helpers';
import { Calendar, Clock, X, Check, FileText, AlertCircle } from 'lucide-react';

interface ExamDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCronograma: Cronograma | undefined;
  editais: Edital[];
  currentDateStr: string;
  onSaveDate: (newDate: string, editalIdToUpdate?: string) => void;
}

export const ExamDateModal: React.FC<ExamDateModalProps> = ({
  isOpen,
  onClose,
  activeCronograma,
  editais,
  currentDateStr,
  onSaveDate
}) => {
  const [dateVal, setDateVal] = useState(currentDateStr || '2026-11-29');
  const [selectedEditalId, setSelectedEditalId] = useState<string>(activeCronograma?.editalId || (editais[0]?.id || ''));
  const hoje = hojeStr();

  useEffect(() => {
    if (isOpen) {
      const initialDate = activeCronograma?.dataProva || 
        (activeCronograma?.editalId ? editais.find(e => e.id === activeCronograma.editalId)?.dataProva : '') ||
        currentDateStr || 
        '2026-11-29';
      setDateVal(initialDate);
      setSelectedEditalId(activeCronograma?.editalId || (editais[0]?.id || ''));
    }
  }, [isOpen, activeCronograma, editais, currentDateStr]);

  if (!isOpen) return null;

  const calculateDays = () => {
    if (!dateVal) return null;
    const examDate = new Date(dateVal);
    const curr = new Date(hoje);
    const diff = examDate.getTime() - curr.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDays();

  const handleApplyPreset = (daysAhead: number) => {
    setDateVal(addDays(hoje, daysAhead));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateVal) return;
    onSaveDate(dateVal, selectedEditalId || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              Personalizar Data da Prova
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Data da Prova do Concurso
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 shadow-2xs font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Esta data será usada no contador de dias restantes e nos prazos do cronograma.
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Atalhos rápidos
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplyPreset(30)}
                className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
              >
                Daqui a 30 dias
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(60)}
                className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
              >
                Daqui a 60 dias
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(90)}
                className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
              >
                Daqui a 90 dias
              </button>
            </div>
          </div>

          {/* Associated Edital selection */}
          {editais.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Atualizar também o edital correspondente:
              </label>
              <select
                value={selectedEditalId}
                onChange={(e) => setSelectedEditalId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer"
              >
                <option value="">Apenas este cronograma</option>
                {editais.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nome} — {e.cargo || 'Geral'} ({e.dataProva ? formatarDataBr(e.dataProva) : 'Sem data'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live countdown preview */}
          {daysLeft !== null && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-600">Tempo restante:</span>
              </div>
              <span className={`text-sm font-bold font-mono ${
                daysLeft < 0 ? 'text-rose-600' : daysLeft <= 15 ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {daysLeft < 0 
                  ? `Prova realizada há ${Math.abs(daysLeft)} dias` 
                  : daysLeft === 0 
                    ? 'A prova é HOJE!' 
                    : `${daysLeft} dias restantes`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
