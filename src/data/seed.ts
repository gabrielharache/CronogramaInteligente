import { PontoEstudo, Edital, Cronograma } from '../types';

export const DEFAULT_CRONOGRAMAS: Cronograma[] = [
  {
    id: "cronograma-geral",
    nome: "Cronograma Geral (Magistratura e Tribunais)",
    descricao: "Ciclo estruturado de 113 tópicos de doutrina, lei e jurisprudência",
    cor: "#8C1C2C",
    createdAt: 1720000000000
  },
  {
    id: "cronograma-tce-ma",
    nome: "TCE-MA 2026 (Controle Externo)",
    descricao: "Cronograma focado no edital do Tribunal de Contas do Maranhão",
    editalId: "edital-tce-ma-analista",
    cor: "#14524A",
    createdAt: 1720000001000
  }
];

export const DEFAULT_SUBJECT_COLORS: Record<string, string> = {
  "Administrativo": "#8C1C2C",
  "Constitucional": "#14524A",
  "Civil": "#1F3C88",
  "Penal": "#5A2A62",
  "Processo Civil": "#2E6E8E",
  "Processo Penal": "#7A4A21",
  "Direito do Trabalho": "#A65D03",
  "Processo do Trabalho": "#4E6E2E",
  "Tributário": "#0F6E6E",
  "Empresarial": "#6E6A5E",
  "Direito Financeiro": "#546A7B",
  "Previdenciário": "#C0562E",
  "Eleitoral": "#6B4E9B",
  "Direito Ambiental": "#2E7D5B",
  "Direito Econômico": "#8A6D1F",
  "Legislação Específica": "#5B5EA6"
};

export const COLOR_PALETTE = [
  "#8C1C2C", "#14524A", "#1F3C88", "#5A2A62", "#2E6E8E", "#7A4A21",
  "#A65D03", "#4E6E2E", "#0F6E6E", "#6E6A5E", "#546A7B", "#C0562E",
  "#6B4E9B", "#2E7D5B", "#8A6D1F", "#5B5EA6", "#B0522D", "#3D6B9E",
  "#D97706", "#059669", "#7C3AED", "#DB2777"
];

// 163 Tópicos distribuídos no ciclo de estudos de Seg a Sáb iniciando em 31/08/2026
export const RAW_SEED_PONTOS: Array<[string, string, string, string]> = [
  // Semana 1: 31/08 a 06/09
  ["2026-08-31", "Administrativo", "Organização Administrativa (Parte 01)", "Fls. 82 — Introdução, desconcentração e descentralização"],
  ["2026-09-01", "Constitucional", "Teoria Geral da Constituição e Neoconstitucionalismo", "Conceitos fundamentais e classificação das constituições"],
  ["2026-09-02", "Processo Civil", "Normas Fundamentais e Princípios Processuais", "Art. 1º a 12 do CPC/15"],
  ["2026-09-03", "Civil", "LINDB", "Vigência, aplicação e integração da lei"],
  ["2026-09-04", "Direito do Trabalho", "Princípios, Relação de Trabalho e de Emprego", "Requisitos da relação de emprego (Art. 2º e 3º CLT)"],
  ["2026-09-05", "Administrativo", "Organização Administrativa (Parte 02)", "Fls. 82 — ⚠️ Lei 13.848/19: Agências Reguladoras (Quarentena e AIR)"],

  // Semana 2: 07/09 a 13/09
  ["2026-09-07", "Constitucional", "Direitos e Deveres Individuais e Coletivos (Art. 5º)", "Páginas: Fls. 41 — Eficácia vertical e horizontal"],
  ["2026-09-08", "Processo Civil", "Jurisdição, Ação e Competência Interna", "Páginas: Fls. 63 — Competência absoluta e relativa"],
  ["2026-09-09", "Processo Penal", "Inquérito Policial e Notitia Criminis", "Características, valor probatório e arquivamento"],
  ["2026-09-10", "Processo do Trabalho", "Organização e Competência da Justiça do Trabalho", "Páginas: Fls. 60 — Art. 114 CF/88"],
  ["2026-09-11", "Tributário", "STN e Princípios Gerais do Direito Tributário (Seq. 1/10)", "Páginas: Fls. 59 — Legalidade, anterioridade e irretroatividade"],
  ["2026-09-12", "Administrativo", "Atos Administrativos", "Páginas: Fls. 52 — ⚠️ Prescrição Quinquenal (Dec. 20.910) vs Decadência (Lei 9.784)"],

  // Semana 3: 14/09 a 20/09
  ["2026-09-14", "Constitucional", "Remédios Constitucionais (MS, HC, MI, HD)", "Páginas: Fls. 28 à 77 — ⚠️ Lei 12.016/09: Mandado de Segurança"],
  ["2026-09-15", "Civil", "Pessoas (Naturais, Jurídicas e Desconsideração)", "Páginas: Fls. 85 — Art. 50 CC"],
  ["2026-09-16", "Penal", "Teoria do Crime 1 (Fato Típico, Conduta e Nexo)", "Elementos do crime, tipicidade e nexo causal"],
  ["2026-09-17", "Direito do Trabalho", "Contrato de Trabalho (Modalidades, Alteração, Suspensão)", "Alterações unilaterais e bilaterais, interrupção vs suspensão"],
  ["2026-09-18", "Tributário", "Limitações ao Poder de Tributar e Imunidades (Seq. 2/10)", "Páginas: Fls. 39 — ⚠️ Imunidade recíproca extensiva a Estatais"],
  ["2026-09-19", "Administrativo", "Poderes da Administração", "Páginas: Fls. 38 — Poder de polícia, regulamentar e disciplinar"],

  // Semana 4: 21/09 a 27/09
  ["2026-09-21", "Constitucional", "Nacionalidade, Direitos Políticos e Partidos Políticos", "Art. 12 a 17 da CF/88"],
  ["2026-09-22", "Processo Civil", "Litisconsórcio e Intervenção de Terceiros", "Páginas: Fls. 31 — ⚠️ Denunciação da Lide na responsabilidade do Estado"],
  ["2026-09-23", "Processo Penal", "Ação Penal (Pública e Privada) e ANPP", "⚠️ Acordo de Não Persecução Penal (Art. 28-A CPP)"],
  ["2026-09-24", "Processo do Trabalho", "Atos, Termos e Prazos Trabalhistas", "Contagem de prazos em dias úteis (Art. 775 CLT)"],
  ["2026-09-25", "Tributário", "Legislação, Vigência e Interpretação (Arts. 96 a 112 CTN) (Seq. 3/10)", "Páginas: Fls. 45"],
  ["2026-09-26", "Administrativo", "Agentes Públicos: Lei 8.112 (Provimento e Vacância)", "Páginas: 01 à 50 (Fls. 100)"],

  // Semana 5: 28/09 a 04/10
  ["2026-09-28", "Constitucional", "Organização do Estado (União, Estados, Municípios)", "Páginas: Fls. 55"],
  ["2026-09-29", "Civil", "Bens (Classificação) e Atos Unilaterais", "Páginas: Fls. 30"],
  ["2026-09-30", "Penal", "Teoria do Crime 2 (Ilicitude, Culpabilidade e Concurso)", "Excludentes de ilicitude e culpabilidade, coautoria e participação"],
  ["2026-10-01", "Direito do Trabalho", "Remuneração e Salário", "Diferenças, parcelas salariais e indenizatórias"],
  ["2026-10-02", "Tributário", "Obrigação Tributária e Responsabilidade (Arts. 113 a 138 CTN) (Seq. 4/10)", "Fato gerador, sujeito ativo e passivo"],
  ["2026-10-03", "Administrativo", "Agentes Públicos: Lei 8.112 (PAD e Disciplinar)", "Páginas: Fls. 100 — ⚠️ Súmulas do STJ sobre PAD"],

  // Semana 6: 05/10 a 11/10
  ["2026-10-05", "Constitucional", "Repartição de Competências Constitucionais", "⚠️ Competência Concorrente (Art. 24) e Privativa (Art. 22)"],
  ["2026-10-06", "Processo Civil", "Sujeitos do Processo (Partes e Procuradores)", "Páginas: Fls. 73 — Capacidade processual e deveres das partes"],
  ["2026-10-07", "Processo Penal", "Competência Processual Penal", "⚠️ Justiça Federal (Art. 109, CF) e Conexão (Súmula 122 STJ)"],
  ["2026-10-08", "Processo do Trabalho", "Sentença, Custas e Nulidades", "⚠️ Honorários Sucumbenciais Pós-Reforma (ADI 5766)"],
  ["2026-10-09", "Tributário", "Crédito Tributário 1: Lançamento e Suspensão (Seq. 5/10)", "Páginas: Fls. 48 — Modalidades de lançamento e causas de suspensão (Art. 151 CTN)"],
  ["2026-10-10", "Administrativo", "Improbidade Administrativa (Lei 8.429/92)", "Páginas: Fls. 64 — ⚠️ Dolo específico e novos prazos de prescrição"],

  // Semana 7: 12/10 a 18/10
  ["2026-10-12", "Constitucional", "Processo Legislativo", "Páginas: Fls. 86 — ⚠️ Limites de Medidas Provisórias e PECs"],
  ["2026-10-13", "Civil", "Prescrição e Decadência", "Páginas: Fls. 31 — Prazos gerais e especiais (Art. 205 e 206 CC)"],
  ["2026-10-14", "Penal", "Princípios, Aplicação da Lei e Penas (Cálculo e Concurso)", "Critério trifásico de dosimetria, regime inicial e concurso de crimes"],
  ["2026-10-15", "Processo do Trabalho", "Recursos Trabalhistas", "Páginas: Fls. 60 — RO, RR, Agravo de Instrumento e Agravo de Petição"],
  ["2026-10-16", "Tributário", "Crédito Tributário 2: Extinção e Exclusão (Seq. 6/10)", "Páginas: Fls. 16 e Fls. 37 — Art. 156 e 175 CTN"],
  ["2026-10-17", "Administrativo", "Licitações 1: Lei 14.133 (Princípios, Fases e Modalidades)", "Nova Lei de Licitações: modalidades, critérios de julgamento e SRP"],

  // Semana 8: 19/10 a 25/10
  ["2026-10-19", "Constitucional", "Poder Executivo", "Atribuições, prerrogativas e responsabilidade do Presidente"],
  ["2026-10-20", "Processo Civil", "Tutela Provisória (Urgência e Evidência)", "Requisitos, estabilização da tutela antecedente"],
  ["2026-10-21", "Processo Penal", "Prisões, Cautelares Pessoais e Medidas Assecuratórias", "Flagrante, preventiva, temporária e medidas alternativas (Art. 319)"],
  ["2026-10-22", "Processo do Trabalho", "Execução Trabalhista (Liquidação e Defesas)", "Impugnação e embargos à execução"],
  ["2026-10-23", "Tributário", "Garantias, Privilégios e Dívida Ativa Tributária (Seq. 7/10)", "Presunção de certeza e liquidez, certidões negativas"],
  ["2026-10-24", "Administrativo", "Licitações 2: Contratação Direta", "Dispensa e inexigibilidade na Lei 14.133/21"],

  // Semana 9: 26/10 a 01/11
  ["2026-10-26", "Constitucional", "Poder Judiciário (STF, STJ e Repercussão Geral)", "Composição, competências constitucionais e controle"],
  ["2026-10-27", "Civil", "Fatos Jurídicos e Negócio Jurídico", "Defeitos do negócio jurídico (erro, dolo, coação, fraude) e nulidades"],
  ["2026-10-28", "Processo Civil", "Petição Inicial", "Requisitos, emenda e indeferimento"],
  ["2026-10-29", "Processo Civil", "Respostas do Réu e Fase Ordinatória", "Contestação, reconvenção e revelia"],
  ["2026-10-30", "Tributário", "Impostos em Espécie (União, Estados, Municípios) (Seq. 8/10)", "IR, IPI, ICMS, IPVA, ISS, IPTU e ITBI"],
  ["2026-10-31", "Administrativo", "Contratos Administrativos", "Fls. 48 — Cláusulas exorbitantes, equilíbrio econômico-financeiro e rescisão"],

  // Semana 10: 02/11 a 08/11
  ["2026-11-02", "Constitucional", "CNJ e Súmulas Vinculantes", "Competências disciplinares do CNJ e eficácia erga omnes"],
  ["2026-11-03", "Civil", "Contratos em Geral (Teoria Geral)", "Fls. 56 — Princípios contratuais, boa-fé objetiva e função social"],
  ["2026-11-04", "Processo Civil", "Provas (Teoria e Espécies)", "Fls. 39 — Ônus da prova dinâmico, ata notarial e perícia"],
  ["2026-11-05", "Direito do Trabalho", "Duração do Trabalho (Jornada e Intervalos)", "Horas extras, banco de horas e intervalos intrajornada/interjornada"],
  ["2026-11-06", "Tributário", "Taxas, Contribuições Especiais e Repartição (Seq. 9/10)", "Taxa de polícia vs serviço, contribuições de melhoria"],
  ["2026-11-07", "Administrativo", "Serviços Públicos (Concessões, PPPs e Consórcios)", "Fls. 54 — Concessão comum, patrocinada e administrativa"],

  // Semana 11: 09/11 a 15/11
  ["2026-11-09", "Constitucional", "Funções Essenciais à Justiça (Advocacia Pública)", "Fls. 71 — MP, Defensoria Pública e Advocacia Pública"],
  ["2026-11-10", "Civil", "Contratos em Espécie", "Fls. 132 — Compra e venda, doação, locação e fiança"],
  ["2026-11-11", "Processo Civil", "Sentença e Coisa Julgada", "Fls. 49 — Elementos da sentença e limites da coisa julgada"],
  ["2026-11-12", "Processo Civil", "Recursos (Teoria Geral e Disposições)", "Fls. 32 — Princípios recursais, preparo e efeito suspensivo"],
  ["2026-11-13", "Tributário", "Simples Nacional (LC 123) e Dívida Ativa Não-Tributária", "Regime simplificado e execução de créditos públicos"],
  ["2026-11-14", "Administrativo", "Intervenção na Propriedade (Desapropriação e Juros)", "Fls. 77 — Desapropriação por utilidade pública e interesse social"],

  // Semana 12: 16/11 a 22/11
  ["2026-11-16", "Constitucional", "Controle de Constitucionalidade (Difuso e Modulação)", "Fls. 33 — Cláusula de reserva de plenário (Art. 97 CF)"],
  ["2026-11-17", "Civil", "Responsabilidade Civil (Teorias e Danos Novos)", "Fls. 86 — Dano moral, estético, perda de uma chance e desvio produtivo"],
  ["2026-11-18", "Processo Penal", "Provas 1 (Teoria Geral, Corpo de Delito e Testemunhas)", "Provas ilícitas por derivação e cadeia de custódia"],
  ["2026-11-19", "Processo Penal", "Provas 2 (Busca e Apreensão, Interrogatório)", "Garantias no interrogatório e mandado de busca"],
  ["2026-11-20", "Direito Financeiro", "Instrumentos Orçamentários (PPA, LDO, LOA)", "Princípios orçamentários, emendas parlamentares e LOA"],
  ["2026-11-21", "Administrativo", "Responsabilidade Civil do Estado (Ação, Omissão e Regresso)", "Fls. 35 — Teoria do risco administrativo e culpa anônima"],

  // Semana 13: 23/11 a 29/11
  ["2026-11-23", "Constitucional", "Controle Concentrado (ADI, ADC, ADO, ADPF)", "Fls. 115 — Legitimados do Art. 103 e efeitos das decisões"],
  ["2026-11-24", "Civil", "Posse", "Fls. 99 — Aquisição, perda e efeitos da posse, interditos possessórios"],
  ["2026-11-25", "Processo Civil", "Execução de Título Extrajudicial (Geral e Espécies)", "Fls. 125 — Títulos executivos, penhora e expropriação"],
  ["2026-11-26", "Direito do Trabalho", "Extinção do Contrato, Justa Causa e Prescrição", "Hipóteses de justa causa (Art. 482 CLT) e rescisão indireta"],
  ["2026-11-27", "Direito Financeiro", "Receitas, Despesas e Ciclo Orçamentário", "Classificação das receitas e despesas públicas"],
  ["2026-11-28", "Administrativo", "Bens Públicos (Terrenos de Marinha e Faixa de Fronteira)", "Fls. 29 — Afetação, desafetação e regime jurídico"],

  // Semana 14: 30/11 a 06/12
  ["2026-11-30", "Constitucional", "Ordem Econômica Constitucional", "Fls. 19 — Princípios da ordem econômica e atuação estatal"],
  ["2026-12-01", "Civil", "Propriedade, Usucapião, Condomínio e Registros", "Fls. 99 — Modalidades de usucapião e direito de vizinhança"],
  ["2026-12-02", "Processo Civil", "Cumprimento de Sentença (Geral e Pagar Quantia)", "Fls. 93 — Multa do Art. 523 e impugnação"],
  ["2026-12-03", "Direito do Trabalho", "Direito Coletivo (Negociação, Sindicatos, Greve)", "Convenção e acordo coletivo, prevalência do negociado"],
  ["2026-12-04", "Direito Financeiro", "LRF: Planejamento, Transferências, RAP e DEA", "Lei de Responsabilidade Fiscal (LC 101/00)"],
  ["2026-12-05", "Administrativo", "Estatuto das Estatais (Lei 13.303) e Anticorrupção", "Governança corporativa, licitações em estatais e Lei 12.846/13"],

  // Semana 15: 07/12 a 13/12
  ["2026-12-07", "Constitucional", "Intervenção do Estado (Defesa do Estado e Sítio)", "Estado de defesa, estado de sítio e intervenção federal"],
  ["2026-12-08", "Civil", "Obrigações 1 (Modalidades e Transmissão)", "Fls. 76 — Obrigação de dar, fazer, solidárias e cessão de crédito"],
  ["2026-12-09", "Processo Civil", "Cumprimento de Sentença contra a Fazenda Pública", "⚠️ Tema 1076 STJ (Fixação de honorários por equidade)"],
  ["2026-12-10", "Empresarial", "Empresário, Empresa e Estabelecimento", "Caracterização, capacidade e trespasse do estabelecimento"],
  ["2026-12-11", "Direito Financeiro", "LRF: Despesas com Pessoal e Dívida Pública", "Limites de gastos com pessoal e medidas de contenção"],
  ["2026-12-12", "Administrativo", "Controle da Administração (Tribunais de Contas e Judiciário)", "Fls. 36 — Controle exercido pelos Tribunais de Contas"],

  // Semana 16: 14/12 a 20/12
  ["2026-12-14", "Constitucional", "Administração Pública Constitucional (Arts. 37 a 41)", "Concurso público, teto remuneratório, acumulação e estabilidade"],
  ["2026-12-15", "Civil", "Obrigações 2 (Adimplemento, Inadimplemento e Mora)", "Fls. 76 — Pagamento indevido, novação, compensação e perdas e danos"],
  ["2026-12-16", "Processo Civil", "Execução contra a Fazenda Pública e Precatórios", "⚠️ EC 113 e 114 — Ordem cronológica de precatórios e RPV"],
  ["2026-12-17", "Empresarial", "Nome Empresarial e Sociedades Não Personificadas", "Firma vs Denominação social e sociedade em comum"],
  ["2026-12-18", "Direito Financeiro", "Dívida Ativa da União e Lei do CADIN", "Inscrição em dívida ativa e efeitos do CADIN"],
  ["2026-12-19", "Administrativo", "Processo Administrativo Federal (Lei 9.784/99)", "Fls. 47 — Princípios, competência, impedimentos, prazos e recursos"],

  // Semana 17: 21/12 a 27/12
  ["2026-12-21", "Constitucional", "Tributação e Orçamento na CF", "Art. 145 a 169 da Constituição"],
  ["2026-12-22", "Penal", "Extinção da Punibilidade (Art. 107) e Prescrição Penal", "Prescrição da pretensão punitiva e executória"],
  ["2026-12-23", "Processo Civil", "Microssistema de Tutela Coletiva (ACP, Ação Popular)", "Lei 7.347/85, Lei 4.717/65 e processos estruturais"],
  ["2026-12-24", "Empresarial", "Sociedade Limitada (LTDA)", "Quotas sociais, deliberações e exclusão de sócio"],
  ["2026-12-25", "Direito Financeiro", "Precatórios (EC 113/114) e Execução Fiscal", "⚠️ Exceção de Pré-Executividade e garantias da execução"],
  ["2026-12-26", "Direito do Trabalho", "Acidente de Trabalho (Responsabilidade Civil e NTEP)", "Nexo Técnico Epidemiológico e estabilidade acidentária"],

  // Semana 18: 28/12 a 03/01
  ["2026-12-28", "Constitucional", "Fiscalização Contábil, Financeira e TCU", "Competências do Tribunal de Contas da União (Art. 71 CF)"],
  ["2026-12-29", "Penal", "Crimes contra a Administração: Funcionário Público", "⚠️ Peculato, concussão, corrupção passiva e crimes previdenciários"],
  ["2026-12-30", "Processo Civil", "Mandado de Segurança (Lei 12.016)", "Direito líquido e certo, prova pré-constituída e liminares"],
  ["2026-12-31", "Empresarial", "Sociedade Anônima (S/A) e SFN", "Ações, debêntures, assembleia geral e órgãos"],
  ["2027-01-01", "Previdenciário", "Seguridade Social: Princípios e Custeio", "Fls. 57 — Financiamento da seguridade e contribuições sociais"],
  ["2027-01-02", "Direito do Trabalho", "Estabilidade, FGTS e Tutelas Especiais", "Gestante, cipeiro, dirigente sindical"],

  // Semana 19: 04/01 a 10/01
  ["2027-01-04", "Constitucional", "Direitos Sociais e Ordem Social", "Fls. 49 — Educação, saúde, previdência e família"],
  ["2027-01-05", "Penal", "Crimes contra a Administração (Particular e Justiça)", "Desacato, corrupção ativa, falso testemunho e denunciação"],
  ["2027-01-06", "Processo Civil", "Juizados Federais e da Fazenda Pública", "Fls. 48 — ⚠️ Leis 10.259/01 e 12.153/09"],
  ["2027-01-07", "Empresarial", "Contratos Mercantis (Factoring, Franchising, Leasing)", "Arrendamento mercantil, faturização e franquia"],
  ["2027-01-08", "Previdenciário", "Segurados do RGPS e Período de Graça", "Fls. 76 — Segurados obrigatórios vs facultativos, manutenção"],
  ["2027-01-09", "Direito do Trabalho", "Terceirização e Responsabilidade Trabalhista", "⚠️ Súmula 331 TST e Tema 246 STF"],

  // Semana 20: 11/01 a 17/01
  ["2027-01-11", "Constitucional", "Direitos Indígenas, Comunidades e Igualdade Racial", "Art. 231 e 232 CF/88 e Estatuto da Igualdade Racial"],
  ["2027-01-12", "Penal", "Crimes contra o Patrimônio e Dignidade Sexual", "Furto, roubo, estelionato e crimes sexuais"],
  ["2027-01-13", "Processo Civil", "Ação Rescisória e Reclamação Constitucional", "Fls. 25 e Fls. 33 — Hipóteses de rescisória e cabimento"],
  ["2027-01-14", "Empresarial", "Títulos de Crédito 1 (Teoria Geral e Letra de Câmbio)", "Princípios cartulares: cartularidade, literalidade e autonomia"],
  ["2027-01-15", "Previdenciário", "RGPS: Aposentadorias e Pensão por Morte (EC 103)", "Regras pós-reforma, transição e cálculo"],
  ["2027-01-16", "Civil", "Sucessões (Legítima e Testamentária)", "Ordem de vocação hereditária, legítima e testamentos"],

  // Semana 21: 18/01 a 24/01
  ["2027-01-18", "Eleitoral", "Partidos Políticos e Financiamento", "Fundo partidário, FEFC e prestação de contas"],
  ["2027-01-19", "Penal", "Leis Penais Especiais - Ordem Tributária e Prisão Temporária", "Súmula Vinculante 24 e requisitos da prisão temporária"],
  ["2027-01-20", "Processo Civil", "IRDR e IAC", "Fls. 24 — Incidente de Resolução de Demandas Repetitivas"],
  ["2027-01-21", "Direito Ambiental", "Princípios e Meio Ambiente na CF/88", "Art. 225 CF/88, prevenção e precaução, poluidor-pagador"],
  ["2027-01-22", "Previdenciário", "RGPS: Auxílios, Salário-Maternidade e Acidente", "Incapacidade temporária e permanente"],
  ["2027-01-23", "Civil", "Direitos Reais sobre Coisas Alheias", "Usufruto, servidão, hipoteca, penhor e alienação fiduciária"],

  // Semana 22: 25/01 a 31/01
  ["2027-01-25", "Eleitoral", "Elegibilidade e Inelegibilidades (LC 64)", "Condições de elegibilidade e Lei da Ficha Limpa"],
  ["2027-01-26", "Empresarial", "Falência (Lei 11.101 - Disposições e Créditos)", "Requisitos da autofalência e ordem de preferência"],
  ["2027-01-27", "Processo Civil", "Advocacia Pública no CPC e Tutela contra a Fazenda", "⚠️ Leis 8.437/92 e 9.494/97 — Prerrogativas processuais"],
  ["2027-01-28", "Direito Ambiental", "Política Nacional do Meio Ambiente (SISNAMA)", "Instrumentos da PNMA, zoneamento ambiental"],
  ["2027-01-29", "Previdenciário", "Prescrição/Decadência, RPPS e Complementar", "Regime próprio de previdência dos servidores públicos"],
  ["2027-01-30", "Processo Penal", "Procedimentos Especiais (Júri e JECRIM)", "Fases do Tribunal do Júri e transação penal"],

  // Semana 23: 01/02 a 07/02
  ["2027-02-01", "Empresarial", "Propriedade Intelectual (Marcas, Patentes)", "Registro de marcas no INPI e invenções"],
  ["2027-02-02", "Empresarial", "Recuperação Judicial", "Plano de recuperação, stay period e assembleia"],
  ["2027-02-03", "Processo Civil", "Procedimentos Especiais (Possessórias e Embargos)", "⚠️ Reintegração de bens públicos e legitimidade"],
  ["2027-02-04", "Direito Ambiental", "Licenciamento e Impacto Ambiental (EIA/RIMA)", "LP, LI, LO e audiências públicas"],
  ["2027-02-05", "Direito Econômico", "Princípios Gerais e Intervenção no Domínio Econômico", "Monopólio estatal e repressão ao abuso de poder"],
  ["2027-02-06", "Processo Penal", "Sentença, Coisa Julgada e Execução Penal (LEP)", "Regimes prisionais, progressão e livramento condicional"],

  // Semana 24: 08/02 a 14/02
  ["2027-02-08", "Processo Penal", "Nulidades e Recursos Processuais Penais", "Nulidade relativa vs absoluta, apelação, RESE"],
  ["2027-02-09", "Penal", "Crimes Licitatórios e Crimes contra a Fé Pública", "Novos crimes na Lei 14.133 e falsidade documental"],
  ["2027-02-10", "Processo Civil", "Proc. Especiais (Monitória, Inventário/Partilha)", "Fls. 74 — Prova escrita sem eficácia executiva"],
  ["2027-02-11", "Empresarial", "Títulos de Crédito 2 (Cheque e Duplicata)", "Endosso, aval, protesto e execução cambial"],
  ["2027-02-12", "Direito Econômico", "Defesa da Concorrência (Lei 12.529/11 - CADE)", "Atos de concentração econômica e cartéis"],
  ["2027-02-13", "Penal", "Leis Penais Especiais - Abuso de Autoridade", "Lei 13.869/19 e Lei 9.296/96 (Interceptação)"],

  // Semana 25: 15/02 a 21/02
  ["2027-02-15", "Civil", "Família (Casamento, Alimentos e Parentesco)", "Regimes de bens, união estável e alimentos"],
  ["2027-02-16", "Processo Penal", "Habeas Corpus e Autoridade Estrangeira", "Extradição e homologação de sentença estrangeira"],
  ["2027-02-17", "Processo Civil", "Recursos em Espécie (Apelação, Agravo e Embargos)", "Fls. 48 — ⚠️ Remessa Necessária e Agravo (Art. 1015)"],
  ["2027-02-18", "Direito Ambiental", "SNUC (Sistema de Unidades de Conservação)", "Unidades de proteção integral e uso sustentável"],
  ["2027-02-19", "Previdenciário", "Salário de Contribuição e Custeio Patronal", "Base de cálculo e alíquotas progressivas"],
  ["2027-02-20", "Penal", "Crimes contra a Pessoa e Crime Organizado", "Homicídio qualificado, Lei 12.850/13 e Lavagem"],

  // Semana 26: 22/02 a 28/02
  ["2027-02-22", "Eleitoral", "Condutas Vedadas e Propaganda Eleitoral", "Proibições aos agentes públicos em ano eleitoral"],
  ["2027-02-23", "Eleitoral", "Ações Eleitorais (AIJE, AIME, AIRE)", "Abuso de poder político e econômico"],
  ["2027-02-24", "Processo Civil", "Arbitragem e Mediação na Fazenda Pública", "Lei 9.307/96 e Lei 13.140/15"],
  ["2027-02-25", "Direito Ambiental", "Crimes Ambientais (Lei 9.605/98)", "Responsabilidade penal da PJ e reparação ambiental"],
  ["2027-02-26", "Processo Civil", "Liquidação de Sentença e Ações de Família", "Liquidação por arbitramento e pelo procedimento comum"],
  ["2027-02-27", "Direito Ambiental", "Código Florestal (APP e Reserva Legal)", "Lei 12.651/12 — APP, Reserva Legal e CAR"],

  // Semana 27: 01/03 a 07/03
  ["2027-03-01", "Direito Ambiental", "PNRS e Patrimônio Genético / Biodiversidade", "Resíduos sólidos e marco da biodiversidade"],
  ["2027-03-02", "Legislação Específica", "Estatuto da OAB e Ética Profissional", "Lei 8.906/94 — Direitos do advogado e prerrogativas"],
  ["2027-03-03", "Legislação Específica", "LOMAN e AGU (LC 35/79 e LC 73/93)", "Lei Orgânica da Magistratura e Advocacia-Geral"],
  ["2027-03-04", "Legislação Específica", "Lei de Acesso à Informação e Conflito de Interesses", "Lei 12.527/11 e Lei 12.813/13"]
];

export const RAW_SEED_EDITAIS: Edital[] = [
  {
    id: "edital-tce-ma-analista",
    nome: "TCE-MA 2026",
    cargo: "Analista Estadual de Apoio ao Controle Externo",
    banca: "Cebraspe",
    dataProva: "2026-11-22",
    status: "Inscrito",
    conteudo: `CONHECIMENTOS BÁSICOS:
- Língua Portuguesa e Redação Oficial
- Controle Externo e Legislação do TCE-MA (LOTCE-MA e RITCE-MA)
- Direito Constitucional e Administrativo
- Auditoria Governamental

CONHECIMENTOS ESPECÍFICOS:
- Direito Financeiro e Orçamento Público
- Lei de Responsabilidade Fiscal (LC 101/2000)
- Nova Lei de Licitações (Lei 14.133/2021) e Contratos Administrativos
- Contabilidade Aplicada ao Setor Público (CASP)
- Análise de Demonstrações Contábeis Públicas`
  },
  {
    id: "edital-tce-ma-tecnico",
    nome: "TCE-MA 2026",
    cargo: "Técnico Estadual de Controle Externo",
    banca: "Cebraspe",
    dataProva: "2026-11-29",
    status: "Inscrito",
    conteudo: `CONHECIMENTOS BÁSICOS:
- Língua Portuguesa
- Legislação Específica do TCE-MA
- Noções de Direito Constitucional
- Noções de Direito Administrativo

CONHECIMENTOS ESPECÍFICOS:
- Noções de Administração Financeira e Orçamentária (AFO)
- Noções de Contabilidade Pública
- Noções de Controle da Administração Pública`
  }
];
