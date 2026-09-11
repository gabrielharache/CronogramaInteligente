export type Dificuldade = 'facil' | 'medio' | 'dificil' | null;

export type TipoEstudo = 'doutrina' | 'lei_seca' | 'jurisprudencia';

export interface Cronograma {
  id: string;
  nome: string;
  descricao?: string;
  editalId?: string; // Optional link to an Edital
  dataProva?: string; // YYYY-MM-DD - Date of the exam for this schedule
  cor?: string;
  createdAt?: number;
}

export interface PontoEstudo {
  id: string;
  cronogramaId?: string; // ID of the schedule it belongs to
  data: string; // YYYY-MM-DD
  materia: string;
  titulo: string;
  tipoEstudo?: TipoEstudo; // 'doutrina' | 'lei_seca' | 'jurisprudencia'
  artigosLei?: string;
  jurisprudenciaRef?: string;
  notas?: string;
  lido: boolean;
  qFeitas: boolean;
  qTotal: number | "";
  qAcertos: number | "";
  dif: Dificuldade;
  showNotes?: boolean;
  ordem?: number; // Ordem lógica / sequência pedagógica no edital
  createdAt?: number;
  updatedAt?: number;
}

export interface MateriaInfo {
  nome: string;
  cor: string;
}

export type EditalStatus = 'Pretendo fazer' | 'Inscrito' | 'Aguardando edital' | 'Prova realizada';

export interface Edital {
  id: string;
  nome: string;
  cargo: string;
  banca: string;
  dataProva: string; // YYYY-MM-DD
  status: EditalStatus;
  conteudo: string;
  link?: string;
  createdAt?: number;
}

export type ViewMode = 'semanal' | 'calendario' | 'materias';
export type TabMode = 'pontos' | 'organizacao_semanal' | 'foco' | 'revisao' | 'editais' | 'desempenho';

export type CategoriaHorario = 'estudo' | 'trabalho' | 'afazeres';

export interface BlocoHorario {
  id: string;
  diaSemana: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  horaInicio: number; // 0 to 23 (e.g. 8 for 08:00)
  horaFim: number; // 1 to 24 (e.g. 12 for 12:00)
  categoria: CategoriaHorario;
  titulo: string;
  materia?: string;
  cor?: string;
  notas?: string;
  pontoId?: string;
  tipoEstudo?: TipoEstudo;
}

export interface SessaoEstudo {
  id: string;
  cronogramaId?: string;
  materia: string;
  assunto: string;
  pontoId?: string;
  duracaoSegundos: number; // net study duration in seconds
  data: string; // YYYY-MM-DD
  inicioTimestamp: number;
  fimTimestamp: number;
  tipoTimer: 'cronometro' | 'pomodoro';
  notas?: string;
  tipoEstudo?: TipoEstudo;
}

export interface AppState {
  cronogramas: Cronograma[];
  activeCronogramaId: string; // 'all' or specific cronograma ID
  pontos: PontoEstudo[];
  editais: Edital[];
  materiasCores: Record<string, string>;
  gradeSemanal?: BlocoHorario[];
  sessoesEstudo?: SessaoEstudo[];
  ui: {
    view: ViewMode;
    calMes?: string; // YYYY-MM
    activeTab: TabMode;
    tipoEstudoFilter?: TipoEstudo | 'todos';
    sidebarCollapsed?: boolean;
  };
  migs?: string[];
}
