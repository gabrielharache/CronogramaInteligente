import React from 'react';
import {
  RefreshCw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Shuffle,
  Zap,
  Sliders,
  Bookmark,
  BookmarkPlus,
  Trash2
} from 'lucide-react';
import { ReorganizeController, DIAS_OPTIONS } from './useReorganizeModal';

// Tab A: presets, rules, combinations and subject frequencies
export const RegrasTab: React.FC<{ r: ReorganizeController }> = ({ r }) => {
  const {
    distributionMode,
    setDistributionMode,
    pointsByMateria,
    materiaOrder,
    materiaConfigs,
    setMateriaConfigs,
    editingDaysMateria,
    setEditingDaysMateria,
    presets,
    activePresetId,
    isPresetModified,
    setIsPresetModified,
    setPresetToDelete,
    setManageModalOpen,
    activePreset,
    handleSelectPreset,
    handleOpenSaveModal,
    handleUpdateCurrentPreset,
    handleMoveMateria,
    handleUpdateMateriaFreq,
    handleToggleMateriaIntercalationGroup,
    handleToggleMateriaAllowedDay,
    freqSummary,
    materiasCores
  } = r;

  return (
    <div className="space-y-4">
      {/* SECTION: PRESETS DE ORGANIZAÇÃO (Salvar, Atualizar, Excluir, Gerenciar) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                2. Presets de Organização
              </span>
              {activePreset && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  activePreset.isBuiltIn
                    ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {activePreset.isBuiltIn ? '⚙️ Padrão' : '★ Personalizado'}: <strong>{activePreset.nome}</strong>
                </span>
              )}
              {isPresetModified && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Modificado
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Aplique combinações predefinidas ou salve sua própria metodologia com frequências e dias personalizados.
            </p>
          </div>

          {/* Actions: Atualizar, Salvar Novo, Gerenciar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {!activePreset?.isBuiltIn ? (
              <button
                type="button"
                onClick={handleUpdateCurrentPreset}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPresetModified
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-xs'
                    : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                }`}
                title="Sobrescrever este preset com as configurações da tela"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPresetModified ? 'text-zinc-950' : 'text-zinc-500'}`} />
                <span>Atualizar Preset</span>
              </button>
            ) : (
              isPresetModified && (
                <button
                  type="button"
                  onClick={handleOpenSaveModal}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Salvar alterações em um novo preset"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Salvar como Novo Preset</span>
                </button>
              )
            )}

            {activePreset && (
              <button
                type="button"
                onClick={() => setPresetToDelete(activePreset)}
                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                title="Excluir este preset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-zinc-500" />
              <span>Salvar Preset</span>
            </button>

            <button
              type="button"
              onClick={() => setManageModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-600" />
              <span>Gerenciar ({presets.length})</span>
            </button>
          </div>
        </div>

        {/* Carousel / Chips of Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {presets.map(p => {
            const isSelected = activePresetId === p.id;
            return (
              <div key={p.id} className="relative group shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs ring-1 ring-zinc-900'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  } pr-7`}
                  title={p.descricao || p.nome}
                >
                  {p.isBuiltIn ? (
                    p.id === 'builtin_concurseiro' ? <span>🎯</span> :
                    p.id === 'builtin_uniforme' ? <span>⚖️</span> :
                    p.id === 'builtin_intensivo' ? <span>⚡</span> :
                    <span>📦</span>
                  ) : (
                    <span className="text-amber-400 font-bold">★</span>
                  )}
                  <span>{p.nome}</span>
                  {isSelected && isPresetModified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPresetToDelete(p);
                  }}
                  className={`absolute right-1.5 p-1 rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                      : 'text-zinc-400 hover:text-red-600 hover:bg-zinc-200'
                  }`}
                  title={p.isBuiltIn ? "Ocultar / Excluir preset padrão" : "Excluir preset personalizado"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution Mode selector cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
          3. Estratégia de Combinação
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDistributionMode('smart_cycle');
              setIsPresetModified(true);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              distributionMode === 'smart_cycle'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-1 ring-zinc-900'
                : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
              <Sparkles className={`w-4 h-4 ${distributionMode === 'smart_cycle' ? 'text-amber-300' : 'text-amber-600'}`} />
              <span>Ciclo Inteligente (Avançado)</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${distributionMode === 'smart_cycle' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Permite matérias obrigatórias toda semana, intercaladas semana sim/não, 2x por semana ou em bloco.
            </p>
            <span className="absolute top-2 right-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950">
              Recomendado
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDistributionMode('cycle');
              setIsPresetModified(true);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              distributionMode === 'cycle'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-1 ring-zinc-900'
                : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
              <Shuffle className={`w-4 h-4 ${distributionMode === 'cycle' ? 'text-blue-300' : 'text-blue-600'}`} />
              <span>Ciclo Tradicional</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${distributionMode === 'cycle' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Alterna uma matéria por dia em rotação contínua (round-robin) sem pesos específicos por semana.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setDistributionMode('sequential');
              setIsPresetModified(true);
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              distributionMode === 'sequential'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-1 ring-zinc-900'
                : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
              <BookOpen className={`w-4 h-4 ${distributionMode === 'sequential' ? 'text-emerald-300' : 'text-emerald-600'}`} />
              <span>Sequencial (Bloco a Bloco)</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${distributionMode === 'sequential' ? 'text-zinc-300' : 'text-zinc-500'}`}>
              Esgota todos os tópicos de uma matéria antes de iniciar a próxima.
            </p>
          </button>
        </div>
      </div>

      {/* Subject Combination Rules (only visible when in smart_cycle) */}
      {distributionMode === 'smart_cycle' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                4. Regras de Frequência das Matérias
              </span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Defina quais matérias caem toda semana e quais serão intercaladas entre si.
              </p>
            </div>

            {/* Active preset status indicator */}
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 px-2 rounded-lg border border-zinc-200 text-[11px] text-zinc-600">
              <span>Preset ativo:</span>
              <strong className="text-zinc-900">{activePreset?.nome}</strong>
            </div>
          </div>

          {/* Summary of active rules */}
          <div className="flex items-center gap-2 flex-wrap text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
            <span className="text-[11px] font-semibold text-zinc-500">Configuração Atual:</span>
            {freqSummary.todaSemana > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px]">
                <Zap className="w-3 h-3 text-amber-600" />
                {freqSummary.todaSemana} Toda Semana
              </span>
            )}
            {(freqSummary.intercaladasA > 0 || freqSummary.intercaladasB > 0) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-semibold text-[11px]">
                <Shuffle className="w-3 h-3 text-purple-600" />
                {freqSummary.intercaladasA + freqSummary.intercaladasB} Intercaladas ({freqSummary.intercaladasA} Grupo A / {freqSummary.intercaladasB} Grupo B)
              </span>
            )}
            {freqSummary.duasVezes > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold text-[11px]">
                ⚡ {freqSummary.duasVezes} 2x por semana
              </span>
            )}
            {freqSummary.bloco > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-semibold text-[11px]">
                📦 {freqSummary.bloco} Em Bloco
              </span>
            )}
            {freqSummary.padrao > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-semibold text-[11px]">
                🔄 {freqSummary.padrao} Rotação Regular
              </span>
            )}
          </div>

          {/* Subjects Table with Frequency controls */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {materiaOrder.map((materia, idx) => {
              const count = pointsByMateria[materia]?.length || 0;
              const cfg = materiaConfigs[materia] || { materia, frequencia: 'padrao' };
              const cor = materiasCores[materia] || '#d97706';
              const isEditingDays = editingDaysMateria === materia;

              return (
                <div 
                  key={materia}
                  className="p-2.5 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* Subject Info */}
                    <div className="flex items-center gap-2 min-w-[200px] flex-1">
                      <span className="font-mono text-[11px] text-zinc-400">#{idx + 1}</span>
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" 
                        style={{ backgroundColor: cor }} 
                      />
                      <span className="text-xs font-bold text-zinc-900 truncate">
                        {materia}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        ({count} tópicos)
                      </span>
                    </div>

                    {/* Frequency Mode Dropdown / Button Group */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={cfg.frequencia}
                        onChange={(e) => handleUpdateMateriaFreq(materia, e.target.value as any)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          cfg.frequencia === 'toda_semana'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                            : cfg.frequencia === 'intercalada'
                            ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold'
                            : cfg.frequencia === 'duas_vezes'
                            ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold'
                            : cfg.frequencia === 'bloco'
                            ? 'bg-zinc-800 text-white border-zinc-800 font-bold'
                            : 'bg-white text-zinc-700 border-zinc-200'
                        }`}
                      >
                        <option value="toda_semana">🌟 Toda Semana (Obrigatória)</option>
                        <option value="intercalada">🔀 Intercalada (Alternar Semanas)</option>
                        <option value="duas_vezes">⚡ 2x por Semana (Reforço)</option>
                        <option value="padrao">🔄 Rotação Regular</option>
                        <option value="bloco">📦 Em Bloco Contínuo</option>
                      </select>

                      {/* Intercalation Group Toggle (Group A or Group B) */}
                      {cfg.frequencia === 'intercalada' && (
                        <button
                          type="button"
                          onClick={() => handleToggleMateriaIntercalationGroup(materia)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                            cfg.grupoIntercalacao === 'A'
                              ? 'bg-purple-600 text-white border-purple-700'
                              : 'bg-indigo-600 text-white border-indigo-700'
                          }`}
                          title={
                            cfg.grupoIntercalacao === 'A' 
                              ? 'Grupo A: Estudada nas semanas 1, 3, 5...' 
                              : 'Grupo B: Estudada nas semanas 2, 4, 6...'
                          }
                        >
                          {cfg.grupoIntercalacao === 'A' ? 'Grupo A (Semana 1, 3...)' : 'Grupo B (Semana 2, 4...)'}
                        </button>
                      )}

                      {/* Optional: Fixed Days Trigger */}
                      <button
                        type="button"
                        onClick={() => setEditingDaysMateria(isEditingDays ? null : materia)}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                          cfg.diasPermitidos && cfg.diasPermitidos.length > 0
                            ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                        }`}
                        title="Fixar matéria em dias específicos da semana"
                      >
                        {cfg.diasPermitidos && cfg.diasPermitidos.length > 0
                          ? `${cfg.diasPermitidos.length} dia(s) fixo(s)`
                          : 'Fixar dias'}
                      </button>

                      {/* Priority Reordering Buttons */}
                      <div className="flex items-center gap-0.5 border border-zinc-200 rounded-md bg-white p-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMateria(materia, 'up')}
                          className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                          title="Subir prioridade"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === materiaOrder.length - 1}
                          onClick={() => handleMoveMateria(materia, 'down')}
                          className="p-1 hover:bg-zinc-100 rounded disabled:opacity-20 cursor-pointer text-zinc-500"
                          title="Descer prioridade"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Day Picker Popover if open */}
                  {isEditingDays && (
                    <div className="p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between flex-wrap gap-2 animate-in slide-in-from-top-1 duration-150">
                      <span className="text-[11px] text-zinc-600 font-medium">
                        Dias permitidos para <strong>{materia}</strong> (deixe vazio para livre distribuição):
                      </span>
                      <div className="flex items-center gap-1">
                        {DIAS_OPTIONS.map(d => {
                          const isChecked = Boolean(cfg.diasPermitidos?.includes(d.id));
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => handleToggleMateriaAllowedDay(materia, d.id)}
                              className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                        {cfg.diasPermitidos && cfg.diasPermitidos.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setMateriaConfigs(prev => ({
                                ...prev,
                                [materia]: { ...prev[materia], diasPermitidos: undefined }
                              }));
                            }}
                            className="text-[10px] text-red-600 hover:underline ml-1 cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
