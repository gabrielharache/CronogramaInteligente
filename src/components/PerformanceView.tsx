import React, { useState, useMemo } from 'react';
import { PontoEstudo, SessaoEstudo, Cronograma, TipoEstudo } from '../types';
import { calcularPercentualAcerto, calcularDificuldadeAutomatica, getDificuldadeInfo, formatarDataBr } from '../utils/helpers';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Award,
  ArrowUpRight,
  Flame,
  ChevronDown,
  ChevronUp,
  Clock,
  PieChart,
  Calendar,
  Layers,
  Scale,
  Landmark,
  Filter,
  CalendarDays
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface PerformanceViewProps {
  pontos: PontoEstudo[];
  allPontos?: PontoEstudo[];
  materiasCores: Record<string, string>;
  sessoesEstudo?: SessaoEstudo[];
  cronogramas?: Cronograma[];
  activeCronogramaId?: string;
  onSelectPonto: (ponto: PontoEstudo) => void;
  onTabChange?: (tab: 'revisao') => void;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  pontos,
  allPontos = [],
  materiasCores,
  sessoesEstudo = [],
  cronogramas = [],
  activeCronogramaId = 'all',
  onSelectPonto,
  onTabChange
}) => {
  const [isSubjectPerformanceCollapsed, setIsSubjectPerformanceCollapsed] = useState(false);
  const [isDifficultyCollapsed, setIsDifficultyCollapsed] = useState(false);
  const [isTimeAnalyticsCollapsed, setIsTimeAnalyticsCollapsed] = useState(false);
  const [timeFilterSubject, setTimeFilterSubject] = useState<string>('todas');

  // Filter States
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [filterCronograma, setFilterCronograma] = useState<string>('all');
  const [filterStudyType, setFilterStudyType] = useState<string>('all');

  const rawPontos = allPontos.length > 0 ? allPontos : pontos;

  // 1. Reactive filtering of Points (pontos)
  const filteredPontos = useMemo(() => {
    let result = [...rawPontos];

    // Filter by Cronograma
    if (filterCronograma !== 'all') {
      result = result.filter(p => p.cronogramaId === filterCronograma);
    } else if (activeCronogramaId !== 'all') {
      // If parent active cronograma is set, follow it unless user selects another
      result = result.filter(p => p.cronogramaId === activeCronogramaId);
    }

    // Filter by Study Type
    if (filterStudyType !== 'all') {
      result = result.filter(p => p.tipoEstudo === filterStudyType);
    }

    // Filter by Date Period (checking ponto.data)
    if (filterPeriod !== 'all') {
      const cutoffDate = new Date();
      if (filterPeriod === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (filterPeriod === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
      else if (filterPeriod === '90d') cutoffDate.setDate(cutoffDate.getDate() - 90);

      const cutoffStr = cutoffDate.toISOString().slice(0, 10);
      result = result.filter(p => p.data && p.data >= cutoffStr);
    }

    return result;
  }, [rawPontos, filterCronograma, filterStudyType, filterPeriod, activeCronogramaId]);

  // 2. Reactive filtering of Study Sessions (sessoesEstudo)
  const filteredSessoes = useMemo(() => {
    let result = [...sessoesEstudo];

    // Filter by Cronograma
    if (filterCronograma !== 'all') {
      result = result.filter(s => s.cronogramaId === filterCronograma);
    } else if (activeCronogramaId !== 'all') {
      result = result.filter(s => s.cronogramaId === activeCronogramaId);
    }

    // Filter by Study Type
    if (filterStudyType !== 'all') {
      result = result.filter(s => s.tipoEstudo === filterStudyType);
    }

    // Filter by Date Period
    if (filterPeriod !== 'all') {
      const cutoffDate = new Date();
      if (filterPeriod === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (filterPeriod === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
      else if (filterPeriod === '90d') cutoffDate.setDate(cutoffDate.getDate() - 90);

      const cutoffStr = cutoffDate.toISOString().slice(0, 10);
      result = result.filter(s => s.data && s.data >= cutoffStr);
    }

    return result;
  }, [sessoesEstudo, filterCronograma, filterStudyType, filterPeriod, activeCronogramaId]);

  // Calculate Weeks Data for Recharts (Last 4 Calendar Weeks)
  const weeksData = useMemo(() => {
    const today = new Date();
    
    const getMondayOfDate = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      mon.setHours(0, 0, 0, 0);
      return mon;
    };

    const currentMonday = getMondayOfDate(today);
    const list: Date[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const m = new Date(currentMonday);
      m.setDate(m.getDate() - (i * 7));
      list.push(m);
    }

    return list.map((monday, idx) => {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const isCurrentWeek = idx === 3;
      const label = isCurrentWeek 
        ? "Esta Semana" 
        : `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth()+1).toString().padStart(2, '0')}`;

      return {
        monday,
        sunday,
        label,
        key: monday.toISOString().slice(0, 10)
      };
    });
  }, []);

  // Compute Weekly Study Hours Data for Recharts
  const rechartsWeeklyData = useMemo(() => {
    const subjectsInSessions = new Set<string>();

    const mappedWeeks = weeksData.map(week => {
      // Filter sessions belonging to this week
      const weekSessions = filteredSessoes.filter(s => {
        const sDate = new Date(s.data + 'T12:00:00');
        return sDate >= week.monday && sDate <= week.sunday;
      });

      const hoursBySubject: Record<string, number> = {};
      weekSessions.forEach(s => {
        subjectsInSessions.add(s.materia);
        const hours = s.duracaoSegundos / 3600;
        hoursBySubject[s.materia] = (hoursBySubject[s.materia] || 0) + hours;
      });

      const dataObj: Record<string, any> = {
        name: week.label,
      };

      Object.entries(hoursBySubject).forEach(([materia, val]) => {
        dataObj[materia] = parseFloat(val.toFixed(2));
      });

      return dataObj;
    });

    return {
      data: mappedWeeks,
      subjects: Array.from(subjectsInSessions)
    };
  }, [weeksData, filteredSessoes]);

  // Calculate Liquid Study Time Stats from filteredSessoes
  const timeStats = useMemo(() => {
    let totalSegundosGeral = 0;
    const porMateria: Record<string, { segundos: number; sessoes: number; assuntos: Record<string, number> }> = {};
    const porTipo: Record<'doutrina' | 'lei_seca' | 'jurisprudencia' | 'nao_classificado', { segundos: number; sessoes: number }> = {
      doutrina: { segundos: 0, sessoes: 0 },
      lei_seca: { segundos: 0, sessoes: 0 },
      jurisprudencia: { segundos: 0, sessoes: 0 },
      nao_classificado: { segundos: 0, sessoes: 0 }
    };

    filteredSessoes.forEach(s => {
      totalSegundosGeral += s.duracaoSegundos;

      const tipo = s.tipoEstudo || 'nao_classificado';
      if (porTipo[tipo]) {
        porTipo[tipo].segundos += s.duracaoSegundos;
        porTipo[tipo].sessoes += 1;
      } else {
        porTipo.nao_classificado.segundos += s.duracaoSegundos;
        porTipo.nao_classificado.sessoes += 1;
      }

      if (!porMateria[s.materia]) {
        porMateria[s.materia] = { segundos: 0, sessoes: 0, assuntos: {} };
      }
      porMateria[s.materia].segundos += s.duracaoSegundos;
      porMateria[s.materia].sessoes += 1;

      const assuntoNorm = s.assunto || 'Geral';
      porMateria[s.materia].assuntos[assuntoNorm] = (porMateria[s.materia].assuntos[assuntoNorm] || 0) + s.duracaoSegundos;
    });

    const rankingMaterias = Object.entries(porMateria).map(([materia, data]) => {
      const horas = data.segundos / 3600;
      const pct = totalSegundosGeral > 0 ? Math.round((data.segundos / totalSegundosGeral) * 100) : 0;
      const assuntosList = Object.entries(data.assuntos).map(([assunto, segs]) => ({
        assunto,
        segundos: segs,
        horas: segs / 3600
      })).sort((a, b) => b.segundos - a.segundos);

      return {
        materia,
        segundos: data.segundos,
        horas,
        sessoes: data.sessoes,
        pct,
        assuntos: assuntosList,
        cor: materiasCores[materia] || '#8C1C2C'
      };
    }).sort((a, b) => b.segundos - a.segundos);

    const rankingTipos = Object.entries(porTipo).map(([tipo, data]) => {
      const pct = totalSegundosGeral > 0 ? Math.round((data.segundos / totalSegundosGeral) * 100) : 0;
      return {
        tipo: tipo as 'doutrina' | 'lei_seca' | 'jurisprudencia' | 'nao_classificado',
        segundos: data.segundos,
        horas: data.segundos / 3600,
        sessoes: data.sessoes,
        pct
      };
    });

    // Format helper
    const formatHoursMinutes = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    const mediaPorSessaoMin = filteredSessoes.length > 0 
      ? Math.round((totalSegundosGeral / filteredSessoes.length) / 60) 
      : 0;

    return {
      totalSegundos: totalSegundosGeral,
      totalHoras: (totalSegundosGeral / 3600).toFixed(1),
      totalFormatado: formatHoursMinutes(totalSegundosGeral),
      mediaPorSessaoMin,
      totalSessoes: filteredSessoes.length,
      rankingMaterias,
      rankingTipos,
      formatHoursMinutes
    };
  }, [filteredSessoes, materiasCores]);

  // Aggregate stats per subject from filteredPontos
  const subjectStats: Record<string, {
    total: number;
    lidos: number;
    questoes: number;
    acertos: number;
    facil: number;
    medio: number;
    dificil: number;
  }> = {};

  let totalQuestoesGeral = 0;
  let totalAcertosGeral = 0;
  let pontosConcluidos = 0;
  let diffCount = { facil: 0, medio: 0, dificil: 0, sem: 0 };

  const pontosParaRevisao: Array<{ ponto: PontoEstudo; motivo: string; pct: number | null }> = [];

  (filteredPontos || []).forEach(p => {
    if (!subjectStats[p.materia]) {
      subjectStats[p.materia] = {
        total: 0,
        lidos: 0,
        questoes: 0,
        acertos: 0,
        facil: 0,
        medio: 0,
        dificil: 0
      };
    }

    const s = subjectStats[p.materia];
    s.total++;
    if (p.lido) s.lidos++;
    if (p.lido && p.qFeitas) pontosConcluidos++;

    const difAuto = calcularDificuldadeAutomatica(p);
    if (difAuto === 'facil') { s.facil++; diffCount.facil++; }
    else if (difAuto === 'medio') { s.medio++; diffCount.medio++; }
    else if (difAuto === 'dificil') { s.dificil++; diffCount.dificil++; }
    else { diffCount.sem++; }

    const t = typeof p.qTotal === 'number' ? p.qTotal : parseInt(String(p.qTotal), 10);
    const a = typeof p.qAcertos === 'number' ? p.qAcertos : parseInt(String(p.qAcertos), 10);
    const pct = calcularPercentualAcerto(p);

    if (t && !isNaN(t) && t > 0) {
      s.questoes += t;
      const acertosLimpos = !isNaN(a) ? Math.min(a, t) : 0;
      s.acertos += acertosLimpos;
      totalQuestoesGeral += t;
      totalAcertosGeral += acertosLimpos;
    }

    // Flag for revision
    if (p.lido) {
      if (difAuto === 'dificil') {
        pontosParaRevisao.push({ 
          ponto: p, 
          motivo: pct !== null ? `Difícil (${pct}% — ≤ 45%)` : 'Classificado como Difícil', 
          pct 
        });
      } else if (difAuto === 'medio' && pct !== null) {
        pontosParaRevisao.push({ 
          ponto: p, 
          motivo: `Médio (${pct}% — 46% a 69%)`, 
          pct 
        });
      }
    }
  });

  const subjectRanking = Object.entries(subjectStats).map(([materia, data]) => {
    const pctAcertos = data.questoes > 0 ? Math.round((data.acertos / data.questoes) * 100) : null;
    const pctLeitura = data.total > 0 ? Math.round((data.lidos / data.total) * 100) : 0;
    return {
      materia,
      ...data,
      pctAcertos,
      pctLeitura
    };
  }).sort((a, b) => {
    if (a.pctAcertos !== null && b.pctAcertos !== null) return b.pctAcertos - a.pctAcertos;
    if (a.pctAcertos !== null) return -1;
    if (b.pctAcertos !== null) return 1;
    return b.pctLeitura - a.pctLeitura;
  });

  const mediaGeralPct = totalQuestoesGeral > 0 ? Math.round((totalAcertosGeral / totalQuestoesGeral) * 100) : null;

  // Custom Tooltip for Recharts Stacked Bar Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + Number(entry.value || 0), 0);
      return (
        <div className="bg-white border border-zinc-200 p-3.5 rounded-xl shadow-lg font-sans text-xs space-y-2">
          <p className="font-bold text-zinc-950 border-b border-zinc-100 pb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-mono font-bold text-zinc-900">{entry.value.toFixed(1)}h</span>
              </div>
            ))}
          </div>
          {payload.length > 1 && (
            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-zinc-100 font-bold text-zinc-950">
              <span>Total Estudado</span>
              <span className="font-mono">{total.toFixed(1)}h</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* FILTER CONTROL PANEL */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
          <Filter className="w-4 h-4 text-zinc-700" />
          <h3 className="font-sans font-bold text-sm text-zinc-900">
            Filtros do Painel de Desempenho
          </h3>
          <span className="text-[10px] text-zinc-400 font-medium ml-auto">
            Métricas atualizadas em tempo real
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter 1: Período */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Período de Estudo
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="all">Todo o histórico</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>

          {/* Filter 2: Cronograma */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Cronograma / Edital
            </label>
            <select
              value={filterCronograma}
              onChange={(e) => setFilterCronograma(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="all">Todos os cronogramas</option>
              {cronogramas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Tipo de Estudo */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Tipo de Estudo
            </label>
            <select
              value={filterStudyType}
              onChange={(e) => setFilterStudyType(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="all">Todos os tipos</option>
              <option value="doutrina">Doutrina / Teoria</option>
              <option value="lei_seca">Lei Seca</option>
              <option value="jurisprudencia">Jurisprudência</option>
            </select>
          </div>
        </div>
      </div>

      {/* OVERVIEW STAT BLOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Tempo Líquido */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estudo Líquido Total</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {timeStats.totalHoras}h
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({timeStats.totalFormatado})
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {timeStats.totalSessoes} sessões • média <strong className="text-zinc-800 font-mono">{timeStats.mediaPorSessaoMin}m</strong>
          </div>
        </div>

        {/* Card 2: Aproveitamento */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aproveitamento</span>
            <Award className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {mediaGeralPct !== null ? `${mediaGeralPct}%` : '—'}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({totalAcertosGeral}/{totalQuestoesGeral} Qs)
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Meta: <span className="font-semibold text-zinc-800">80%+</span>
          </div>
        </div>

        {/* Card 3: Cobertura de Leitura */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cobertura do Edital</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {filteredPontos.length > 0 ? Math.round((filteredPontos.filter(p => p.lido).length / filteredPontos.length) * 100) : 0}%
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({filteredPontos.filter(p => p.lido).length}/{filteredPontos.length})
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Itens lidos e finalizados
          </div>
        </div>
      </div>

      {/* NEW BAR CHART SECTION (RECHARTS) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="pb-3.5 border-b border-zinc-100 mb-4">
          <h3 className="font-serif font-bold text-base sm:text-lg text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Evolução de Horas Estudadas por Matéria</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gráfico de barras empilhadas mostrando a carga horária líquida de estudos nas últimas 4 semanas.
          </p>
        </div>

        {rechartsWeeklyData.subjects.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            Nenhum estudo líquido registrado nas últimas semanas para as matérias selecionadas.
          </div>
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rechartsWeeklyData.data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7' }} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconSize={10} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                {rechartsWeeklyData.subjects.map((materia) => (
                  <Bar
                    key={materia}
                    dataKey={materia}
                    stackId="a"
                    fill={materiasCores[materia] || '#8C1C2C'}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* DETAILED ROTATIVE TIME BREAKDOWN */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 mb-4 gap-2">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Detalhamento de Estudo Líquido por Matéria & Assunto</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tempo real acumulado por assunto, ordenado pela duração das sessões focadas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={timeFilterSubject}
              onChange={(e) => setTimeFilterSubject(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="todas">Todas as matérias</option>
              {timeStats.rankingMaterias.map(m => (
                <option key={m.materia} value={m.materia}>{m.materia}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsTimeAnalyticsCollapsed(!isTimeAnalyticsCollapsed)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              {isTimeAnalyticsCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expandir</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!isTimeAnalyticsCollapsed && (
          <div className="space-y-6">
            {timeStats.rankingMaterias.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                Nenhuma sessão de estudo líquido registrada neste período.
              </div>
            ) : (
              <>
                {/* Progress bar visual distribution */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                    <span>Distribuição Proporcional</span>
                    <span className="font-mono text-zinc-500 font-bold">{timeStats.totalFormatado} totais</span>
                  </div>
                  <div className="w-full h-4 bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200/80">
                    {timeStats.rankingMaterias.map(item => (
                      <div
                        key={item.materia}
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.cor
                        }}
                        className="h-full transition-all duration-300"
                        title={`${item.materia}: ${timeStats.formatHoursMinutes(item.segundos)} (${item.pct}%)`}
                      />
                    ))}
                  </div>
                </div>

                {/* Donut chart + Legend */}
                <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 shadow-3xs">
                  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Ring graphics */}
                    <div className="relative w-40 h-44 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#f4f4f5"
                          strokeWidth="10"
                        />
                        {timeStats.totalSegundos > 0 ? (
                          timeStats.rankingMaterias.map((item, index, arr) => {
                            const circumference = 251.327;
                            let priorPercentSum = 0;
                            for (let idx = 0; idx < index; idx++) {
                              priorPercentSum += arr[idx].pct;
                            }
                            const dashArray = `${(item.pct / 100) * circumference} ${circumference}`;
                            const dashOffset = -((priorPercentSum / 100) * circumference);

                            return (
                              <circle
                                key={item.materia}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={item.cor}
                                strokeWidth="10"
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="butt"
                                className="transition-all duration-300 hover:stroke-[12] cursor-pointer"
                              />
                            );
                          })
                        ) : null}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                          Tempo Focado
                        </span>
                        <span className="font-mono text-lg font-extrabold text-zinc-800 leading-none mt-0.5">
                          {timeStats.totalFormatado}
                        </span>
                      </div>
                    </div>

                    {/* Detailed legends */}
                    <div className="flex-1 w-full space-y-4">
                      <div className="text-sm font-semibold text-zinc-800 pb-2 border-b border-zinc-100">
                        Tempo por Matéria
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[180px] overflow-y-auto pr-1">
                        {timeStats.rankingMaterias.map(item => (
                          <div key={item.materia} className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors">
                            <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.cor }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-zinc-800 truncate">{item.materia}</span>
                                <span className="text-[10px] font-mono font-semibold text-zinc-500">{item.pct}%</span>
                              </div>
                              <div className="text-xs font-mono font-bold text-zinc-950 mt-0.5">
                                {timeStats.formatHoursMinutes(item.segundos)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-grid of horizontal bars & topics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left list of progress */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                      Visualização de Ranking
                    </div>
                    <div className="space-y-2.5">
                      {timeStats.rankingMaterias.map(item => (
                        <div
                          key={item.materia}
                          onClick={() => setTimeFilterSubject(item.materia)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            timeFilterSubject === item.materia 
                              ? 'bg-zinc-50 border-zinc-400 ring-1 ring-zinc-900 shadow-3xs' 
                              : 'bg-white border-zinc-200/80 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                              <span className="font-bold text-xs text-zinc-900 truncate">{item.materia}</span>
                            </div>
                            <span className="font-mono font-bold text-xs text-zinc-900 shrink-0">
                              {timeStats.formatHoursMinutes(item.segundos)}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.pct}%`, backgroundColor: item.cor }}
                              className="h-full rounded-full transition-all duration-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right topics breakdown */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                      Detalhamento de Assuntos
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {timeStats.rankingMaterias
                        .filter(m => timeFilterSubject === 'todas' || m.materia === timeFilterSubject)
                        .flatMap(m => m.assuntos.map(a => ({ ...a, materia: m.materia, cor: m.cor })))
                        .sort((a, b) => b.segundos - a.segundos)
                        .map(topic => {
                          const topicPct = timeStats.totalSegundos > 0 
                            ? Math.round((topic.segundos / timeStats.totalSegundos) * 100) 
                            : 0;

                          return (
                            <div key={`${topic.materia}-${topic.assunto}`} className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: topic.cor }}>
                                  {topic.materia}
                                </span>
                                <span className="font-mono text-xs font-bold text-zinc-900">{timeStats.formatHoursMinutes(topic.segundos)}</span>
                              </div>
                              <div className="font-medium text-xs text-zinc-800 truncate">{topic.assunto}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* DETAILED LIST BY SUBJECT AND ACCOMPLISHMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: List of all Subjects */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <div>
              <h3 className="font-sans font-semibold text-base sm:text-lg text-zinc-900">
                Aproveitamento por Matéria
              </h3>
              <p className="text-xs text-zinc-500">
                Taxa de acerto em exercícios e percentual lido por edital.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setIsSubjectPerformanceCollapsed(!isSubjectPerformanceCollapsed)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-md border border-zinc-200 cursor-pointer"
            >
              {isSubjectPerformanceCollapsed ? "Expandir" : "Recolher"}
            </button>
          </div>

          {!isSubjectPerformanceCollapsed && (
            <div className="space-y-3">
              {subjectRanking.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              ) : (
                subjectRanking.map(item => {
                  const color = materiasCores[item.materia] || '#3F3F46';
                  const hasQuestoes = item.questoes > 0;
                  const pct = item.pctAcertos;

                  const diffConfig = pct !== null 
                    ? (pct >= 70 
                        ? { barBg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                        : pct >= 46
                        ? { barBg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-800 border-amber-200' }
                        : { barBg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200' })
                    : { barBg: 'bg-zinc-300', text: 'text-zinc-500', badge: 'bg-zinc-100 text-zinc-500 border-zinc-200' };

                  return (
                    <div key={item.materia} className="p-3 bg-zinc-50/50 border border-zinc-200 rounded-xl">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color }} />
                          <span className="font-bold text-xs text-zinc-900 truncate">{item.materia}</span>
                        </div>
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${diffConfig.badge}`}>
                          {pct !== null ? `${pct}% acertos` : 'Sem questões'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-100">
                        {/* Reading stats */}
                        <div className="bg-white p-2.5 rounded-lg border border-zinc-200/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-zinc-500 font-medium">Leitura ({item.lidos}/{item.total})</span>
                            <span className="font-mono font-bold text-zinc-900">{item.pctLeitura}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div style={{ width: `${item.pctLeitura}%`, backgroundColor: color }} className="h-full rounded-full" />
                          </div>
                        </div>

                        {/* Questions stats */}
                        <div className="bg-white p-2.5 rounded-lg border border-zinc-200/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-zinc-500 font-medium">Acertos ({hasQuestoes ? `${item.acertos}/${item.questoes} Qs` : '0 Qs'})</span>
                            <span className={`font-mono font-bold ${diffConfig.text}`}>{pct !== null ? `${pct}%` : '—'}</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            {hasQuestoes && pct !== null ? (
                              <div style={{ width: `${pct}%` }} className={`h-full rounded-full ${diffConfig.barBg}`} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: Classification */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-sans font-semibold text-sm text-zinc-900">
              Classificação Automática
            </h3>
            <button
              type="button"
              onClick={() => setIsDifficultyCollapsed(!isDifficultyCollapsed)}
              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
            >
              {isDifficultyCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isDifficultyCollapsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Fácil (≥ 70%)
                </span>
                <span className="font-mono text-xs font-bold text-emerald-900">{diffCount.facil}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Médio (46% a 69%)
                </span>
                <span className="font-mono text-xs font-bold text-amber-900">{diffCount.medio}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-200 rounded-lg">
                <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  Difícil (≤ 45%)
                </span>
                <span className="font-mono text-xs font-bold text-rose-900">{diffCount.dificil}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                  Não classificado
                </span>
                <span className="font-mono text-xs font-bold text-zinc-700">{diffCount.sem}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
