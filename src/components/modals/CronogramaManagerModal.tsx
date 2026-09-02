import React, { useState } from 'react';
import { Cronograma, Edital, PontoEstudo } from '../../types';
import { COLOR_PALETTE } from '../../data/seed';
import { uid, formatarDataBr, calcularDiasRestantes } from '../../utils/helpers';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  FileText,
  AlertCircle,
  Calendar,
  Clock,
  Briefcase,
  ExternalLink
} from 'lucide-react';

interface CronogramaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronogramas: Cronograma[];
  activeCronogramaId: string;
  pontos: PontoEstudo[];
  editais: Edital[];
  onSelectCronograma: (id: string) => void;
  onSaveCronograma: (c: {
    id?: string;
    nome: string;
    descricao?: string;
    editalId?: string;
    dataProva?: string;
    cor?: string;
  }) => void;
  onDeleteCronograma: (id: string) => void;
  onNovoEdital: () => void;
  onEditEdital: (edital: Edital) => void;
  onDeleteEdital: (id: string) => void;
}

export const CronogramaManagerModal: React.FC<CronogramaManagerModalProps> = ({
  isOpen,
  onClose,
  cronogramas,
  activeCronogramaId,
  pontos,
  editais,
  onSelectCronograma,
  onSaveCronograma,
  onDeleteCronograma,
  onNovoEdital,
  onEditEdital,
  onDeleteEdital
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cronogramas' | 'editais'>('cronogramas');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editalId, setEditalId] = useState<string>('');
  const [dataProva, setDataProva] = useState<string>('');
  const [cor, setCor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState('');
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const [deleteEditalArmedId, setDeleteEditalArmedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingId(null);
    setNome('');
    setDescricao('');
    setEditalId('');
    setDataProva('');
    setCor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setIsCreating(true);
    setError('');
  };

  const handleStartEdit = (c: Cronograma) => {
    setEditingId(c.id);
    setNome(c.nome);
    setDescricao(c.descricao || '');
    setEditalId(c.editalId || '');
    // If cronograma has dataProva use it, otherwise fallback to linked edital's date
    const linkedEdital = editais.find(e => e.id === c.editalId);
    setDataProva(c.dataProva || linkedEdital?.dataProva || '');
    setCor(c.cor || COLOR_PALETTE[0]);
    setIsCreating(true);
    setError('');
  };

  const handleSelectEditalInForm = (selectedId: string) => {
    setEditalId(selectedId);
    if (selectedId) {
      const found = editais.find(e => e.id === selectedId);
      if (found && found.dataProva && !dataProva) {
        setDataProva(found.dataProva);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do cronograma.');
      return;
    }

    onSaveCronograma({
      id: editingId || undefined,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      editalId: editalId || undefined,
      dataProva: dataProva || undefined,
      cor
    });

    setIsCreating(false);
    setEditingId(null);
    setError('');
  };

  const handleDelete = (id: string) => {
    if (cronogramas.length <= 1) {
      setError('Não é possível excluir o único cronograma existente.');
      return;
    }
    if (deleteArmedId === id) {
      onDeleteCronograma(id);
      setDeleteArmedId(null);
    } else {
      setDeleteArmedId(id);
      setTimeout(() => setDeleteArmedId(null), 3500);
    }
  };

  const handleDeleteEditalConfirm = (id: string) => {
    if (deleteEditalArmedId === id) {
      onDeleteEdital(id);
      setDeleteEditalArmedId(null);
    } else {
      setDeleteEditalArmedId(id);
      setTimeout(() => setDeleteEditalArmedId(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              Gerenciar Cronogramas & Editais
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-4 px-5 border-b border-zinc-200 bg-white shrink-0">
          <button
            onClick={() => {
              setActiveSubTab('cronogramas');
              setIsCreating(false);
            }}
            className={`py-2.5 text-xs font-semibold relative transition-colors ${
              activeSubTab === 'cronogramas'
                ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Cronogramas ({cronogramas.length})
          </button>

          <button
            onClick={() => {
              setActiveSubTab('editais');
              setIsCreating(false);
            }}
            className={`py-2.5 text-xs font-semibold relative transition-colors ${
              activeSubTab === 'editais'
                ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Editais Cadastrados ({editais.length})
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CRONOGRAMAS */}
          {activeSubTab === 'cronogramas' && (
            <>
              {!isCreating && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                      Alterne entre cronogramas, personalize datas de prova e cores de cada concurso.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md shadow-2xs transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Cronograma</span>
                    </button>
                  </div>

                  {/* All Combined Option */}
                  <div
                    onClick={() => {
                      onSelectCronograma('all');
                      onClose();
                    }}
                    className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      activeCronogramaId === 'all'
                        ? 'border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900/10 shadow-2xs'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-zinc-900 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-zinc-900">
                            Todos os cronogramas combinados
                          </h4>
                          {activeCronogramaId === 'all' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-900 text-white">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Visualização consolidada de todos os tópicos ({pontos.length} tópicos)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Individual Cronogramas */}
                  {cronogramas.map(c => {
                    const count = pontos.filter(p => p.cronogramaId === c.id).length;
                    const done = pontos.filter(p => p.cronogramaId === c.id && p.lido).length;
                    const pct = count > 0 ? Math.round((done / count) * 100) : 0;
                    const isActive = activeCronogramaId === c.id;
                    const linkedEdital = editais.find(e => e.id === c.editalId);
                    const effectiveDate = c.dataProva || linkedEdital?.dataProva;
                    const diasInfo = effectiveDate ? calcularDiasRestantes(effectiveDate) : null;

                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-lg border flex items-center justify-between transition-all ${
                          isActive
                            ? 'border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900/10 shadow-2xs'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div 
                          onClick={() => {
                            onSelectCronograma(c.id);
                            onClose();
                          }}
                          className="flex-1 min-w-0 cursor-pointer pr-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: c.cor || '#18181B' }} 
                            />
                            <h4 className="font-semibold text-xs text-zinc-900 truncate">
                              {c.nome}
                            </h4>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-900 text-white">
                                Ativo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center flex-wrap gap-2 text-[11px] text-zinc-500">
                            <span>{count} tópicos</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-700 font-semibold">{pct}% estudado</span>
                            
                            {effectiveDate && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded text-[11px]">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  Prova: {formatarDataBr(effectiveDate)}
                                  {diasInfo && (
                                    <span className="font-semibold text-zinc-900">({diasInfo.texto})</span>
                                  )}
                                </span>
                              </>
                            )}

                            {linkedEdital && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                                  <FileText className="w-3 h-3 text-zinc-500" />
                                  {linkedEdital.nome}
                                </span>
                              </>
                            )}
                          </div>

                          {c.descricao && (
                            <p className="text-[11px] text-zinc-400 mt-1 italic truncate">
                              {c.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => handleStartEdit(c)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                            title="Editar nome, data da prova ou detalhes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(c.id)}
                            className={`p-1.5 text-xs font-semibold rounded-md transition-all ${
                              deleteArmedId === c.id
                                ? 'bg-rose-600 text-white animate-pulse px-2'
                                : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={deleteArmedId === c.id ? "Confirmar exclusão" : "Excluir cronograma"}
                          >
                            {deleteArmedId === c.id ? 'Excluir?' : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Form Create/Edit Cronograma */}
              {isCreating && (
                <form onSubmit={handleSubmit} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-zinc-900">
                      {editingId ? 'Editar cronograma' : 'Criar novo cronograma'}
                    </h3>
                    <span className="text-[11px] text-zinc-500">Campos com * são obrigatórios</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Nome do cronograma *
                    </label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex.: TCE-MA 2026 (Auditoria e Controle Externo)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900 shadow-2xs"
                    />
                  </div>

                  {/* Data da Prova do Cronograma */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Data da Prova do Concurso (para a contagem regressiva)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dataProva}
                        onChange={(e) => setDataProva(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900 shadow-2xs font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Define os dias restantes até o exame no cabeçalho do aplicativo.
                    </p>
                  </div>

                  {/* Vincular Edital */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        Vincular a um edital cadastrado (opcional)
                      </label>
                      <button
                        type="button"
                        onClick={onNovoEdital}
                        className="text-[11px] font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Cadastrar novo edital</span>
                      </button>
                    </div>

                    <select
                      value={editalId}
                      onChange={(e) => handleSelectEditalInForm(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer shadow-2xs"
                    >
                      <option value="">Nenhum vínculo (Cronograma Geral)</option>
                      {editais.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nome} — {e.cargo || 'Geral'} {e.dataProva ? `(Prova: ${formatarDataBr(e.dataProva)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Descrição ou meta
                    </label>
                    <input
                      type="text"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Ex.: Meta de 2 tópicos/dia até a prova"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Cor de identificação
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_PALETTE.slice(0, 10).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCor(c)}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            cor === c ? 'scale-125 ring-2 ring-zinc-900 ring-offset-1' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-black text-white rounded-md shadow-2xs transition-colors"
                    >
                      {editingId ? 'Salvar Alterações' : 'Criar Cronograma'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: EDITAIS CADASTRADOS */}
          {activeSubTab === 'editais' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Gerencie, edite ou exclua os editais e concursos cadastrados no sistema.
                </p>
                <button
                  type="button"
                  onClick={onNovoEdital}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-md shadow-2xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Edital</span>
                </button>
              </div>

              {editais.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-xl">
                  <FileText className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-xs text-zinc-900 mb-1">
                    Nenhum edital cadastrado
                  </h4>
                  <p className="text-[11px] text-zinc-500 mb-3">
                    Cadastre editais para vincular cronogramas e calcular datas de prova.
                  </p>
                  <button
                    onClick={onNovoEdital}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar primeiro edital</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {editais.map(edital => {
                    const diasInfo = edital.dataProva ? calcularDiasRestantes(edital.dataProva) : null;
                    const linkedCro = cronogramas.find(c => c.editalId === edital.id);
                    const isArmed = deleteEditalArmedId === edital.id;

                    return (
                      <div
                        key={edital.id}
                        className="p-3.5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h4 className="font-semibold text-xs text-zinc-900">
                              {edital.nome}
                            </h4>
                            {edital.banca && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-100 text-zinc-700 border border-zinc-200">
                                Banca: {edital.banca}
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700">
                              {edital.status}
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap gap-2 text-[11px] text-zinc-500">
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                              <Briefcase className="w-3 h-3 text-zinc-400" />
                              {edital.cargo || 'Cargo não informado'}
                            </span>

                            {edital.dataProva && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  Data: {formatarDataBr(edital.dataProva)}
                                  {diasInfo && (
                                    <span className="font-semibold text-zinc-900">({diasInfo.texto})</span>
                                  )}
                                </span>
                              </>
                            )}

                            {linkedCro && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  <Layers className="w-3 h-3 text-emerald-600" />
                                  Cronograma: {linkedCro.nome}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => onEditEdital(edital)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                            title="Editar edital e data da prova"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteEditalConfirm(edital.id)}
                            className={`p-1.5 text-xs font-semibold rounded-md transition-all ${
                              isArmed
                                ? 'bg-rose-600 text-white animate-pulse px-2'
                                : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isArmed ? "Confirmar exclusão deste edital" : "Excluir edital"}
                          >
                            {isArmed ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
