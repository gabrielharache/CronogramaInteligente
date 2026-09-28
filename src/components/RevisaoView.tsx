import React, { useState, useMemo } from 'react';
import { PontoEstudo, RevisaoAgendada, TipoRevisaoEspacada, BateriaQuestoes } from '../types';
import { 
  calcularPercentualAcerto, 
  calcularDificuldadeAutomatica, 
  formatarDataBr,
  hojeStr,
  calcularEvolucaoQuestoes,
  calcularStatusRevisao,
  REVISOES_ESPACADAS_CONFIG,
  addDays,
  uid,
  getDificuldadeInfo
} from '../utils/helpers';
import { 
  Flame, 
  Search, 
  Filter, 
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
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  Plus,
  Trash2,
  CalendarClock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RevisaoViewProps {
  pontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  onSelectPonto: (ponto: PontoEstudo) => void;
  onDuplicatePonto: (ponto: PontoEstudo) => void;
  onUpdatePonto: (id: string, updated: Partial<PontoEstudo>) => void;
}

interface ItemRevisaoEspacada {
  ponto: PontoEstudo;
  revisao: RevisaoAgendada;
  statusInfo: ReturnType<typeof calcularStatusRevisao>;
  evolucao: ReturnType<typeof calcularEvolucaoQuestoes>;
}

export const RevisaoView: React.FC<RevisaoViewProps> = ({
  pontos = [],
  materiasCores = {},
  onSelectPonto,
  onDuplicatePonto,
  onUpdatePonto
}) => {
  const hoje = hojeStr();

  // Active sub-tab in Revisões view: Spaced Repetitions vs Difficulty Radar
  const [subTab, setSubTab] = useState<'espacadas' | 'radar'>('espacadas');

  // Filters for Spaced Repetitions
  const [searchEspacada, setSearchEspacada] = useState('');
  const [statusFilterEspacada, setStatusFilterEspacada] = useState<'todas' | 'hoje_atrasadas' | 'proximas' | 'concluidas'>('todas');
  const [cicloFilterEspacada, setCicloFilterEspacada] = useState<string>('todos');
  const [materiaFilterEspacada, setMateriaFilterEspacada] = useState<string>('todas');

  // Quick Question Batch inline modal/card state for a specific review
  const [batchPontoId, setBatchPontoId] = useState<string | null>(null);
  const [batchAcertos, setBatchAcertos] = useState<number | ''>('');
  const [batchTotal, setBatchTotal] = useState<number | ''>('');
  const [batchTipo, setBatchTipo] = useState<string>('');
  const [batchNotas, setBatchNotas] = useState<string>('');

  // Filters for Radar
  const [searchRadar, setSearchRadar] = useState('');
  const [selectedMateriaRadar, setSelectedMateriaRadar] = useState<string>('todas');
  const [selectedDificuldadeRadar, setSelectedDificuldadeRadar] = useState<string>('todas');
  const [selectedTipoEstudoRadar, setSelectedTipoEstudoRadar] = useState<string>('todos');

  // 1. Compute all Spaced Repetitions across all points
  const todasRevisoesEspacadas = useMemo<ItemRevisaoEspacada[]>(() => {
    const list: ItemRevisaoEspacada[] = [];

    pontos.forEach(p => {
      const historico = p.historicoQuestoes && p.historicoQuestoes.length > 0 
        ? p.historicoQuestoes 
        : (p.qFeitas && p.qTotal && Number(p.qTotal) > 0 ? [{
            id: 'init-' + p.id,
            data: p.data || hoje,
            qAcertos: typeof p.qAcertos === 'number' ? p.qAcertos : (parseInt(String(p.qAcertos), 10) || 0),
            qTotal: typeof p.qTotal === 'number' ? p.qTotal : (parseInt(String(p.qTotal), 10) || 1),
            pct: calcularPercentualAcerto(p) || 0,
            createdAt: p.createdAt || Date.now()
          }] : []);

      const evolucao = calcularEvolucaoQuestoes(historico);

      (p.revisoesEspacadas || []).forEach(rev => {
        const statusInfo = calcularStatusRevisao(rev, hoje);
        list.push({
          ponto: p,
          revisao: rev,
          statusInfo,
          evolucao
        });
      });
    });

    // Sort order: Overdue first, then Today, then upcoming soonest, then completed
    return list.sort((a, b) => {
      if (a.revisao.concluida && !b.revisao.concluida) return 1;
      if (!a.revisao.concluida && b.revisao.concluida) return -1;
      return (a.revisao.dataPrevista || '').localeCompare(b.revisao.dataPrevista || '');
    });
  }, [pontos, hoje]);

  // Unique subjects with scheduled reviews
  const materiasEspacadas = useMemo(() => {
    const set = new Set<string>();
    todasRevisoesEspacadas.forEach(i => set.add(i.ponto.materia));
    return Array.from(set).sort();
  }, [todasRevisoesEspacadas]);

  // Filtered Spaced Repetitions
  const filteredEspacadas = useMemo(() => {
    return todasRevisoesEspacadas.filter(({ ponto, revisao, statusInfo }) => {
      const matchesSearch = 
        ponto.titulo.toLowerCase().includes(searchEspacada.toLowerCase()) ||
        ponto.materia.toLowerCase().includes(searchEspacada.toLowerCase()) ||
        (ponto.artigosLei && ponto.artigosLei.toLowerCase().includes(searchEspacada.toLowerCase())) ||
        (ponto.jurisprudenciaRef && ponto.jurisprudenciaRef.toLowerCase().includes(searchEspacada.toLowerCase()));

      const matchesMateria = materiaFilterEspacada === 'todas' || ponto.materia === materiaFilterEspacada;
      const matchesCiclo = cicloFilterEspacada === 'todos' || revisao.tipo === cicloFilterEspacada;

      let matchesStatus = true;
      if (statusFilterEspacada === 'hoje_atrasadas') {
        matchesStatus = !revisao.concluida && (statusInfo.status === 'hoje' || statusInfo.status === 'atrasada');
      } else if (statusFilterEspacada === 'proximas') {
        matchesStatus = !revisao.concluida && statusInfo.status === 'proxima';
      } else if (statusFilterEspacada === 'concluidas') {
        matchesStatus = revisao.concluida;
      }

      return matchesSearch && matchesMateria && matchesCiclo && matchesStatus;
    });
  }, [todasRevisoesEspacadas, searchEspacada, materiaFilterEspacada, cicloFilterEspacada, statusFilterEspacada]);

  // Spaced Repetition Stats
  const statsEspacadas = useMemo(() => {
    const total = todasRevisoesEspacadas.length;
    const atrasadasEHoje = todasRevisoesEspacadas.filter(
      i => !i.revisao.concluida && (i.statusInfo.status === 'hoje' || i.statusInfo.status === 'atrasada')
    ).length;
    const proximas7d = todasRevisoesEspacadas.filter(
      i => !i.revisao.concluida && i.statusInfo.status === 'proxima' && i.statusInfo.diasDiff <= 7
    ).length;
    const concluidas = todasRevisoesEspacadas.filter(i => i.revisao.concluida).length;
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      atrasadasEHoje,
      proximas7d,
      concluidas,
      taxaConclusao
    };
  }, [todasRevisoesEspacadas]);

  // 2. Compute radar points (topics studied with issues / < 70%)
  const pontosParaRadar = useMemo(() => {
    const list: Array<{ 
      ponto: PontoEstudo; 
      motivo: string; 
      pct: number | null; 
      difAuto: string;
      evolucao: ReturnType<typeof calcularEvolucaoQuestoes>;
    }> = [];
    
    (pontos || []).forEach(p => {
      const difAuto = calcularDificuldadeAutomatica(p);
      const pct = calcularPercentualAcerto(p);

      const historico = p.historicoQuestoes && p.historicoQuestoes.length > 0 
        ? p.historicoQuestoes 
        : (p.qFeitas && p.qTotal && Number(p.qTotal) > 0 ? [{
            id: 'init-' + p.id,
            data: p.data || hoje,
            qAcertos: typeof p.qAcertos === 'number' ? p.qAcertos : (parseInt(String(p.qAcertos), 10) || 0),
            qTotal: typeof p.qTotal === 'number' ? p.qTotal : (parseInt(String(p.qTotal), 10) || 1),
            pct: pct || 0,
            createdAt: p.createdAt || Date.now()
          }] : []);

      const evolucao = calcularEvolucaoQuestoes(historico);

      if (p.lido) {
        if (difAuto === 'dificil') {
          list.push({ 
            ponto: p, 
            motivo: pct !== null ? `Difícil (${pct}% — ≤ 45%)` : 'Classificado como Difícil', 
            pct,
            difAuto,
            evolucao
          });
        } else if (difAuto === 'medio' && pct !== null) {
          list.push({ 
            ponto: p, 
            motivo: `Médio (${pct}% — 46% a 69%)`, 
            pct,
            difAuto,
            evolucao
          });
        }
      }
    });

    return list;
  }, [pontos, hoje]);

  const materiasNaRadar = useMemo(() => {
    const set = new Set<string>();
    pontosParaRadar.forEach(item => set.add(item.ponto.materia));
    return Array.from(set).sort();
  }, [pontosParaRadar]);

  const filteredRadar = useMemo(() => {
    return pontosParaRadar.filter(({ ponto, difAuto }) => {
      const matchesSearch = 
        ponto.titulo.toLowerCase().includes(searchRadar.toLowerCase()) ||
        ponto.materia.toLowerCase().includes(searchRadar.toLowerCase()) ||
        (ponto.artigosLei && ponto.artigosLei.toLowerCase().includes(searchRadar.toLowerCase())) ||
        (ponto.jurisprudenciaRef && ponto.jurisprudenciaRef.toLowerCase().includes(searchRadar.toLowerCase()));

      const matchesMateria = selectedMateriaRadar === 'todas' || ponto.materia === selectedMateriaRadar;
      const matchesDificuldade = selectedDificuldadeRadar === 'todas' || difAuto === selectedDificuldadeRadar;
      const matchesTipoEstudo = selectedTipoEstudoRadar === 'todos' || ponto.tipoEstudo === selectedTipoEstudoRadar;

      return matchesSearch && matchesMateria && matchesDificuldade && matchesTipoEstudo;
    });
  }, [pontosParaRadar, searchRadar, selectedMateriaRadar, selectedDificuldadeRadar, selectedTipoEstudoRadar]);

  const statsRadar = useMemo(() => {
    const total = pontosParaRadar.length;
    const difíceis = pontosParaRadar.filter(item => item.difAuto === 'dificil').length;
    const médios = pontosParaRadar.filter(item => item.difAuto === 'medio').length;
    
    let totalPctSum = 0;
    let pctCount = 0;
    pontosParaRadar.forEach(item => {
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
  }, [pontosParaRadar]);

  // Handlers
  const handleToggleConcluida = (pontoId: string, revisaoId: string) => {
    const ponto = pontos.find(p => p.id === pontoId);
    if (!ponto || !ponto.revisoesEspacadas) return;

    const nextRevisoes = ponto.revisoesEspacadas.map(r => {
      if (r.id === revisaoId) {
        const nextConcluida = !r.concluida;
        return {
          ...r,
          concluida: nextConcluida,
          concluidaEm: nextConcluida ? hoje : undefined
        };
      }
      return r;
    });

    onUpdatePonto(pontoId, { revisoesEspacadas: nextRevisoes, updatedAt: Date.now() });
  };

  const handleRemoveSpacedRevision = (pontoId: string, revisaoId: string) => {
    const ponto = pontos.find(p => p.id === pontoId);
    if (!ponto || !ponto.revisoesEspacadas) return;

    onUpdatePonto(pontoId, {
      revisoesEspacadas: ponto.revisoesEspacadas.filter(r => r.id !== revisaoId),
      updatedAt: Date.now()
    });
  };

  const handleScheduleNextStage = (pontoId: string, currentTipo: TipoRevisaoEspacada) => {
    const ponto = pontos.find(p => p.id === pontoId);
    if (!ponto) return;

    let proximoTipo: TipoRevisaoEspacada = '7d';
    if (currentTipo === '24h') proximoTipo = '7d';
    else if (currentTipo === '7d') proximoTipo = '30d';
    else if (currentTipo === '30d') proximoTipo = '60d';
    else proximoTipo = 'personalizada';

    const config = REVISOES_ESPACADAS_CONFIG[proximoTipo];
    const dataPrevista = addDays(hoje, config.dias || 15);

    const nova: RevisaoAgendada = {
      id: uid(),
      tipo: proximoTipo,
      dataPrevista,
      concluida: false,
      createdAt: Date.now()
    };

    const currentRevisoes = ponto.revisoesEspacadas || [];
    onUpdatePonto(pontoId, {
      revisoesEspacadas: [...currentRevisoes, nova],
      updatedAt: Date.now()
    });
  };

  const handleScheduleQuickForRadar = (pontoId: string, tipo: TipoRevisaoEspacada) => {
    const ponto = pontos.find(p => p.id === pontoId);
    if (!ponto) return;

    const config = REVISOES_ESPACADAS_CONFIG[tipo];
    const dataPrevista = addDays(hoje, config.dias);

    const nova: RevisaoAgendada = {
      id: uid(),
      tipo,
      dataPrevista,
      concluida: false,
      createdAt: Date.now()
    };

    const currentRevisoes = ponto.revisoesEspacadas || [];
    // Only add if not already scheduled for that type
    if (currentRevisoes.some(r => r.tipo === tipo && !r.concluida)) {
      alert(`Este ponto já possui uma revisão ${config.label} agendada pendente!`);
      return;
    }

    onUpdatePonto(pontoId, {
      revisoesEspacadas: [...currentRevisoes, nova],
      updatedAt: Date.now()
    });
  };

  const handleScheduleCycleForRadar = (pontoId: string) => {
    const ponto = pontos.find(p => p.id === pontoId);
    if (!ponto) return;

    const baseDate = hoje;
    const tipos: TipoRevisaoEspacada[] = ['24h', '7d', '30d', '60d'];
    const existing = new Set((ponto.revisoesEspacadas || []).map(r => r.tipo));
    const novos: RevisaoAgendada[] = [];

    tipos.forEach(t => {
      if (!existing.has(t)) {
        novos.push({
          id: uid(),
          tipo: t,
          dataPrevista: addDays(baseDate, REVISOES_ESPACADAS_CONFIG[t].dias),
          concluida: false,
          createdAt: Date.now()
        });
      }
    });

    onUpdatePonto(pontoId, {
      revisoesEspacadas: [...(ponto.revisoesEspacadas || []), ...novos],
      updatedAt: Date.now()
    });
  };

  const handleSaveBatchDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchPontoId) return;
    const ponto = pontos.find(p => p.id === batchPontoId);
    if (!ponto) return;

    const acertos = typeof batchAcertos === 'number' ? batchAcertos : parseInt(String(batchAcertos), 10) || 0;
    const total = typeof batchTotal === 'number' ? batchTotal : parseInt(String(batchTotal), 10) || 0;
    if (total <= 0) return;

    const acertosReal = Math.min(acertos, total);
    const pct = Math.round((acertosReal / total) * 100);
    const dif = calcularDificuldadeAutomatica({ qAcertos: acertosReal, qTotal: total });

    const novaBateria: BateriaQuestoes = {
      id: uid(),
      data: hoje,
      qAcertos: acertosReal,
      qTotal: total,
      pct,
      dif,
      tipo: batchTipo.trim() || `Revisão (${hoje})`,
      notas: batchNotas.trim() || undefined,
      createdAt: Date.now()
    };

    const currentHistorico = ponto.historicoQuestoes || [];
    onUpdatePonto(batchPontoId, {
      historicoQuestoes: [...currentHistorico, novaBateria],
      qAcertos: acertosReal,
      qTotal: total,
      qFeitas: true,
      dif,
      updatedAt: Date.now()
    });

    setBatchPontoId(null);
    setBatchAcertos('');
    setBatchTotal('');
    setBatchTipo('');
    setBatchNotas('');
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
      {/* Top Main Navigation Tabs: Spaced Repetition vs Difficulty Radar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-fit">
          <button
            type="button"
            onClick={() => setSubTab('espacadas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'espacadas'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Régua de Revisões Espaçadas</span>
            {statsEspacadas.atrasadasEHoje > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                {statsEspacadas.atrasadasEHoje} hoje
              </span>
            ) : statsEspacadas.total > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700">
                {statsEspacadas.total}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('radar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'radar'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Radar de Desempenho</span>
            {statsRadar.total > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900">
                {statsRadar.total}
              </span>
            )}
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          {subTab === 'espacadas'
            ? '📌 As revisões agendadas não poluem o calendário principal: aparecem exclusivamente aqui para seu cumprimento diário.'
            : '🎯 Tópicos lidos com rendimento &lt; 70% ou difíceis para reforço ativo.'}
        </p>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: RÉGUA DE REVISÕES ESPAÇADAS (SPACED REPETITION) */}
      {/* ======================================================== */}
      {subTab === 'espacadas' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: Due Today & Overdue */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Para Hoje & Atrasadas</span>
                <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-2xl sm:text-3xl font-bold ${
                  statsEspacadas.atrasadasEHoje > 0 ? 'text-rose-600' : 'text-zinc-900'
                }`}>
                  {statsEspacadas.atrasadasEHoje}
                </span>
                <span className="text-xs text-zinc-400">revisões pendentes</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Prazo vencido ou previsto para hoje
              </p>
            </div>

            {/* Metric 2: Upcoming next 7 days */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Próximos 7 Dias</span>
                <CalendarClock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-indigo-700">
                  {statsEspacadas.proximas7d}
                </span>
                <span className="text-xs text-zinc-400">no horizonte</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Revisões agendadas para esta semana
              </p>
            </div>

            {/* Metric 3: Completed */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Concluídas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-600">
                  {statsEspacadas.concluidas}
                </span>
                <span className="text-xs text-zinc-400">de {statsEspacadas.total} no total</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Revisões cumpridas com sucesso
              </p>
            </div>

            {/* Metric 4: Completion Rate */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Taxa de Conclusão</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
                  {statsEspacadas.taxaConclusao}%
                </span>
                <span className="text-xs text-zinc-400">das programadas</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Índice de retenção e assiduidade
              </p>
            </div>
          </div>

          {/* Filter Bar & List */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs">
            <div className="p-4 border-b border-zinc-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  Acompanhe e cumpra suas revisões de 24h, 7 dias, 30 dias e 60 dias diretamente nesta central.
                </p>
                <div className="text-xs font-mono font-bold bg-zinc-100 border border-zinc-200 rounded-md px-2.5 py-1 text-zinc-700 self-start sm:self-auto shrink-0">
                  Exibindo {filteredEspacadas.length} de {todasRevisoesEspacadas.length} revisões
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar tópico ou matéria..."
                    value={searchEspacada}
                    onChange={(e) => setSearchEspacada(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilterEspacada}
                    onChange={(e) => setStatusFilterEspacada(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
                  >
                    <option value="todas">Todos os Status</option>
                    <option value="hoje_atrasadas">Para Hoje & Atrasadas</option>
                    <option value="proximas">Próximas (Futuras)</option>
                    <option value="concluidas">Apenas Concluídas</option>
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>

                {/* Ciclo Filter */}
                <div className="relative">
                  <select
                    value={cicloFilterEspacada}
                    onChange={(e) => setCicloFilterEspacada(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
                  >
                    <option value="todos">Todos os Ciclos</option>
                    <option value="24h">R24h (1 dia)</option>
                    <option value="7d">R7d (7 dias)</option>
                    <option value="30d">R30d (30 dias)</option>
                    <option value="60d">R60d (60 dias)</option>
                    <option value="personalizada">Personalizada</option>
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>

                {/* Subject Filter */}
                <div className="relative">
                  <select
                    value={materiaFilterEspacada}
                    onChange={(e) => setMateriaFilterEspacada(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
                  >
                    <option value="todas">Todas as Matérias</option>
                    {materiasEspacadas.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* List / Cards */}
            <div className="p-4">
              {filteredEspacadas.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <RotateCcw className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Nenhuma revisão espaçada encontrada</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    {todasRevisoesEspacadas.length === 0
                      ? "Abra qualquer card de estudo no Cronograma ou clique na aba 'Radar de Desempenho' e clique em 'Agendar Ciclo' para iniciar sua repetição espaçada."
                      : "Altere os filtros de busca para visualizar outras etapas agendadas."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEspacadas.map(({ ponto, revisao, statusInfo, evolucao }) => {
                    const color = materiasCores[ponto.materia] || '#52525b';
                    const config = REVISOES_ESPACADAS_CONFIG[revisao.tipo] || { label: revisao.tipo, badgeClass: 'bg-zinc-100 text-zinc-700' };

                    return (
                      <div
                        key={revisao.id}
                        className={`flex flex-col justify-between border rounded-xl p-4 transition-all hover:shadow-xs group relative bg-white ${
                          revisao.concluida
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : statusInfo.status === 'hoje'
                            ? 'border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                            : statusInfo.status === 'atrasada'
                            ? 'border-rose-200 bg-rose-50/15'
                            : 'border-zinc-200 shadow-3xs'
                        }`}
                      >
                        {/* Top: Subject + Cycle Badge + Status */}
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span 
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider truncate text-white"
                                style={{ backgroundColor: color }}
                              >
                                {ponto.materia}
                              </span>

                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${config.badgeClass}`}>
                                {config.label}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 
                            onClick={() => onSelectPonto(ponto)}
                            className="font-sans font-bold text-sm text-zinc-900 group-hover:text-zinc-800 leading-tight line-clamp-2 cursor-pointer hover:underline mb-1"
                            title="Clique para ver o card completo do tópico"
                          >
                            {ponto.titulo}
                          </h4>

                          {/* Original Study Date and Method */}
                          <div className="flex items-center flex-wrap gap-2 text-[10px] text-zinc-400 font-mono mb-2">
                            <span>Estudo base: {formatarDataBr(ponto.data)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {getTipoEstudoIcon(ponto.tipoEstudo)}
                              <span>{getTipoEstudoLabel(ponto.tipoEstudo)}</span>
                            </span>
                          </div>

                          {/* Snippet Articles / Notes */}
                          {(ponto.artigosLei || ponto.notas) && (
                            <div className="text-[11px] text-zinc-500 bg-zinc-50/60 rounded-md p-2 mb-3 border border-zinc-100 font-medium">
                              {ponto.artigosLei && (
                                <div className="truncate mb-0.5" title={ponto.artigosLei}>
                                  <strong className="text-zinc-700">Artigos:</strong> {ponto.artigosLei}
                                </div>
                              )}
                              {ponto.notas && (
                                <div className="truncate font-serif italic text-zinc-600" title={ponto.notas}>
                                  {ponto.notas}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Performance & Evolution preview */}
                          {evolucao.totalBaterias > 0 && (
                            <div className="flex items-center justify-between text-[11px] mb-3 bg-zinc-50 px-2 py-1 rounded border border-zinc-150/70">
                              <span className="text-zinc-500 font-medium">Desempenho:</span>
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-bold text-zinc-800">
                                  {evolucao.ultima?.pct}%
                                </span>
                                {evolucao.delta !== null && evolucao.totalBaterias > 1 && (
                                  <span className={`text-[10px] font-bold px-1 rounded ${
                                    evolucao.trend === 'up'
                                      ? 'text-emerald-700 bg-emerald-100'
                                      : evolucao.trend === 'down'
                                      ? 'text-rose-700 bg-rose-100'
                                      : 'text-zinc-600 bg-zinc-200'
                                  }`}>
                                    {evolucao.delta > 0 ? `+${evolucao.delta}%` : `${evolucao.delta}%`}
                                  </span>
                                )}
                                <span className="text-zinc-400 text-[10px]">
                                  ({evolucao.totalBaterias}ª rodada)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Toggle Concluded */}
                            <button
                              type="button"
                              onClick={() => handleToggleConcluida(ponto.id, revisao.id)}
                              className={`flex items-center justify-center gap-1 py-1 px-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                revisao.concluida
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-zinc-900 text-white hover:bg-black shadow-2xs'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{revisao.concluida ? 'Concluída' : 'Marcar Feita'}</span>
                            </button>

                            {/* Log Questions Batch */}
                            <button
                              type="button"
                              onClick={() => {
                                setBatchPontoId(ponto.id);
                                setBatchTipo(`Revisão ${config.label}`);
                                setBatchAcertos('');
                                setBatchTotal('');
                                setBatchNotas('');
                              }}
                              className="flex items-center justify-center gap-1 py-1 px-1.5 text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                              title="Registrar quantidade de questões resolvidas nesta revisão"
                            >
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              <span>+ Questões</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400">
                            {/* Schedule next stage button */}
                            {revisao.tipo !== '60d' && revisao.tipo !== 'personalizada' ? (
                              <button
                                type="button"
                                onClick={() => handleScheduleNextStage(ponto.id, revisao.tipo)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Avançar para próximo ciclo</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : <span />}

                            <button
                              type="button"
                              onClick={() => handleRemoveSpacedRevision(ponto.id, revisao.id)}
                              className="hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              title="Remover esta revisão agendada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: RADAR DE DESEMPENHO (BAIXO APROVEITAMENTO)     */}
      {/* ======================================================== */}
      {subTab === 'radar' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Radar Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="revisao-metricas-grid">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Radar Crítico</span>
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
                  {statsRadar.total}
                </span>
                <span className="text-xs text-zinc-400">tópicos prioritários</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Aproveitamento abaixo de 70%
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Altamente Críticos</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-rose-600">
                  {statsRadar.difíceis}
                </span>
                <span className="text-xs text-zinc-400">itens (Difícil)</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Taxa de acertos ≤ 45%
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Atenção Média</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-amber-600">
                  {statsRadar.médios}
                </span>
                <span className="text-xs text-zinc-400">itens (Médio)</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Taxa entre 46% e 69%
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">Aproveitamento Médio</span>
                <HelpCircle className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
                  {statsRadar.mediaAproveitamento !== null ? `${statsRadar.mediaAproveitamento}%` : '—'}
                </span>
                <span className="text-xs text-zinc-400">dos itens listados</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Média geral dos tópicos de reforço
              </p>
            </div>
          </div>

          {/* Filter Bar & List for Radar */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs">
            <div className="p-4 border-b border-zinc-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  Agende revisões espaçadas de 24h ou ciclo completo diretamente nos tópicos que exigem maior retenção.
                </p>
                <div className="text-xs font-mono font-bold bg-zinc-100 border border-zinc-200 rounded-md px-2.5 py-1 text-zinc-700 self-start sm:self-auto shrink-0">
                  Exibindo {filteredRadar.length} de {pontosParaRadar.length} itens
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar assunto..."
                    value={searchRadar}
                    onChange={(e) => setSearchRadar(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedMateriaRadar}
                    onChange={(e) => setSelectedMateriaRadar(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
                  >
                    <option value="todas">Todas as Matérias</option>
                    {materiasNaRadar.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedDificuldadeRadar}
                    onChange={(e) => setSelectedDificuldadeRadar(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 appearance-none cursor-pointer"
                  >
                    <option value="todas">Todas as Urgências</option>
                    <option value="dificil">Altamente Crítico (Difícil)</option>
                    <option value="medio">Atenção Média (Médio)</option>
                  </select>
                  <Filter className="absolute right-3 top-2.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedTipoEstudoRadar}
                    onChange={(e) => setSelectedTipoEstudoRadar(e.target.value)}
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

            {/* Radar Cards */}
            <div className="p-4">
              {filteredRadar.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <Flame className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Nenhum tópico para revisão encontrado</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {pontosParaRadar.length === 0 
                      ? "Parabéns! Seus tópicos lidos possuem aproveitamento satisfatório acima de 70%." 
                      : "Experimente alterar os critérios de busca ou filtros."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredRadar.map(({ ponto, motivo, pct, difAuto, evolucao }) => {
                    const color = materiasCores[ponto.materia] || '#52525b';
                    const hasSpacedScheduled = (ponto.revisoesEspacadas || []).some(r => !r.concluida);

                    return (
                      <div
                        key={ponto.id}
                        className={`flex flex-col justify-between border rounded-xl p-4 transition-all hover:shadow-xs group relative bg-white ${
                          difAuto === 'dificil' 
                            ? 'border-rose-100 hover:border-rose-300 shadow-3xs' 
                            : 'border-amber-100 hover:border-amber-300 shadow-3xs'
                        }`}
                      >
                        <div>
                          {/* Top Tag & Date */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span 
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider truncate text-white"
                                style={{ backgroundColor: color }}
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

                          {/* Question Evolution info */}
                          {evolucao.totalBaterias > 1 && evolucao.delta !== null && (
                            <div className="flex items-center justify-between text-[11px] mb-3 bg-zinc-50 px-2 py-1 rounded border border-zinc-150/70 font-mono">
                              <span className="text-zinc-500 font-sans">Histórico de {evolucao.totalBaterias} baterias:</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                evolucao.trend === 'up'
                                  ? 'text-emerald-700 bg-emerald-100'
                                  : 'text-rose-700 bg-rose-100'
                              }`}>
                                {evolucao.primeira?.pct}% ➔ {evolucao.ultima?.pct}% ({evolucao.delta > 0 ? `+${evolucao.delta}%` : `${evolucao.delta}%`})
                              </span>
                            </div>
                          )}
                        </div>

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

                          {/* 1-Click Spaced Repetition Triggers */}
                          <div className="bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 flex items-center justify-between gap-1 text-[11px]">
                            <span className="text-indigo-800 font-semibold text-[10px] flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-indigo-600" />
                              <span>Régua:</span>
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleScheduleQuickForRadar(ponto.id, '24h')}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded hover:bg-indigo-50 cursor-pointer"
                                title="Agendar revisão em 24h na aba de revisões"
                              >
                                + R24h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleScheduleCycleForRadar(ponto.id)}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 cursor-pointer shadow-3xs"
                                title="Agendar ciclo completo (24h, 7d, 30d, 60d)"
                              >
                                + Ciclo Completo
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => onSelectPonto(ponto)}
                              className="flex items-center justify-center gap-1 py-1 px-1 text-[10px] font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                              title="Abrir detalhes e anotações do ponto"
                            >
                              Ver Card
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setBatchPontoId(ponto.id);
                                setBatchTipo('Nova bateria de recuperação');
                                setBatchAcertos('');
                                setBatchTotal('');
                                setBatchNotas('');
                              }}
                              className="flex items-center justify-center gap-1 py-1 px-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Registrar nova bateria de questões para recalcular o aproveitamento"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>+ Questões</span>
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
      )}

      {/* Modal / Quick Dialog for Logging a New Question Attempt */}
      {batchPontoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div 
            className="bg-white border border-zinc-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-zinc-900">Registrar Bateria de Questões</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchPontoId(null)}
                className="text-zinc-400 hover:text-zinc-700 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBatchDirect} className="space-y-3">
              <p className="text-xs text-zinc-500">
                Esta tentativa será salva no histórico cumulativo do card e atualizará seu percentual e evolução.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Acertos:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 17"
                    value={batchAcertos}
                    onChange={(e) => setBatchAcertos(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-sm font-mono font-bold px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Total de Questões:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ex: 20"
                    value={batchTotal}
                    onChange={(e) => setBatchTotal(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-sm font-mono font-bold px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Contexto / Tipo de Bateria:</label>
                <input
                  type="text"
                  placeholder="Ex: Revisão 24h, Bateria FGV, Simulado..."
                  value={batchTipo}
                  onChange={(e) => setBatchTipo(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Anotações / Pontos de atenção (opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Errei jurisprudência do STJ sobre súmula..."
                  value={batchNotas}
                  onChange={(e) => setBatchNotas(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setBatchPontoId(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                >
                  Salvar Bateria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
