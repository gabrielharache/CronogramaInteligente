import React from 'react';
import {
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ReorganizeController } from './useReorganizeModal';

// Tab C: logical topic order and prerequisites
export const PreRequisitosTab: React.FC<{ r: ReorganizeController }> = ({ r }) => {
  const {
    pointsByMateria,
    materiaOrder,
    handleMoveTopicInMateria,
    materiasCores
  } = r;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
      <div className="border-b border-zinc-100 pb-2">
        <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
          Ordem Pedagógica Interna dos Tópicos
        </span>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Os tópicos de cada matéria serão agendados rigorosamente nesta sequência. Suba os pré-requisitos fundamentais para virem antes dos avançados.
        </p>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {materiaOrder.map(materia => {
          const topics = pointsByMateria[materia] || [];
          const cor = materiasCores[materia] || '#d97706';

          return (
            <div key={materia} className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/70">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
                  <span className="text-xs font-bold text-zinc-900">{materia}</span>
                  <span className="text-[11px] text-zinc-500">({topics.length} itens)</span>
                </div>
              </div>

              <div className="space-y-1">
                {topics.map((t, tIdx) => (
                  <div 
                    key={t.id}
                    className="p-1.5 px-2 bg-white border border-zinc-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <span className="truncate text-zinc-800 flex-1 mr-2 text-[11px]">
                      <span className="font-mono text-zinc-400 mr-1.5">#{tIdx + 1}</span>
                      {t.titulo}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={tIdx === 0}
                        onClick={() => handleMoveTopicInMateria(materia, t.id, 'up')}
                        className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={tIdx === topics.length - 1}
                        onClick={() => handleMoveTopicInMateria(materia, t.id, 'down')}
                        className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
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
  );
};
