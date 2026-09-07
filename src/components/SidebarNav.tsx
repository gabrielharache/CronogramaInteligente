import React, { useState } from 'react';
import { AppState, TabMode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { calcularDificuldadeAutomatica, calcularPercentualAcerto } from '../utils/helpers';
import { 
  BookOpen, 
  Clock, 
  CalendarDays, 
  FileText, 
  BarChart3, 
  Layers, 
  CalendarClock, 
  Palette, 
  Share2,
  RotateCcw,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Calendar,
  PanelLeftClose,
  PanelLeft,
  X,
  Check,
  User as UserIcon,
  Flame
} from 'lucide-react';

interface SidebarNavProps {
  state?: AppState;
  activeTab: TabMode;
  onTabChange: (tab: TabMode) => void;
  onOpenCronogramaManager: () => void;
  onOpenReorganize?: () => void;
  onOpenSubjectManager: () => void;
  onOpenExamDateModal?: () => void;
  onResetToInitial?: () => void;
  isOpenMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isTimerRunning?: boolean;
  timerSecondsElapsed?: number;
  activeTimerMateria?: string;
  editaisCount?: number;
  pontosCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  state,
  activeTab,
  onTabChange,
  onOpenCronogramaManager,
  onOpenReorganize = () => {},
  onOpenSubjectManager,
  onOpenExamDateModal = () => {},
  onResetToInitial,
  isOpenMobile,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse = () => {},
  isTimerRunning = false,
  timerSecondsElapsed = 0,
  activeTimerMateria = '',
  editaisCount,
  pontosCount
}) => {
  const { user, signOut, isGuest } = useAuth();
  const [copiedShare, setCopiedShare] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const cronogramas = state?.cronogramas || [];
  const activeCronogramaId = state?.activeCronogramaId || 'all';
  const activeCronogramaObj = cronogramas.find(c => c.id === activeCronogramaId) || cronogramas[0];
  const editais = state?.editais || [];
  const pontos = state?.pontos || [];
  const sessoesEstudo = state?.sessoesEstudo || [];
  const gradeSemanal = state?.gradeSemanal || [];

  const effectiveMobileOpen = isOpenMobile ?? isMobileOpen ?? false;

  const userInitials = (user?.email || (isGuest ? 'CV' : 'EU')).slice(0, 2).toUpperCase();

  // Share handler
  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Reset handler
  const handleResetClick = () => {
    if (!onResetToInitial) return;
    if (confirmReset) {
      onResetToInitial();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  };

  // Calculate days to exam
  const hoje = new Date().toISOString().slice(0, 10);
  const getExamDateInfo = () => {
    if (activeCronogramaObj?.dataProva) {
      return { dateStr: activeCronogramaObj.dataProva, source: activeCronogramaObj.nome };
    }
    if (activeCronogramaObj?.editalId) {
      const linked = editais.find(e => e.id === activeCronogramaObj.editalId);
      if (linked?.dataProva) return { dateStr: linked.dataProva, source: linked.nome };
    }
    const upcoming = editais.find(e => e.dataProva && e.dataProva >= hoje) || editais[0];
    if (upcoming?.dataProva) return { dateStr: upcoming.dataProva, source: upcoming.nome };
    return { dateStr: '2026-11-29', source: 'Concurso' };
  };

  const examTarget = getExamDateInfo();
  const calculateDays = () => {
    const examDate = new Date(examTarget.dateStr);
    const curr = new Date(hoje);
    const diff = Math.ceil((examDate.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    return {
      days: diff,
      labelDate: examTarget.dateStr.length >= 10 ? `${examTarget.dateStr.slice(8, 10)}/${examTarget.dateStr.slice(5, 7)}` : examTarget.dateStr,
      source: examTarget.source
    };
  };
  const examInfo = calculateDays();

  // Format timer seconds into MM:SS
  const formatTimerClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Total study sessions time
  const totalStudySeconds = sessoesEstudo.reduce((acc, s) => acc + s.duracaoSegundos, 0);
  const totalStudyHoursFormatted = (totalStudySeconds / 3600).toFixed(1);

  // Total weekly allocated hours
  const totalWeeklyHours = gradeSemanal.reduce((acc, b) => acc + Math.max(0, b.horaFim - b.horaInicio), 0);

  // Total points info
  const effectivePontosCount = pontosCount ?? pontos.length;
  const lidosCount = pontos.filter(p => p.lido).length;
  const effectiveEditaisCount = editaisCount ?? editais.length;

  // Calculate points needing revision
  const revisionCount = (pontos || []).filter(p => {
    if (!p.lido) return false;
    const difAuto = calcularDificuldadeAutomatica(p);
    const pct = calcularPercentualAcerto(p);
    return difAuto === 'dificil' || (difAuto === 'medio' && pct !== null);
  }).length;

  // Nav Items configuration
  const navItems = [
    {
      id: 'pontos' as TabMode,
      label: 'Cronograma',
      subtitle: 'Pontos & Ciclo de Estudo',
      icon: BookOpen,
      badge: effectivePontosCount ? `${lidosCount}/${effectivePontosCount}` : undefined,
    },
    {
      id: 'organizacao_semanal' as TabMode,
      label: 'Organização Semanal',
      subtitle: 'Horários hora a hora',
      icon: CalendarDays,
      badge: `${totalWeeklyHours}h`,
    },
    {
      id: 'foco' as TabMode,
      label: 'Modo Foco',
      subtitle: 'Estudo Líquido & Timer',
      icon: Clock,
      badge: isTimerRunning ? formatTimerClock(timerSecondsElapsed) : undefined,
      isLive: isTimerRunning,
    },
    {
      id: 'revisao' as TabMode,
      label: 'Revisões',
      subtitle: 'Radar de Revisão Ativa',
      icon: Flame,
      badge: revisionCount > 0 ? String(revisionCount) : undefined,
    },
    {
      id: 'editais' as TabMode,
      label: 'Editais & Concursos',
      subtitle: 'Concursos vinculados',
      icon: FileText,
      badge: String(effectiveEditaisCount),
    },
    {
      id: 'desempenho' as TabMode,
      label: 'Desempenho',
      subtitle: 'Estatísticas & Horas',
      icon: BarChart3,
      badge: `${totalStudyHoursFormatted}h`,
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white text-zinc-900 border-r border-zinc-200 select-none overflow-y-auto overflow-x-hidden">
      {/* Top Section */}
      <div>
        {/* Brand & Collapse Header */}
        <div className={`p-3 sm:p-3.5 border-b border-zinc-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-3xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-serif font-bold text-sm tracking-tight text-zinc-900 truncate">
                    Estante de Estudos
                  </h1>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 truncate">
                    Painel de Organização
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Button */}
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:flex p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Recolher barra lateral (apenas ícones)"
                  aria-label="Recolher barra lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>

                {/* Mobile close */}
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 md:hidden cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-3xs hover:bg-zinc-800 transition-colors cursor-pointer group"
                title="Expandir barra lateral"
                aria-label="Expandir barra lateral"
              >
                <PanelLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Schedule Selector Pill */}
        <div className="p-2.5 border-b border-zinc-100">
          <button
            onClick={onOpenCronogramaManager}
            className={`w-full flex items-center gap-2 text-left rounded-lg transition-all group cursor-pointer ${
              isCollapsed 
                ? 'justify-center p-2 hover:bg-zinc-100' 
                : 'p-2 bg-zinc-50/90 hover:bg-zinc-100/90 border border-zinc-200/80 hover:border-zinc-300'
            }`}
            title={`Cronograma: ${activeCronogramaObj?.nome || 'Principal'} (Clique para gerenciar)`}
          >
            <div 
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-3xs"
              style={{ backgroundColor: activeCronogramaObj?.cor || '#8C1C2C' }}
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase font-mono font-semibold text-zinc-400 tracking-wider">
                  Cronograma Ativo
                </div>
                <div className="text-xs font-bold text-zinc-800 truncate" style={{ fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                  {activeCronogramaId === 'all'
                    ? 'Todos os Cronogramas'
                    : (activeCronogramaObj?.nome || 'Cronograma Principal')}
                </div>
              </div>
            )}
            {!isCollapsed && (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
            )}
          </button>
        </div>

        {/* Active Timer Live Notification */}
        {isTimerRunning && activeTab !== 'foco' && (
          <div className="p-2 border-b border-zinc-100">
            <button
              onClick={() => onTabChange('foco')}
              className={`w-full flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 hover:bg-amber-100/80 transition-all text-left cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={`Foco ativo: ${formatTimerClock(timerSecondsElapsed)} - Clique para abrir`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Foco em Andamento</span>
                    <span className="font-mono">{formatTimerClock(timerSecondsElapsed)}</span>
                  </div>
                  {activeTimerMateria && (
                    <div className="text-[10px] text-amber-700 truncate">
                      {activeTimerMateria}
                    </div>
                  )}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Primary Navigation Menu */}
        <div className="p-2 space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Navegação Principal
            </div>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 rounded-lg text-left text-xs font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-2xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                } ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}
                title={isCollapsed ? `${item.label} (${item.subtitle})` : undefined}
              >
                <div className="relative shrink-0">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`} />
                  {item.isLive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-white" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="truncate leading-tight">
                      {item.label}
                    </div>
                    <div className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      {item.subtitle}
                    </div>
                  </div>
                )}

                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-500 border border-zinc-200/80'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Ferramentas & Ações (Red items from user request) */}
        <div className="p-2 pt-2 border-t border-zinc-100 space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Ferramentas & Ações
            </div>
          )}

          {/* Gerenciar Cronogramas */}
          <button
            onClick={() => { onOpenCronogramaManager(); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 rounded-lg text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            }`}
            title="Gerenciar múltiplos cronogramas e editais"
          >
            <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
            {!isCollapsed && <span className="truncate">Gerenciar Cronogramas</span>}
          </button>

          {/* Reorganizar Datas */}
          <button
            onClick={() => { onOpenReorganize(); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 rounded-lg text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            }`}
            title="Reorganizar datas ou empurrar matérias atrasadas"
          >
            <CalendarClock className="w-4 h-4 text-zinc-500 shrink-0" />
            {!isCollapsed && <span className="truncate">Reorganizar Datas</span>}
          </button>

          {/* Cores & Matérias */}
          <button
            onClick={() => { onOpenSubjectManager(); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 rounded-lg text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            }`}
            title="Gerenciar matérias e paleta de cores"
          >
            <Palette className="w-4 h-4 text-zinc-500 shrink-0" />
            {!isCollapsed && <span className="truncate">Cores & Matérias</span>}
          </button>

          {/* Compartilhar / Share */}
          <button
            onClick={handleShareClick}
            className={`w-full flex items-center gap-2.5 rounded-lg text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
            }`}
            title={copiedShare ? 'Link copiado!' : 'Copiar link de compartilhamento'}
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Share2 className="w-4 h-4 text-zinc-500 shrink-0" />
            )}
            {!isCollapsed && (
              <span className="truncate">
                {copiedShare ? 'Link Copiado!' : 'Compartilhar'}
              </span>
            )}
          </button>

          {/* Resetar Dados */}
          {onResetToInitial && (
            <button
              onClick={handleResetClick}
              className={`w-full flex items-center gap-2.5 rounded-lg text-left text-xs font-medium transition-colors cursor-pointer ${
                confirmReset 
                  ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' 
                  : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50/60'
              } ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}
              title={confirmReset ? 'Clique novamente para confirmar a restauração' : 'Restaurar cronograma original'}
            >
              <RotateCcw className={`w-4 h-4 shrink-0 ${confirmReset ? 'text-rose-600 animate-spin' : 'text-zinc-400'}`} />
              {!isCollapsed && (
                <span className="truncate">
                  {confirmReset ? 'Confirmar Reset?' : 'Resetar Dados'}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Area: Prova, Perfil do Usuário e Recolher */}
      <div className="p-2.5 border-t border-zinc-100 space-y-2 bg-zinc-50/50">
        {/* Countdown to Exam */}
        {!isCollapsed ? (
          <div
            onClick={onOpenExamDateModal}
            className="p-2.5 rounded-xl bg-white border border-zinc-200/80 hover:border-zinc-300 hover:shadow-2xs transition-all cursor-pointer text-left group"
            title="Clique para alterar a data da prova"
          >
            <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-zinc-500 uppercase font-semibold">
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3 h-3 text-[#831843]" />
                <span className="truncate">{examInfo.source}</span>
              </span>
              <span className="text-[#831843] font-bold">{examInfo.labelDate}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-xs text-zinc-500 font-medium">Dias Restantes:</span>
              <span className="font-mono font-extrabold text-base text-zinc-900">
                {examInfo.days < 0 
                  ? `-${Math.abs(examInfo.days)}d` 
                  : examInfo.days === 0 
                    ? 'Hoje!' 
                    : `${examInfo.days}d`}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenExamDateModal}
            className="w-full flex flex-col items-center justify-center p-2 rounded-lg hover:bg-zinc-100 text-zinc-700 cursor-pointer"
            title={`Prova: ${examInfo.days}d restantes (${examInfo.labelDate}) - ${examInfo.source}`}
          >
            <Calendar className="w-4 h-4 text-[#831843]" />
            <span className="font-mono text-[10px] font-bold mt-0.5">{examInfo.days}d</span>
          </button>
        )}

        {/* User Profile Card (CV) */}
        {!isCollapsed ? (
          <div className="p-2 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div 
                className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shadow-2xs shrink-0"
                title={user?.email || (isGuest ? 'Modo Convidado' : 'Meu Perfil')}
              >
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 truncate">
                  {user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Convidado')}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {user?.email || 'Sessão Local'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await signOut();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title={user ? 'Sair da conta' : 'Sair do Modo Convidado'}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <button
              type="button"
              onClick={async () => {
                await signOut();
              }}
              className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shadow-2xs hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
              title={`${user?.email || 'Convidado'} (Clique para sair)`}
            >
              {userInitials}
            </button>
          </div>
        )}

        {/* Desktop Collapse / Expand Toggle Bar */}
        <div className="hidden md:flex items-center justify-center pt-1 border-t border-zinc-100/80">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
            title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Recolher barra</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:block shrink-0 sticky top-0 h-screen transition-all duration-200 z-20 ${
          isCollapsed ? 'w-[68px]' : 'w-[250px] 2xl:w-[270px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {effectiveMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-[270px] bg-white z-50 md:hidden shadow-2xl transform transition-transform duration-200 ${
          effectiveMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
