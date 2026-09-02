import React from 'react';
import { ViewMode, TipoEstudo, Cronograma } from '../types';
import { 
  Search, 
  Plus, 
  X, 
  BookOpen, 
  Scale, 
  Landmark,
  ChevronDown
} from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedMateria: string;
  onMateriaChange: (materia: string) => void;
  materias: string[];
  materiasCores: Record<string, string>;
  materiasCounts: Record<string, number>;
  cronogramas: Cronograma[];
  activeCronogramaId: string;
  onCronogramaChange: (id: string) => void;
  onOpenCronogramaManager: () => void;
  tipoEstudoFilter: TipoEstudo | 'todos';
  onTipoEstudoFilterChange: (tipo: TipoEstudo | 'todos') => void;
  tipoEstudoCounts: {
    todos: number;
    doutrina: number;
    lei_seca: number;
    jurisprudencia: number;
  };
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  diffFilter: string;
  onDiffFilterChange: (val: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (view: ViewMode) => void;
  onNovoPonto: () => void;
  totalFiltrados: number;
  totalGeral: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  selectedMateria,
  onMateriaChange,
  materias,
  materiasCores,
  materiasCounts,
  cronogramas,
  activeCronogramaId,
  onCronogramaChange,
  onOpenCronogramaManager,
  tipoEstudoFilter,
  onTipoEstudoFilterChange,
  tipoEstudoCounts,
  statusFilter,
  onStatusFilterChange,
  diffFilter,
  onDiffFilterChange,
  viewMode,
  onViewModeChange,
  onNovoPonto,
  totalFiltrados,
  totalGeral
}) => {
  return (
    <div className="space-y-4 mb-4">
      {/* 1. View Underline Tabs: Semanas | Matérias | Mês */}
      <div className="flex items-center justify-between border-b border-zinc-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onViewModeChange('semanal')}
            className={`pb-2.5 text-sm font-semibold transition-all relative ${
              viewMode === 'semanal'
                ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Semanas
          </button>

          <button
            onClick={() => onViewModeChange('materias')}
            className={`pb-2.5 text-sm font-semibold transition-all relative ${
              viewMode === 'materias'
                ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Matérias
          </button>

          <button
            onClick={() => onViewModeChange('calendario')}
            className={`pb-2.5 text-sm font-semibold transition-all relative ${
              viewMode === 'calendario'
                ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Mês (Calendário)
          </button>
        </div>

        {/* New Point button on right */}
        <button
          onClick={onNovoPonto}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-black text-white rounded shadow-2xs transition-colors mb-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo ponto</span>
        </button>
      </div>

      {/* 2. Search & Select Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar tópico, lei ou anotação..."
            className="w-full pl-8 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 shadow-2xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Todas as matérias Dropdown */}
          <select
            value={selectedMateria}
            onChange={(e) => onMateriaChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-zinc-200 rounded text-zinc-700 focus:outline-hidden focus:border-zinc-900 shadow-2xs cursor-pointer"
          >
            <option value="todas">Todas as matérias</option>
            {materias.map(m => (
              <option key={m} value={m}>
                {m} ({materiasCounts[m] || 0})
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-zinc-200 rounded text-zinc-700 focus:outline-hidden focus:border-zinc-900 shadow-2xs cursor-pointer"
          >
            <option value="todos">Todos os status</option>
            <option value="pendentes-leitura">Apenas pendentes</option>
            <option value="lidos">Apenas estudados</option>
            <option value="questoes-feitas">Questões registradas</option>
            <option value="100-concluido">100% concluídos</option>
          </select>

          {/* Dificuldade Dropdown */}
          <select
            value={diffFilter}
            onChange={(e) => onDiffFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-zinc-200 rounded text-zinc-700 focus:outline-hidden focus:border-zinc-900 shadow-2xs cursor-pointer"
            title="Classificação automática por acertos: Fácil (≥70%), Médio (46%-69%), Difícil (≤45%)"
          >
            <option value="todas">Todas as dificuldades</option>
            <option value="facil">Fácil (≥ 70% acertos)</option>
            <option value="medio">Médio (46% a 69% acertos)</option>
            <option value="dificil">Difícil (≤ 45% acertos)</option>
            <option value="sem">Sem questões</option>
          </select>

          {/* Total topics counter */}
          <div className="text-xs text-zinc-500 font-sans pl-1">
            <span className="font-semibold text-zinc-800">{totalFiltrados}</span> tópicos
          </div>
        </div>
      </div>

      {/* 3. Tipo de Estudo Filter Chips: Doutrina, Lei Seca, Jurisprudência */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onTipoEstudoFilterChange('todos')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors shrink-0 ${
            tipoEstudoFilter === 'todos'
              ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
              : 'bg-white text-zinc-700 hover:text-zinc-900 border-zinc-200'
          }`}
        >
          <span>Todos</span>
          <span className={`text-[10px] font-mono px-1 rounded ${
            tipoEstudoFilter === 'todos' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {tipoEstudoCounts.todos}
          </span>
        </button>

        <button
          onClick={() => onTipoEstudoFilterChange('doutrina')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors shrink-0 ${
            tipoEstudoFilter === 'doutrina'
              ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
              : 'bg-white text-zinc-700 hover:text-zinc-900 border-zinc-200'
          }`}
        >
          <BookOpen className="w-3 h-3 text-zinc-500" />
          <span>Doutrina</span>
          <span className={`text-[10px] font-mono px-1 rounded ${
            tipoEstudoFilter === 'doutrina' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {tipoEstudoCounts.doutrina}
          </span>
        </button>

        <button
          onClick={() => onTipoEstudoFilterChange('lei_seca')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors shrink-0 ${
            tipoEstudoFilter === 'lei_seca'
              ? 'bg-amber-600 text-white border-amber-600 font-semibold'
              : 'bg-white text-zinc-700 hover:text-zinc-900 border-zinc-200'
          }`}
        >
          <Scale className="w-3 h-3 text-amber-600" />
          <span>Lei Seca</span>
          <span className={`text-[10px] font-mono px-1 rounded ${
            tipoEstudoFilter === 'lei_seca' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'
          }`}>
            {tipoEstudoCounts.lei_seca}
          </span>
        </button>

        <button
          onClick={() => onTipoEstudoFilterChange('jurisprudencia')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors shrink-0 ${
            tipoEstudoFilter === 'jurisprudencia'
              ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
              : 'bg-white text-zinc-700 hover:text-zinc-900 border-zinc-200'
          }`}
        >
          <Landmark className="w-3 h-3 text-emerald-600" />
          <span>Jurisprudência</span>
          <span className={`text-[10px] font-mono px-1 rounded ${
            tipoEstudoFilter === 'jurisprudencia' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
          }`}>
            {tipoEstudoCounts.jurisprudencia}
          </span>
        </button>
      </div>
    </div>
  );
};
