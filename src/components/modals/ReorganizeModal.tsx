import React, { useState, useMemo } from 'react';
import { PontoEstudo, Cronograma } from '../../types';
import { hojeStr, formatarDataBr, distributePlannedDates } from '../../utils/helpers';
import { 
  X, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ReorganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pontos: PontoEstudo[]; // Points of the active schedule
  activeCronograma?: Cronograma;
  onApplyReorganize: (newDatesMap: Record<string, string>) => void;
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

  // Filter target points based on scope
  const targetPoints = useMemo(() => {
    if (scope === 'pending') {
      return pontos.filter(p => !(p.lido && p.qFeitas));
    }
    return [...pontos];
  }, [pontos, scope]);

  // Calculate simulated dates in real-time
  const calculatedDates = useMemo(() => {
    if (!startDate || targetPoints.length === 0) return [];
    return distributePlannedDates(targetPoints.length, {
      startDate,
      topicsPerDay,
      studyDaysMode
    });
  }, [startDate, targetPoints.length, topicsPerDay, studyDaysMode]);

  const endDateStr = calculatedDates.length > 0 ? calculatedDates[calculatedDates.length - 1] : '';

  if (!isOpen) return null;

  const handleExecute = () => {
    if (calculatedDates.length !== targetPoints.length) return;

    const datesMap: Record<string, string> = {};
    targetPoints.forEach((p, idx) => {
      datesMap[p.id] = calculatedDates[idx];
    });

    onApplyReorganize(datesMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
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
              Basta definir a nova <strong>Data de Início</strong> e a plataforma distribuirá todos os tópicos em ordem lógica sequencial.
            </p>
          </div>

          {/* 1. Start Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              1. Data de Início dos Estudos *
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setStartDate(hojeStr())}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg transition-colors shrink-0"
              >
                Começar Hoje
              </button>
            </div>
          </div>

          {/* 2. Scope */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              2. O que deseja reorganizar?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                  scope === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-2xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="font-semibold mb-0.5">Todos os tópicos ({pontos.length})</div>
                <div className={`text-[10px] ${scope === 'all' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Recomeçar cronograma completo desde a 1ª aula
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('pending')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                  scope === 'pending'
                    ? 'bg-zinc-900 text-white border-zinc-900 font-medium shadow-2xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="font-semibold mb-0.5">
                  Apenas pendentes ({pontos.filter(p => !(p.lido && p.qFeitas)).length})
                </div>
                <div className={`text-[10px] ${scope === 'pending' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  Manter os já concluídos e redistribuir o restante
                </div>
              </button>
            </div>
          </div>

          {/* 3. Rhythm and Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                3. Tópicos por dia
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

          {/* Real-time Calculation Summary */}
          {targetPoints.length > 0 && calculatedDates.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Simulação da Nova Linha do Tempo</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-emerald-800">
                <div className="bg-white p-2 rounded-md border border-emerald-100">
                  <span className="text-[10px] text-zinc-500 block uppercase">Início</span>
                  <strong className="text-xs text-zinc-900">{formatarDataBr(startDate)}</strong>
                </div>
                <div className="bg-white p-2 rounded-md border border-emerald-100">
                  <span className="text-[10px] text-zinc-500 block uppercase">Término Previsto</span>
                  <strong className="text-xs text-emerald-700">{formatarDataBr(endDateStr)}</strong>
                </div>
              </div>

              {/* Sample first 3 topics */}
              <div className="pt-1">
                <span className="text-[10px] font-semibold uppercase text-emerald-800 block mb-1">
                  Primeiras datas calculadas:
                </span>
                <div className="bg-white rounded-lg border border-emerald-200 divide-y divide-zinc-100 overflow-hidden">
                  {targetPoints.slice(0, 3).map((pt, idx) => (
                    <div key={pt.id} className="p-1.5 px-2.5 flex items-center justify-between text-[11px]">
                      <div className="truncate mr-2 text-zinc-700">
                        <strong className="text-zinc-900 mr-1">[{pt.materia}]</strong>
                        <span>{pt.titulo}</span>
                      </div>
                      <span className="font-mono text-emerald-700 font-bold shrink-0">
                        ➔ {formatarDataBr(calculatedDates[idx])}
                      </span>
                    </div>
                  ))}
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
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={targetPoints.length === 0}
              onClick={handleExecute}
              className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg shadow-2xs transition-colors"
            >
              Reorganizar Cronograma Automaticamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
