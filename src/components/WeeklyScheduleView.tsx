import React, { useState, useMemo } from 'react';
import { BlocoHorario, CategoriaHorario, TipoEstudo } from '../types';
import { 
  Briefcase, 
  BookOpen, 
  Smile, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  RotateCcw, 
  Check, 
  Sparkles,
  Calendar,
  X,
  Info,
  Printer,
  Scale,
  Landmark
} from 'lucide-react';
import { uid } from '../utils/helpers';
import { PontoEstudo } from '../types';

interface WeeklyScheduleViewProps {
  gradeSemanal?: BlocoHorario[];
  grade?: BlocoHorario[];
  onUpdateGrade: (novaGrade: BlocoHorario[]) => void;
  materias: string[];
  materiasCores: Record<string, string>;
  pontos?: PontoEstudo[];
}

const DIAS_SEMANA = [
  { id: 1, nome: 'Segunda-feira', abrev: 'Seg' },
  { id: 2, nome: 'Terça-feira', abrev: 'Ter' },
  { id: 3, nome: 'Quarta-feira', abrev: 'Qua' },
  { id: 4, nome: 'Quinta-feira', abrev: 'Qui' },
  { id: 5, nome: 'Sexta-feira', abrev: 'Sex' },
  { id: 6, nome: 'Sábado', abrev: 'Sáb' },
  { id: 0, nome: 'Domingo', abrev: 'Dom' },
];

const CATEGORIAS_CONFIG: Record<CategoriaHorario, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  barColor: string;
  defaultTitle: string;
  bgLight: string;
  border: string;
}> = {
  trabalho: {
    label: 'Trabalho',
    icon: Briefcase,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    barColor: '#D97706', // amber-600
    defaultTitle: 'Expediente de Trabalho',
    bgLight: 'bg-amber-50/80',
    border: 'border-amber-300'
  },
  estudo: {
    label: 'Estudo',
    icon: BookOpen,
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    barColor: '#2563EB', // blue-600
    defaultTitle: 'Sessão de Estudos',
    bgLight: 'bg-blue-50/80',
    border: 'border-blue-300'
  },
  afazeres: {
    label: 'Outros Afazeres',
    icon: Smile,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    barColor: '#059669', // emerald-600
    defaultTitle: 'Atividade Pessoal / Rotina',
    bgLight: 'bg-emerald-50/80',
    border: 'border-emerald-300'
  }
};

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  gradeSemanal: rawGradeSemanal,
  grade: rawGrade,
  onUpdateGrade,
  materias = [],
  materiasCores = {},
  pontos = []
}) => {
  const gradeSemanal = useMemo(() => {
    return Array.isArray(rawGradeSemanal) 
      ? rawGradeSemanal 
      : (Array.isArray(rawGrade) ? rawGrade : []);
  }, [rawGradeSemanal, rawGrade]);
  // Config for hours to display: 24h, starting from 01:00 to 00:00 (represented by hour 0 at the end)
  const [startHour] = useState(1);
  const [endHour] = useState(24); // inclusive

  // Active day filter for mobile / focus
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'todos'>('todos');
  const [layoutMode, setLayoutMode] = useState<'agenda' | 'grade'>('grade');

  // Modal / form state for adding/editing a block
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlocoHorario | null>(null);
  
  // Form fields
  const [formDia, setFormDia] = useState<number>(1);
  const [formHoraInicio, setFormHoraInicio] = useState<number>(8);
  const [formHoraFim, setFormHoraFim] = useState<number>(9);
  const [formCategoria, setFormCategoria] = useState<CategoriaHorario>('estudo');
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formMateria, setFormMateria] = useState<string>('');
  const [formNotas, setFormNotas] = useState<string>('');
  const [formPontoId, setFormPontoId] = useState<string>('');
  const [formTipoEstudo, setFormTipoEstudo] = useState<TipoEstudo | undefined>(undefined);

  // Confirmation for resetting/clearing
  const [confirmClear, setConfirmClear] = useState(false);

  const hoursRange = useMemo(() => {
    const hours: number[] = [];
    for (let h = startHour; h <= endHour; h++) {
      hours.push(h === 24 ? 0 : h);
    }
    return hours;
  }, [startHour, endHour]);

  // Aggregate totals
  const stats = useMemo(() => {
    let horasTrabalho = 0;
    let horasEstudo = 0;
    let horasAfazeres = 0;

    gradeSemanal.forEach(block => {
      const duracao = Math.max(0, block.horaFim - block.horaInicio);
      if (block.categoria === 'trabalho') horasTrabalho += duracao;
      else if (block.categoria === 'estudo') horasEstudo += duracao;
      else if (block.categoria === 'afazeres') horasAfazeres += duracao;
    });

    const totalAlocado = horasTrabalho + horasEstudo + horasAfazeres;
    const totalSemana = 168; // 24 * 7
    const horasLivres = Math.max(0, totalSemana - totalAlocado);

    return {
      trabalho: horasTrabalho,
      estudo: horasEstudo,
      afazeres: horasAfazeres,
      total: totalAlocado,
      livres: horasLivres,
      pctTrabalho: Math.round((horasTrabalho / totalSemana) * 100),
      pctEstudo: Math.round((horasEstudo / totalSemana) * 100),
      pctAfazeres: Math.round((horasAfazeres / totalSemana) * 100),
      pctLivres: Math.max(0, 100 - Math.round((totalAlocado / totalSemana) * 100))
    };
  }, [gradeSemanal]);

  // Open modal to add block at specific day & hour
  const handleOpenAddAt = (dia: number, hora: number) => {
    setEditingBlock(null);
    setFormDia(dia);
    setFormHoraInicio(hora);
    setFormHoraFim(Math.min(24, hora + 1));
    setFormCategoria('estudo');
    setFormTitulo('');
    setFormMateria(materias[0] || '');
    setFormNotas('');
    setFormPontoId('');
    setFormTipoEstudo(undefined);
    setIsModalOpen(true);
  };

  // Open modal to edit existing block
  const handleOpenEdit = (block: BlocoHorario) => {
    setEditingBlock(block);
    setFormDia(block.diaSemana);
    setFormHoraInicio(block.horaInicio);
    setFormHoraFim(block.horaFim);
    setFormCategoria(block.categoria);
    setFormTitulo(block.titulo);
    setFormMateria(block.materia || '');
    setFormNotas(block.notas || '');
    setFormPontoId(block.pontoId || '');
    setFormTipoEstudo(block.tipoEstudo);
    setIsModalOpen(true);
  };

  // Save block (create or update)
  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (formHoraFim <= formHoraInicio) {
      alert('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    const titleToUse = formTitulo.trim() || 
      (formCategoria === 'estudo' && formMateria ? formMateria : CATEGORIAS_CONFIG[formCategoria].defaultTitle);

    if (editingBlock) {
      // Edit existing
      const updatedList = gradeSemanal.map(b => {
        if (b.id === editingBlock.id) {
          return {
            ...b,
            diaSemana: formDia,
            horaInicio: formHoraInicio,
            horaFim: formHoraFim,
            categoria: formCategoria,
            titulo: titleToUse,
            materia: formCategoria === 'estudo' ? formMateria : undefined,
            notas: formNotas.trim() || undefined,
            pontoId: formCategoria === 'estudo' ? (formPontoId || undefined) : undefined,
            tipoEstudo: formCategoria === 'estudo' ? formTipoEstudo : undefined
          };
        }
        return b;
      });
      onUpdateGrade(updatedList);
    } else {
      // Add new
      const newBlock: BlocoHorario = {
        id: uid(),
        diaSemana: formDia,
        horaInicio: formHoraInicio,
        horaFim: formHoraFim,
        categoria: formCategoria,
        titulo: titleToUse,
        materia: formCategoria === 'estudo' ? formMateria : undefined,
        notas: formNotas.trim() || undefined,
        pontoId: formCategoria === 'estudo' ? (formPontoId || undefined) : undefined,
        tipoEstudo: formCategoria === 'estudo' ? formTipoEstudo : undefined
      };
      onUpdateGrade([...gradeSemanal, newBlock]);
    }

    setIsModalOpen(false);
  };

  // Delete block
  const handleDeleteBlock = (id: string) => {
    onUpdateGrade(gradeSemanal.filter(b => b.id !== id));
    if (editingBlock?.id === id) {
      setIsModalOpen(false);
    }
  };

  // Clear all
  const handleClearAll = () => {
    if (confirmClear) {
      onUpdateGrade([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    }
  };

  // Helper to find blocks that overlap with a specific day and hour
  // Returns block if this hour is the START of the block, or if it spans across
  const getBlockForSlot = (dia: number, hour: number) => {
    return gradeSemanal.find(b => b.diaSemana === dia && b.horaInicio <= hour && b.horaFim > hour);
  };

  return (
    <div className="space-y-6 print-full-width">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.8cm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          aside,
          header,
          .no-print,
          button,
          select,
          form,
          .fixed,
          input,
          .no-print-element {
            display: none !important;
          }
          /* Full width layout for print */
          .print-full-width {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 99999 !important;
          }
          /* Standardize print tables */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }
          th, td {
            border: 1px solid #d4d4d8 !important;
            padding: 6px !important;
          }
          /* Ensure backgrounds print correctly in all engines */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
            Organização Semanal
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Planeje sua semana hora a hora e equilibre suas horas de trabalho, estudo e afazeres.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap no-print">
          {/* Segmented Control Selector de Layout */}
          <div className="bg-zinc-100 p-0.5 rounded-lg flex items-center border border-zinc-200 text-xs font-semibold mr-1 shadow-3xs">
            <button
              onClick={() => setLayoutMode('agenda')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                layoutMode === 'agenda'
                  ? 'bg-white text-zinc-900 shadow-3xs font-bold font-sans'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Agenda (Sem rolagem)
            </button>
            <button
              onClick={() => setLayoutMode('grade')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                layoutMode === 'grade'
                  ? 'bg-white text-zinc-900 shadow-3xs font-bold font-sans'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Grade Semanal
            </button>
          </div>

          <button
            onClick={handleClearAll}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              confirmClear 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-white hover:bg-rose-50 text-zinc-500 hover:text-rose-600 border border-zinc-200'
            }`}
            title="Limpar todos os blocos cadastrados"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmClear ? 'Confirmar Limpeza?' : 'Limpar'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-3xs transition-colors cursor-pointer"
            title="Exportar cronograma de organização semanal em PDF no modo paisagem"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Baixar PDF (Paisagem)</span>
          </button>

          <button
            onClick={() => handleOpenAddAt(1, 8)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-3xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Horário</span>
          </button>
        </div>
      </div>

      {/* Counters & Weekly Allocation Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Trabalho */}
        <div className="bg-white border border-amber-200/90 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-amber-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Trabalho</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200">
              <Briefcase className="w-3.5 h-3.5 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-zinc-900">
              {stats.trabalho}h
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / semana
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>{stats.pctTrabalho}% da semana</span>
            <span className="font-semibold text-amber-700">{(stats.trabalho / 7).toFixed(1)}h/dia</span>
          </div>
        </div>

        {/* Card 2: Estudo */}
        <div className="bg-white border border-blue-200/90 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estudo</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-200">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-blue-900">
              {stats.estudo}h
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / semana
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>{stats.pctEstudo}% da semana</span>
            <span className="font-semibold text-blue-700">{(stats.estudo / 7).toFixed(1)}h/dia</span>
          </div>
        </div>

        {/* Card 3: Outros Afazeres */}
        <div className="bg-white border border-emerald-200/90 rounded-xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-emerald-900 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Afazeres / Pessoal</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <Smile className="w-3.5 h-3.5 text-emerald-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-zinc-900">
              {stats.afazeres}h
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / semana
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>{stats.pctAfazeres}% da semana</span>
            <span className="font-semibold text-emerald-700">{(stats.afazeres / 7).toFixed(1)}h/dia</span>
          </div>
        </div>
      </div>

      {/* Visual Proportional Week Balance Bar */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-3xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
          <span>Distribuição Semanal de Tempo (168 Horas)</span>
          <span className="font-mono text-zinc-500 text-[11px]">
            {stats.total}h ocupadas ({100 - stats.pctLivres}%) • {stats.livres}h livres/sono ({stats.pctLivres}%)
          </span>
        </div>

        <div className="w-full h-3.5 bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200/80">
          {stats.trabalho > 0 && (
            <div 
              style={{ width: `${stats.pctTrabalho}%` }}
              className="bg-amber-500 h-full transition-all duration-300" 
              title={`Trabalho: ${stats.trabalho}h (${stats.pctTrabalho}%)`}
            />
          )}
          {stats.estudo > 0 && (
            <div 
              style={{ width: `${stats.pctEstudo}%` }}
              className="bg-blue-600 h-full transition-all duration-300" 
              title={`Estudo: ${stats.estudo}h (${stats.pctEstudo}%)`}
            />
          )}
          {stats.afazeres > 0 && (
            <div 
              style={{ width: `${stats.pctAfazeres}%` }}
              className="bg-emerald-500 h-full transition-all duration-300" 
              title={`Outros Afazeres: ${stats.afazeres}h (${stats.pctAfazeres}%)`}
            />
          )}
          <div 
            style={{ width: `${stats.pctLivres}%` }}
            className="bg-zinc-200/70 h-full transition-all duration-300" 
            title={`Tempo Livre & Sono: ${stats.livres}h (${stats.pctLivres}%)`}
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-600 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Trabalho ({stats.trabalho}h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Estudo ({stats.estudo}h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Afazeres ({stats.afazeres}h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <span>Descanso / Livre ({stats.livres}h)</span>
          </span>
        </div>
      </div>

      {/* Day Selector Tabs for Small Screens or Specific Day Filtering */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar no-print">
        <button
          onClick={() => setSelectedDayTab('todos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            selectedDayTab === 'todos'
              ? 'bg-zinc-900 text-white shadow-2xs'
              : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
          }`}
        >
          Visão Completa (Todos os Dias)
        </button>

        {DIAS_SEMANA.map(d => {
          const blocksOnDay = gradeSemanal.filter(b => b.diaSemana === d.id);
          const totalDayHours = blocksOnDay.reduce((acc, b) => acc + Math.max(0, b.horaFim - b.horaInicio), 0);
          const isSelected = selectedDayTab === d.id;

          return (
            <button
              key={d.id}
              onClick={() => setSelectedDayTab(d.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              <span>{d.abrev}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${
                isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {totalDayHours}h
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic View: Agenda (Cards) vs Grade (Table) */}
      {layoutMode === 'agenda' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {DIAS_SEMANA.filter(d => selectedDayTab === 'todos' || selectedDayTab === d.id).map(d => {
            const blocks = gradeSemanal
              .filter(b => b.diaSemana === d.id)
              .sort((a, b) => a.horaInicio - b.horaInicio);

            const totalStudyH = blocks.filter(b => b.categoria === 'estudo').reduce((acc, b) => acc + (b.horaFim - b.horaInicio), 0);
            const totalWorkH = blocks.filter(b => b.categoria === 'trabalho').reduce((acc, b) => acc + (b.horaFim - b.horaInicio), 0);
            const totalOtherH = blocks.filter(b => b.categoria === 'afazeres').reduce((acc, b) => acc + (b.horaFim - b.horaInicio), 0);
            const totalDayHours = totalStudyH + totalWorkH + totalOtherH;

            return (
              <div 
                key={d.id} 
                className="bg-white border border-zinc-200/95 rounded-xl overflow-hidden shadow-3xs flex flex-col h-full print:border-zinc-300"
              >
                {/* Day Header inside Card */}
                <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-150/80 flex items-center justify-between print:bg-zinc-100">
                  <div>
                    <h3 className="font-serif font-bold text-zinc-900 text-sm sm:text-base">
                      {d.nome}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-zinc-500 font-semibold">
                      {totalWorkH > 0 && <span className="text-amber-700">{totalWorkH}h trab</span>}
                      {totalStudyH > 0 && <span className="text-blue-700">{totalStudyH}h est</span>}
                      {totalOtherH > 0 && <span className="text-emerald-700">{totalOtherH}h afaz</span>}
                      {totalDayHours === 0 && <span className="text-zinc-400">Sem atividades</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAddAt(d.id, 8)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer no-print"
                    title={`Adicionar atividade na ${d.nome}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Blocks List */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {blocks.length > 0 ? (
                    <div className="space-y-3 flex-1">
                      {blocks.map(block => {
                        const duration = block.horaFim - block.horaInicio;
                        const subjectColor = block.materia ? (materiasCores[block.materia] || '#2563EB') : undefined;
                        const linkedPonto = block.pontoId ? pontos.find(p => p.id === block.pontoId) : null;
                        const Icon = CATEGORIAS_CONFIG[block.categoria]?.icon || Clock;

                        return (
                          <div 
                            key={block.id}
                            onClick={() => handleOpenEdit(block)}
                            className={`p-3 rounded-xl border text-zinc-950 transition-all hover:shadow-2xs cursor-pointer relative group/item ${
                              block.categoria === 'trabalho'
                                ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:bg-amber-50/80'
                                : block.categoria === 'estudo'
                                ? 'bg-blue-50/60 border-blue-200 hover:border-blue-300 hover:bg-blue-50/80'
                                : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/80'
                            }`}
                          >
                            {/* Top row: Category Badge & Time Frame */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                                block.categoria === 'trabalho'
                                  ? 'bg-amber-200/50 text-amber-900'
                                  : block.categoria === 'estudo'
                                  ? 'bg-blue-200/50 text-blue-900'
                                  : 'bg-emerald-200/50 text-emerald-900'
                              }`}>
                                <Icon className="w-3 h-3" />
                                <span>
                                  {String(block.horaInicio).padStart(2, '0')}:00 - {String(block.horaFim === 24 ? 0 : block.horaFim).padStart(2, '0')}:00 ({duration}h)
                                </span>
                              </span>

                              {/* Action Buttons: Edit / Delete on right (always visible or hover) */}
                              <div className="flex items-center gap-1 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity no-print">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(block);
                                  }}
                                  className="p-1 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBlock(block.id);
                                  }}
                                  className="p-1 rounded hover:bg-zinc-200/70 text-zinc-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Block Title */}
                            <div className="font-bold text-xs sm:text-sm text-zinc-900 leading-tight">
                              {block.titulo}
                            </div>

                            {/* Subject */}
                            {block.materia && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-blue-900">
                                <span 
                                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: subjectColor }} 
                                />
                                <span className="truncate">{block.materia}</span>
                              </div>
                            )}

                            {/* Tipo de Estudo (Doutrina, Lei Seca, Jurisprudência) */}
                            {block.categoria === 'estudo' && block.tipoEstudo && (
                              <div className="mt-1.5">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  block.tipoEstudo === 'doutrina'
                                    ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                                    : block.tipoEstudo === 'lei_seca'
                                    ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
                                    : 'bg-emerald-100/70 text-emerald-900 border border-emerald-200'
                                }`}>
                                  {block.tipoEstudo === 'doutrina' && <BookOpen className="w-2.5 h-2.5 text-zinc-600" />}
                                  {block.tipoEstudo === 'lei_seca' && <Scale className="w-2.5 h-2.5 text-amber-700" />}
                                  {block.tipoEstudo === 'jurisprudencia' && <Landmark className="w-2.5 h-2.5 text-emerald-700" />}
                                  <span>
                                    {block.tipoEstudo === 'doutrina' ? 'Doutrina' : block.tipoEstudo === 'lei_seca' ? 'Lei Seca' : 'Jurisprudência'}
                                  </span>
                                </span>
                              </div>
                            )}

                            {/* Linked Topic */}
                            {linkedPonto && (
                              <div 
                                className="text-[10px] bg-white/70 border border-blue-200/80 text-blue-900 rounded-md px-2 py-1 mt-1.5 flex items-center gap-1.5 max-w-full shadow-3xs"
                                title={`Tópico: ${linkedPonto.titulo}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="font-semibold truncate">Tópico: {linkedPonto.titulo}</span>
                                {linkedPonto.lido && <span className="text-emerald-600 font-bold ml-auto text-[9px] shrink-0">✓</span>}
                              </div>
                            )}

                            {/* Private Notes */}
                            {block.notas && (
                              <div className="text-[10px] text-zinc-500 font-sans mt-1.5 italic bg-white/60 p-2 rounded border border-zinc-150 leading-relaxed truncate">
                                {block.notas}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[100px] rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center p-4 bg-zinc-50/30">
                      <p className="text-[11px] text-zinc-400 font-medium">Nenhum compromisso para este dia</p>
                    </div>
                  )}

                  {/* Add action button at bottom of day list */}
                  <button
                    onClick={() => handleOpenAddAt(d.id, 8)}
                    className="w-full py-2.5 border border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl text-zinc-400 hover:text-zinc-700 transition-all text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer bg-zinc-50/20 hover:bg-zinc-50/80 no-print"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Atividade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Hour by Hour Schedule Grid */
        <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-3xs">
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full text-left border-collapse min-w-[760px] lg:min-w-0 lg:table-fixed">
              {/* Table Header: Days of the week */}
              <thead>
                <tr className="bg-zinc-50/90 border-b border-zinc-200 text-xs font-bold text-zinc-800">
                  <th className="w-16 sm:w-20 p-3 text-center border-r border-zinc-200 font-mono text-zinc-500">
                    Horário
                  </th>
                  {DIAS_SEMANA.filter(d => selectedDayTab === 'todos' || selectedDayTab === d.id).map(d => {
                    const blocks = gradeSemanal.filter(b => b.diaSemana === d.id);
                    const studyH = blocks.filter(b => b.categoria === 'estudo').reduce((a, b) => a + (b.horaFim - b.horaInicio), 0);
                    const workH = blocks.filter(b => b.categoria === 'trabalho').reduce((a, b) => a + (b.horaFim - b.horaInicio), 0);
                    const otherH = blocks.filter(b => b.categoria === 'afazeres').reduce((a, b) => a + (b.horaFim - b.horaInicio), 0);

                    return (
                      <th key={d.id} className="p-2 sm:p-3 border-r border-zinc-200/80 last:border-r-0 min-w-[90px] sm:min-w-[105px] lg:min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs sm:text-sm font-serif font-bold text-zinc-900 truncate">{d.nome}</span>
                          <button
                            onClick={() => handleOpenAddAt(d.id, 8)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors shrink-0"
                            title={`Adicionar atividade em ${d.nome}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1 font-mono text-[9px] text-zinc-500 font-normal">
                          {workH > 0 && <span className="text-amber-700 font-semibold">{workH}h trab</span>}
                          {studyH > 0 && <span className="text-blue-700 font-semibold">{studyH}h est</span>}
                          {otherH > 0 && <span className="text-emerald-700 font-semibold">{otherH}h afaz</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body: Hour Rows */}
              <tbody className="divide-y divide-zinc-200/70 text-xs">
                {hoursRange.map(hour => {
                  const hourFormatted = `${String(hour).padStart(2, '0')}:00`;

                  return (
                    <tr key={hour} className="hover:bg-zinc-50/40 transition-colors">
                      {/* Hour Column */}
                      <td className="p-2 text-center font-mono text-zinc-400 font-semibold text-[11px] sm:text-xs border-r border-zinc-200 bg-zinc-50/40 select-none">
                        {hourFormatted}
                      </td>

                      {/* Day Cells */}
                      {DIAS_SEMANA.filter(d => selectedDayTab === 'todos' || selectedDayTab === d.id).map(d => {
                        const block = getBlockForSlot(d.id, hour);
                        const isFirstHour = block && block.horaInicio === hour;

                        // If there is a block spanning multiple hours and this is not the first hour, we still render a cell connected visually
                        if (block && !isFirstHour) {
                          return (
                            <td 
                              key={d.id} 
                              onClick={() => handleOpenEdit(block)}
                              className="p-1 border-r border-zinc-200/70 last:border-r-0 cursor-pointer bg-zinc-50/10"
                            >
                              <div className={`h-8 rounded px-1.5 flex items-center justify-between text-[10px] opacity-85 ${
                                block.categoria === 'trabalho'
                                  ? 'bg-amber-100/40 border-x border-amber-300/60 text-amber-900'
                                  : block.categoria === 'estudo'
                                  ? 'bg-blue-100/40 border-x border-blue-300/60 text-blue-900'
                                  : 'bg-emerald-100/40 border-x border-emerald-300/80 text-emerald-900'
                              }`}>
                                <span className="italic font-mono text-[9px] text-zinc-400 truncate">
                                  (até {String(block.horaFim === 24 ? 0 : block.horaFim).padStart(2, '0')}:00)
                                </span>
                              </div>
                            </td>
                          );
                        }

                        if (block && isFirstHour) {
                          const duration = block.horaFim - block.horaInicio;
                          const subjectColor = block.materia ? (materiasCores[block.materia] || '#2563EB') : undefined;
                          const linkedPonto = block.pontoId ? pontos.find(p => p.id === block.pontoId) : null;

                          return (
                            <td 
                              key={d.id} 
                              onClick={() => handleOpenEdit(block)}
                              className="p-1 border-r border-zinc-200/70 last:border-r-0 cursor-pointer transition-all hover:brightness-95"
                            >
                              <div className={`p-1.5 sm:p-2 rounded-lg border shadow-3xs transition-all ${
                                block.categoria === 'trabalho'
                                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 hover:border-amber-400'
                                  : block.categoria === 'estudo'
                                  ? 'bg-blue-50/90 border-blue-300 text-blue-950 hover:border-blue-400'
                                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:border-emerald-400'
                              }`}>
                                <div className="flex items-center justify-between gap-1 mb-0.5 overflow-hidden">
                                  <span className={`inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold font-mono uppercase px-1 py-0.2 rounded shrink-0 whitespace-nowrap truncate max-w-full ${
                                    block.categoria === 'trabalho'
                                      ? 'bg-amber-200/70 text-amber-900'
                                      : block.categoria === 'estudo'
                                      ? 'bg-blue-200/70 text-blue-900'
                                      : 'bg-emerald-200/70 text-emerald-900'
                                  }`}>
                                    {block.categoria === 'trabalho' && <Briefcase className="w-2 h-2" />}
                                    {block.categoria === 'estudo' && <BookOpen className="w-2 h-2" />}
                                    {block.categoria === 'afazeres' && <Smile className="w-2 h-2" />}
                                    <span className="hidden xl:inline">{String(block.horaInicio).padStart(2, '0')}h-{String(block.horaFim === 24 ? 0 : block.horaFim).padStart(2, '0')}h ({duration}h)</span>
                                    <span className="xl:hidden">{String(block.horaInicio).padStart(2, '0')}-{String(block.horaFim === 24 ? 0 : block.horaFim).padStart(2, '0')} ({duration}h)</span>
                                  </span>

                                  {block.materia && (
                                    <span 
                                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: subjectColor }} 
                                      title={block.materia}
                                    />
                                  )}
                                </div>

                                <div className="font-bold text-[11px] sm:text-xs text-zinc-900 leading-tight truncate" title={block.titulo}>
                                  {block.titulo}
                                </div>

                                {block.materia && (
                                  <div className="text-[10px] font-semibold text-blue-800 truncate mt-0.5" title={block.materia}>
                                    {block.materia}
                                  </div>
                                )}

                                {block.categoria === 'estudo' && block.tipoEstudo && (
                                  <span className={`inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-bold uppercase px-1 py-0.2 rounded mt-1 shrink-0 ${
                                    block.tipoEstudo === 'doutrina'
                                      ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                                      : block.tipoEstudo === 'lei_seca'
                                      ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
                                      : 'bg-emerald-100/70 text-emerald-900 border border-emerald-200'
                                  }`}>
                                    {block.tipoEstudo === 'doutrina' && <BookOpen className="w-2 h-2 shrink-0 text-zinc-600" />}
                                    {block.tipoEstudo === 'lei_seca' && <Scale className="w-2 h-2 shrink-0 text-amber-700" />}
                                    {block.tipoEstudo === 'jurisprudencia' && <Landmark className="w-2 h-2 shrink-0 text-emerald-700" />}
                                    <span className="hidden xl:inline">
                                      {block.tipoEstudo === 'doutrina' ? 'Doutrina' : block.tipoEstudo === 'lei_seca' ? 'Lei Seca' : 'Jurisprudência'}
                                    </span>
                                    <span className="xl:hidden">
                                      {block.tipoEstudo === 'doutrina' ? 'Dout' : block.tipoEstudo === 'lei_seca' ? 'Lei' : 'Jur'}
                                    </span>
                                  </span>
                                )}

                                {linkedPonto && (
                                  <div 
                                    className="text-[9px] bg-white/75 border border-blue-200 text-blue-900 rounded px-1.5 py-0.5 mt-1 flex items-center gap-1 max-w-full"
                                    title={`Tópico: ${linkedPonto.titulo}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    <span className="font-semibold truncate">Tópico: {linkedPonto.titulo}</span>
                                    {linkedPonto.lido && <span className="text-emerald-600 font-bold ml-auto text-[9px] shrink-0">✓</span>}
                                  </div>
                                )}

                                {block.notas && (
                                  <div className="text-[10px] text-zinc-500 font-sans truncate mt-0.5" title={block.notas}>
                                    {block.notas}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Empty slot: clicking allows adding a block
                        return (
                          <td 
                            key={d.id}
                            onClick={() => handleOpenAddAt(d.id, hour)}
                            className="p-0.5 sm:p-1 border-r border-zinc-200/60 last:border-r-0 hover:bg-zinc-100/60 transition-colors cursor-pointer group"
                            title={`Clique para adicionar atividade às ${hourFormatted} na ${d.nome}`}
                          >
                            <div className="h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-bold text-zinc-400 inline-flex items-center gap-0.5">
                                <Plus className="w-3 h-3" /> Adicionar
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Adding / Editing a Block */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-6 text-zinc-900 relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${CATEGORIAS_CONFIG[formCategoria].bgLight}`}>
                  <Clock className="w-4 h-4 text-zinc-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-zinc-900 leading-tight">
                    {editingBlock ? 'Editar Horário' : 'Novo Horário na Grade'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Defina categoria, dia da semana e duração da atividade
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4 text-xs">
              {/* Categoria Selector */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1.5">
                  Categoria da Atividade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['trabalho', 'estudo', 'afazeres'] as CategoriaHorario[]).map(cat => {
                    const cfg = CATEGORIAS_CONFIG[cat];
                    const isSelected = formCategoria === cat;
                    const Icon = cfg.icon;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategoria(cat)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.bgLight} ${cfg.border} ring-2 ring-zinc-900 text-zinc-900 font-bold shadow-3xs`
                            : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dia da Semana */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Dia da Semana
                </label>
                <select
                  value={formDia}
                  onChange={(e) => setFormDia(parseInt(e.target.value, 10))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                >
                  {DIAS_SEMANA.map(d => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>

              {/* Horário Início e Término */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Horário de Início
                  </label>
                  <select
                    value={formHoraInicio}
                    onChange={(e) => setFormHoraInicio(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-mono font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0].map((i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">
                    Horário de Término
                  </label>
                  <select
                    value={formHoraFim}
                    onChange={(e) => setFormHoraFim(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-mono font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {Array.from({ length: 25 }).map((_, i) => {
                      if (i <= formHoraInicio) return null;
                      const displayHour = i === 24 ? 0 : i;
                      return <option key={i} value={i}>{String(displayHour).padStart(2, '0')}:00</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Matéria (se for categoria Estudo) */}
              {formCategoria === 'estudo' && (
                <>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">
                      Matéria de Estudo
                    </label>
                    <select
                      value={formMateria}
                      onChange={(e) => {
                        const newMateria = e.target.value;
                        setFormMateria(newMateria);
                        if (!formTitulo || formTitulo === formMateria) {
                          setFormTitulo(newMateria);
                        }
                        // Clear point selection if it belongs to a different subject
                        if (newMateria && formPontoId) {
                          const p = pontos.find(p => p.id === formPontoId);
                          if (p && p.materia !== newMateria) {
                            setFormPontoId('');
                          }
                        }
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    >
                      <option value="">Selecione uma matéria...</option>
                      {materias.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vincular Tópico de Estudo */}
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1 flex items-center gap-1">
                      <span>Vincular Tópico de Estudo</span>
                      <span className="text-[10px] text-zinc-400 font-normal font-sans">(Opcional)</span>
                    </label>
                    <select
                      value={formPontoId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setFormPontoId(selectedId);
                        if (selectedId) {
                          const matched = pontos.find(p => p.id === selectedId);
                          if (matched) {
                            if (!formTitulo || formTitulo === formMateria || formTitulo === CATEGORIAS_CONFIG['estudo'].defaultTitle) {
                              setFormTitulo(matched.titulo);
                            }
                            if (matched.materia && (!formMateria || formMateria !== matched.materia)) {
                              setFormMateria(matched.materia);
                            }
                            if (matched.tipoEstudo) {
                              setFormTipoEstudo(matched.tipoEstudo);
                            }
                          }
                        }
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    >
                      <option value="">Nenhum tópico de estudo vinculado</option>
                      {(formMateria 
                        ? pontos.filter(p => p.materia === formMateria)
                        : pontos
                      ).map(p => (
                        <option key={p.id} value={p.id}>
                          [{p.materia}] {p.titulo} {p.lido ? '✓ (Estudado)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                      Permite acompanhar o tópico do seu cronograma diretamente na grade semanal.
                    </p>
                  </div>

                  {/* Tipo de Estudo (Doutrina, Lei Seca, Jurisprudência) */}
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1.5 flex items-center gap-1">
                      <span>Tipo de Estudo / Classificação</span>
                      <span className="text-[10px] text-zinc-400 font-normal font-sans">(Opcional)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormTipoEstudo(formTipoEstudo === 'doutrina' ? undefined : 'doutrina')}
                        className={`py-2 px-2 rounded-lg border text-center text-[10px] sm:text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          formTipoEstudo === 'doutrina'
                            ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-2xs'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Doutrina</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormTipoEstudo(formTipoEstudo === 'lei_seca' ? undefined : 'lei_seca')}
                        className={`py-2 px-2 rounded-lg border text-center text-[10px] sm:text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          formTipoEstudo === 'lei_seca'
                            ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-2xs'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Lei Seca</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormTipoEstudo(formTipoEstudo === 'jurisprudencia' ? undefined : 'jurisprudencia')}
                        className={`py-2 px-2 rounded-lg border text-center text-[10px] sm:text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          formTipoEstudo === 'jurisprudencia'
                            ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-2xs'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <Landmark className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Jurisprudência</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Título / Descrição */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Título da Atividade
                </label>
                <input
                  type="text"
                  placeholder={CATEGORIAS_CONFIG[formCategoria].defaultTitle}
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none font-medium"
                />
              </div>

              {/* Notas opcionais */}
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Observações / Detalhes (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Leitura de doutrina e 30 questões, ou reunião da equipe"
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                {editingBlock ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(editingBlock.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    Salvar Horário
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
