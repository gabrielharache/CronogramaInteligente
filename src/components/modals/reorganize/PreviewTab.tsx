import React from 'react';
import { formatarDataBr } from '../../../utils/helpers';
import {
  Shuffle,
  Zap
} from 'lucide-react';
import { ReorganizeController } from './useReorganizeModal';

// Tab B: interactive weekly preview of the calculated schedule
export const PreviewTab: React.FC<{ r: ReorganizeController }> = ({ r }) => {
  const {
    startDate,
    topicsPerDay,
    selectedPreviewWeek,
    setSelectedPreviewWeek,
    previewViewMode,
    setPreviewViewMode,
    targetPoints,
    orderedPoints,
    calculatedDates,
    weeksSummary,
    endDate,
    currentPreviewWeekObj,
    materiasCores
  } = r;

  return (
    <div className="space-y-4">
      {/* Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-zinc-800">
        <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
            Data de Início
          </span>
          <strong className="text-xs text-zinc-900 font-bold">{formatarDataBr(startDate)}</strong>
        </div>

        <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
            Previsão de Fim
          </span>
          <strong className="text-xs text-emerald-700 font-bold">{formatarDataBr(endDate)}</strong>
        </div>

        <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
            Duração Total
          </span>
          <strong className="text-xs text-zinc-900 font-bold">
            {weeksSummary.length} semanas ({targetPoints.length} tópicos)
          </strong>
        </div>

        <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-2xs">
          <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
            Ritmo Médio
          </span>
          <strong className="text-xs text-blue-700 font-bold">
            {topicsPerDay} tópico(s) / dia
          </strong>
        </div>
      </div>

      {/* Weekly Navigator Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Navegar Semanas da Simulação
            </span>
            <span className="text-[11px] text-zinc-400">
              (Clique para ver a rotação)
            </span>
          </div>

          {/* Mode switcher: Week view vs Full list */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
            <button
              type="button"
              onClick={() => setPreviewViewMode('semanal')}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                previewViewMode === 'semanal'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Visão Semanal
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewMode('lista')}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                previewViewMode === 'lista'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Lista Completa
            </button>
          </div>
        </div>

        {/* Week pills pagination */}
        {previewViewMode === 'semanal' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {weeksSummary.map(w => {
              const isSelected = w.semanaNumero === selectedPreviewWeek;
              const isOdd = w.semanaNumero % 2 !== 0;
              return (
                <button
                  key={w.semanaNumero}
                  type="button"
                  onClick={() => setSelectedPreviewWeek(w.semanaNumero)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span>Semana {w.semanaNumero}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                    isSelected ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {isOdd ? 'Ímpar (A)' : 'Par (B)'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Week Visual Detail */}
      {previewViewMode === 'semanal' && currentPreviewWeekObj && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
          {/* Week Header & Combination badges */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900">
                Semana {currentPreviewWeekObj.semanaNumero}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                ({formatarDataBr(currentPreviewWeekObj.dataInicio)} até {formatarDataBr(currentPreviewWeekObj.dataFim)})
              </span>
            </div>

            <span className="text-xs text-zinc-600 font-semibold">
              {currentPreviewWeekObj.totalTopicos} tópicos distribuídos
            </span>
          </div>

          {/* Highlights of combinations in this specific week */}
          <div className="space-y-1.5 p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Composição desta Semana:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {currentPreviewWeekObj.materiasTodaSemana.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-amber-800 font-semibold flex items-center gap-0.5">
                    <Zap className="w-3 h-3 text-amber-600" /> Toda Semana:
                  </span>
                  {currentPreviewWeekObj.materiasTodaSemana.map(m => (
                    <span 
                      key={m}
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-300/80 bg-amber-50 text-amber-900"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {currentPreviewWeekObj.materiasIntercaladas.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-purple-800 font-semibold flex items-center gap-0.5">
                    <Shuffle className="w-3 h-3 text-purple-600" /> Intercaladas nesta semana:
                  </span>
                  {currentPreviewWeekObj.materiasIntercaladas.map(m => (
                    <span 
                      key={m}
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-purple-300/80 bg-purple-50 text-purple-900"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {currentPreviewWeekObj.materiasDuasVezes.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-blue-800 font-semibold flex items-center gap-0.5">
                    ⚡ 2x na semana:
                  </span>
                  {currentPreviewWeekObj.materiasDuasVezes.map(m => (
                    <span 
                      key={m}
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-blue-300/80 bg-blue-50 text-blue-900"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Day by Day Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {currentPreviewWeekObj.dias.map(dayItem => (
              <div 
                key={dayItem.data}
                className="p-3 bg-zinc-50/50 border border-zinc-200 rounded-xl space-y-2 flex flex-col"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-150">
                  <span className="font-bold text-xs text-zinc-900">
                    {dayItem.diaSemanaAbrev}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 font-medium">
                    {formatarDataBr(dayItem.data)}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1">
                  {dayItem.topicos.map(topic => {
                    const cor = materiasCores[topic.materia] || '#d97706';
                    return (
                      <div 
                        key={topic.id}
                        className="p-2 bg-white border border-zinc-200 rounded-lg shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white truncate max-w-[150px]"
                            style={{ backgroundColor: cor }}
                          >
                            {topic.materia}
                          </span>
                          {topic.tipoEstudo && (
                            <span className="text-[9px] uppercase font-bold text-zinc-400">
                              {topic.tipoEstudo === 'lei_seca' ? 'Lei' : topic.tipoEstudo === 'jurisprudencia' ? 'Juris' : 'Doutrina'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-800 font-medium line-clamp-2 leading-tight">
                          {topic.titulo}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full List Mode */}
      {previewViewMode === 'lista' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2 max-h-96 overflow-y-auto">
          <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider pb-1 border-b border-zinc-100">
            Cronograma Completo ({orderedPoints.length} Tópicos)
          </div>
          <div className="divide-y divide-zinc-100">
            {orderedPoints.map((pt, idx) => {
              const cor = materiasCores[pt.materia] || '#d97706';
              return (
                <div key={pt.id} className="py-2 px-1 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 truncate flex-1">
                    <span className="font-mono text-[10px] text-zinc-400 w-8">#{idx + 1}</span>
                    <span 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                      style={{ backgroundColor: cor }}
                    >
                      {pt.materia}
                    </span>
                    <span className="text-zinc-800 truncate font-medium">{pt.titulo}</span>
                  </div>
                  <span className="font-mono text-zinc-900 font-bold shrink-0 text-[11px] bg-zinc-100 px-2 py-0.5 rounded">
                    {formatarDataBr(calculatedDates[idx])}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
