import React, { useState, useEffect } from 'react';
import { PontoEstudo } from '../../types';
import { Play, X, Clock, Timer, Hourglass } from 'lucide-react';

interface FocusDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ponto: PontoEstudo | null;
  materiaCor?: string;
  onConfirm: (minutes: number, mode: 'pomodoro' | 'cronometro') => void;
}

export const FocusDurationModal: React.FC<FocusDurationModalProps> = ({
  isOpen,
  onClose,
  ponto,
  materiaCor = '#d97706',
  onConfirm
}) => {
  const [minutes, setMinutes] = useState<number>(50);
  const [mode, setMode] = useState<'pomodoro' | 'cronometro'>('pomodoro');

  useEffect(() => {
    if (isOpen) {
      // Default reset on opening
      setMinutes(50);
      setMode('pomodoro');
    }
  }, [isOpen]);

  if (!isOpen || !ponto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minutes <= 0 && mode === 'pomodoro') return;
    onConfirm(minutes, mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-100 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              Iniciar Foco de Estudo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Target Study Point Context */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: materiaCor }}
              />
              <span className="text-xs font-semibold text-zinc-600">
                {ponto.materia}
              </span>
            </div>
            <h4 className="text-sm font-bold text-zinc-900 line-clamp-2">
              {ponto.titulo}
            </h4>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Tipo de Timer / Modo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('pomodoro')}
                className={`p-2.5 text-xs font-semibold border rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  mode === 'pomodoro'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Hourglass className="w-4 h-4" />
                <span>Pomodoro (Regressivo)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('cronometro')}
                className={`p-2.5 text-xs font-semibold border rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  mode === 'cronometro'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>Cronômetro (Livre)</span>
              </button>
            </div>
          </div>

          {/* Duration Selector (Only relevant/visible if mode is pomodoro) */}
          {mode === 'pomodoro' && (
            <div className="space-y-3 animate-in slide-in-from-top-1 duration-150">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Tempo da Sessão
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[25, 50, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMinutes(preset)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        minutes === preset
                          ? 'bg-amber-600 border-amber-600 text-white font-semibold'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {preset} minutos
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tempo Personalizado (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  required
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-amber-500 shadow-2xs font-mono"
                />
              </div>
            </div>
          )}

          {mode === 'cronometro' && (
            <p className="text-xs text-zinc-500 italic bg-amber-50/40 p-2.5 rounded-lg border border-amber-100">
              No modo cronômetro, o tempo contará progressivamente a partir de zero sem limite rígido.
            </p>
          )}

          {/* Action buttons */}
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Iniciar Foco</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
