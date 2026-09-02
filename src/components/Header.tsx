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
  User as UserIcon
} from 'lucide-react';
import { formatarDataBr, hojeStr } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  state: AppState;
  activeTab: TabMode;
  onTabChange: (tab: TabMode) => void;
  onExport: () => void;
  onOpenImport: () => void;
  onOpenReorganize: () => void;
  onOpenSubjectManager: () => void;
  onOpenCronogramaManager: () => void;
  onSelectCronograma: (id: string) => void;
  onOpenExamDateModal?: () => void;
  onResetToInitial: () => void;
  onUpdatePonto?: (id: string, updated: Partial<PontoEstudo>) => void;
  isSaving?: boolean;
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
  isSaving = false
}) => {
  const { user, signOut, isGuest, isConfigured } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userInitials = user?.user_metadata?.name 
    ? user.user_metadata.name.slice(0, 2).toUpperCase()
    : user?.email 
      ? user.email.slice(0, 2).toUpperCase() 
      : isGuest ? 'CV' : 'EU';

  // Active cronograma points
  const activeCronogramaPoints = state.activeCronogramaId === 'all'
    ? state.pontos
    : state.pontos.filter(p => p.cronogramaId === state.activeCronogramaId);

  const activeCronogramaObj = state.cronogramas.find(c => c.id === state.activeCronogramaId);

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

  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleResetClick = () => {
    if (confirmReset) {
      onResetToInitial();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  };

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
        {/* Left: Home / Schedule Breadcrumb & Main Tabs */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">📚</span>
            <div className="relative">
              <button
                onClick={onOpenCronogramaManager}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
                title="Trocar ou gerenciar cronogramas"
              >
                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                  {state.activeCronogramaId === 'all'
                    ? 'Todos os Cronogramas'
                    : (activeCronogramaObj?.nome || 'Cronograma Principal')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </button>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-300 hidden sm:block" />

          {/* Main Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-200/60 p-0.5 rounded-lg">
            <button
              onClick={() => onTabChange('pontos')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'pontos'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cronograma</span>
            </button>

            <button
              onClick={() => onTabChange('editais')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'editais'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Editais & Concursos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'editais' ? 'bg-zinc-900 text-white' : 'bg-zinc-300/80 text-zinc-700'
              }`}>
                {state.editais.length}
              </span>
            </button>

            <button
              onClick={() => onTabChange('desempenho')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'desempenho'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Desempenho</span>
            </button>
          </nav>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Cronogramas & Editais Manager Shortcut */}
          <button
            onClick={onOpenCronogramaManager}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
            title="Gerenciar cronogramas e editais vinculados"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Gerenciar</span>
          </button>

          <button
            onClick={onOpenReorganize}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
            title="Reorganizar datas ou empurrar tópicos atrasados"
          >
            <CalendarClock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Reorganizar</span>
          </button>

          <button
            onClick={onOpenSubjectManager}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
            title="Cores e matérias"
          >
            <Palette className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Matérias</span>
          </button>

          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
            title="Importar cronograma de edital em lote"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Importar</span>
          </button>

          <button
            onClick={onExport}
            className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Exportar</span>
          </button>

          <button
            onClick={handleShareClick}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200/90 hover:bg-zinc-50 px-2.5 py-1 rounded shadow-2xs transition-colors"
          >
            <Share2 className="w-3 h-3 text-zinc-500" />
            <span>{copiedShare ? 'Copiado!' : 'Share'}</span>
          </button>

          <button
            onClick={handleResetClick}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              confirmReset ? 'bg-rose-600 text-white font-bold animate-pulse' : 'text-zinc-400 hover:text-zinc-700'
            }`}
            title="Resetar para estado original"
          >
            {confirmReset ? 'Confirmar?' : 'Reset'}
          </button>

          {/* User Profile & Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 focus:outline-none group"
              title={user?.email || (isGuest ? 'Modo Convidado' : 'Meu Perfil')}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shadow-2xs group-hover:ring-2 group-hover:ring-indigo-300 transition-all select-none">
                {userInitials}
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
            </button>

            {/* Dropdown Card */}
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-3 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-zinc-900 truncate">
                        {user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Convidado')}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {user?.email || 'Sessão Local'}
                      </div>
                    </div>
                  </div>

                  {/* Sync status */}
                  <div className="py-2.5 px-2 text-xs flex items-center justify-between text-zinc-600">
                    <span className="text-[11px] font-medium text-zinc-500">Status:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {isConfigured && user ? (
                        <>
                          <Cloud className="w-3 h-3 text-emerald-600" />
                          <span>{isSaving ? 'Salvando...' : 'Nuvem Supabase'}</span>
                        </>
                      ) : (
                        <span>Modo Local / Convidado</span>
                      )}
                    </span>
                  </div>

                  {/* Logout Action */}
                  <div className="pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>{user ? 'Sair da conta' : 'Sair do Modo Convidado'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="max-w-7xl 2xl:max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* Title & Countdown Row */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-5">
          <div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-zinc-900 tracking-tight">
              {activeTab === 'pontos' && 'Cronograma de Estudos'}
              {activeTab === 'editais' && 'Editais & Concursos Cadastrados'}
              {activeTab === 'desempenho' && 'Desempenho & Estatísticas'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-sans mt-1">
              {formattedTodayDate}
            </p>
          </div>

          {/* Interactive Exam Countdown Badge */}
          <div 
            onClick={onOpenExamDateModal}
            className="text-left sm:text-right group cursor-pointer p-2 -m-2 rounded-lg hover:bg-zinc-200/50 transition-colors"
            title="Clique para personalizar a data da prova ou trocar de edital"
          >
            <div className="flex items-center sm:justify-end gap-1.5">
              <span className="font-sans font-bold text-2xl sm:text-3xl text-zinc-900 tracking-tight">
                {examInfo.days < 0 
                  ? `Prova realizada (${Math.abs(examInfo.days)}d atrás)` 
                  : examInfo.days === 0 
                    ? 'Prova HOJE!' 
                    : `${examInfo.days} dias`}
              </span>
              <button 
                type="button"
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-800 transition-opacity"
                title="Editar data da prova"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-zinc-500 font-sans flex items-center sm:justify-end gap-1">
              <span>até a prova {examInfo.labelDate}</span>
              <span className="text-[10px] text-zinc-400 font-medium underline decoration-dotted group-hover:text-zinc-700">
                (personalizar)
              </span>
            </div>
          </div>
        </div>

        {/* Featured "Hoje" Banner (Only shown when activeTab === 'pontos') */}
        {activeTab === 'pontos' && hojePonto && (
          <div className="bg-white border border-zinc-200 border-l-4 border-l-[#831843] rounded-md p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#831843] uppercase tracking-wide mb-1">
                  Hoje — Meta Diária
                </div>

                <h2 className="font-serif text-lg sm:text-2xl font-bold text-zinc-900 leading-snug tracking-tight">
                  {hojePonto.titulo}
                </h2>

                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <span 
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded text-white shadow-2xs"
                    style={{ backgroundColor: hojeCor }}
                  >
                    {hojePonto.materia}
                  </span>

                  {(hojePonto.artigosLei || hojePonto.notas) && (
                    <span className="font-serif italic text-xs sm:text-sm text-zinc-500 truncate max-w-md">
                      {hojePonto.artigosLei || hojePonto.notas}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={handleToggleHojePoint}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer ${
                    hojePonto.lido 
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                      : 'bg-[#18181B] hover:bg-black text-white'
                  }`}
                >
                  {hojePonto.lido && <Check className="w-4 h-4 stroke-[3]" />}
                  <span>{hojePonto.lido ? 'Estudado ✓' : 'Marcar como estudado'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
