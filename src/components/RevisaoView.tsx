import React, { useState, useMemo } from 'react';
import { PontoEstudo } from '../types';
import { calcularPercentualAcerto, calcularDificuldadeAutomatica, formatarDataBr } from '../utils/helpers';
import { 
  Flame, 
  Search, 
  Filter, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Calendar,
  BookOpen,
  Scale,
  Landmark,
  FileText,
  Clock,
  HelpCircle,
  Copy
} from 'lucide-react';

interface RevisaoViewProps {
  pontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  onSelectPonto: (ponto: PontoEstudo) => void;
  onDuplicatePonto: (ponto: PontoEstudo) => void;
  onUpdatePonto: (id: string, updated: Partial<PontoEstudo>) => void;
}

export const RevisaoView: React.FC<RevisaoViewProps> = ({
  pontos,
  materiasCores,
  onSelectPonto,
  onDuplicatePonto,
  onUpdatePonto
}) => {
  const [search, setSearch] = useState('');
  const [selectedMateria, setSelectedMateria] = useState<string>('todas');
  const [selectedDificuldade, setSelectedDificuldade] = useState<string>('todas');
  const [selectedTipoEstudo, setSelectedTipoEstudo] = useState<string>('todos');

  // Process and compute the list of points requiring revision
  const pontosParaRevisao = useMemo(() => {
    const list: Array<{ ponto: PontoEstudo; motivo: string; pct: number | null; difAuto: string }> = [];
    
    (pontos || []).forEach(p => {
      const difAuto = calcularDificuldadeAutomatica(p);
      const pct = calcularPercentualAcerto(p);

      // We only flag lido (studied) points with issues for revision
      if (p.lido) {
        if (difAuto === 'dificil') {
          list.push({ 
            ponto: p, 
            motivo: pct !== null ? `Difícil (${pct}% — ≤ 45%)` : 'Classificado como Difícil', 
            pct,
            difAuto
          });
        } else if (difAuto === 'medio' && pct !== null) {
          list.push({ 
            ponto: p, 
            motivo: `Médio (${pct}% — 46% a 69%)`, 
            pct,
            difAuto
          });
        }
      }
    });

    return list;
  }, [pontos]);

  // Extract unique subjects that have items in the revision radar
  const materiasNaRevisao = useMemo(() => {
    const set = new Set<string>();
    pontosParaRevisao.forEach(item => set.add(item.ponto.materia));
    return Array.from(set).sort();
  }, [pontosParaRevisao]);

  // Filtering logic
  const filteredRevisoes = useMemo(() => {
    return pontosParaRevisao.filter(({ ponto, difAuto }) => {
      const matchesSearch = 
        ponto.titulo.toLowerCase().includes(search.toLowerCase()) ||
        ponto.materia.toLowerCase().includes(search.toLowerCase()) ||
        (ponto.artigosLei && ponto.artigosLei.toLowerCase().includes(search.toLowerCase())) ||
        (ponto.jurisprudenciaRef && ponto.jurisprudenciaRef.toLowerCase().includes(search.toLowerCase()));

      const matchesMateria = selectedMateria === 'todas' || ponto.materia === selectedMateria;
      const matchesDificuldade = selectedDificuldade === 'todas' || difAuto === selectedDificuldade;
      const matchesTipoEstudo = selectedTipoEstudo === 'todos' || ponto.tipoEstudo === selectedTipoEstudo;

      return matchesSearch && matchesMateria && matchesDificuldade && matchesTipoEstudo;
    });
  }, [pontosParaRevisao, search, selectedMateria, selectedDificuldade, selectedTipoEstudo]);

  // Stats
  const stats = useMemo(() => {
    const total = pontosParaRevisao.length;
    const difíceis = pontosParaRevisao.filter(item => item.difAuto === 'dificil').length;
    const médios = pontosParaRevisao.filter(item => item.difAuto === 'medio').length;
    
    let totalPctSum = 0;
    let pctCount = 0;
    pontosParaRevisao.forEach(item => {
      if (item.pct !== null) {
        totalPctSum += item.pct;
        pctCount++;
      }
    });
    const mediaAproveitamento = pctCount > 0 ? Math.round(totalPctSum / pctCount) : null;

    return {
      total,
      difíceis,
      médios,
      mediaAproveitamento
    };
  }, [pontosParaRevisao]);

  // Handle Mark as Revised (resets performance to allow re-evaluation, or updates it)
  const handleMarkAsRevised = (pontoId: string) => {
    onUpdatePonto(pontoId, {
      qFeitas: false,
      qTotal: '',
      qAcertos: '',
      dif: null,
      updatedAt: Date.now()
    });
  };

  const getTipoEstudoIcon = (tipo?: string) => {
    switch (tipo) {
      case 'doutrina':
        return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'lei_seca':
        return <Scale className="w-3.5 h-3.5 text-emerald-500" />;
      case 'jurisprudencia':
        return <Landmark className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getTipoEstudoLabel = (tipo?: string) => {
    switch (tipo) {
      case 'doutrina': return 'Doutrina';
      case 'lei_seca': return 'Lei Seca';
      case 'jurisprudencia': return 'Jurisprudência';
      default: return 'Geral';
    }
  };

  return (
    <div className="space-y-6" id="secao-revisao-container">
      {/* Overview stats specific to Revision */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="revisao-metricas-grid">
        {/* Metric 1: Total Revisions */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs" id="metrica-total-revisoes">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Radar de Revisão</span>
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {stats.total}
            </span>
            <span className="text-xs text-zinc-400">tópicos prioritários</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Dificuldade alta ou taxa &lt; 70%
          </p>
        </div>

        {/* Metric 2: Highly Critical */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs" id="metrica-dificeis">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Altamente Críticos</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-rose-600">
              {stats.difíceis}
            </span>
            <span className="text-xs text-zinc-400">itens (Difícil)</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Aproveitamento igual ou inferior a 45%
          </p>
        </div>

        {/* Metric 3: Moderately Critical */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs" id="metrica-medios">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Atenção Média</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-amber-600">
              {stats.médios}
            </span>
            <span className="text-xs text-zinc-400">itens (Médio)</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Aproveitamento entre 46% e 69%
          </p>
        </div>

        {/* Metric 4: Average Correct Rate for revision items */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs" id="metrica-aproveitamento-medio">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aproveitamento Médio</span>
            <HelpCircle className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {stats.mediaAproveitamento !== null ? `${stats.mediaAproveitamento}%` : '—'}
            </span>
            <span className="text-xs text-zinc-400">dos itens listados</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Aproveitamento médio geral do radar
          </p>
        </div>
      </div>

      {/* Filter and Content section */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs" id="painel-revisoes">
        {/* Filters and Header */}
        <div className="p-4 border-b border-zinc-100 space-y-3" id="filtros-revisao-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Selecione os tópicos prioritários para revisar doutrina, lei seca e fazer novas baterias de questões.
            </p>
            
            <div className="text-xs font-mono font-bold bg-zinc-100 border border-zinc-200 rounded-md px-2.5 py-1 text-zinc-700 self-start sm:self-auto shrink-0">
              Exibindo {filteredRevisoes.length} de {pontosParaRevisao.length} itens
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1" id="inputs-filtros-revisao">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar assunto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <select
                value={selectedMateria}
                onChange={(e) => setSelectedMateria(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
              >
                <option value="todas">Todas as Matérias</option>
                {materiasNaRevisao.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <select
                value={selectedDificuldade}
                onChange={(e) => setSelectedDificuldade(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
              >
                <option value="todas">Todas as Urgências</option>
                <option value="dificil">Altamente Crítico (Difícil)</option>
                <option value="medio">Atenção Média (Médio)</option>
              </select>
              <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
            </div>

            {/* Study Type Filter */}
            <div className="relative">
              <select
                value={selectedTipoEstudo}
                onChange={(e) => setSelectedTipoEstudo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
              >
                <option value="todos">Todos os Métodos</option>
                <option value="doutrina">Doutrina</option>
                <option value="lei_seca">Lei Seca</option>
                <option value="jurisprudencia">Jurisprudência</option>
              </select>
              <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Content list / Cards */}
        <div className="p-4" id="lista-revisoes-conteudo">
          {filteredRevisoes.length === 0 ? (
            <div className="py-12 text-center text-zinc-500" id="nenhum-item-revisao">
              <Flame className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Nenhum tópico para revisão encontrado</p>
              <p className="text-xs text-zinc-400 mt-1">
                {pontosParaRevisao.length === 0 
                  ? "Parabéns! Seus tópicos lidos possuem aproveitamento satisfatório acima de 70%." 
                  : "Experimente alterar os critérios de busca ou filtros."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="grid-cards-revisao">
              {filteredRevisoes.map(({ ponto, motivo, pct, difAuto }) => {
                const color = materiasCores[ponto.materia] || '#52525b';
                
                return (
                  <div
                    key={ponto.id}
                    className={`flex flex-col justify-between border rounded-xl p-4 transition-all hover:shadow-xs group relative bg-white ${
                      difAuto === 'dificil' 
                        ? 'border-rose-100 hover:border-rose-300 shadow-3xs' 
                        : 'border-amber-100 hover:border-amber-300 shadow-3xs'
                    }`}
                    id={`card-revisao-${ponto.id}`}
                  >
                    {/* Top strip with Subject tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span 
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider truncate"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          {ponto.materia}
                        </span>
                        
                        <div 
                          className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 shrink-0"
                          title={`Método: ${getTipoEstudoLabel(ponto.tipoEstudo)}`}
                        >
                          {getTipoEstudoIcon(ponto.tipoEstudo)}
                          <span className="truncate max-w-[60px]">{getTipoEstudoLabel(ponto.tipoEstudo)}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-zinc-300" />
                        {formatarDataBr(ponto.data)}
                      </div>
                    </div>

                    {/* Title */}
                    <h4 
                      onClick={() => onSelectPonto(ponto)}
                      className="font-sans font-bold text-sm text-zinc-900 group-hover:text-zinc-800 leading-tight line-clamp-2 cursor-pointer hover:underline mb-2"
                      title="Clique para ver detalhes do ponto"
                    >
                      {ponto.titulo}
                    </h4>

                    {/* Meta info / articles */}
                    {(ponto.artigosLei || ponto.jurisprudenciaRef) && (
                      <div className="text-[11px] text-zinc-500 bg-zinc-50/50 rounded-lg p-2 mb-3 border border-zinc-100/60 font-medium">
                        {ponto.artigosLei && (
                          <div className="truncate" title={ponto.artigosLei}>
                            <strong className="text-zinc-700">Artigos:</strong> {ponto.artigosLei}
                          </div>
                        )}
                        {ponto.jurisprudenciaRef && (
                          <div className="truncate" title={ponto.jurisprudenciaRef}>
                            <strong className="text-zinc-700">Jurispr.:</strong> {ponto.jurisprudenciaRef}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom motive and Actions */}
                    <div className="mt-auto pt-3 border-t border-zinc-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          difAuto === 'dificil' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                          {motivo}
                        </span>
                        
                        {pct !== null && (
                          <span className="text-xs font-mono font-extrabold text-zinc-700">
                            {pct}% acertos
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectPonto(ponto)}
                          className="flex items-center justify-center gap-1 py-1 px-1 text-[10px] font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                          title="Abrir detalhes"
                        >
                          Detalhes
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => onDuplicatePonto(ponto)}
                          className="flex items-center justify-center gap-1 py-1 px-1 text-[10px] font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                          title="Agendar nova revisão (Duplicar ponto daqui a 7 dias)"
                        >
                          <Copy className="w-3 h-3 text-zinc-500" />
                          Re-agendar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkAsRevised(ponto.id)}
                          className="flex items-center justify-center gap-1 py-1 px-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Limpar questões e marcar para refazer avaliação"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Revisado
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
