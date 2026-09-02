import { PontoEstudo, Dificuldade } from '../types';

export const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MESES_ABR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez"
];

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function hojeStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatarDataBr(dataStr?: string): string {
  if (!dataStr) return "Sem data definida";
  const [y, m, d] = dataStr.split("-");
  if (!y || !m || !d) return dataStr;
  return `${d}/${m}/${y.substring(2)}`;
}

export const DIAS_SEMANA_COMPLETO = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

export const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DIAS_SEMANA_SEG_DOM = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function getDiaDaSemana(dataStr?: string): {
  nomeCompleto: string;
  abreviado: string;
  index: number; // 0 = Domingo, 1 = Segunda, ...
  isFimDeSemana: boolean;
} {
  if (!dataStr) {
    return { nomeCompleto: "Sem data", abreviado: "—", index: -1, isFimDeSemana: false };
  }
  const parts = dataStr.split("-");
  if (parts.length < 3) {
    return { nomeCompleto: "Data inválida", abreviado: "—", index: -1, isFimDeSemana: false };
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d, 12, 0, 0);
  const idx = dateObj.getDay();
  return {
    nomeCompleto: DIAS_SEMANA_COMPLETO[idx] || "—",
    abreviado: DIAS_SEMANA_CURTO[idx] || "—",
    index: idx,
    isFimDeSemana: idx === 0 || idx === 6
  };
}

export function formatarDataComDiaSemana(dataStr?: string): string {
  if (!dataStr) return "Sem data";
  const { nomeCompleto } = getDiaDaSemana(dataStr);
  const [y, m, d] = dataStr.split("-");
  if (!y || !m || !d) return dataStr;
  return `${nomeCompleto}, ${d}/${m}/${y}`;
}

export function formatarDataCompleta(dataStr?: string): string {
  if (!dataStr) return "Sem data";
  const [y, m, d] = dataStr.split("-");
  if (!y || !m || !d) return dataStr;
  const mesIndex = parseInt(m, 10) - 1;
  const { nomeCompleto } = getDiaDaSemana(dataStr);
  return `${nomeCompleto}, ${parseInt(d, 10)} de ${MESES_PT[mesIndex]} de ${y}`;
}

export function mesAnoLabel(dataStr?: string): string {
  if (!dataStr) return "Sem data";
  const [y, m] = dataStr.split("-");
  if (!y || !m) return "Sem data";
  const mesIndex = parseInt(m, 10) - 1;
  return `${MESES_PT[mesIndex]} de ${y}`;
}

export function getWeekStart(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00');
  const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dayOfWeek);
  return d.toISOString().slice(0, 10);
}

export function addDays(dataStr: string, n: number): string {
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatarSemanaLabel(weekStartStr: string): string {
  const weekEndStr = addDays(weekStartStr, 5); // Seg a Sab
  const [, m1, d1] = weekStartStr.split("-");
  const [, m2, d2] = weekEndStr.split("-");
  const mes1 = MESES_PT[parseInt(m1, 10) - 1].toLowerCase();
  const mes2 = MESES_PT[parseInt(m2, 10) - 1].toLowerCase();
  
  if (m1 === m2) {
    return `${parseInt(d1, 10)} a ${parseInt(d2, 10)} de ${mes1}`;
  }
  return `${parseInt(d1, 10)} de ${mes1.slice(0, 3)}. a ${parseInt(d2, 10)} de ${mes2.slice(0, 3)}.`;
}

export function shiftMonth(mesAno: string, delta: number): string {
  let [y, m] = mesAno.split("-").map(Number);
  m += delta;
  if (m < 1) {
    m = 12;
    y--;
  } else if (m > 12) {
    m = 1;
    y++;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function calcularPercentualAcerto(ponto: { qTotal?: number | ""; qAcertos?: number | "" }): number | null {
  const total = typeof ponto.qTotal === 'number' ? ponto.qTotal : parseInt(String(ponto.qTotal), 10);
  const acertos = typeof ponto.qAcertos === 'number' ? ponto.qAcertos : parseInt(String(ponto.qAcertos), 10);
  
  if (!total || isNaN(total) || total <= 0) return null;
  if (isNaN(acertos) || acertos < 0) return 0;
  
  const acertosReais = Math.min(acertos, total);
  return Math.round((acertosReais / total) * 100);
}

/**
 * Classificação automática de tópicos:
 * - Fácil -> 70% pra cima de acerto nas questões (>= 70%)
 * - Médio -> de 46% a 69% (>= 46% e <= 69%)
 * - Difícil -> Abaixo de 45% (<= 45%)
 */
export function calcularDificuldadeAutomatica(ponto: { qTotal?: number | ""; qAcertos?: number | ""; dif?: Dificuldade }): Dificuldade {
  const pct = calcularPercentualAcerto(ponto);
  if (pct === null) {
    return ponto.dif || null;
  }
  if (pct >= 70) return 'facil';
  if (pct >= 46) return 'medio';
  return 'dificil';
}

export function getPercentualBadgeClass(pct: number | null): { bg: string; text: string; border: string } {
  if (pct === null) return { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' };
  if (pct >= 70) return { bg: 'bg-emerald-50 text-emerald-800', text: 'text-emerald-700', border: 'border-emerald-200' };
  if (pct >= 46) return { bg: 'bg-amber-50 text-amber-800', text: 'text-amber-700', border: 'border-amber-200' };
  return { bg: 'bg-rose-50 text-rose-800', text: 'text-rose-700', border: 'border-rose-200' };
}

export function getDificuldadeInfo(dif: Dificuldade): {
  label: string;
  badgeClass: string;
  badgeText: string;
  dotColor: string;
  desc: string;
} {
  if (dif === 'facil') {
    return {
      label: 'Fácil',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeText: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
      desc: '≥ 70% de acertos'
    };
  }
  if (dif === 'medio') {
    return {
      label: 'Médio',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeText: 'text-amber-700',
      dotColor: 'bg-amber-500',
      desc: '46% a 69% de acertos'
    };
  }
  if (dif === 'dificil') {
    return {
      label: 'Difícil',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeText: 'text-rose-700',
      dotColor: 'bg-rose-500',
      desc: '≤ 45% de acertos'
    };
  }
  return {
    label: 'Sem questões',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    badgeText: 'text-zinc-500',
    dotColor: 'bg-zinc-400',
    desc: 'Não classificado'
  };
}

export function calcularDiasRestantes(dataProvaStr: string): { texto: string; dias: number; realizada: boolean } {
  if (!dataProvaStr) return { texto: 'Data a definir', dias: 0, realizada: false };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prova = new Date(dataProvaStr + 'T00:00:00');
  const diffMs = prova.getTime() - hoje.getTime();
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (dias > 1) {
    return { texto: `Faltam ${dias} dias`, dias, realizada: false };
  } else if (dias === 1) {
    return { texto: 'Prova amanhã!', dias: 1, realizada: false };
  } else if (dias === 0) {
    return { texto: 'Prova é HOJE!', dias: 0, realizada: false };
  } else {
    return { texto: `Realizada há ${Math.abs(dias)} dias`, dias, realizada: true };
  }
}

// Markdown and Text Study Points Parser
export interface ParsedStudyPoint {
  titulo: string;
  materia: string;
  tipoEstudo: 'doutrina' | 'lei_seca' | 'jurisprudencia';
  data?: string;
  artigosLei?: string;
  jurisprudenciaRef?: string;
  notas?: string;
}

export function parseMarkdownStudyPoints(text: string): ParsedStudyPoint[] {
  const lines = text.split(/\r?\n/);
  const results: ParsedStudyPoint[] = [];

  let currentSubject = 'Geral';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check for Markdown Headings (# Subject, ## Subject)
    const headerMatch = rawLine.match(/^#{1,4}\s+(.+)$/);
    if (headerMatch) {
      currentSubject = headerMatch[1].replace(/[:#-]/g, '').trim() || currentSubject;
      continue;
    }

    // Check for Markdown Table Rows: | Data | Matéria | Tópico | Tipo | Notas |
    if (rawLine.startsWith('|') && rawLine.endsWith('|')) {
      const cells = rawLine.split('|').map(c => c.trim()).filter(c => c.length > 0);
      // Skip header divider rows like |---|---|
      if (cells.length >= 2 && !cells[0].includes('---') && !cells[0].toLowerCase().includes('data') && !cells[0].toLowerCase().includes('título')) {
        let pData = '';
        let pMateria = currentSubject;
        let pTitulo = '';
        let pTipo: 'doutrina' | 'lei_seca' | 'jurisprudencia' = 'doutrina';
        let pNotas = '';

        if (cells[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
          pData = cells[0];
          pMateria = cells[1] || currentSubject;
          pTitulo = cells[2] || 'Tópico de Estudo';
          const tRaw = (cells[3] || '').toLowerCase();
          if (tRaw.includes('lei') || tRaw.includes('artigo') || tRaw.includes('seca')) pTipo = 'lei_seca';
          else if (tRaw.includes('juris') || tRaw.includes('súmula') || tRaw.includes('sumula') || tRaw.includes('tese')) pTipo = 'jurisprudencia';
          pNotas = cells[4] || '';
        } else {
          // | Matéria | Tópico | Tipo |
          pMateria = cells[0] || currentSubject;
          pTitulo = cells[1] || 'Tópico de Estudo';
          const tRaw = (cells[2] || '').toLowerCase();
          if (tRaw.includes('lei') || tRaw.includes('artigo') || tRaw.includes('seca')) pTipo = 'lei_seca';
          else if (tRaw.includes('juris') || tRaw.includes('súmula') || tRaw.includes('sumula') || tRaw.includes('tese')) pTipo = 'jurisprudencia';
          pNotas = cells[3] || '';
        }

        if (pTitulo) {
          results.push({
            titulo: pTitulo,
            materia: pMateria,
            tipoEstudo: pTipo,
            data: pData,
            notas: pNotas
          });
        }
        continue;
      }
    }

    // Check for List / Checklist items: - [ ] Topic, * Topic, 1. Topic, - Topic
    const listMatch = rawLine.match(/^([-*+]|\d+\.)\s*(?:\[[ xX]\]\s*)?(.+)$/);
    if (listMatch) {
      const content = listMatch[2].trim();

      // Check pipe format: YYYY-MM-DD | Matéria | Tópico | Tipo | Notas
      if (content.includes('|')) {
        const parts = content.split('|').map(p => p.trim());
        let pData = '';
        let pMateria = currentSubject;
        let pTitulo = '';
        let pTipo: 'doutrina' | 'lei_seca' | 'jurisprudencia' = 'doutrina';
        let pNotas = '';

        if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
          pData = parts[0];
          pMateria = parts[1] || currentSubject;
          pTitulo = parts[2] || 'Tópico';
          const tRaw = (parts[3] || '').toLowerCase();
          if (tRaw.includes('lei') || tRaw.includes('seca') || tRaw.includes('artigo')) pTipo = 'lei_seca';
          else if (tRaw.includes('juris') || tRaw.includes('sumula') || tRaw.includes('súmula')) pTipo = 'jurisprudencia';
          pNotas = parts[4] || '';
        } else {
          pMateria = parts[0] || currentSubject;
          pTitulo = parts[1] || 'Tópico';
          const tRaw = (parts[2] || '').toLowerCase();
          if (tRaw.includes('lei') || tRaw.includes('seca') || tRaw.includes('artigo')) pTipo = 'lei_seca';
          else if (tRaw.includes('juris') || tRaw.includes('sumula') || tRaw.includes('súmula')) pTipo = 'jurisprudencia';
          pNotas = parts[3] || '';
        }

        results.push({
          titulo: pTitulo,
          materia: pMateria,
          tipoEstudo: pTipo,
          data: pData,
          notas: pNotas
        });
        continue;
      }

      // Check colon format: "Direito Constitucional: Controle de Constitucionalidade (Lei Seca)"
      if (content.includes(':')) {
        const [subjPart, ...rest] = content.split(':');
        const titlePart = rest.join(':').trim();
        let pTipo: 'doutrina' | 'lei_seca' | 'jurisprudencia' = 'doutrina';
        const lower = titlePart.toLowerCase();
        if (lower.includes('(lei seca)') || lower.includes('[lei seca]') || lower.includes('letra de lei')) {
          pTipo = 'lei_seca';
        } else if (lower.includes('(jurisprudência)') || lower.includes('(súmulas)') || lower.includes('[jurisprudência]')) {
          pTipo = 'jurisprudencia';
        }

        results.push({
          titulo: titlePart.replace(/\((lei seca|jurisprudência|súmulas|doutrina)\)/gi, '').trim(),
          materia: subjPart.trim() || currentSubject,
          tipoEstudo: pTipo
        });
        continue;
      }

      // Plain topic line under current subject
      let pTipo: 'doutrina' | 'lei_seca' | 'jurisprudencia' = 'doutrina';
      const lower = content.toLowerCase();
      if (lower.includes('(lei seca)') || lower.includes('[lei seca]') || lower.includes('letra de lei')) {
        pTipo = 'lei_seca';
      } else if (lower.includes('(jurisprudência)') || lower.includes('(súmulas)') || lower.includes('[jurisprudência]')) {
        pTipo = 'jurisprudencia';
      }

      results.push({
        titulo: content.replace(/\((lei seca|jurisprudência|súmulas|doutrina)\)/gi, '').trim(),
        materia: currentSubject,
        tipoEstudo: pTipo
      });
      continue;
    }

    // Direct plain line
    results.push({
      titulo: rawLine,
      materia: currentSubject,
      tipoEstudo: 'doutrina'
    });
  }

  return results;
}

// Automatic schedule distribution function
export interface DistributionOptions {
  startDate: string; // YYYY-MM-DD
  topicsPerDay: number; // 1, 2, 3
  studyDaysMode: 'seg-sex' | 'seg-sab' | 'todos'; // week pattern
}

export function distributePlannedDates(
  totalItems: number,
  options: DistributionOptions
): string[] {
  const dates: string[] = [];
  if (totalItems <= 0) return dates;

  let current = new Date(options.startDate + 'T12:00:00');
  let itemsOnCurrentDay = 0;

  for (let i = 0; i < totalItems; i++) {
    // Advance date if we filled current day's quota
    while (true) {
      const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
      let isValidStudyDay = true;

      if (options.studyDaysMode === 'seg-sex' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        isValidStudyDay = false;
      } else if (options.studyDaysMode === 'seg-sab' && dayOfWeek === 0) {
        isValidStudyDay = false;
      }

      if (isValidStudyDay) {
        break;
      }
      current.setDate(current.getDate() + 1);
      itemsOnCurrentDay = 0;
    }

    dates.push(current.toISOString().slice(0, 10));
    itemsOnCurrentDay++;

    if (itemsOnCurrentDay >= options.topicsPerDay) {
      current.setDate(current.getDate() + 1);
      itemsOnCurrentDay = 0;
    }
  }

  return dates;
}

export interface ParsedEditalMarkdown {
  nome: string;
  cargo: string;
  banca: string;
  dataProva: string;
  status: 'Pretendo fazer' | 'Inscrito' | 'Aguardando edital' | 'Prova realizada';
  conteudo: string;
  disciplinasCount: number;
  topicosCount: number;
}

export interface SmartTopicItem {
  id: string;
  titulo: string;
  materia: string;
  tipoEstudo: 'doutrina' | 'lei_seca' | 'jurisprudencia' | 'questoes';
  artigosLei?: string;
  jurisprudenciaRef?: string;
  notas?: string;
  selected: boolean;
  dificuldade?: 'facil' | 'media' | 'dificil';
}

export interface SmartSubjectGroup {
  id: string;
  nome: string;
  cor: string;
  selected: boolean;
  topicos: SmartTopicItem[];
}

export interface SmartEditalHierarchy {
  nome: string;
  cargo: string;
  banca: string;
  dataProva: string;
  status: 'Pretendo fazer' | 'Inscrito' | 'Aguardando edital' | 'Prova realizada';
  rawText: string;
  materias: SmartSubjectGroup[];
  totalTopicos: number;
}

// Default distinct color palette for auto-detected subjects
const SUBJECT_PALETTE = [
  '#8C1C2C', // Vinho / Carmim (Principal)
  '#1e3a8a', // Azul Marinho
  '#065f46', // Verde Esmeralda
  '#7c2d12', // Terracota / Âmbar
  '#4c1d95', // Roxo Profundo
  '#164e63', // Ciano Petróleo
  '#831843', // Rosa Escuro
  '#374151', // Grafite Neutro
  '#0f766e', // Teal
  '#9a3412', // Laranja Queimado
  '#312e81', // Indigo
  '#3f3f46'  // Zinco
];

// Helper to detect legal articles in text
function extractLegalReferences(text: string): string {
  const matches: string[] = [];
  
  // Specific patterns for brazilian legislation
  const patterns = [
    /Lei(?:\s+(?:Federal|Complementar|Estadual|Municipal))?\s+(?:n[ºo°]?\s*)?[\d\.\/]+/gi,
    /CF\/?88|Constituiç[aã]o\s+Federal(?:\s+de\s+1988)?/gi,
    /Art(?:igo)?s?\.?\s*\d+º?(?:\s*(?:ao?|a|e|-)\s*\d+º?)?(?:\s*(?:da|do)\s*[A-Za-z0-9\/\.\-]+)?/gi,
    /Código\s+(?:Civil|Penal|Processo\s+Penal|Processo\s+Civil|Tribut[áa]rio\s+Nacional|de\s+Trânsito)/gi,
    /Decreto(?:-Lei)?\s+(?:n[ºo°]?\s*)?[\d\.\/]+/gi,
    /Estatuto\s+d[oa]\s+[A-Za-zÀ-ÿ\s]+/gi,
    /Regimento\s+Interno/gi,
    /Lei\s+Orgânica/gi
  ];

  for (const pat of patterns) {
    const found = text.match(pat);
    if (found) {
      found.forEach(m => {
        const clean = m.trim();
        if (!matches.includes(clean) && clean.length > 2) {
          matches.push(clean);
        }
      });
    }
  }

  return matches.slice(0, 3).join('; ');
}

// Helper to detect jurisprudence in text
function extractJurisprudenceReferences(text: string): string {
  const matches: string[] = [];
  const patterns = [
    /Súmula(?:\s+Vinculante)?\s+(?:n[ºo°]?\s*)?\d+/gi,
    /Súmula\s+d[oe]\s+(?:STF|STJ|TST|TSE)\s+(?:n[ºo°]?\s*)?\d+/gi,
    /Tema\s+(?:de\s+Repercussão\s+Geral|Repetitivo)?\s*(?:n[ºo°]?\s*)?\d+/gi,
    /STF|STJ|TST|TSE|TFR/g,
    /Jurisprudência\s+(?:do|da|dos)\s+[A-Za-z]+/gi,
    /Informativos?\s+do\s+(?:STF|STJ)/gi
  ];

  for (const pat of patterns) {
    const found = text.match(pat);
    if (found) {
      found.forEach(m => {
        const clean = m.trim();
        if (!matches.includes(clean) && clean.length > 2) {
          matches.push(clean);
        }
      });
    }
  }

  return matches.slice(0, 2).join('; ');
}

// Classify study type
function classifyStudyType(text: string, artigos: string, juris: string): 'doutrina' | 'lei_seca' | 'jurisprudencia' | 'questoes' {
  const lower = text.toLowerCase();
  
  if (lower.includes('(questões)') || lower.includes('[questões]') || lower.includes('resolução de questões') || lower.includes('bateria de questões') || lower.includes('simulado')) {
    return 'questoes';
  }
  
  if (juris.length > 0 || lower.includes('(jurisprudência)') || lower.includes('[jurisprudência]') || lower.includes('súmula') || lower.includes('informativo')) {
    return 'jurisprudencia';
  }
  
  if (artigos.length > 0 || lower.includes('(lei seca)') || lower.includes('[lei seca]') || lower.includes('letra de lei') || lower.includes('art.') || lower.includes('lei nº') || lower.includes('lei 1')) {
    return 'lei_seca';
  }
  
  return 'doutrina';
}

// Clean up raw topic text
function cleanTopicTitle(raw: string): string {
  return raw
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[\.\)\-]\s*/, '') // remove "1. ", "1) ", "1- "
    .replace(/^\d+\.\d+[\.\)\-]?\s*/, '') // remove "1.1. "
    .replace(/^\d+\.\d+\.\d+[\.\)\-]?\s*/, '') // remove "1.1.1 "
    .replace(/^[a-z]\)\s*/i, '') // remove "a) "
    .replace(/^[IVXLCDM]+\s*[\.\-]\s*/i, '') // remove roman "I - "
    .replace(/\*\*/g, '')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\((lei seca|jurisprudência|doutrina|questões)\)/gi, '')
    .replace(/\[(lei seca|jurisprudência|doutrina|questões)\]/gi, '')
    .trim();
}

/**
 * Intelligent Edital Parser:
 * Identifies subjects (matérias) and distinct study topics (assuntos),
 * supporting both list markdown formats and Cebraspe/FGV inline numbered block formats.
 */
export function parseSmartEditalHierarchy(text: string, defaultFileName?: string): SmartEditalHierarchy {
  const lines = text.split(/\r?\n/);
  
  let nome = '';
  let cargo = '';
  let banca = '';
  let dataProva = '';
  let status: 'Pretendo fazer' | 'Inscrito' | 'Aguardando edital' | 'Prova realizada' = 'Pretendo fazer';

  // Fallback name from file
  const fallbackName = defaultFileName
    ? defaultFileName.replace(/\.(md|txt|markdown)$/i, '').replace(/[-_]/g, ' ')
    : 'Novo Edital';

  // Extract top-level metadata first
  for (let i = 0; i < Math.min(lines.length, 35); i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    // Heading # Concurso ...
    const h1Match = raw.match(/^#\s+(.+)$/);
    if (h1Match && !nome) {
      nome = h1Match[1].replace(/[*_`]/g, '').trim();
      continue;
    }

    const cleaned = raw.replace(/^[-*+]\s+/, '').replace(/\*\*/g, '').trim();
    
    const cargoM = cleaned.match(/^(?:cargo|função|especialidade)\s*:\s*(.+)$/i);
    if (cargoM && !cargo) { cargo = cargoM[1].trim(); continue; }

    const bancaM = cleaned.match(/^(?:banca|banca examinadora|instituição|organizadora)\s*:\s*(.+)$/i);
    if (bancaM && !banca) { banca = bancaM[1].trim(); continue; }

    const dataM = cleaned.match(/^(?:data da prova|data prova|data exame|data)\s*:\s*(.+)$/i);
    if (dataM && !dataProva) {
      const rawDate = dataM[1].trim();
      if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataProva = rawDate;
      } else if (rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)) {
        const [, d, m, y] = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!;
        dataProva = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      continue;
    }

    const statusM = cleaned.match(/^(?:status|situação|situacao)\s*:\s*(.+)$/i);
    if (statusM) {
      const sVal = statusM[1].toLowerCase();
      if (sVal.includes('inscrito')) status = 'Inscrito';
      else if (sVal.includes('aguardando')) status = 'Aguardando edital';
      else if (sVal.includes('realizada')) status = 'Prova realizada';
      else status = 'Pretendo fazer';
      continue;
    }

    const orgaoM = cleaned.match(/^(?:concurso|órgão|orgao|edital)\s*:\s*(.+)$/i);
    if (orgaoM && !nome) { nome = orgaoM[1].trim(); continue; }
  }

  if (!nome) nome = fallbackName;

  // Now process subjects & topics
  const subjectsMap: { [key: string]: SmartTopicItem[] } = {};
  let currentSubject = 'Conhecimentos Gerais';
  let colorIdx = 0;

  // Check if text is mostly Cebraspe/FGV inline numbered block or markdown list
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Ignore metadata header lines in body
    if (rawLine.match(/^(?:\*\*?(?:cargo|banca|data|status|concurso|órgão)\*\*?:)/i)) {
      continue;
    }

    // Ignore generic edital boilerplate headers
    if (rawLine.match(/^(?:#+\s*)?(?:anexo|conteúdo programático|conhecimentos básicos|conhecimentos específicos|das disposições|da prova|dos critérios|quadro de provas)/i)) {
      // If it's something like "## CONHECIMENTOS ESPECÍFICOS - CARGO ANALISTA", continue or set subject if specific
      const cleanH = rawLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      if (cleanH.toLowerCase() === 'conhecimentos básicos' || cleanH.toLowerCase() === 'conhecimentos específicos' || cleanH.toLowerCase().includes('conteúdo programático')) {
        continue;
      }
    }

    // 1. Detect Markdown Header subject: `## DIREITO CONSTITUCIONAL` or `### LÍNGUA PORTUGUESA`
    const headerMatch = rawLine.match(/^#{1,4}\s+(.+)$/);
    if (headerMatch) {
      const rawTitle = headerMatch[1].replace(/\*\*/g, '').trim();
      // If this is not the main document title
      if (rawTitle !== nome && rawTitle.length > 2) {
        currentSubject = rawTitle.replace(/^\d+[\.\-\s]+/, '').trim();
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];
        continue;
      }
    }

    // 2. Detect Upper Case Colon or Dash subject: `DIREITO CONSTITUCIONAL:` or `**DIREITO ADMINISTRATIVO:**`
    const subjectPrefixMatch = rawLine.match(/^(\*{0,2}[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s\/\-&]{3,40}\*{0,2})\s*[:–-]\s*(.*)$/);
    if (subjectPrefixMatch && !rawLine.startsWith('#')) {
      const candidateSubj = subjectPrefixMatch[1].replace(/\*\*/g, '').trim();
      const restOfLine = subjectPrefixMatch[2].trim();

      // Check if candidate looks like a real subject title (not a small label)
      if (candidateSubj.length >= 4 && !candidateSubj.match(/^(CARGO|BANCA|DATA|STATUS|OBS|FONTE|LOCAL)$/i)) {
        currentSubject = candidateSubj;
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];

        if (restOfLine) {
          // Parse the inline topics in the rest of the line
          const topics = splitInlineTopics(restOfLine, currentSubject);
          topics.forEach(t => subjectsMap[currentSubject].push(t));
        }
        continue;
      }
    }

    // 3. Detect Standalone Bold Subject line: `**DIREITO CONSTITUCIONAL**`
    const boldSubjectMatch = rawLine.match(/^\*\*([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s\/\-&]{3,50})\*\*$/);
    if (boldSubjectMatch) {
      const subj = boldSubjectMatch[1].trim();
      if (subj.length >= 4 && !subj.match(/^(CARGO|BANCA|DATA|STATUS|OBS)$/i)) {
        currentSubject = subj;
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];
        continue;
      }
    }

    // 4. Detect List Item (- Topic or 1. Topic)
    const listMatch = rawLine.match(/^([-*+]|\d+\.)\s*(?:\[[ xX]\]\s*)?(.+)$/);
    if (listMatch) {
      const content = listMatch[2].trim();

      // Check if this list line actually contains inline numbered sub-topics e.g. "1. Conceito... 2. Classificação..."
      if (content.match(/\b\d+\s+[A-Z\u00C0-\u00DF]/) || content.match(/\b\d+\.\d+\s+[A-Z\u00C0-\u00DF]/)) {
        const inlineTopics = splitInlineTopics(content, currentSubject);
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];
        inlineTopics.forEach(t => subjectsMap[currentSubject].push(t));
        continue;
      }

      // Check if it's colon format: `Matéria: Tópico`
      if (content.includes(':') && !content.startsWith('http')) {
        const [subjPart, ...rest] = content.split(':');
        const titlePart = rest.join(':').trim();
        // If left side looks like a subject
        if (subjPart.length < 35 && titlePart.length > 2 && !subjPart.match(/^(https?|art|lei|obs|nota)/i)) {
          const itemSubject = subjPart.replace(/\*\*/g, '').trim();
          if (!subjectsMap[itemSubject]) subjectsMap[itemSubject] = [];
          
          const art = extractLegalReferences(titlePart);
          const juris = extractJurisprudenceReferences(titlePart);
          const tipo = classifyStudyType(titlePart, art, juris);

          subjectsMap[itemSubject].push({
            id: uid() + Math.random().toString(36).slice(2, 6),
            titulo: cleanTopicTitle(titlePart),
            materia: itemSubject,
            tipoEstudo: tipo,
            artigosLei: art,
            jurisprudenciaRef: juris,
            selected: true
          });
          continue;
        }
      }

      // Standard single topic
      const art = extractLegalReferences(content);
      const juris = extractJurisprudenceReferences(content);
      const tipo = classifyStudyType(content, art, juris);
      const cleanTitle = cleanTopicTitle(content);

      if (cleanTitle.length > 2) {
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];
        subjectsMap[currentSubject].push({
          id: uid() + Math.random().toString(36).slice(2, 6),
          titulo: cleanTitle,
          materia: currentSubject,
          tipoEstudo: tipo,
          artigosLei: art,
          jurisprudenciaRef: juris,
          selected: true
        });
      }
      continue;
    }

    // 5. Line contains inline numbered topics without bullet: `1 Conceito... 2 Classificação...`
    if (rawLine.match(/^\d+[\.\s]+[A-Z\u00C0-\u00DF]/) || rawLine.match(/\b\d+\s+[A-Z\u00C0-\u00DF]/)) {
      const inlineTopics = splitInlineTopics(rawLine, currentSubject);
      if (inlineTopics.length > 0) {
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];
        inlineTopics.forEach(t => subjectsMap[currentSubject].push(t));
        continue;
      }
    }

    // 6. Regular plain text line with sufficient length
    if (rawLine.length > 5 && !rawLine.startsWith('#')) {
      const art = extractLegalReferences(rawLine);
      const juris = extractJurisprudenceReferences(rawLine);
      const tipo = classifyStudyType(rawLine, art, juris);
      const cleanTitle = cleanTopicTitle(rawLine);

      if (cleanTitle.length > 3) {
        if (!subjectsMap[currentSubject]) subjectsMap[currentSubject] = [];
        subjectsMap[currentSubject].push({
          id: uid() + Math.random().toString(36).slice(2, 6),
          titulo: cleanTitle,
          materia: currentSubject,
          tipoEstudo: tipo,
          artigosLei: art,
          jurisprudenciaRef: juris,
          selected: true
        });
      }
    }
  }

  // Build structured subject groups
  const materias: SmartSubjectGroup[] = Object.keys(subjectsMap)
    .filter(subj => subjectsMap[subj].length > 0)
    .map(subj => {
      const cor = SUBJECT_PALETTE[colorIdx % SUBJECT_PALETTE.length];
      colorIdx++;
      return {
        id: uid() + Math.random().toString(36).slice(2, 6),
        nome: subj,
        cor,
        selected: true,
        topicos: subjectsMap[subj]
      };
    });

  const totalTopicos = materias.reduce((acc, m) => acc + m.topicos.length, 0);

  return {
    nome,
    cargo,
    banca,
    dataProva,
    status,
    rawText: text,
    materias,
    totalTopicos
  };
}

/**
 * Splits Cebraspe / Quadrix / FGV inline numbered topic streams into individual topics.
 * Example: `1 Conceito e fontes. 2 Princípios. 3 Atos administrativos: 3.1 requisitos; 3.2 atributos. 4 Licitações (Lei 14.133/2021).`
 */
function splitInlineTopics(raw: string, subject: string): SmartTopicItem[] {
  const results: SmartTopicItem[] = [];
  
  // Split on numbers followed by period or space: `\s*(?:\b\d+[\.\)]\s+|\b\d+\s+(?=[A-Z\u00C0-\u00DF]))`
  // We tokenize cleanly
  const rawSegments = raw.split(/(?=\b\d+[\.\)]\s+[A-Z\u00C0-\u00DF]|\b\d+\s+[A-Z\u00C0-\u00DF])/);

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // Check if segment has semicolon sub-items (e.g. `3 Atos: 3.1 conceito; 3.2 validade.`)
    const art = extractLegalReferences(trimmed);
    const juris = extractJurisprudenceReferences(trimmed);
    const tipo = classifyStudyType(trimmed, art, juris);
    const cleanTitle = cleanTopicTitle(trimmed);

    if (cleanTitle.length > 2) {
      results.push({
        id: uid() + Math.random().toString(36).slice(2, 6),
        titulo: cleanTitle,
        materia: subject,
        tipoEstudo: tipo,
        artigosLei: art,
        jurisprudenciaRef: juris,
        selected: true
      });
    }
  }

  // If no numbered tokens were found, split by semicolon or period if long enough
  if (results.length === 0) {
    const semiParts = raw.split(/;\s+/);
    if (semiParts.length > 1) {
      semiParts.forEach(p => {
        const cl = cleanTopicTitle(p);
        if (cl.length > 3) {
          const art = extractLegalReferences(cl);
          const juris = extractJurisprudenceReferences(cl);
          const tipo = classifyStudyType(cl, art, juris);
          results.push({
            id: uid() + Math.random().toString(36).slice(2, 6),
            titulo: cl,
            materia: subject,
            tipoEstudo: tipo,
            artigosLei: art,
            jurisprudenciaRef: juris,
            selected: true
          });
        }
      });
    } else {
      const art = extractLegalReferences(raw);
      const juris = extractJurisprudenceReferences(raw);
      const tipo = classifyStudyType(raw, art, juris);
      const cl = cleanTopicTitle(raw);
      if (cl.length > 2) {
        results.push({
          id: uid() + Math.random().toString(36).slice(2, 6),
          titulo: cl,
          materia: subject,
          tipoEstudo: tipo,
          artigosLei: art,
          jurisprudenciaRef: juris,
          selected: true
        });
      }
    }
  }

  return results;
}

export interface InterleavedScheduleOptions {
  startDate: string;
  topicsPerDay: number;
  studyDaysMode: 'seg-sex' | 'seg-sab' | 'todos';
  sequenceMode: 'intercalado' | 'sequencial';
}

/**
 * Distributes structured topics into planned study dates.
 * In 'intercalado' mode (concurso cycle), alternates subjects round-robin so the student
 * contacts every subject frequently, avoiding forgetting curve decay.
 */
export function buildStructuredStudyPlan(
  subjects: SmartSubjectGroup[],
  options: InterleavedScheduleOptions
): { pontoData: Array<{ materia: string; titulo: string; tipoEstudo: 'doutrina' | 'lei_seca' | 'jurisprudencia' | 'questoes'; artigosLei?: string; jurisprudenciaRef?: string; notas?: string; data: string }> } {
  const activeSubjects = subjects
    .filter(s => s.selected)
    .map(s => ({
      ...s,
      topicos: s.topicos.filter(t => t.selected)
    }))
    .filter(s => s.topicos.length > 0);

  const orderedTopics: SmartTopicItem[] = [];

  if (options.sequenceMode === 'intercalado') {
    // Round-robin cycle across all active subjects
    let hasMore = true;
    let index = 0;
    while (hasMore) {
      hasMore = false;
      for (const subj of activeSubjects) {
        if (index < subj.topicos.length) {
          orderedTopics.push(subj.topicos[index]);
          hasMore = true;
        }
      }
      index++;
    }
  } else {
    // Sequential block by subject
    for (const subj of activeSubjects) {
      orderedTopics.push(...subj.topicos);
    }
  }

  // Calculate planned dates
  const dates = distributePlannedDates(orderedTopics.length, {
    startDate: options.startDate,
    topicsPerDay: options.topicsPerDay,
    studyDaysMode: options.studyDaysMode
  });

  const pontoData = orderedTopics.map((top, idx) => ({
    materia: top.materia,
    titulo: top.titulo,
    tipoEstudo: top.tipoEstudo,
    artigosLei: top.artigosLei || '',
    jurisprudenciaRef: top.jurisprudenciaRef || '',
    notas: top.notas || '',
    data: dates[idx] || options.startDate
  }));

  return { pontoData };
}

export function parseEditalMarkdown(text: string, defaultFileName?: string): ParsedEditalMarkdown {
  const hierarchy = parseSmartEditalHierarchy(text, defaultFileName);
  return {
    nome: hierarchy.nome,
    cargo: hierarchy.cargo,
    banca: hierarchy.banca,
    dataProva: hierarchy.dataProva,
    status: hierarchy.status,
    conteudo: text,
    disciplinasCount: hierarchy.materias.length,
    topicosCount: hierarchy.totalTopicos
  };
}
