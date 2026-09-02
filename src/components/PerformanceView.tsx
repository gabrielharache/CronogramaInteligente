import React, { useState } from 'react';
import { PontoEstudo } from '../types';
import { calcularPercentualAcerto, calcularDificuldadeAutomatica, getDificuldadeInfo, formatarDataBr } from '../utils/helpers';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Award,
  ArrowUpRight,
  Flame,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PerformanceViewProps {
  pontos: PontoEstudo[];
  materiasCores: Record<string, string>;
  onSelectPonto: (ponto: PontoEstudo) => void;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  pontos,
  materiasCores,
  onSelectPonto
}) => {
  const [isSubjectPerformanceCollapsed, setIsSubjectPerformanceCollapsed] = useState(false);
  const [isRadarCollapsed, setIsRadarCollapsed] = useState(false);
  const [isDifficultyCollapsed, setIsDifficultyCollapsed] = useState(false);

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

  pontos.forEach(p => {
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

    // Flag for revision: difAuto difícil (<=45%) or médio (46-69%)
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
      {/* Notion Overview Stat Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">Aproveitamento Médio</span>
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
            Meta de aprovação: <span className="font-semibold text-zinc-800">80%+</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">Cobertura de Leitura</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {pontos.length > 0 ? Math.round((pontos.filter(p => p.lido).length / pontos.length) * 100) : 0}%
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({pontos.filter(p => p.lido).length} de {pontos.length})
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Itens concluídos: <span className="font-semibold text-zinc-800">{pontosConcluidos}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider">Radar de Revisão</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-zinc-900">
              {pontosParaRevisao.length}
            </span>
            <span className="text-xs text-zinc-400">
              tópicos prioritários
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Dificuldade alta ou taxa &lt; 70%
          </div>
        </div>
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

          {/* Revision List */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs transition-all">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-semibold text-base text-zinc-900">
                  Radar de Revisão
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {pontosParaRevisao.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRadarCollapsed(!isRadarCollapsed)}
                className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title={isRadarCollapsed ? "Expandir radar" : "Recolher radar"}
              >
                {isRadarCollapsed ? (
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

            {!isRadarCollapsed && (
              <>
                {pontosParaRevisao.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    Nenhum tópico com dificuldade alta ou rendimento &lt; 70%.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {pontosParaRevisao.slice(0, 15).map(({ ponto, motivo }) => (
                      <div
                        key={ponto.id}
                        onClick={() => onSelectPonto(ponto)}
                        className="p-2.5 bg-zinc-50/70 border border-zinc-200 hover:border-zinc-900 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] mb-0.5">
                          <span 
                            className="font-semibold uppercase tracking-wider text-[10px]"
                            style={{ color: materiasCores[ponto.materia] || '#3F3F46' }}
                          >
                            {ponto.materia}
                          </span>
                          <span className="font-mono text-zinc-400 text-[10px]">{formatarDataBr(ponto.data)}</span>
                        </div>

                        <div className="font-medium text-xs text-zinc-900 leading-snug truncate">
                          {ponto.titulo}
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
                          <span>• {motivo}</span>
                          <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
