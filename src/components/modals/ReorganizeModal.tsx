import React from 'react';
import { hojeStr, formatarDataBr } from '../../utils/helpers';
import {
  X,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  CalendarDays,
  Sliders,
  Check,
  Info
} from 'lucide-react';
import { useReorganizeModal, ReorganizeModalProps, DIAS_OPTIONS } from './reorganize/useReorganizeModal';
import { RegrasTab } from './reorganize/RegrasTab';
import { PreviewTab } from './reorganize/PreviewTab';
import { PreRequisitosTab } from './reorganize/PreRequisitosTab';
import { PresetSubModals } from './reorganize/PresetSubModals';

export const ReorganizeModal: React.FC<ReorganizeModalProps> = (props) => {
  const r = useReorganizeModal(props);
  const {
    startDate,
    setStartDate,
    scope,
    setScope,
    topicsPerDay,
    setTopicsPerDay,
    studyDaysMode,
    setStudyDaysMode,
    customDays,
    avoidSameSubjectPerDay,
    setAvoidSameSubjectPerDay,
    materiaOrder,
    activeTabSection,
    setActiveTabSection,
    setIsPresetModified,
    feedbackMsg,
    setFeedbackMsg,
    selectedMateriasForReorg,
    setSelectedMateriasForReorg,
    allAvailableMaterias,
    isConcluido,
    pendingPointsCount,
    completedPointsCount,
    targetPoints,
    handleToggleCustomDay,
    orderedPoints,
    weeksSummary,
    endDate,
    handleExecute,
    onClose,
    pontos,
    activeCronograma,
    materiasCores
  } = r;

  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-zinc-900 text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <div>
              <h2 className="font-sans font-bold text-base text-zinc-900 leading-tight">
                Reorganizar Cronograma com Combinação Inteligente
              </h2>
              <p className="text-[11px] text-zinc-500">
                Configure matérias fixas toda semana, intercaladas (semana sim/não) e simule a grade.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Control Bar: Schedule, Scope & Primary Tabs */}
        <div className="px-5 py-3 border-b border-zinc-150 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Cronograma:</span>
            <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
              {activeCronograma ? activeCronograma.nome : 'Todos os tópicos'}
            </span>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center gap-1.5 p-0.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <button
              type="button"
              onClick={() => setScope('pending')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                scope === 'pending'
                  ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/70'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Apenas Pendentes ({pendingPointsCount})
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                scope === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/70'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todos ({pontos.length})
            </button>
          </div>

          {/* Navigation Tabs between Sections */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTabSection('regras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'regras'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Regras & Frequência ({materiaOrder.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabSection('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'preview'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Pré-visualização Semanal ({weeksSummary.length} sem.)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabSection('pre-requisitos')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTabSection === 'pre-requisitos'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordem de Tópicos</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 bg-zinc-50/40">
          {/* SECTION 1: Base Parameters (Date, Pace, Days) */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                1. Parâmetros de Calendário & Ritmo Diário
              </span>
              <span className="text-[11px] text-zinc-500">
                {targetPoints.length} tópicos selecionados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Data de Início *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setStartDate(hojeStr())}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Hoje
                  </button>
                </div>
              </div>

              {/* Topics per day */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Ritmo de Estudo Diário
                </label>
                <select
                  value={topicsPerDay}
                  onChange={(e) => {
                    setTopicsPerDay(Number(e.target.value));
                    setIsPresetModified(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                >
                  <option value={1}>1 tópico por dia (Recomendado)</option>
                  <option value={2}>2 tópicos por dia (Intensivo)</option>
                  <option value={3}>3 tópicos por dia (Reta Final)</option>
                </select>
              </div>

              {/* Study Days Mode */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                  Dias de Estudo na Semana
                </label>
                <select
                  value={studyDaysMode}
                  onChange={(e) => {
                    setStudyDaysMode(e.target.value as any);
                    setIsPresetModified(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 font-medium focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                >
                  <option value="seg-sab">Segunda a Sábado (Folga Domingo)</option>
                  <option value="seg-sex">Segunda a Sexta (Folga Fim de Semana)</option>
                  <option value="todos">Todos os dias (Sem pausas)</option>
                  <option value="custom">Personalizado (Selecionar dias)</option>
                </select>
              </div>
            </div>

            {/* Custom Day Selector if 'custom' is active */}
            {studyDaysMode === 'custom' && (
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-150">
                <span className="text-xs font-medium text-zinc-700">Selecione os dias da semana ativos:</span>
                <div className="flex items-center gap-1">
                  {DIAS_OPTIONS.map(d => {
                    const isSelected = customDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleCustomDay(d.id)}
                        className={`w-9 h-8 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                        }`}
                        title={d.full}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diversification rule */}
            {topicsPerDay > 1 && (
              <label className="flex items-center gap-2 text-xs text-zinc-700 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidSameSubjectPerDay}
                  onChange={(e) => {
                    setAvoidSameSubjectPerDay(e.target.checked);
                    setIsPresetModified(true);
                  }}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <span className="font-medium">
                  Evitar a mesma matéria no mesmo dia (estudar matérias diferentes a cada turno diário)
                </span>
              </label>
            )}

            {/* Subject Selection for Reorganization */}
            <div className="border-t border-zinc-100 pt-3.5 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                    Matérias para Reorganizar
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Selecione quais matérias serão redistribuídas. As desmarcadas não sofrerão nenhuma alteração no calendário.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMateriasForReorg(allAvailableMaterias)}
                    className="px-2 py-1 text-[10px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
                  >
                    Selecionar Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMateriasForReorg([])}
                    className="px-2 py-1 text-[10px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                {allAvailableMaterias.map(materia => {
                  const isSelected = selectedMateriasForReorg.includes(materia);
                  const cor = materiasCores[materia] || '#d97706';
                  const totalCount = pontos.filter(p => p.materia === materia).length;
                  const pendingCount = pontos.filter(p => p.materia === materia && !isConcluido(p)).length;

                  return (
                    <button
                      key={materia}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMateriasForReorg(prev => prev.filter(m => m !== materia));
                        } else {
                          setSelectedMateriasForReorg(prev => [...prev, materia]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-50 border-zinc-300 shadow-2xs hover:bg-zinc-100'
                          : 'bg-zinc-100/50 border-zinc-200 opacity-60 hover:opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by button click
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 shrink-0 cursor-pointer"
                        />
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: cor }} 
                        />
                        <span className="text-xs font-semibold text-zinc-900 truncate">
                          {materia}
                        </span>
                      </div>
                      <div className="text-right shrink-0 pl-2 flex flex-col justify-center">
                        <span className="text-[10px] font-mono text-zinc-500 font-bold">
                          {pendingCount}/{totalCount}
                        </span>
                        {!isSelected && (
                          <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-tight leading-none mt-0.5">
                            Fixa
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback banner */}
          {feedbackMsg && (
            <div className={`p-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
              feedbackMsg.type === 'error' ? 'bg-red-50 text-red-900 border-red-300' :
              'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Info className="w-4 h-4 text-amber-600 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFeedbackMsg(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB CONTENT A: Rules, Combinations & Subject Frequencies */}
          {activeTabSection === 'regras' && <RegrasTab r={r} />}

          {/* TAB CONTENT B: Interactive Weekly Preview */}
          {activeTabSection === 'preview' && <PreviewTab r={r} />}

          {/* TAB CONTENT C: Topics Logical Order & Prerequisites */}
          {activeTabSection === 'pre-requisitos' && <PreRequisitosTab r={r} />}

          {/* Scope note if pending topics */}
          {scope === 'pending' && completedPointsCount > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{completedPointsCount} tópico(s) concluído(s)</strong> serão retirados do calendário e continuarão intactos na <strong>aba Matérias</strong> com todo o progresso e estatísticas preservados.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Previsão: <strong>{formatarDataBr(startDate)}</strong> ➔ <strong>{formatarDataBr(endDate)}</strong></span>
            <span>•</span>
            <span><strong>{orderedPoints.length}</strong> tópicos</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={targetPoints.length === 0 || orderedPoints.length === 0}
              onClick={handleExecute}
              className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Reorganização Inteligente</span>
            </button>
          </div>
        </div>
      </div>

      <PresetSubModals r={r} />
    </div>
  );
};

