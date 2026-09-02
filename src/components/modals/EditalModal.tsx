import React, { useState, useEffect, useRef } from 'react';
import { Edital, EditalStatus } from '../../types';
import { parseSmartEditalHierarchy, SmartEditalHierarchy } from '../../utils/helpers';
import { 
  X, 
  FileText, 
  AlertCircle, 
  Upload, 
  CheckCircle2, 
  FileCode, 
  Sparkles,
  Calendar,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

interface EditalModalProps {
  isOpen: boolean;
  onClose: () => void;
  edital: Edital | null;
  onSave: (editalData: {
    id?: string;
    nome: string;
    cargo: string;
    banca: string;
    dataProva: string;
    status: EditalStatus;
    conteudo: string;
  }) => void;
  onOpenSmartStructurer?: (hierarchy: SmartEditalHierarchy) => void;
}

const SAMPLE_MD_EDITAL = `# Concurso TCE-MA 2026
**Cargo:** Auditor Estadual de Controle Externo
**Banca:** FGV
**Data da Prova:** 2026-11-29
**Status:** Pretendo fazer

## Direito Constitucional
- Controle Concentrado e Difuso de Constitucionalidade (Lei Seca)
- Direitos e Garantias Fundamentais: Art. 5º ao 17 da CF/88
- Organização do Estado, Poder Legislativo e Funções Essenciais à Justiça

## Direito Administrativo
- Nova Lei de Licitações e Contratos (Lei 14.133/2021)
- Improbidade Administrativa e Dolo Específico (Lei 8.429/1992 com alterações)
- Regime Jurídico Administrativo e Poderes da Administração

## Controle Externo & Legislação Específica
- Lei Orgânica do TCE-MA e Regimento Interno
- Fiscalização Contábil, Financeira e Orçamentária na CF/88 (Arts. 70 a 75)`;

export const EditalModal: React.FC<EditalModalProps> = ({
  isOpen,
  onClose,
  edital,
  onSave,
  onOpenSmartStructurer
}) => {
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [banca, setBanca] = useState('');
  const [dataProva, setDataProva] = useState('');
  const [status, setStatus] = useState<EditalStatus>('Pretendo fazer');
  const [conteudo, setConteudo] = useState('');
  const [error, setError] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edital) {
      setNome(edital.nome);
      setCargo(edital.cargo || '');
      setBanca(edital.banca || '');
      setDataProva(edital.dataProva || '');
      setStatus(edital.status || 'Pretendo fazer');
      setConteudo(edital.conteudo || '');
      setUploadSuccessMsg(null);
    } else {
      setNome('');
      setCargo('');
      setBanca('');
      setDataProva('');
      setStatus('Pretendo fazer');
      setConteudo('');
      setUploadSuccessMsg(null);
    }
    setError('');
  }, [edital, isOpen]);

  if (!isOpen) return null;

  const processFileContent = (text: string, fileName?: string) => {
    setError('');
    try {
      const hierarchy = parseSmartEditalHierarchy(text, fileName);
      if (hierarchy.nome) setNome(hierarchy.nome);
      if (hierarchy.cargo) setCargo(hierarchy.cargo);
      if (hierarchy.banca) setBanca(hierarchy.banca);
      if (hierarchy.dataProva) setDataProva(hierarchy.dataProva);
      if (hierarchy.status) setStatus(hierarchy.status);
      setConteudo(text);

      const infoParts: string[] = [];
      if (hierarchy.materias.length > 0) infoParts.push(`${hierarchy.materias.length} matérias`);
      if (hierarchy.totalTopicos > 0) infoParts.push(`${hierarchy.totalTopicos} tópicos identificados`);

      const summary = infoParts.length > 0 ? ` (${infoParts.join(', ')})` : '';
      setUploadSuccessMsg(`Arquivo "${fileName || 'edital.md'}" carregado com sucesso!${summary}`);
    } catch (err) {
      setError('Erro ao processar arquivo Markdown.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processFileContent(text, file.name);
    };
    reader.readAsText(file);
    // Reset file input value so user can re-upload same file if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processFileContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    processFileContent(SAMPLE_MD_EDITAL, 'exemplo_edital_tce.md');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do concurso / órgão.');
      return;
    }

    onSave({
      id: edital?.id,
      nome: nome.trim(),
      cargo: cargo.trim(),
      banca: banca.trim(),
      dataProva,
      status,
      conteudo: conteudo.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="font-sans font-semibold text-base text-zinc-900 leading-none">
                {edital ? 'Editar edital' : 'Cadastrar novo edital'}
              </h2>
              <span className="text-[11px] text-zinc-500 font-sans">
                Preencha manualmente ou envie um arquivo Markdown (.md)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload .md Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-zinc-700" />
                <span>Alimentar via Arquivo .md (Markdown)</span>
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Carregar exemplo .md</span>
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-zinc-900 bg-zinc-100/90 ring-2 ring-zinc-900/10' 
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/70 hover:bg-zinc-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-zinc-800">
                Arraste seu arquivo <span className="font-mono text-zinc-900 bg-zinc-200/80 px-1 py-0.2 rounded">.md</span> aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Preenche automaticamente órgão, cargo, banca, data da prova e conteúdo programático
              </p>
            </div>

            {uploadSuccessMsg && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200/80 pt-3 space-y-3.5">
            {/* Nome do Concurso */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                Órgão / nome do concurso *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: TJ-MA 2027 ou TCE-MA 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium"
              />
            </div>

            {/* Cargo & Banca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex.: Analista Judiciário / Auditor"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Banca examinadora
                </label>
                <input
                  type="text"
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  placeholder="Ex.: FGV, Cebraspe, FCC, Vunesp"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>
            </div>

            {/* Data da Prova & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Data da prova
                </label>
                <input
                  type="date"
                  value={dataProva}
                  onChange={(e) => setDataProva(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                  Situação
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EditalStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-medium cursor-pointer"
                >
                  <option value="Pretendo fazer">Pretendo fazer</option>
                  <option value="Inscrito">Inscrito</option>
                  <option value="Aguardando edital">Aguardando edital</option>
                  <option value="Prova realizada">Prova realizada</option>
                </select>
              </div>
            </div>

            {/* Conteúdo Programático */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Conteúdo programático / tópicos em Markdown
                </label>
                <div className="flex items-center gap-2">
                  {conteudo.trim().length > 10 && onOpenSmartStructurer && (
                    <button
                      type="button"
                      onClick={() => {
                        const hierarchy = parseSmartEditalHierarchy(conteudo, nome || 'Edital');
                        onOpenSmartStructurer(hierarchy);
                      }}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Estruturar Matérias & Assuntos</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {conteudo.length > 0 ? `${conteudo.split('\n').length} linhas` : 'Vazio'}
                  </span>
                </div>
              </div>
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={5}
                placeholder="Cole ou edite a ementa de disciplinas, pontos específicos e referências..."
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition-all shadow-2xs font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-200 shrink-0">
            {conteudo.trim().length > 10 && onOpenSmartStructurer ? (
              <button
                type="button"
                onClick={() => {
                  const hierarchy = parseSmartEditalHierarchy(conteudo, nome || 'Edital');
                  onOpenSmartStructurer(hierarchy);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-700" />
                <span>Leitura Inteligente do Ciclo</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-black text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {edital ? 'Salvar Edital' : 'Cadastrar Edital'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
