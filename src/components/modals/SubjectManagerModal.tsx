import React, { useState } from 'react';
import { COLOR_PALETTE } from '../../data/seed';
import { X, Palette, Plus } from 'lucide-react';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  materias: string[];
  materiasCores: Record<string, string>;
  onUpdateCor: (materia: string, cor: string) => void;
  onAddMateria: (nome: string, cor: string) => void;
}

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
  materias,
  materiasCores,
  onUpdateCor,
  onAddMateria
}) => {
  const [novaMateria, setNovaMateria] = useState('');
  const [novaCor, setNovaCor] = useState(COLOR_PALETTE[0]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMateria.trim()) return;
    onAddMateria(novaMateria.trim(), novaCor);
    setNovaMateria('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <Palette className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              Personalizar matérias e cores
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add New Subject inline form */}
          <form onSubmit={handleAdd} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Adicionar nova disciplina / matéria
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaMateria}
                onChange={(e) => setNovaMateria(e.target.value)}
                placeholder="Ex.: Direito Cibernético"
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900"
              />
              <button
                type="submit"
                disabled={!novaMateria.trim()}
                className="px-3.5 py-1.5 bg-zinc-900 disabled:opacity-50 hover:bg-zinc-800 text-white text-xs font-medium rounded-md flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-medium text-zinc-500 mr-1">Cor:</span>
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNovaCor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    novaCor === c ? 'scale-125 ring-2 ring-zinc-900 ring-offset-1' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>

          {/* List of existing subjects with color picker popovers */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Cores das matérias existentes ({materias.length})
            </label>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {materias.map(m => {
                const currentColor = materiasCores[m] || '#18181b';

                return (
                  <div 
                    key={m}
                    className="p-2.5 bg-zinc-50/70 border border-zinc-200/70 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: currentColor }} 
                      />
                      <span className="text-xs font-medium text-zinc-800 truncate">
                        {m}
                      </span>
                    </div>

                    {/* Color palette selector for this subject */}
                    <div className="flex items-center gap-1 flex-wrap shrink-0">
                      {COLOR_PALETTE.slice(0, 8).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onUpdateCor(m, c)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform ${
                            currentColor === c ? 'scale-125 ring-2 ring-zinc-900 ring-offset-1' : 'hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                          title={`Mudar cor para ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
