import React, { useState, useEffect } from 'react';
import { PontoEstudo } from '../../types';
import { X, Calendar, Layers, Split } from 'lucide-react';
import { addDays, formatarDataBr } from '../../utils/helpers';

interface SplitPontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ponto: PontoEstudo | null;
  onConfirmSplit: (pontoId: string, parts: Array<{ titulo: string; data: string }>, efeitoCascata: boolean) => void;
}

export const SplitPontoModal: React.FC<SplitPontoModalProps> = ({
  isOpen,
  onClose,
  ponto,
  onConfirmSplit
}) => {
  const [numParts, setNumParts] = useState<number>(2);
  const [parts, setParts] = useState<Array<{ titulo: string; data: string }>>([]);
  const [rippleEffect, setRippleEffect] = useState<boolean>(true);

  useEffect(() => {
    if (ponto && isOpen) {
      const initialParts = [];
      const baseDate = ponto.data || new Date().toISOString().split('T')[0];
      
      for (let i = 1; i <= numParts; i++) {
        // Pre-fill parts: Part 1 gets baseDate, Part 2 gets baseDate + 7 days, Part 3 gets baseDate + 14 days, etc.
        // since the user studies the subject weekly!
        const partDate = i === 1 ? baseDate : addDays(baseDate, 7 * (i - 1));
        
        initialParts.push({
          titulo: `${ponto.titulo}`,
          data: partDate
        });
      }
      setParts(initialParts);
      setRippleEffect(true);
    }
  }, [ponto, numParts, isOpen]);

  if (!isOpen || !ponto) return null;

  const handlePartChange = (index: number, value: string) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], data: value };
    setParts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSplit(ponto.id, parts, rippleEffect);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-zinc-900 leading-none">
                Dividir Assunto em Partes
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Divida um assunto extenso em múltiplos dias de estudo no calendário
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info section */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Tópico original
            </span>
            <div className="font-serif font-bold text-sm text-zinc-800 leading-snug">
              {ponto.titulo}
            </div>
            <div className="text-xs text-zinc-500">
              Matéria: <span className="font-semibold text-zinc-700">{ponto.materia}</span>
            </div>
          </div>

          {/* Number of parts picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              Dividir em quantas partes?
            </label>
            <div className="flex items-center gap-3">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumParts(n)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    numParts === n
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  {n} partes
                </button>
              ))}
            </div>
          </div>

          {/* Parts details header */}
          <div className="pt-2 border-t border-zinc-150">
            <span className="text-xs font-bold text-zinc-800">
              Configurações de cada parte:
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-normal">
              Preenchemos as partes seguintes com intervalos de 7 dias (+1 semana) automaticamente, pois as matérias costumam ser semanais. Você pode ajustar as datas livremente para que apareçam no calendário nos dias que preferir.
            </p>
          </div>

          {/* List of Part Inputs */}
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {parts.map((part, index) => (
              <div 
                key={index}
                className="p-3 bg-zinc-50/50 border border-zinc-150 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-700 block">
                    {index + 1}ª Sessão de Estudo
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Agendada no calendário
                  </span>
                </div>

                <div className="w-40 shrink-0">
                  <input
                    type="date"
                    value={part.data}
                    onChange={(e) => handlePartChange(index, e.target.value)}
                    required
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md focus:outline-hidden focus:border-zinc-900 font-medium"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Ripple Effect Toggle */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-start gap-2.5">
            <input
              type="checkbox"
              id="rippleEffect"
              checked={rippleEffect}
              onChange={(e) => setRippleEffect(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-sm border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="rippleEffect" className="text-xs text-indigo-950 font-medium cursor-pointer select-none">
              <span className="font-bold block">Efeito Cascata Reorganizador</span>
              Adiar automaticamente os próximos tópicos agendados desta matéria para abrir espaço para estas novas sessões.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-150">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Confirmar Divisão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
