import React, { useState, useEffect } from 'react';
import { PontoEstudo } from '../types';
import { StudyPointCard } from './StudyPointCard';
import { 
  getWeekStart, 
  formatarSemanaLabel,
  hojeStr,
  addDays
} from '../utils/helpers';
import { BookOpen, Plus, ChevronDown, ChevronRight } from 'lucide-react';

interface WeeklyListViewProps {
  pontos: PontoEstudo[];
  allPontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  onUpdatePonto: (id: string, updated: Partial<PontoEstudo>) => void;
  onDeletePonto: (id: string) => void;
  onEditPonto: (ponto: PontoEstudo) => void;
  onDuplicatePonto: (ponto: PontoEstudo) => void;
  onNovoPonto: () => void;
}

export const WeeklyListView: React.FC<WeeklyListViewProps> = ({
  pontos,
  allPontos,
  materiasCores,
  onUpdatePonto,
  onDeletePonto,
  onEditPonto,
  onDuplicatePonto,
  onNovoPonto
}) => {
  const hoje = hojeStr();
  const currentWeekStart = getWeekStart(hoje);

  // Group all points by weekStart
  const allWeekStarts: string[] = Array.from(
    new Set<string>(allPontos.filter(p => Boolean(p.data)).map(p => getWeekStart(p.data)))
  ).sort();

  const weekNumberMap: Record<string, number> = {};
  allWeekStarts.forEach((ws: string, idx: number) => {
    weekNumberMap[ws] = idx + 1;
  });

  // Group filtered points by weekStart
  const groupedByWeek: Record<string, PontoEstudo[]> = {};
  pontos.forEach(p => {
    const ws = p.data ? getWeekStart(p.data) : 'sem-data';
    if (!groupedByWeek[ws]) groupedByWeek[ws] = [];
    groupedByWeek[ws].push(p);
  });

  const sortedWeeks = Object.keys(groupedByWeek).sort();

  // Accordion open state: by default, all weeks are open or at least current & first few
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sortedWeeks.forEach((ws, i) => {
      // First 3 weeks open by default
      initial[ws] = i < 4 || ws === currentWeekStart;
    });
    return initial;
  });

  const toggleWeek = (ws: string) => {
    setOpenWeeks(prev => ({
      ...prev,
      [ws]: !prev[ws]
    }));
  };

  // Expose global open/close via custom window event or listeners if needed
  useEffect(() => {
    const handleExpandAll = () => {
      const allOpen: Record<string, boolean> = {};
      sortedWeeks.forEach(ws => { allOpen[ws] = true; });
      setOpenWeeks(allOpen);
    };
    const handleCollapseAll = () => {
      const allClosed: Record<string, boolean> = {};
      sortedWeeks.forEach(ws => { allClosed[ws] = false; });
      setOpenWeeks(allClosed);
    };

    window.addEventListener('expand-all-weeks', handleExpandAll);
    window.addEventListener('collapse-all-weeks', handleCollapseAll);
    return () => {
      window.removeEventListener('expand-all-weeks', handleExpandAll);
      window.removeEventListener('collapse-all-weeks', handleCollapseAll);
    };
  }, [sortedWeeks]);

  if (pontos.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-md p-10 text-center my-4">
        <div className="w-10 h-10 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="font-serif font-bold text-lg text-zinc-900 mb-1">
          Nenhum ponto de estudo encontrado
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto mb-4">
          Ajuste a busca e filtros ou adicione novos tópicos para preencher o cronograma.
        </p>
        <button
          onClick={onNovoPonto}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Criar novo ponto</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedWeeks.map(weekStart => {
        const weekPoints = groupedByWeek[weekStart] || [];
        const isOpen = openWeeks[weekStart] ?? true;
        const weekNum = weekNumberMap[weekStart] || 1;
        const isCurrentWeek = weekStart === currentWeekStart;

        const totalInWeek = weekPoints.length;
        const doneInWeek = weekPoints.filter(p => p.lido).length;
        const pctDone = totalInWeek > 0 ? Math.round((doneInWeek / totalInWeek) * 100) : 0;

        return (
          <div 
            key={weekStart}
            id={`semana-${weekNum}`}
            className="bg-white border border-zinc-200/90 rounded-md overflow-hidden transition-all shadow-2xs"
          >
            {/* Accordion Header */}
            <div 
              onClick={() => toggleWeek(weekStart)}
              className="px-4 py-3 bg-zinc-50/80 hover:bg-zinc-100/80 cursor-pointer flex items-center justify-between gap-3 select-none transition-colors border-b border-zinc-100"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-zinc-500 p-0.5">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-700" /> : <ChevronRight className="w-4 h-4 text-zinc-700" />}
                </span>

                <div className="flex items-center flex-wrap gap-2">
                  <h3 className="font-serif font-bold text-zinc-900 text-base sm:text-[17px] tracking-tight">
                    {weekStart === 'sem-data' ? 'Sem data definida' : `Semana ${weekNum}`}
                  </h3>

                  {weekStart !== 'sem-data' && (
                    <span className="text-xs sm:text-sm text-zinc-500 font-sans">
                      {formatarSemanaLabel(weekStart)}
                    </span>
                  )}

                  {isCurrentWeek && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#831843] text-white uppercase tracking-wider">
                      agora
                    </span>
                  )}
                </div>
              </div>

              {/* Progress on Right: 1/6 + mini progress bar */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs sm:text-sm font-mono font-semibold text-zinc-600">
                  {doneInWeek}/{totalInWeek}
                </span>

                <div className="w-14 sm:w-20 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#15803d] h-full rounded-full transition-all duration-300"
                    style={{ width: `${pctDone}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Accordion Content */}
            {isOpen && (
              <div className="divide-y divide-zinc-100">
                {weekPoints.map(ponto => (
                  <StudyPointCard
                    key={ponto.id}
                    ponto={ponto}
                    materiaCor={materiasCores[ponto.materia] || '#8C1C2C'}
                    onUpdate={(updated) => onUpdatePonto(ponto.id, updated)}
                    onDelete={() => onDeletePonto(ponto.id)}
                    onEdit={() => onEditPonto(ponto)}
                    onDuplicate={() => onDuplicatePonto(ponto)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
