import React, { useState } from 'react';
import { AppState, Cronograma, Edital, PontoEstudo, TipoEstudo } from '../../types';
import { validateAndParseBackup } from '../../utils/storage';
import { parseMarkdownStudyPoints, ParsedStudyPoint, uid } from '../../utils/helpers';
import { 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  FileJson, 
  FileText, 
  Copy, 
  Plus, 
  Layers,
  Sparkles
} from 'lucide-react';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronogramas: Cronograma[];
  activeCronogramaId: string;
  editais: Edital[];
  onImportFullBackup: (newState: AppState) => void;
  onImportPointsToSchedule: (
    points: PontoEstudo[], 
    destination: {
      type: 'new_cronograma' | 'append_current' | 'replace_current';
      newCronogramaNome?: string;
      newCronogramaEditalId?: string;
      targetCronogramaId?: string;
    }
  ) => void;
}

const MARKDOWN_TEMPLATE_EXAMPLE = `# Direito Constitucional
- [ ] 2026-09-01 | Teoria Geral dos Direitos Fundamentais | Doutrina | Fls. 40
- [ ] 2026-09-02 | Art. 5º da CF/88 (Incisos I a XXX) | Lei Seca | Leitura atenta dos incisos
- [ ] 2026-09-03 | Controle Concentrado e Remédios | Jurisprudência | ADI 5766 e Súmulas Vinculantes

# Direito Administrativo
- [ ] 2026-09-04 | Organização Administrativa e Terceiro Setor | Doutrina | Descentralização
- [ ] 2026-09-05 | Lei 14.133/21 — Licitações (Arts. 1 a 30) | Lei Seca | Princípios e modalidades
- [ ] 2026-09-07 | Improbidade Administrativa e Dolo Específico | Jurisprudência | Tema 1199 STF

# Direito Financeiro
- [ ] 2026-09-08 | Lei de Responsabilidade Fiscal (LC 101/00) | Lei Seca | Despesas com pessoal`;

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  cronogramas,
  activeCronogramaId,
  editais,
  onImportFullBackup,
  onImportPointsToSchedule
}) => {
  const [content, setContent] = useState('');
  const [importMode, setImportMode] = useState<'append_current' | 'new_cronograma' | 'replace_current' | 'full_backup'>('new_cronograma');
  const [newCronogramaNome, setNewCronogramaNome] = useState('');
  const [newCronogramaEditalId, setNewCronogramaEditalId] = useState('');
  
  const [fullBackupPreview, setFullBackupPreview] = useState<AppState | null>(null);
  const [parsedPoints, setParsedPoints] = useState<ParsedStudyPoint[]>([]);
  const [error, setError] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      analyzeContent(text);
      if (file.name && !newCronogramaNome) {
        setNewCronogramaNome(file.name.replace(/\.(json|md|txt)$/i, ''));
      }
    };
    reader.readAsText(file);
  };

  const analyzeContent = (text: string) => {
    setError('');
    setFullBackupPreview(null);
    setParsedPoints([]);

    if (!text.trim()) return;

    // Check if it's a JSON backup
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      const backup = validateAndParseBackup(text);
      if (backup) {
        setFullBackupPreview(backup);
        setImportMode('full_backup');
        return;
      }
    }

    // Otherwise, parse as Markdown or plain text topics list
    const mdPoints = parseMarkdownStudyPoints(text);
    if (mdPoints.length > 0) {
      setParsedPoints(mdPoints);
      if (importMode === 'full_backup') {
        setImportMode('new_cronograma');
      }
    } else {
      setError('Não foi possível identificar tópicos ou backup válido no conteúdo fornecido.');
    }
  };

  const handleTextChange = (text: string) => {
    setContent(text);
    analyzeContent(text);
  };

  const handleInsertTemplate = () => {
    setContent(MARKDOWN_TEMPLATE_EXAMPLE);
    analyzeContent(MARKDOWN_TEMPLATE_EXAMPLE);
    if (!newCronogramaNome) {
      setNewCronogramaNome('Novo Cronograma Exemplo');
    }
  };

  const handleApply = () => {
    if (fullBackupPreview && importMode === 'full_backup') {
      onImportFullBackup(fullBackupPreview);
      onClose();
      return;
    }

    if (parsedPoints.length > 0) {
      if (importMode === 'new_cronograma' && !newCronogramaNome.trim()) {
        setError('Por favor, informe o nome do novo cronograma.');
        return;
      }

      const targetCronId = importMode === 'new_cronograma' ? uid() : activeCronogramaId;

      const converted: PontoEstudo[] = parsedPoints.map((p, idx) => ({
        id: uid() + idx,
        cronogramaId: targetCronId,
        data: p.data || '',
        materia: p.materia || 'Geral',
        titulo: p.titulo,
        tipoEstudo: p.tipoEstudo || 'doutrina',
        artigosLei: p.artigosLei || '',
        jurisprudenciaRef: p.jurisprudenciaRef || '',
        notas: p.notas || '',
        lido: false,
        qFeitas: false,
        qTotal: '',
        qAcertos: '',
        dif: null,
        showNotes: Boolean(p.notas),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      onImportPointsToSchedule(converted, {
        type: importMode as any,
        newCronogramaNome: newCronogramaNome.trim() || 'Novo Cronograma',
        newCronogramaEditalId: newCronogramaEditalId || undefined,
        targetCronogramaId: targetCronId
      });

      onClose();
    }
  };

  const activeCronogramaObj = cronogramas.find(c => c.id === activeCronogramaId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-200 text-zinc-800">
              <Upload className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-sans font-semibold text-base text-zinc-900">
              Alimentar & Importar Cronograma (JSON / Markdown)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          <p className="text-xs text-zinc-500">
            Importe seu cronograma a partir de um arquivo <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">.md</code> (Markdown), <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">.json</code> ou cole sua lista de estudos diretamente abaixo.
          </p>

          {/* File Picker & Quick Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 border border-dashed border-zinc-300 rounded-xl bg-zinc-50/50 text-center hover:border-zinc-400 transition-colors flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <FileJson className="w-4 h-4 text-zinc-500" />
              </div>
              <label className="cursor-pointer">
                <span className="inline-block px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition-colors">
                  Escolher arquivo (.md ou .json)
                </span>
                <input
                  type="file"
                  accept=".json,.md,.txt,text/plain,text/markdown,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Modelo rápido Markdown
                </span>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Preencha com matérias, tópicos e tipo (Doutrina, Lei Seca ou Jurisprudência).
                </p>
              </div>
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-700 hover:text-zinc-900 shadow-2xs mt-2 self-start"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Carregar exemplo de modelo</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Conteúdo do Arquivo / Texto
              </label>
              <span className="text-[11px] text-zinc-400">
                Suporta markdown com listas, tabelas ou texto direto
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={5}
              placeholder="Cole seu Markdown ou JSON aqui..."
              className="w-full text-xs p-3 font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Destination Selector */}
          {(parsedPoints.length > 0 || fullBackupPreview) && (
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Como deseja aplicar os dados importados?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('new_cronograma')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    importMode === 'new_cronograma'
                      ? 'bg-white border-zinc-900 ring-1 ring-zinc-900/10 font-semibold text-zinc-900 shadow-2xs'
                      : 'bg-zinc-100/70 border-zinc-200 text-zinc-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-zinc-800 font-semibold">
                    <Plus className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Novo Cronograma</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-normal">
                    Cria um cronograma exclusivo para este edital
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('append_current')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    importMode === 'append_current'
                      ? 'bg-white border-zinc-900 ring-1 ring-zinc-900/10 font-semibold text-zinc-900 shadow-2xs'
                      : 'bg-zinc-100/70 border-zinc-200 text-zinc-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-zinc-800 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Adicionar ao Atual</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-normal">
                    Acrescenta à grade selecionada ({activeCronogramaObj?.nome || 'Atual'})
                  </p>
                </button>

                {fullBackupPreview ? (
                  <button
                    type="button"
                    onClick={() => setImportMode('full_backup')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      importMode === 'full_backup'
                        ? 'bg-white border-zinc-900 ring-1 ring-zinc-900/10 font-semibold text-zinc-900 shadow-2xs'
                        : 'bg-zinc-100/70 border-zinc-200 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-zinc-800 font-semibold">
                      <FileJson className="w-3.5 h-3.5 text-zinc-900" />
                      <span>Restaurar Backup</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-normal">
                      Substitui o estado completo da aplicação
                    </p>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImportMode('replace_current')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      importMode === 'replace_current'
                        ? 'bg-white border-zinc-900 ring-1 ring-zinc-900/10 font-semibold text-zinc-900 shadow-2xs'
                        : 'bg-zinc-100/70 border-zinc-200 text-zinc-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-zinc-800 font-semibold">
                      <Upload className="w-3.5 h-3.5 text-zinc-900" />
                      <span>Substituir Atual</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-normal">
                      Substitui apenas os pontos do cronograma atual
                    </p>
                  </button>
                )}
              </div>

              {/* Options for New Cronograma */}
              {importMode === 'new_cronograma' && (
                <div className="pt-2 border-t border-zinc-200 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Nome do novo cronograma *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCronogramaNome}
                      onChange={(e) => setNewCronogramaNome(e.target.value)}
                      placeholder="Ex.: TJ-MA 2027 (Magistratura Estadual)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-hidden focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                      Vincular a um edital cadastrado (opcional)
                    </label>
                    <select
                      value={newCronogramaEditalId}
                      onChange={(e) => setNewCronogramaEditalId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer"
                    >
                      <option value="">Nenhum vínculo (Cronograma independente)</option>
                      {editais.map(e => (
                        <option key={e.id} value={e.id}>{e.nome} — {e.cargo || 'Geral'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Points Preview Table */}
          {parsedPoints.length > 0 && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-900 font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parsedPoints.length} tópicos identificados com sucesso</span>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto border border-emerald-200 rounded-lg bg-white divide-y divide-zinc-100">
                {parsedPoints.slice(0, 10).map((pt, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between gap-2 text-[11px]">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-800 uppercase mr-1.5">[{pt.materia}]</span>
                      <span className="text-zinc-900">{pt.titulo}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                      pt.tipoEstudo === 'lei_seca' ? 'bg-amber-100 text-amber-800' :
                      pt.tipoEstudo === 'jurisprudencia' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                      {pt.tipoEstudo === 'lei_seca' ? 'Lei Seca' : pt.tipoEstudo === 'jurisprudencia' ? 'Jurisprudência' : 'Doutrina'}
                    </span>
                  </div>
                ))}
                {parsedPoints.length > 10 && (
                  <div className="p-2 text-center text-zinc-400 font-mono text-[10px]">
                    + {parsedPoints.length - 10} outros tópicos na fila
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full JSON Backup Preview */}
          {fullBackupPreview && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Backup JSON Válido</span>
              </div>
              <p className="text-emerald-700">
                Contém <strong>{fullBackupPreview.pontos.length}</strong> pontos de estudo, <strong>{fullBackupPreview.cronogramas?.length || 1}</strong> cronogramas e <strong>{fullBackupPreview.editais?.length || 0}</strong> editais.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedPoints.length === 0 && !fullBackupPreview}
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 disabled:opacity-50 hover:bg-zinc-800 text-white rounded-lg shadow-2xs transition-colors"
            >
              {importMode === 'new_cronograma' ? 'Criar Novo Cronograma' :
               importMode === 'append_current' ? 'Adicionar ao Cronograma' :
               importMode === 'replace_current' ? 'Substituir Cronograma' : 'Restaurar Backup Completo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
