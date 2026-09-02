import React from 'react';
import { PontoEstudo, ViewMode } from '../types';

interface SidebarProgressoProps {
  pontos: PontoEstudo[];
  materias: string[];
  materiasCores: Record<string, string>;
  selectedMateria: string;
  onSelectMateria: (materia: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export const SidebarProgresso: React.FC<SidebarProgressoProps> = ({
  pontos,
  materias,
  materiasCores,
  selectedMateria,
  onSelectMateria,
  onViewModeChange
}) => {
  const total = pontos.length;
  const concluidos = pontos.filter(p => p.lido).length;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  // Compute per-subject counts & completed counts
  const subjectStats = materias.map(materia => {
    const subjectPoints = pontos.filter(p => p.materia === materia);
    const subTotal = subjectPoints.length;
    const subDone = subjectPoints.filter(p => p.lido).length;
    return {
      materia,
      total: subTotal,
      done: subDone,
      color: materiasCores[materia] || '#8C1C2C'
    };
  }).filter(s => s.total > 0);

  // SVG Circular Gauge calculations
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentual / 100) * circumference;

  const scrollToCurrentWeek = () => {
    const el = document.querySelector('[id^="semana-"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExpandAll = () => {
    window.dispatchEvent(new CustomEvent('expand-all-weeks'));
  };

  const handleCollapseAll = () => {
    window.dispatchEvent(new CustomEvent('collapse-all-weeks'));
  };

  return (
    <aside className="w-full md:w-60 lg:w-64 shrink-0 space-y-6">
      {/* 1. Progresso Card */}
      <div className="bg-white border border-zinc-200 rounded-md p-4 shadow-2xs">
        <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">
          Progresso
        </h3>

        {/* Circular SVG Gauge */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-[100px] h-[100px] flex items-center justify-center">
            <svg width={size} height={size} className="rotate-[-90deg]">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#E4E4E7"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress stroke */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#15803d"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-sans font-bold text-xl text-zinc-900">
              {percentual}%
            </div>
          </div>

          <div className="text-xs text-zinc-500 font-sans mt-2">
            {concluidos} de {total} tópicos
          </div>
        </div>
      </div>

      {/* 2. Por Matéria List */}
      <div className="bg-white border border-zinc-200 rounded-md p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400">
            Por matéria
          </h3>
          {selectedMateria !== 'todas' && (
            <button
              onClick={() => onSelectMateria('todas')}
              className="text-[11px] text-zinc-900 hover:underline font-semibold"
            >
              Ver todas
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
          {subjectStats.map(({ materia, total: subTotal, done: subDone }) => {
            const isSelected = selectedMateria === materia;
            const subPct = subTotal > 0 ? (subDone / subTotal) * 100 : 0;

            return (
              <button
                key={materia}
                onClick={() => onSelectMateria(isSelected ? 'todas' : materia)}
                className={`w-full text-left p-1.5 rounded transition-all group ${
                  isSelected ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className={`truncate ${isSelected ? 'font-bold text-zinc-900' : 'text-zinc-700'}`}>
                    {materia}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 shrink-0 ml-2">
                    {subDone}/{subTotal}
                  </span>
                </div>

                {/* Slim progress bar */}
                <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-[#15803d] h-full rounded-full transition-all duration-300"
                    style={{ width: `${subPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Navegar Links */}
      <div className="bg-white border border-zinc-200 rounded-md p-4 shadow-2xs">
        <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3 pb-2 border-b border-zinc-100">
          Navegar
        </h3>

        <div className="space-y-2 text-xs">
          <button
            onClick={scrollToCurrentWeek}
            className="w-full text-left text-zinc-600 hover:text-zinc-900 hover:underline py-1 transition-colors block"
          >
            Ir para a semana atual
          </button>

          <button
            onClick={() => onViewModeChange('calendario')}
            className="w-full text-left text-zinc-600 hover:text-zinc-900 hover:underline py-1 transition-colors block"
          >
            Ver o mês atual
          </button>

          <button
            onClick={handleExpandAll}
            className="w-full text-left text-zinc-600 hover:text-zinc-900 hover:underline py-1 transition-colors block"
          >
            Abrir tudo
          </button>

          <button
            onClick={handleCollapseAll}
            className="w-full text-left text-zinc-600 hover:text-zinc-900 hover:underline py-1 transition-colors block"
          >
            Fechar tudo
          </button>
        </div>
      </div>
    </aside>
  );
};
