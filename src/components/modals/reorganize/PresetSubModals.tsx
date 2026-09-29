import React from 'react';
import {
  X,
  RefreshCw,
  Sliders,
  Check,
  BookmarkPlus,
  Save,
  Trash2
} from 'lucide-react';
import { ReorganizeController } from './useReorganizeModal';

// Preset sub-modals: save new preset, confirm deletion and manage all presets
export const PresetSubModals: React.FC<{ r: ReorganizeController }> = ({ r }) => {
  const {
    topicsPerDay,
    studyDaysMode,
    customDays,
    distributionMode,
    materiaConfigs,
    presets,
    activePresetId,
    saveModalOpen,
    setSaveModalOpen,
    savePresetName,
    setSavePresetName,
    savePresetDesc,
    setSavePresetDesc,
    presetToDelete,
    setPresetToDelete,
    manageModalOpen,
    setManageModalOpen,
    handleSelectPreset,
    handleOpenSaveModal,
    handleConfirmSavePreset,
    handleUpdatePresetById,
    handleDeletePreset,
    handleRestoreDefaultPresets
  } = r;

  return (
    <>
      {/* SUB-MODAL 1: Salvar Novo Preset */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Salvar Preset de Organização</h4>
                  <p className="text-[11px] text-zinc-500">Grave esta configuração para reutilizar em qualquer cronograma.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Nome do Preset *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ciclo Reta Final 2x, Ciclo Padrão PF..."
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Descrição ou Observação (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 2 tópicos/dia, Segunda a Sexta, Português e Dir. Adm toda semana..."
                  value={savePresetDesc}
                  onChange={(e) => setSavePresetDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white resize-none"
                />
              </div>

              {/* Summary of what is being saved */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5 text-zinc-600">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Resumo dos parâmetros a salvar:
                </span>
                <div className="flex items-center justify-between">
                  <span>Estratégia:</span>
                  <strong className="text-zinc-800 capitalize">
                    {distributionMode === 'smart_cycle' ? 'Ciclo Inteligente' : distributionMode === 'cycle' ? 'Ciclo Tradicional' : 'Sequencial'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ritmo diário:</span>
                  <strong className="text-zinc-800">{topicsPerDay} tópico(s) por dia</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dias de estudo:</span>
                  <strong className="text-zinc-800">
                    {studyDaysMode === 'seg-sab' ? 'Segunda a Sábado' : studyDaysMode === 'seg-sex' ? 'Segunda a Sexta' : studyDaysMode === 'todos' ? 'Todos os dias' : `${customDays.length} dias selecionados`}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Regras de matérias:</span>
                  <strong className="text-zinc-800">{Object.keys(materiaConfigs).length} matérias configuradas</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!savePresetName.trim()}
                onClick={handleConfirmSavePreset}
                className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-300" />
                <span>Salvar Preset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Confirmar Exclusão de Preset */}
      {presetToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Excluir Preset?</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Deseja remover o preset <strong>"{presetToDelete.nome}"</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setPresetToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePreset(presetToDelete.id)}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: Gerenciar Todos os Presets */}
      {manageModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
            <div className="p-4 px-5 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Gerenciar Presets de Organização</h4>
                  <p className="text-xs text-zinc-500">Selecione, atualize ou remova seus modelos salvos.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Presets Disponíveis ({presets.length})
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultPresets}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-700 flex items-center gap-1.5 cursor-pointer"
                    title="Restaurar presets padrões deletados"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restaurar Padrões</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManageModalOpen(false);
                      handleOpenSaveModal();
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Novo Preset</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {presets.map(p => {
                  const isActive = activePresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300'
                          : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-zinc-900 truncate">
                            {p.nome}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.isBuiltIn
                              ? 'bg-zinc-200/80 text-zinc-700'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {p.isBuiltIn ? '⚙️ Padrão' : '★ Personalizado'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white">
                              Em Uso
                            </span>
                          )}
                        </div>
                        {p.descricao && (
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            {p.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-0.5 flex-wrap">
                          <span>Modo: <strong className="text-zinc-700">
                            {p.distributionMode === 'smart_cycle' ? 'Ciclo Inteligente' : p.distributionMode === 'cycle' ? 'Ciclo Tradicional' : 'Sequencial'}
                          </strong></span>
                          <span>•</span>
                          <span>Ritmo: <strong className="text-zinc-700">{p.topicsPerDay} tópicos/dia</strong></span>
                          <span>•</span>
                          <span>Dias: <strong className="text-zinc-700">
                            {p.studyDaysMode === 'seg-sab' ? 'Seg a Sáb' : p.studyDaysMode === 'seg-sex' ? 'Seg a Sex' : p.studyDaysMode === 'todos' ? 'Todos os dias' : p.studyDaysMode}
                          </strong></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectPreset(p);
                              setManageModalOpen(false);
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition-colors cursor-pointer"
                          >
                            Aplicar
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Ativo</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {!p.isBuiltIn && (
                            <button
                              type="button"
                              onClick={() => handleUpdatePresetById(p.id)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-white rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                              title="Atualizar este preset com a configuração atual da tela"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPresetToDelete(p)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                            title={p.isBuiltIn ? "Ocultar / Excluir preset padrão" : "Excluir preset"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 px-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500">
                Seus presets personalizados ficam salvos no seu navegador para uso contínuo.
              </span>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
