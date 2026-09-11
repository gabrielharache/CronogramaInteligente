import React, { useState, useMemo } from 'react';
import { PontoEstudo, SessaoEstudo } from '../types';
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
  Landmark
} from 'lucide-react';

interface PerformanceViewProps {
  pontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  sessoesEstudo?: SessaoEstudo[];
  onSelectPonto: (ponto: PontoEstudo) => void;
  onTabChange?: (tab: 'revisao') => void;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  pontos,
  materiasCores,
  sessoesEstudo = [],
  onSelectPonto,
  onTabChange
}) => {
  const [isSubjectPerformanceCollapsed, setIsSubjectPerformanceCollapsed] = useState(false);
  const [isRadarCollapsed, setIsRadarCollapsed] = useState(false);
  const [isDifficultyCollapsed, setIsDifficultyCollapsed] = useState(false);
  const [isTimeAnalyticsCollapsed, setIsTimeAnalyticsCollapsed] = useState(false);
  const [timeFilterSubject, setTimeFilterSubject] = useState<string>('todas');

  // Calculate Liquid Study Time Stats from sessoesEstudo
  const timeStats = useMemo(() => {
    let totalSegundosGeral = 0;
    const porMateria: Record<string, { segundos: number; sessoes: number; assuntos: Record<string, number> }> = {};
    const porTipo: Record<'doutrina' | 'lei_seca' | 'jurisprudencia' | 'nao_classificado', { segundos: number; sessoes: number }> = {
      doutrina: { segundos: 0, sessoes: 0 },
      lei_seca: { segundos: 0, sessoes: 0 },
      jurisprudencia: { segundos: 0, sessoes: 0 },
      nao_classificado: { segundos: 0, sessoes: 0 }
    };

    (sessoesEstudo || []).forEach(s => {
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

    const mediaPorSessaoMin = sessoesEstudo.length > 0 
      ? Math.round((totalSegundosGeral / sessoesEstudo.length) / 60) 
      : 0;

    return {
      totalSegundos: totalSegundosGeral,
      totalHoras: (totalSegundosGeral / 3600).toFixed(1),
      totalFormatado: formatHoursMinutes(totalSegundosGeral),
      mediaPorSessaoMin,
      totalSessoes: sessoesEstudo.length,
      rankingMaterias,
      rankingTipos,
      formatHoursMinutes
    };
  }, [sessoesEstudo, materiasCores]);

  // Aggregate stats per subject
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

  (pontos || []).forEach(p => {
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

    // Flag for revision: only studied (lido) points with difAuto difícil (<=45%) or médio (46-69%)
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

  return (
    <div className="space-y-4">
      {/* Overview Stat Blocks (3 Metrics) */}
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
            {timeStats.totalSessoes} sessões • média <strong className="text-zinc-800">{timeStats.mediaPorSessaoMin} min</strong>
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
              {pontos.length > 0 ? Math.round((pontos.filter(p => p.lido).length / pontos.length) * 100) : 0}%
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({pontos.filter(p => p.lido).length}/{pontos.length})
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Itens lidos e finalizados
          </div>
        </div>
      </div>

      {/* NEW SECTION: Controle de Estudo Líquido por Matéria e Assunto */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 mb-4 gap-2">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Horas de Estudo Líquido por Matéria & Assunto</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tempo real contabilizado pelo Modo Foco, visualizado com as cores personalizadas de cada matéria.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by subject for topic breakdown */}
            <select
              value={timeFilterSubject}
              onChange={(e) => setTimeFilterSubject(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
                Nenhuma sessão de estudo líquido registrada ainda. Utilize a aba "Modo Foco" para cronometrar seus estudos!
              </div>
            ) : (
              <>
                {/* Multi-colored Visual Distribution Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                    <span>Distribuição Proporcional do Tempo de Estudo</span>
                    <span className="font-mono text-zinc-500">{timeStats.totalFormatado} acumuladas</span>
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

                {/* Visual Distribution by Subject (Matéria) */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-zinc-500" />
                    <span>Tempo Líquido por Matéria (Gráfico de Rosca)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      const totalSegundos = timeStats.rankingMaterias.reduce((sum, item) => sum + item.segundos, 0);

                      // radius = 40, circumference = 2 * PI * 40 ≈ 251.327
                      const circumference = 251.327;
                      let currentOffset = 0;

                      // Map chart data
                      const chartData = timeStats.rankingMaterias.map(item => {
                        const pct = totalSegundos > 0 ? (item.segundos / totalSegundos) * 100 : 0;
                        const dashArray = `${(pct / 100) * circumference} ${circumference}`;
                        const dashOffset = -currentOffset;
                        currentOffset += (pct / 100) * circumference;

                        return {
                          ...item,
                          pct,
                          dashArray,
                          dashOffset
                        };
                      });

                      return (
                        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-3xs">
                          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                            {/* Gráfico Pizza / Donut no lado Esquerdo */}
                            <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                {/* Background Circle */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  stroke="#f4f4f5"
                                  strokeWidth="10"
                                />
                                {totalSegundos > 0 ? (
                                  chartData.map((item) => (
                                    <circle
                                      key={item.materia}
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="transparent"
                                      stroke={item.cor}
                                      strokeWidth="10"
                                      strokeDasharray={item.dashArray}
                                      strokeDashoffset={item.dashOffset}
                                      strokeLinecap="butt"
                                      className="transition-all duration-500 ease-out hover:stroke-[12] cursor-pointer"
                                      title={`${item.materia}: ${item.pct.toFixed(1)}%`}
                                    />
                                  ))
                                ) : (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#e4e4e7"
                                    strokeWidth="10"
                                  />
                                )}
                              </svg>
                              {/* Center Text inside Donut */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-sans">
                                  Foco Total
                                </span>
                                <span className="font-mono text-xl sm:text-2xl font-extrabold text-zinc-800 leading-none mt-0.5">
                                  {timeStats.formatHoursMinutes(totalSegundos)}
                                </span>
                              </div>
                            </div>

                            {/* Legenda Detalhada na Direita */}
                            <div className="flex-1 w-full space-y-4">
                              <div className="text-sm font-semibold text-zinc-800 pb-2 border-b border-zinc-100">
                                Proporção por Matéria
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                                {chartData.map(item => {
                                  return (
                                    <div key={item.materia} className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors">
                                      <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 bg-zinc-50 border-zinc-200"
                                        style={{ color: item.cor }}
                                      >
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-bold text-zinc-800 truncate">
                                            {item.materia}
                                          </span>
                                          <span className="text-[10px] font-mono font-semibold text-zinc-500 shrink-0">
                                            {item.pct.toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5 mt-0.5">
                                          <span className="text-sm font-mono font-bold text-zinc-900">
                                            {timeStats.formatHoursMinutes(item.segundos)}
                                          </span>
                                          <span className="text-[10px] text-zinc-400 font-sans">
                                            • {item.sessoes} {item.sessoes === 1 ? 'sessão' : 'sessões'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Grid: Left Column = Horizontal Subject Bars | Right Column = Topic Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Matérias Ranking & Progress Bars */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                      Tempo por Matéria
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
                              <span 
                                className="w-3 h-3 rounded-full shrink-0 shadow-3xs" 
                                style={{ backgroundColor: item.cor }} 
                              />
                              <span className="font-bold text-xs text-zinc-900 truncate">
                                {item.materia}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ({item.sessoes} {item.sessoes === 1 ? 'sessão' : 'sessões'})
                              </span>
                            </div>

                            <div className="flex items-baseline gap-1.5 shrink-0">
                              <span className="font-mono font-bold text-xs text-zinc-900">
                                {timeStats.formatHoursMinutes(item.segundos)}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400">
                                ({item.pct}%)
                              </span>
                            </div>
                          </div>

                          {/* Progress bar using exact subject color */}
                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ 
                                width: `${item.pct}%`,
                                backgroundColor: item.cor 
                              }}
                              className="h-full rounded-full transition-all duration-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Topic / Assunto Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono">
                      <span>Detalhamento por Assunto</span>
                      {timeFilterSubject !== 'todas' && (
                        <button
                          onClick={() => setTimeFilterSubject('todas')}
                          className="text-[10px] font-sans font-semibold text-blue-600 hover:underline cursor-pointer lowercase"
                        >
                          ver todos
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                      {timeStats.rankingMaterias
                        .filter(m => timeFilterSubject === 'todas' || m.materia === timeFilterSubject)
                        .flatMap(m => m.assuntos.map(a => ({ ...a, materia: m.materia, cor: m.cor })))
                        .sort((a, b) => b.segundos - a.segundos)
                        .map(topic => {
                          const topicPct = timeStats.totalSegundos > 0 
                            ? Math.round((topic.segundos / timeStats.totalSegundos) * 100) 
                            : 0;

                          return (
                            <div 
                              key={`${topic.materia}-${topic.assunto}`}
                              className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80 hover:border-zinc-300 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span 
                                  className="text-[10px] font-bold uppercase tracking-wider truncate"
                                  style={{ color: topic.cor }}
                                >
                                  {topic.materia}
                                </span>
                                <span className="font-mono text-xs font-bold text-zinc-900 shrink-0">
                                  {timeStats.formatHoursMinutes(topic.segundos)}
                                </span>
                              </div>

                              <div className="font-medium text-xs text-zinc-800 leading-snug truncate">
                                {topic.assunto}
                              </div>

                              <div className="mt-1.5 w-full bg-zinc-200/60 h-1.5 rounded-full overflow-hidden">
                                <div
                                  style={{ 
                                    width: `${Math.max(4, topicPct)}%`,
                                    backgroundColor: topic.cor 
                                  }}
                                  className="h-full rounded-full transition-all"
                                />
                              </div>
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

      {/* Breakdown per Subject & Difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Subject Performance Ranking */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
            <div>
              <h3 className="font-sans font-semibold text-base sm:text-lg text-zinc-900">
                Desempenho por Matéria
              </h3>
              <p className="text-xs text-zinc-500">
                Rendimento nas questões e status de leitura por matéria.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSubjectPerformanceCollapsed(!isSubjectPerformanceCollapsed)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 rounded-md border border-zinc-200 transition-colors cursor-pointer"
                title={isSubjectPerformanceCollapsed ? "Expandir lista detalhada" : "Recolher lista"}
              >
                {isSubjectPerformanceCollapsed ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Expandir ({subjectRanking.length})</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Recolher</span>
                  </>
                )}
              </button>
              <BarChart3 className="w-4 h-4 text-zinc-400" />
            </div>
          </div>

          {isSubjectPerformanceCollapsed ? (
            /* Collapsed compact overview */
            <div className="py-2">
              <div className="flex flex-wrap gap-2">
                {subjectRanking.map(item => {
                  const color = materiasCores[item.materia] || '#3F3F46';
                  const pct = item.pctAcertos;
                  const diffBadge = pct !== null 
                    ? (pct >= 70 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : pct >= 46
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200')
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200';

                  return (
                    <button
                      key={item.materia}
                      onClick={() => setIsSubjectPerformanceCollapsed(false)}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-medium text-zinc-800 truncate max-w-[120px]">{item.materia}</span>
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${diffBadge}`}>
                        {pct !== null ? `${pct}%` : `${item.pctLeitura}% lido`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                {subjectRanking.length} matérias cadastradas. Clique em Expandir para visualizar as barras de progresso e rendimento detalhado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectRanking.map(item => {
                const color = materiasCores[item.materia] || '#3F3F46';
                const hasQuestoes = item.questoes > 0;
                const pct = item.pctAcertos;
                
                // Color coding by performance / automatic difficulty
                const diffConfig = pct !== null 
                  ? (pct >= 70 
                      ? { barBg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Fácil (≥70%)' }
                      : pct >= 46
                      ? { barBg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Médio (46-69%)' }
                      : { barBg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-200', label: 'Difícil (≤45%)' })
                  : { barBg: 'bg-zinc-300', text: 'text-zinc-500', badge: 'bg-zinc-100 text-zinc-500 border-zinc-200', label: 'Sem questões' };

                return (
                  <div key={item.materia} className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl hover:border-zinc-300 transition-colors">
                    {/* Subject Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: color }} 
                        />
                        <span className="font-semibold text-sm text-zinc-900 truncate">{item.materia}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">({item.total} tópicos)</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                        <span className={`font-bold px-2.5 py-0.5 rounded-md border ${diffConfig.badge}`}>
                          {pct !== null ? `${pct}% acertos` : 'Sem questões'}
                        </span>
                      </div>
                    </div>

                    {/* Dual Visual Metrics: Leitura do Edital & Aproveitamento das Questões */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2.5 border-t border-zinc-200/70">
                      {/* Leitura */}
                      <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70 shadow-2xs">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-zinc-600 font-medium flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                            Leitura ({item.lidos}/{item.total})
                          </span>
                          <span className="font-mono font-semibold text-zinc-900">
                            {item.pctLeitura}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/60">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.pctLeitura}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>

                      {/* Questões: Barra corresponde exatamente a Acertos / Total de Questões */}
                      <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70 shadow-2xs">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-zinc-600 font-medium flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-zinc-500" />
                            Acertos ({hasQuestoes ? `${item.acertos}/${item.questoes} Qs` : '0 Qs'})
                          </span>
                          <span className={`font-mono font-bold ${diffConfig.text}`}>
                            {pct !== null ? `${pct}%` : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/60">
                          {hasQuestoes && pct !== null ? (
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${diffConfig.barBg}`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          ) : (
                            <div className="h-full w-0 bg-transparent" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Difficulty & Revision Radar */}
        <div className="space-y-4">
          {/* Difficulty breakdown */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-sans font-semibold text-base text-zinc-900">
                Classificação Automática
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-400 font-mono">Por acertos</span>
                <button
                  type="button"
                  onClick={() => setIsDifficultyCollapsed(!isDifficultyCollapsed)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                  title={isDifficultyCollapsed ? "Expandir" : "Recolher"}
                >
                  {isDifficultyCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            
            {!isDifficultyCollapsed && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">
                  <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Fácil <span className="text-[10px] text-emerald-600 font-normal">(≥ 70%)</span></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-900">
                    {diffCount.facil}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-amber-50/50 border border-amber-200/80 rounded-lg">
                  <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Médio <span className="text-[10px] text-amber-600 font-normal">(46% a 69%)</span></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-900">
                    {diffCount.medio}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-rose-50/50 border border-rose-200/80 rounded-lg">
                  <span className="text-xs font-medium text-rose-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Difícil <span className="text-[10px] text-rose-600 font-normal">(≤ 45%)</span></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-900">
                    {diffCount.dificil}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                    <span>Não classificado <span className="text-[10px] text-zinc-400 font-normal">(sem questões)</span></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-700">
                    {diffCount.sem}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
