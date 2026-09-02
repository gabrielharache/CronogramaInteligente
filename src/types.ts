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
export type TabMode = 'pontos' | 'editais' | 'desempenho';

export interface AppState {
  cronogramas: Cronograma[];
  activeCronogramaId: string; // 'all' or specific cronograma ID
  pontos: PontoEstudo[];
  editais: Edital[];
  materiasCores: Record<string, string>;
  ui: {
    view: ViewMode;
    calMes?: string; // YYYY-MM
    activeTab: TabMode;
    tipoEstudoFilter?: TipoEstudo | 'todos';
  };
  migs?: string[];
}
