import React, { useState } from 'react';
import { COLOR_PALETTE } from '../../data/seed';
import { X, Palette, Plus, Trash2, AlertTriangle, Edit2, Check } from 'lucide-react';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  materias: string[];
  materiasCores: Record<string, string>;
  materiasCounts: Record<string, number>;
  onUpdateCor: (materia: string, cor: string) => void;
  onAddMateria: (nome: string, cor: string) => void;
  onDeleteMateria: (materia: string) => void;
  onRenameMateria: (antigoNome: string, novoNome: string) => void;
}

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
  materias,
  materiasCores,
  materiasCounts,
  onUpdateCor,
  onAddMateria,
  onDeleteMateria,
  onRenameMateria
}) => {
  const [novaMateria, setNovaMateria] = useState('');
  const [novaCor, setNovaCor] = useState(COLOR_PALETTE[0]);
  const [confirmDeleteMateria, setConfirmDeleteMateria] = useState<string | null>(null);
  const [editingMateria, setEditingMateria] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');

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

                if (confirmDeleteMateria === m) {
                  const count = materiasCounts[m] || 0;
                  return (
                    <div 
                      key={m}
                      className="p-2.5 bg-red-50/50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-950">
                            Excluir "{m}"?
                          </p>
                          <p className="text-[10px] text-red-700 mt-0.5 leading-normal">
                            Isso removerá a matéria e {count === 1 ? '1 tópico associado' : `${count} tópicos associados`} permanentemente.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteMateria(null)}
                          className="px-2 py-1 text-[10px] font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteMateria(m);
                            setConfirmDeleteMateria(null);
                          }}
                          className="px-2 py-1 text-[10px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                          Confirmar Exclusão
                        </button>
                      </div>
                    </div>
                  );
                }

                if (editingMateria === m) {
                  return (
                    <form
                      key={m}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = editNome.trim();
                        if (trimmed && trimmed !== m) {
                          onRenameMateria(m, trimmed);
                        }
                        setEditingMateria(null);
                      }}
                      className="p-2 bg-zinc-100 border border-zinc-300 rounded-lg flex items-center justify-between gap-2 animate-in fade-in duration-100"
                    >
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900"
                        autoFocus
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="submit"
                          disabled={!editNome.trim() || (editNome.trim() !== m && materias.includes(editNome.trim()))}
                          className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40"
                          title="Salvar novo nome"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMateria(null)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div 
                    key={m}
                    className="p-2.5 bg-zinc-50/70 border border-zinc-200/70 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: currentColor }} 
                      />
                      <span className="text-xs font-medium text-zinc-800 truncate" title={m}>
                        {m}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Color palette selector for this subject */}
                      <div className="flex items-center gap-1 flex-wrap">
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

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMateria(m);
                          setEditNome(m);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-md transition-colors"
                        title="Renomear matéria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMateria(m)}
                        className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir matéria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
