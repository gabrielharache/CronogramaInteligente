import React, { useState, useMemo, useEffect } from 'react';
import { PontoEstudo, TipoEstudo } from '../types';
import { MESES_PT, hojeStr, shiftMonth, formatarDataBr, calcularPercentualAcerto, calcularDificuldadeAutomatica, getDificuldadeInfo } from '../utils/helpers';
import { 
  ChevronLeft,
  ChevronRight,
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Calendar as CalIcon, 
  Check, 
  BookOpen, 
  Scale, 
  Landmark,
  Maximize2,
  Minimize2,
  CalendarDays,
  Layers,
  Sparkles
} from 'lucide-react';

interface CalendarViewProps {
  pontos: PontoEstudo[];
  allPontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  onSelectPonto: (ponto: PontoEstudo) => void;
  onMovePontoDate: (pontoId: string, newDate: string) => void;
  onNovoPontoNaData: (data: string) => void;
  onUpdatePonto?: (id: string, updated: Partial<PontoEstudo>) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  pontos,
  allPontos,
  materiasCores,
  onSelectPonto,
  onMovePontoDate,
  onNovoPontoNaData,
  onUpdatePonto
}) => {
  const hoje = hojeStr();
  const currentYearMonth = hoje.slice(0, 7);

  // View modes: 'single' (focused month by month) or 'stream' (continuous scroll)
  const [displayMode, setDisplayMode] = useState<'single' | 'stream'>('single');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(false);

  // Drag and drop states
  const [draggedPontoId, setDraggedPontoId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Determine initial list of all months with scheduled points
  const allAvailableMonths = useMemo(() => {
    const dates = allPontos.filter(p => Boolean(p.data)).map(p => p.data.slice(0, 7));
    const unique = Array.from(new Set([...dates, currentYearMonth])).sort();
    
    if (unique.length === 0) {
      return [currentYearMonth, shiftMonth(currentYearMonth, 1), shiftMonth(currentYearMonth, 2)];
    }
    
    // Add one month after the last if not present
    const last = unique[unique.length - 1];
    const nextAfterLast = shiftMonth(last, 1);
    if (!unique.includes(nextAfterLast)) {
      unique.push(nextAfterLast);
    }
    return unique;
  }, [allPontos, currentYearMonth]);

  const [visibleMonths, setVisibleMonths] = useState<string[]>(allAvailableMonths);

  useEffect(() => {
    setVisibleMonths(prev => Array.from(new Set([...prev, ...allAvailableMonths])).sort());
  }, [allAvailableMonths]);

  // Points grouped by date
  const pointsByDate = useMemo(() => {
    const map: Record<string, PontoEstudo[]> = {};
    pontos.forEach(p => {
      if (p.data) {
        if (!map[p.data]) map[p.data] = [];
        map[p.data].push(p);
      }
    });
    return map;
  }, [pontos]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setSelectedMonth(prev => shiftMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => shiftMonth(prev, 1));
  };

  const handlePrependMonth = () => {
    if (visibleMonths.length === 0) return;
    const earliest = visibleMonths[0];
    const prev = shiftMonth(earliest, -1);
    setVisibleMonths([prev, ...visibleMonths]);
  };

  const handleAppendMonth = () => {
    if (visibleMonths.length === 0) return;
    const latest = visibleMonths[visibleMonths.length - 1];
    const next = shiftMonth(latest, 1);
    setVisibleMonths([...visibleMonths, next]);
  };

  const scrollToToday = () => {
    if (displayMode === 'single') {
      setSelectedMonth(currentYearMonth);
    } else {
      if (!visibleMonths.includes(currentYearMonth)) {
        setVisibleMonths(prev => Array.from(new Set([...prev, currentYearMonth])).sort());
      }
      setTimeout(() => {
        const todayEl = document.getElementById(`cal-day-${hoje}`);
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedPontoId(id);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedPontoId;
    if (id && dateStr) {
      onMovePontoDate(id, dateStr);
    }
    setDraggedPontoId(null);
    setDragOverDate(null);
  };

  const weekDays = [
    { label: "Segunda", short: "SEG" },
    { label: "Terça", short: "TER" },
    { label: "Quarta", short: "QUA" },
    { label: "Quinta", short: "QUI" },
    { label: "Sexta", short: "SEX" },
    { label: "Sábado", short: "SÁB" },
    { label: "Domingo", short: "DOM" }
  ];

  const renderTipoBadge = (tipo?: TipoEstudo) => {
    if (tipo === 'lei_seca') {
      return (
        <span 
          className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0" 
          title="Tipo: Lei Seca"
        >
          <Scale className="w-3 h-3" />
        </span>
      );
    }
    if (tipo === 'jurisprudencia') {
      return (
        <span 
          className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0" 
          title="Tipo: Jurisprudência"
        >
          <Landmark className="w-3 h-3" />
        </span>
      );
    }
    return (
      <span 
        className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/80 shrink-0" 
        title="Tipo: Doutrina / Geral"
      >
        <BookOpen className="w-3 h-3 text-zinc-600" />
      </span>
    );
  };

  // Render a specific month block
  const renderMonthBlock = (ym: string) => {
    const [yearStr, monthStr] = ym.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthPoints = pontos.filter(p => p.data && p.data.startsWith(ym));
    const monthTotalPoints = monthPoints.length;
    const monthDonePoints = monthPoints.filter(p => p.lido && p.qFeitas).length;
    const monthPct = monthTotalPoints > 0 ? Math.round((monthDonePoints / monthTotalPoints) * 100) : 0;

    return (
      <div 
        key={ym} 
        id={`cal-month-${ym}`}
        className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4"
      >
        {/* Month Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-2xs">
              {monthStr}
            </div>
            <div>
              <h3 className="font-sans font-bold text-xl sm:text-2xl text-zinc-900 tracking-tight capitalize">
                {MESES_PT[month - 1]} de {year}
              </h3>
              <p className="text-xs text-zinc-500">
                {monthTotalPoints === 0 ? 'Nenhum tópico agendado neste mês' : `${monthTotalPoints} tópicos de estudo programados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {monthTotalPoints > 0 && (
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-zinc-600 font-medium">Progresso do mês:</span>
                <span className="font-bold text-zinc-900">{monthDonePoints}/{monthTotalPoints} ({monthPct}%)</span>
                <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden ml-1">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${monthPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable container with min-width to ensure spacious calendar columns */}
        <div className="overflow-x-auto pb-3 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="min-w-[1100px] w-full">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-3 sm:gap-3.5 mb-3 text-center">
              {weekDays.map((wd, index) => {
                const isWeekend = index >= 5;
                return (
                  <div 
                    key={wd.short} 
                    className={`py-2.5 px-3 rounded-xl font-sans text-xs font-bold border transition-colors ${
                      isWeekend 
                        ? 'bg-zinc-100/80 text-zinc-600 border-zinc-200/70' 
                        : 'bg-zinc-50 text-zinc-800 border-zinc-200/90'
                    }`}
                  >
                    <span className="hidden sm:inline">{wd.label}</span>
                    <span className="sm:hidden">{wd.short}</span>
                  </div>
                );
              })}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-3 sm:gap-3.5">
              {/* Empty days before month start */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${ym}-${i}`}
                  className="min-h-[150px] bg-zinc-50/40 rounded-xl border border-dashed border-zinc-200/60 opacity-30 flex items-center justify-center text-zinc-300 select-none text-xs"
                />
              ))}

              {/* Actual Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayStr = String(dayNum).padStart(2, '0');
                const dateStr = `${year}-${monthStr}-${dayStr}`;
                const isToday = dateStr === hoje;
                const pointsOnThisDay = pointsByDate[dateStr] || [];
                const isDragOver = dragOverDate === dateStr;
                const allDone = pointsOnThisDay.length > 0 && pointsOnThisDay.every(p => p.lido && p.qFeitas);

                return (
                  <div
                    key={dateStr}
                    id={`cal-day-${dateStr}`}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`min-h-[150px] sm:min-h-[175px] p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-all relative group ${
                      isToday
                        ? 'border-zinc-900 ring-2 ring-zinc-900/15 bg-white shadow-xs'
                        : isDragOver
                        ? 'border-zinc-900 bg-zinc-100 ring-2 ring-zinc-400/30'
                        : allDone
                        ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Day Cell Header */}
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold rounded-md px-2.5 py-0.5 flex items-center justify-center transition-colors ${
                          isToday
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : allDone
                            ? 'bg-emerald-100 text-emerald-900 font-bold'
                            : 'text-zinc-800 bg-zinc-100'
                        }`}>
                          {dayNum}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-900 bg-zinc-200/80 px-1.5 py-0.5 rounded">
                            Hoje
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onNovoPontoNaData(dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all cursor-pointer"
                        title={`Adicionar tópico em ${formatarDataBr(dateStr)}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Study Points inside this Day - Fitted naturally without any scrollbar */}
                    <div className="space-y-2 flex-1">
                      {pointsOnThisDay.map(p => {
                        const spineColor = materiasCores[p.materia] || '#8C1C2C';
                        const isDone = p.lido && p.qFeitas;

                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            onClick={() => onSelectPonto(p)}
                            className={`p-2.5 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all shadow-2xs ${
                              isDone
                                ? 'bg-zinc-50/90 border-zinc-200/80 opacity-70'
                                : 'bg-white hover:bg-zinc-50/90 border-zinc-200 hover:border-zinc-300'
                            }`}
                            title="Clique para detalhes ou arraste para reagendar para outro dia"
                          >
                            {/* Subject & Type header */}
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: spineColor }}
                                />
                                <span
                                  className="font-bold text-[11px] uppercase tracking-wide truncate"
                                  style={{ color: spineColor }}
                                >
                                  {p.materia}
                                </span>
                              </div>
                              {renderTipoBadge(p.tipoEstudo)}
                            </div>

                            {/* Full Topic Title */}
                            <div className={`font-medium text-xs text-zinc-900 leading-snug ${
                              isDone ? 'line-through text-zinc-400' : ''
                            }`}>
                              {p.titulo}
                            </div>

                            {/* Quick Status toggles with icon-first compact styling */}
                            <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-zinc-100 text-[10px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUpdatePonto) {
                                      onUpdatePonto(p.id, { lido: !p.lido });
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[10px] transition-colors cursor-pointer ${
                                    p.lido
                                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                  }`}
                                  title="Marcar leitura como feita/pendente"
                                >
                                  <span>{p.lido ? '✓' : '○'}</span>
                                  <span>Leitura</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUpdatePonto) {
                                      onUpdatePonto(p.id, { qFeitas: !p.qFeitas });
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[10px] transition-colors cursor-pointer ${
                                    p.qFeitas
                                      ? 'bg-blue-100 text-blue-800 font-semibold'
                                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                  }`}
                                  title="Marcar questões como feitas/pendentes"
                                >
                                  <span>{p.qFeitas ? '✓' : '○'}</span>
                                  <span>Questões</span>
                                </button>
                              </div>

                              {(() => {
                                const pct = calcularPercentualAcerto(p);
                                const difAuto = calcularDificuldadeAutomatica(p);
                                if (pct === null || !difAuto) return null;
                                const info = getDificuldadeInfo(difAuto);
                                return (
                                  <span 
                                    className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${info.badgeClass}`}
                                    title={`Classificação: ${info.label} (${pct}%) — ${info.desc}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${info.dotColor}`} />
                                    <span>{pct}%</span>
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Daily footer status */}
                    {pointsOnThisDay.length > 0 ? (
                      <div className="text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-100 flex items-center justify-between mt-1">
                        <span>{pointsOnThisDay.length} {pointsOnThisDay.length === 1 ? 'tópico' : 'tópicos'}</span>
                        {allDone && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold text-[10px]">
                            <Check className="w-3 h-3" /> Concluído
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-300 text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clique no + para agendar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${isFullWidth ? 'w-full' : ''}`}>
      {/* Calendar Top Control Sticky Bar */}
      <div className="sticky top-2 z-20 bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: View title & Mode selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-lg bg-zinc-900 text-white shadow-2xs">
            <CalIcon className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-bold text-base sm:text-lg text-zinc-900 leading-tight">
                Visão de Calendário
              </h2>
              <span className="hidden sm:inline-block text-[11px] text-zinc-500 font-normal">
                (Arraste tópicos entre os dias para reagendar)
              </span>
            </div>
            
            {/* Display Mode Tabs: Mês Focado vs Fluxo Contínuo */}
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={() => setDisplayMode('single')}
                className={`text-xs px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                  displayMode === 'single'
                    ? 'bg-zinc-100 text-zinc-900 font-bold border border-zinc-300'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Mês a Mês
              </button>
              <button
                onClick={() => setDisplayMode('stream')}
                className={`text-xs px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                  displayMode === 'stream'
                    ? 'bg-zinc-100 text-zinc-900 font-bold border border-zinc-300'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Fluxo Contínuo
              </button>
            </div>
          </div>
        </div>

        {/* Right Navigation & Quick Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {displayMode === 'single' && (
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white text-zinc-700 hover:text-zinc-900 rounded-md transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Selector Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 px-2 py-1 outline-hidden cursor-pointer"
              >
                {allAvailableMonths.map(ym => {
                  const [y, m] = ym.split('-');
                  const monthName = MESES_PT[parseInt(m, 10) - 1];
                  return (
                    <option key={ym} value={ym}>
                      {monthName} {y}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white text-zinc-700 hover:text-zinc-900 rounded-md transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={scrollToToday}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Ir direto para a data de hoje"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Hoje</span>
          </button>

          {displayMode === 'stream' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrependMonth}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
                title="Carregar mês anterior no topo"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden md:inline">+ Mês anterior</span>
              </button>

              <button
                onClick={handleAppendMonth}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
                title="Carregar próximo mês abaixo"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden md:inline">+ Próximo mês</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors"
            title={isFullWidth ? "Modo padrão" : "Expandir largura total"}
          >
            {isFullWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullWidth ? 'Padrão' : 'Expandir'}</span>
          </button>
        </div>
      </div>

      {/* Render Single Month or Continuous Stream */}
      {displayMode === 'single' ? (
        renderMonthBlock(selectedMonth)
      ) : (
        <div className="space-y-8">
          {/* Button to load previous month at top */}
          <div className="text-center">
            <button
              onClick={handlePrependMonth}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 rounded-full border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Carregar mês anterior ({shiftMonth(visibleMonths[0] || currentYearMonth, -1)})</span>
            </button>
          </div>

          {visibleMonths.map(ym => renderMonthBlock(ym))}

          {/* Button to load more future months at bottom */}
          <div className="text-center pt-2 pb-6">
            <button
              onClick={handleAppendMonth}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 rounded-xl border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Carregar próximo mês ({shiftMonth(visibleMonths[visibleMonths.length - 1] || currentYearMonth, 1)})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
