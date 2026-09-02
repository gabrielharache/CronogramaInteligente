import React, { useState, useRef } from 'react';
import { Edital, EditalStatus, Cronograma, PontoEstudo } from '../types';
import { calcularDiasRestantes, formatarDataBr, parseSmartEditalHierarchy, SmartEditalHierarchy } from '../utils/helpers';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Briefcase,
  Layers,
  ArrowRight,
  Upload,
  FileCode,
  CheckCircle2,
  Sparkles,
  BookOpen,
  SlidersHorizontal
} from 'lucide-react';

interface EditaisViewProps {
  editais: Edital[];
  cronogramas: Cronograma[];
  pontos: PontoEstudo[];
  onUpdateEdital: (id: string, updated: Partial<Edital>) => void;
  onDeleteEdital: (id: string) => void;
  onEditEdital: (edital: Edital) => void;
  onNovoEdital: () => void;
  onSwitchToCronograma: (cronogramaId: string) => void;
  onCriarCronogramaParaEdital: (edital: Edital) => void;
  onOpenImportForEdital: (edital: Edital) => void;
  onOpenSmartImport?: (hierarchy: SmartEditalHierarchy) => void;
}

export const EditaisView: React.FC<EditaisViewProps> = ({
  editais,
  cronogramas,
  pontos,
  onUpdateEdital,
  onDeleteEdital,
  onEditEdital,
  onNovoEdital,
  onSwitchToCronograma,
  onCriarCronogramaParaEdital,
  onOpenImportForEdital,
  onOpenSmartImport
}) => {
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [targetEditalIdForUpload, setTargetEditalIdForUpload] = useState<string | null>(null);

  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = (id: string) => {
    if (deleteArmedId === id) {
      onDeleteEdital(id);
      setDeleteArmedId(null);
    } else {
      setDeleteArmedId(id);
      setTimeout(() => setDeleteArmedId(null), 3500);
    }
  };

  const handleGlobalMdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const hierarchy = parseSmartEditalHierarchy(text, file.name);
      if (onOpenSmartImport) {
        onOpenSmartImport(hierarchy);
      } else {
        onEditEdital({
          id: '',
          nome: hierarchy.nome,
          cargo: hierarchy.cargo,
          banca: hierarchy.banca,
          dataProva: hierarchy.dataProva,
          status: hierarchy.status,
          conteudo: text,
          createdAt: Date.now()
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCardMdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetEditalIdForUpload) return;

    const targetId = targetEditalIdForUpload;
    const currentEd = editais.find(ed => ed.id === targetId);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const hierarchy = parseSmartEditalHierarchy(text, currentEd?.nome || file.name);
      
      if (onOpenSmartImport) {
        onOpenSmartImport(hierarchy);
      } else {
        onUpdateEdital(targetId, {
          conteudo: text,
          cargo: hierarchy.cargo || undefined,
          banca: hierarchy.banca || undefined,
          dataProva: hierarchy.dataProva || undefined
        });
        showToast(`Conteúdo e dados atualizados a partir do arquivo .md (${hierarchy.materias.length} matérias / ${hierarchy.totalTopicos} tópicos)!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setTargetEditalIdForUpload(null);
  };

  const statusOptions: EditalStatus[] = [
    'Pretendo fazer',
    'Inscrito',
    'Aguardando edital',
    'Prova realizada'
  ];

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={globalFileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleGlobalMdUpload}
        className="hidden"
      />
      <input
        ref={cardFileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleCardMdUpload}
        className="hidden"
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 mb-0.5">
            <FileText className="w-4 h-4 text-zinc-700" />
            <h2 className="font-sans font-semibold text-lg text-zinc-900">
              Editais & Concursos Cadastrados
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Cadastre concursos, acompanhe a contagem regressiva da prova e suba arquivos <span className="font-mono text-zinc-700 font-semibold">.md</span> para alimentar automaticamente.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => globalFileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-semibold rounded-lg border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
            title="Alimentar ou cadastrar novo edital a partir de um arquivo .md"
          >
            <FileCode className="w-4 h-4 text-zinc-600" />
            <span>Subir Edital (.md)</span>
          </button>

          <button
            onClick={onNovoEdital}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Edital</span>
          </button>
        </div>
      </div>

      {/* Editais List */}
      {editais.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center shadow-2xs">
          <FileCode className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-sans font-semibold text-base text-zinc-900 mb-1">
            Nenhum edital cadastrado
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-4">
            Suba um arquivo <span className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-semibold">.md</span> com a ementa do concurso ou preencha o formulário para começar a planejar seus estudos.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => globalFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir arquivo .md</span>
            </button>
            <button
              onClick={onNovoEdital}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar manualmente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {editais.map(edital => {
            const diasInfo = calcularDiasRestantes(edital.dataProva);
            const isArmed = deleteArmedId === edital.id;
            
            // Find linked cronograma
            const linkedCronograma = cronogramas.find(c => c.editalId === edital.id);
            const editalPontos = linkedCronograma ? pontos.filter(p => p.cronogramaId === linkedCronograma.id) : [];
            const editalDone = editalPontos.filter(p => p.lido && p.qFeitas).length;
            const pct = editalPontos.length > 0 ? Math.round((editalDone / editalPontos.length) * 100) : 0;

            const handleUploadForThisCard = () => {
              setTargetEditalIdForUpload(edital.id);
              cardFileInputRef.current?.click();
            };

            return (
              <article 
                key={edital.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-zinc-300 transition-all relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-sans font-semibold text-lg text-zinc-900">
                        {edital.nome}
                      </h3>
                      {edital.banca && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                          Banca: {edital.banca}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                        {edital.cargo || 'Cargo não informado'}
                      </span>
                      {edital.dataProva && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-mono text-zinc-500">
                            <Calendar className="w-3.5 h-3.5" />
                            Data da Prova: {formatarDataBr(edital.dataProva)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Status Select */}
                    <select
                      value={edital.status}
                      onChange={(e) => onUpdateEdital(edital.id, { status: e.target.value as EditalStatus })}
                      className="px-2.5 py-1 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    {/* Countdown Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs font-semibold border ${
                      diasInfo.realizada ? 'bg-zinc-100 text-zinc-500 border-zinc-200' :
                      diasInfo.dias <= 7 ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      diasInfo.dias <= 30 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{diasInfo.texto}</span>
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={() => onEditEdital(edital)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="Editar edital / subir arquivo .md"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(edital.id)}
                        className={`p-1.5 text-xs font-semibold rounded-lg transition-all ${
                          isArmed 
                            ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse px-2'
                            : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isArmed ? "Confirmar exclusão" : "Excluir edital"}
                      >
                        {isArmed ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linked Schedule Bar */}
                <div className="my-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-md bg-white border border-zinc-200 text-zinc-700 shadow-2xs">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900">
                          {linkedCronograma ? linkedCronograma.nome : 'Nenhum cronograma vinculado'}
                        </span>
                        {linkedCronograma && (
                          <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            {pct}% concluído
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {linkedCronograma 
                          ? `${editalPontos.length} tópicos cadastrados (${editalDone} finalizados)` 
                          : 'Crie ou importe tópicos específicos para este concurso'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {linkedCronograma ? (
                      <button
                        onClick={() => onSwitchToCronograma(linkedCronograma.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
                      >
                        <span>Abrir Cronograma</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onCriarCronogramaParaEdital(edital)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar Cronograma</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenImportForEdital(edital)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md shadow-2xs transition-colors"
                      title="Importar matérias e tópicos via Markdown / JSON para este concurso"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Alimentar Tópicos</span>
                    </button>
                  </div>
                </div>

                  {/* Programmatic Content TextArea with .md shortcut */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Conteúdo Programático / Matérias do Edital
                      </label>
                      <div className="flex items-center gap-2">
                        {edital.conteudo && edital.conteudo.trim().length > 15 && onOpenSmartImport && (
                          <button
                            type="button"
                            onClick={() => {
                              const hierarchy = parseSmartEditalHierarchy(edital.conteudo, edital.nome);
                              onOpenSmartImport(hierarchy);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            title="Estruturar matérias e gerar ciclo de estudos a partir deste conteúdo"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Estruturar Matérias & Ciclo</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleUploadForThisCard}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 hover:underline cursor-pointer"
                          title="Atualizar o conteúdo deste edital com um arquivo .md"
                        >
                          <FileCode className="w-3 h-3 text-zinc-500" />
                          <span>Subir arquivo .md neste edital</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={edital.conteudo || ''}
                      onChange={(e) => onUpdateEdital(edital.id, { conteudo: e.target.value })}
                      placeholder="Cole aqui o conteúdo programático do edital ou envie um arquivo .md..."
                      rows={3}
                      className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all font-mono leading-relaxed"
                    />
                  </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
