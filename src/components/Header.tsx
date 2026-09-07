import React, { useState } from 'react';
import { AppState, TabMode, Cronograma, PontoEstudo } from '../types';
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  Download, 
  Upload, 
  CalendarClock,
  Palette,
  Layers,
  ChevronDown,
  Share2,
  Check,
  Calendar,
  Edit3,
  LogOut,
  Cloud,
  CloudCheck,
  User as UserIcon,
  Save,
  RotateCcw,
  Clock,
  Loader2,
  CheckCircle2,
  Menu,
  CalendarDays,
  PanelLeftClose,
  PanelLeft,
  Flame
} from 'lucide-react';
import { formatarDataBr, hojeStr } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  state: AppState;
  activeTab: TabMode;
  onTabChange: (tab: TabMode) => void;
  onExport: () => void;
  onOpenImport: () => void;
  onOpenReorganize?: () => void;
  onOpenSubjectManager?: () => void;
  onOpenCronogramaManager: () => void;
  onSelectCronograma: (id: string) => void;
  onOpenExamDateModal?: () => void;
  onResetToInitial?: () => void;
  onUpdatePonto?: (id: string, updated: Partial<PontoEstudo>) => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
  autoSaveCountdown?: number | null;
  onManualSave?: () => void;
  onDiscardChanges?: () => void;
  onOpenMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  activeTab,
  onTabChange,
  onExport,
  onOpenImport,
  onOpenReorganize,
  onOpenSubjectManager,
  onOpenCronogramaManager,
  onSelectCronograma,
  onOpenExamDateModal,
  onResetToInitial,
  onUpdatePonto,
  isSaving = false,
  hasUnsavedChanges = false,
  lastSavedAt = null,
  autoSaveCountdown = null,
  onManualSave,
  onDiscardChanges,
  onOpenMobileMenu,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { user, signOut, isGuest, isConfigured } = useAuth();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const userInitials = user?.user_metadata?.name 
    ? user.user_metadata.name.slice(0, 2).toUpperCase()
    : user?.email 
      ? user.email.slice(0, 2).toUpperCase() 
      : isGuest ? 'CV' : 'EU';

  // Active cronograma points
  const activeCronogramaPoints = state.activeCronogramaId === 'all'
    ? state.pontos
    : state.pontos.filter(p => p.cronogramaId === state.activeCronogramaId);

  const cronogramas = state.cronogramas || [];
  const activeCronogramaObj = cronogramas.find(c => c.id === state.activeCronogramaId) || cronogramas[0];

  const hoje = hojeStr(); // e.g. "2026-09-02"

  // Find target edital / cronograma date for countdown
  const getExamDateInfo = () => {
    // 1. Check if active cronograma has its own dataProva
    if (activeCronogramaObj?.dataProva) {
      return {
        dateStr: activeCronogramaObj.dataProva,
        source: activeCronogramaObj.nome
      };
    }
    // 2. Check if active cronograma is linked to an edital
    if (activeCronogramaObj?.editalId) {
      const linked = state.editais.find(e => e.id === activeCronogramaObj.editalId);
      if (linked?.dataProva) {
        return {
          dateStr: linked.dataProva,
          source: linked.nome
        };
      }
    }
    // 3. Fallback to earliest upcoming edital or first edital
    const upcomingEdital = state.editais.find(e => e.dataProva && e.dataProva >= hoje) || state.editais[0];
    if (upcomingEdital?.dataProva) {
      return {
        dateStr: upcomingEdital.dataProva,
        source: upcomingEdital.nome
      };
    }
    return {
      dateStr: '2026-11-29',
      source: 'Concurso'
    };
  };

  const examTarget = getExamDateInfo();

  const calculateDaysToExam = () => {
    const examDateStr = examTarget.dateStr;
    const examDate = new Date(examDateStr);
    const currentDate = new Date(hoje);
    const diffTime = examDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      labelDate: examDateStr.length >= 10 ? `${examDateStr.slice(8, 10)}/${examDateStr.slice(5, 7)}` : examDateStr,
      fullDateBr: formatarDataBr(examDateStr),
      source: examTarget.source
    };
  };

  const examInfo = calculateDaysToExam();

  // Find "Hoje" point: either point matching hoje, or first pending point
  const hojePonto = activeCronogramaPoints.find(p => p.data === hoje) || 
                    activeCronogramaPoints.find(p => !p.lido) || 
                    activeCronogramaPoints[2] || 
                    activeCronogramaPoints[0];

  // Portuguese formatted date string: e.g. "Qua, 2 de setembro de 2026"
  const formattedTodayDate = (() => {
    const parts = hoje.split('-');
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const d = new Date(parseInt(year, 10), monthIdx, day);
    const wday = weekDays[d.getDay()];
    return `${wday}, ${day} de ${monthNames[monthIdx]} de ${year}`;
  })();

  const handleToggleHojePoint = () => {
    if (!hojePonto || !onUpdatePonto) return;
    const nextState = !hojePonto.lido;
    onUpdatePonto(hojePonto.id, {
      lido: nextState,
      qFeitas: nextState ? (hojePonto.qFeitas || true) : hojePonto.qFeitas,
      qTotal: nextState && !hojePonto.qTotal ? 40 : hojePonto.qTotal,
      qAcertos: nextState && !hojePonto.qAcertos ? 30 : hojePonto.qAcertos
    });
  };

  const hojeCor = hojePonto ? (state.materiasCores[hojePonto.materia] || '#2E6E8E') : '#2E6E8E';

  return (
    <header className="border-b border-zinc-200/80 bg-[#f7f7f5]">
      {/* Top Navbar */}
      <div className="border-b border-zinc-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Mobile Menu Toggle, Desktop Sidebar Toggle & Current Section Indicator */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Mobile Menu Button */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 md:hidden transition-colors cursor-pointer"
              title="Abrir menu de navegação"
              aria-label="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Sidebar Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 transition-colors cursor-pointer"
              title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral (apenas ícones)"}
              aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}

          {/* Current Section Badge & Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-serif font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
              {activeTab === 'pontos' && <BookOpen className="w-4 h-4 text-zinc-700" />}
              {activeTab === 'organizacao_semanal' && <CalendarDays className="w-4 h-4 text-blue-600" />}
              {activeTab === 'foco' && <Clock className="w-4 h-4 text-amber-600" />}
              {activeTab === 'revisao' && <Flame className="w-4 h-4 text-amber-500" />}
              {activeTab === 'editais' && <FileText className="w-4 h-4 text-emerald-600" />}
              {activeTab === 'desempenho' && <BarChart3 className="w-4 h-4 text-purple-600" />}

              <span>
                {activeTab === 'pontos' && 'Cronograma de Estudos'}
                {activeTab === 'organizacao_semanal' && 'Organização Semanal'}
                {activeTab === 'foco' && 'Modo Foco & Estudo Líquido'}
                {activeTab === 'revisao' && 'Radar de Revisão Ativa'}
                {activeTab === 'editais' && 'Editais & Concursos'}
                {activeTab === 'desempenho' && 'Desempenho & Estatísticas'}
              </span>
            </span>

            <span className="text-zinc-300 hidden sm:inline">•</span>

            <button
              onClick={onOpenCronogramaManager}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100/90 hover:bg-zinc-200/70 text-xs font-semibold text-zinc-700 transition-colors border border-zinc-200/60"
              title="Trocar ou gerenciar cronogramas"
            >
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: activeCronogramaObj?.cor || '#8C1C2C' }} 
              />
              <span className="truncate max-w-[160px]">
                {state.activeCronogramaId === 'all'
                  ? 'Todos os Cronogramas'
                  : (activeCronogramaObj?.nome || 'Cronograma Principal')}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Cloud Sync & Auto/Manual Save Controls */}
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <div 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                title="Salvando dados no Supabase..."
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span className="text-[11px] font-semibold">Salvando...</span>
              </div>
            ) : hasUnsavedChanges ? (
              <div className="inline-flex items-center gap-1 bg-amber-50/90 border border-amber-200/80 p-0.5 rounded-lg shadow-2xs">
                {/* Auto-save status / countdown indicator */}
                <div 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-amber-800"
                  title={autoSaveCountdown !== null ? `Salvamento automático agendado para daqui a ${autoSaveCountdown}s` : 'Alterações pendentes de salvamento'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-medium hidden sm:inline">Pendente</span>
                  {autoSaveCountdown !== null && (
                    <span className="text-[10px] font-mono font-bold bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded">
                      {autoSaveCountdown}s
                    </span>
                  )}
                </div>

                {/* Botão Salvar Agora (Manual) */}
                {onManualSave && (
                  <button
                    type="button"
                    onClick={onManualSave}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                    title="Salvar alterações agora no Supabase (Atalho: Ctrl + S)"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                )}

                {/* Botão Reverter / Descartar Alterações */}
                {onDiscardChanges && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDiscard) {
                        onDiscardChanges();
                        setConfirmDiscard(false);
                      } else {
                        setConfirmDiscard(true);
                        setTimeout(() => setConfirmDiscard(false), 4000);
                      }
                    }}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      confirmDiscard
                        ? 'bg-rose-600 text-white font-bold animate-pulse shadow-sm'
                        : 'text-zinc-600 hover:text-rose-700 hover:bg-rose-100/70'
                    }`}
                    title={confirmDiscard ? 'Clique novamente para confirmar e desfazer as alterações' : 'Reverter para o último estado salvo no Supabase'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{confirmDiscard ? 'Confirmar?' : 'Reverter'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-200/70 px-2 py-1 rounded-md shadow-3xs"
                title={lastSavedAt ? `Sincronizado com Supabase. Último salvamento às ${lastSavedAt.toLocaleTimeString('pt-BR')}` : 'Sincronizado com o Supabase'}
              >
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium hidden sm:inline">
                  {lastSavedAt ? `Salvo às ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Salvo'}
                </span>
                <span className="text-[11px] font-medium sm:hidden">Salvo</span>
              </div>
            )}
          </div>

          {/* Green items: Importar e Exportar - displayed exclusively in the Cronograma section */}
          {activeTab === 'pontos' && (
            <>
              <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenImport}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200/90 hover:bg-zinc-50 px-2.5 py-1 rounded shadow-3xs transition-colors cursor-pointer"
                  title="Importar cronograma de edital ou backup JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Importar</span>
                </button>

                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200/90 hover:bg-zinc-50 px-2.5 py-1 rounded shadow-3xs transition-colors cursor-pointer"
                  title="Exportar backup completo"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Exportar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="max-w-7xl 2xl:max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        
        {/* Unified Layout for Cronograma Tab (Pontos) */}
        {activeTab === 'pontos' && (
          <div className="w-full">
            {hojePonto ? (
              <div className="h-full bg-white border border-zinc-200/95 rounded-xl p-4 sm:p-5 shadow-3xs relative overflow-hidden transition-all hover:border-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Elegant vertical color ribbon */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#831843]" />
                <div className="pl-3 sm:pl-4 flex-1 min-w-0">
                  <div className="text-[10px] sm:text-xs font-bold text-[#831843] uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#831843] animate-pulse" />
                      <span>Hoje — Meta Diária</span>
                    </div>
                    <span className="text-zinc-400 font-mono text-[9px] uppercase bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">
                      {formattedTodayDate}
                    </span>
                  </div>

                  <h2 className="font-serif text-base sm:text-lg md:text-xl font-bold text-zinc-900 leading-snug tracking-tight mt-1.5">
                    {hojePonto.titulo}
                  </h2>

                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span 
                      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-3xs"
                      style={{ backgroundColor: hojeCor }}
                    >
                      {hojePonto.materia}
                    </span>

                    {(hojePonto.artigosLei || hojePonto.notas) && (
                      <span className="font-serif italic text-xs text-zinc-500 truncate max-w-md">
                        {hojePonto.artigosLei || hojePonto.notas}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-3 sm:pl-0 shrink-0">
                  <button
                    onClick={handleToggleHojePoint}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-3xs cursor-pointer ${
                      hojePonto.lido 
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                        : 'bg-zinc-900 hover:bg-zinc-850 text-white'
                    }`}
                  >
                    {hojePonto.lido && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{hojePonto.lido ? 'Estudado ✓' : 'Marcar como estudado'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white border border-zinc-200/95 rounded-xl p-4 sm:p-5 shadow-3xs relative overflow-hidden transition-all hover:border-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-zinc-400" />
                <div className="pl-3 sm:pl-4 flex-1 min-w-0">
                  <div className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Metas de Hoje Concluídas</span>
                    </div>
                    <span className="text-zinc-400 font-mono text-[9px] uppercase bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">
                      {formattedTodayDate}
                    </span>
                  </div>

                  <h2 className="font-serif text-sm sm:text-base font-medium text-zinc-500 leading-snug tracking-tight mt-2 italic">
                    Excelente trabalho! Você concluiu todos os tópicos agendados para hoje.
                  </h2>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Standard Layout for other Tabs */}
        {activeTab !== 'pontos' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
            <div className="space-y-1.5">
              <h1 className="font-serif font-bold text-3xl sm:text-4xl md:text-[2.75rem] text-zinc-900 tracking-tight leading-[1.1]">
                {activeTab === 'organizacao_semanal' && 'Organização Semanal'}
                {activeTab === 'foco' && 'Modo Foco & Estudo Líquido'}
                {activeTab === 'revisao' && 'Radar de Revisão Ativa'}
                {activeTab === 'editais' && 'Editais & Concursos'}
                {activeTab === 'desempenho' && 'Desempenho & Estatísticas'}
              </h1>
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold font-mono">
                {formattedTodayDate}
              </p>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
