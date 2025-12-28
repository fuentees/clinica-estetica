// =========================================
// 1. SAÚDE GERAL, HÁBITOS E QUEIXA
// =========================================

export const DOENCAS = [
  "Hipertensão",
  "Diabetes",
  "Cardiopatias",
  "Autoimunes (Lúpus, etc)",
  "Epilepsia",
  "Tireoide (Hipo/Hiper)",
  "Herpes",
  "Hepatite",
  "Câncer/Histórico",
  "Distúrbio Hormonal",
  "SOP (Ovário Policístico)"
];

export const ALERGIAS = [
  "Antibióticos",
  "Anestésicos (Lidocaína)",
  "Látex",
  "Cosméticos/Conservantes",
  "AAS/Dipirona",
  "Frutos do Mar",
  "Iodo",
  "Nenhuma Conhecida"
];

export const QUEIXAS = [
  "Gordura Localizada",
  "Flacidez Corporal",
  "Flacidez Facial",
  "Celulite (FEG)",
  "Melasma / Manchas",
  "Acne / Cicatrizes",
  "Rugas / Linhas",
  "Olheiras",
  "Queda de Cabelo / Calvície",
  "Estrias",
  "Papada",
  "Poros Dilatados"
];

// --- INVESTIGAÇÃO DETALHADA (TAB QUEIXA) ---
export const EVOLUCAO_QUEIXA = [
  "Estável (Sem alterações recentes)",
  "Piora Gradual (Lenta)",
  "Piora Súbita (Rápida)",
  "Melhora com cosméticos",
  "Flutuante (Melhora e piora)"
];

export const HISTORICO_PROCEDIMENTOS = [
  "Toxina Botulínica",
  "Preenchimento",
  "Bioestimuladores",
  "Fios de Sustentação",
  "Laser / Luz Pulsada",
  "Peeling Químico",
  "Microagulhamento",
  "Cirurgia Plástica Facial",
  "Cirurgia Plástica Corporal",
  "Nenhum procedimento anterior"
];

export const ROTINA_SKINCARE = [
  "Limpeza (Sabonete específico)",
  "Tonificação",
  "Hidratação",
  "Proteção Solar Diária",
  "Uso de Ácidos/Retinóides",
  "Uso de Vitamina C",
  "Maquiagem Diária",
  "Dorme de Maquiagem",
  "Não possui rotina"
];

export const EXPECTATIVA_RESULTADO = [
  "Sutil / Natural",
  "Moderada / Corretiva",
  "Transformação Total",
  "Imediata (Urgência)",
  "Preventiva (Manutenção)"
];

// =========================================
// 2. FACIAL - ANÁLISE AVANÇADA
// =========================================

// Básico
export const FOTOTIPOS = ["I", "II", "III", "IV", "V", "VI"];
export const BIOTIPOS = ["Normal (Eudérmica)", "Seca (Alípica)", "Oleosa (Lipídica)", "Mista", "Sensível"];
export const TEXTURAS_PELE = ["Lisa", "Áspera", "Espessa", "Fina", "Irregular"];
export const ESPESSURA_PELE = ["Muito Fina", "Fina", "Normal", "Espessa", "Muito Espessa"];

// Detalhes de Poros e Acne
export const OSTIOS = [
  "Imperceptíveis",
  "Pouco Visíveis",
  "Visíveis na Zona T",
  "Muito Dilatados na Zona T",
  "Dilatados na Face Toda"
];

export const COMEDOES = [
  "Ausentes",
  "Poucos (Zona T)",
  "Muitos (Zona T)",
  "Dispersos na Face",
  "Muitos em toda a face"
];

export const GRAUS_ACNE = [
  "Não possui",
  "Grau I (Comedônica)",
  "Grau II (Pápulo-pustulosa)",
  "Grau III (Nódulo-cística)",
  "Grau IV (Conglobata)",
  "Grau V (Fulminans)"
];

export const LESOES_ACNE = [
  "Comedões Abertos",
  "Comedões Fechados",
  "Pápulas",
  "Pústulas",
  "Milium",
  "Cistos",
  "Nódulos",
  "Escoriações",
  "Cicatrizes Atróficas",
  "Cicatrizes Hipertróficas"
];

export const PATOLOGIAS_PELE = [
  "Rosácea",
  "Dermatite Seborreica",
  "Dermatite de Contato",
  "Dermatite Atópica",
  "Psoríase",
  "Vitiligo",
  "Efelides (Sardas)",
  "Nevos (Pintas)"
];

export const DISCROMIAS = [
  "Acromia",
  "Hipocromia",
  "Hipercromia Pós-Inflamatória",
  "Melasma Epidérmico",
  "Melasma Dérmico",
  "Melasma Misto",
  "Melanose Solar"
];

export const ENVELHECIMENTO_SINAIS = [
  "Rugas Dinâmicas",
  "Rugas Estáticas",
  "Elastose Solar",
  "Flacidez Muscular",
  "Flacidez Tissular",
  "Perda de Volume (Coxins)",
  "Ptose Facial"
];

export const REGIOES_FACIAIS = [
  "Frontal (Testa)",
  "Glabela",
  "Periorbital (Olhos)",
  "Malar (Maçãs)",
  "Nasal",
  "Nasogeniano (Bigode Chinês)",
  "Perioral (Boca)",
  "Mentual (Queixo)",
  "Mandibular",
  "Pescoço",
  "Colo"
];

// --- SELETORES VISUAIS PREMIUM (FACIAL) ---

export const FITZPATRICK_OPCOES = [
  { label: "Tipo I", desc: "Sempre queima, nunca bronzeia", color: "#fdf0e6" },
  { label: "Tipo II", desc: "Sempre queima, bronzeia muito pouco", color: "#f3e0cf" },
  { label: "Tipo III", desc: "Queima moderadamente, bronzeia moderadamente", color: "#eacba8" },
  { label: "Tipo IV", desc: "Queima pouco, sempre bronzeia", color: "#d2a47e" },
  { label: "Tipo V", desc: "Raramente queima, bronzeia muito", color: "#9e704e" },
  { label: "Tipo VI", desc: "Nunca queima, totalmente pigmentada", color: "#5c3a26" }
];

export const BAUMANN_TYPES = [
  { id: "O", label: "Oleosa", desc: "Brilho excessivo" },
  { id: "S", label: "Seca", desc: "Opaca/Repuxa" },
  { id: "P", label: "Pigmentada", desc: "Manchas" },
  { id: "N", label: "Não-Pigm.", desc: "Tom uniforme" },
  { id: "S2", label: "Sensível", desc: "Vermelhidão/Ardor" },
  { id: "R", label: "Resistente", desc: "Barreira forte" },
  { id: "W", label: "Enrugada", desc: "Rugas/Flacidez" },
  { id: "T", label: "Tensionada", desc: "Firme" }
];

export const OLHEIRAS_TIPOS = [
  { label: "Tipo 1 - Pigmentar", desc: "Acastanhada (Melanina)" },
  { label: "Tipo 2 - Vascular", desc: "Azulada/Roxa (Circulação)" },
  { label: "Tipo 3 - Estrutural", desc: "Profunda (Sombra/Sulco)" },
  { label: "Tipo 4 - Mista", desc: "Vascular + Pigmentar" },
  { label: "Tipo 5 - Edematosa", desc: "Bolsas de gordura/líquido" },
  { label: "Tipo 6 - Flácida", desc: "Excesso de pele" }
];

// =========================================
// 3. CORPORAL - ANÁLISE AVANÇADA
// =========================================

export const ALTERACOES_POSTURAIS = [
  "Cifose",
  "Escoliose",
  "Hiperlordose",
  "Retificação",
  "Protusão Abdominal",
  "Anteversão Pélvica"
];

export const TIPOS_LIPODISTROFIA = [
  "Gordura Flácida",
  "Gordura Compacta",
  "Gordura Edematosa",
  "Gordura Mista"
];

export const DISTRIBUICAO_GORDURA = [
  { id: "Androide", label: "Androide (Maçã)", desc: "Acúmulo tronco/abdômen" },
  { id: "Ginoide", label: "Ginoide (Pêra)", desc: "Acúmulo quadril/coxas" }
];

export const TIPOS_ESTRIAS = [
  "Vermelhas (Rubras)",
  "Nacaradas (Brilhantes)",
  "Brancas (Albas)",
  "Atróficas (Largas)"
];

export const FLACIDEZ_CORPORAL = [
  "Tissular (Pele)",
  "Muscular",
  "Mista (Pele + Músculo)"
];

export const REGIOES_CORPORAIS = [
  "Braços",
  "Abdômen Superior",
  "Abdômen Inferior",
  "Flancos",
  "Costas (Sutiã)",
  "Glúteos",
  "Banana Roll (Subglúteo)",
  "Coxa Anterior",
  "Coxa Posterior",
  "Interno de Coxa",
  "Culote",
  "Panturrilha",
  "Joelho"
];

export const DOBRAS_CUTANEAS = [
  "Tricipital",
  "Subescapular",
  "Biciptal",
  "Axilar Média",
  "Ilíaca",
  "Supraespinhal",
  "Abdominal",
  "Coxa",
  "Panturrilha"
];

export const PERIMETRIA_PONTOS = [
  "Braço Relaxado",
  "Braço Contraído",
  "Cintura",
  "Abdomem (Cicatriz Umbilical)",
  "Quadril",
  "Coxa Proximal",
  "Coxa Medial",
  "Panturrilha"
];

export const DIASTASE_TIPO = [
  { id: "Tipo A", label: "Tipo A", desc: "Abaixo do umbigo" },
  { id: "Tipo B", label: "Tipo B", desc: "Acima do umbigo" },
  { id: "Tipo C", label: "Tipo C", desc: "Região umbilical" },
  { id: "Tipo D", label: "Tipo D", desc: "Abertura total" }
];

// =========================================
// 4. CAPILAR - TRICOLOGIA
// =========================================

export const CAPILAR_TIPO = ["Liso", "Ondulado", "Cacheado", "Crespo"];
export const CAPILAR_LAVAGEM = ["Diária", "A cada dois dias", "A cada três dias", "Semanalmente", "Quinzenalmente"];
export const CAPILAR_DIAMETRO = ["Fino", "Médio", "Grosso"];
export const CAPILAR_OLEOSIDADE = ["Seco", "Normal", "Misto", "Oleoso"];
export const CAPILAR_COURO = ["Seco", "Normal", "Oleoso", "Descamativo (Caspa)", "Sensível", "Inflamado/Eritematoso"];
export const CAPILAR_ELASTICIDADE = ["Ausente (Quebra fácil)", "Pouca", "Normal", "Boa"];
export const CAPILAR_POROSIDADE = ["Baixa (Cutícula fechada)", "Normal", "Alta (Poroso)", "Muito Poroso"];
export const CAPILAR_COMPRIMENTO = ["Extremamente Curto", "Curto (Orelha)", "Médio (Ombro)", "Longo (Escápula)", "Extremamente Longo"];

export const DISPLASIAS_CONGENITAS = [
  "Moniletrix",
  "Tricorrexe invaginada",
  "Tricopoliodistrofia",
  "Cabelos anágenos frouxos",
  "Síndrome dos cabelos impenteáveis"
];

export const DISPLASIAS_ADQUIRIDAS = [
  "Tricorrexe nodosa",
  "Tricoptilose (Pontas duplas)",
  "Triconodose (Nós)",
  "Tricotilomania (Arrancamento)",
  "Bubble Hair"
];

export const ALOPECIA_AREATA = [
  "Unifocal",
  "Multifocal",
  "Total (Todo couro cabeludo)",
  "Universal (Todos os pelos)",
  "Difusa",
  "Ofiásica",
  "Reticular"
];

export const ESCALA_SAVIN = ["I-1", "I-2", "I-3", "I-4", "II-1", "II-2", "III", "Avançado", "Frontal"];
export const ESCALA_NORWOOD = ["I", "II", "IIa", "III", "IIIa", "III-Vertex", "IV", "IVa", "V", "Va", "VI", "VII"];

// =========================================
// 5. PROCEDIMENTOS
// =========================================
export const PROCEDIMENTOS_LISTA = [
  "Toxina Botulínica",
  "Preenchimento (Ác. Hialurônico)",
  "Bioestimulador de Colágeno",
  "Fios de PDO",
  "Lipo Enzimática (Papada/Corporal)",
  "Intradermoterapia / Mesoterapia",
  "PEIM (Secagem de Vasinhos)",
  "Laser Lavieen / CO2",
  "Luz Pulsada (IPL)",
  "Peeling Químico",
  "Microagulhamento",
  "Ultrassom Microfocado",
  "Radiofrequência",
  "Criolipólise",
  "MMP Capilar",
  "Cirurgia Plástica (Histórico)"
];

// =========================================
// 6. TERMOS LEGAIS
// =========================================
export const TERMO_LGPD_COMPLETO = `
Eu, paciente identificado no prontuário desta clínica, declaro que fui devidamente informado(a), de forma clara, adequada e suficiente, sobre a necessidade de realização de registros fotográficos e/ou audiovisuais, antes, durante e após procedimentos estéticos, exclusivamente para fins de avaliação, acompanhamento clínico, registro técnico e documentação da evolução do tratamento ao qual serei submetido(a).

Autorizo, de maneira livre, informada e inequívoca, que minhas imagens sejam captadas, armazenadas, tratadas e utilizadas pela clínica e por seus profissionais, para compor meu prontuário, subsidiar decisões terapêuticas, permitir comparações entre estágios de tratamento, registrar intercorrências, dar suporte à conduta técnica adotada, e eventualmente servir como documento de comprovação em auditorias internas, demandas profissionais, perícias ou processos éticos, caso necessário. Declaro estar ciente de que tais imagens possuem caráter estritamente técnico e que têm como finalidade principal a garantia de segurança, transparência, rastreabilidade e qualidade assistencial.

Autorizo ainda que as imagens possam ser utilizadas para fins de treinamento técnico da equipe, aprimoramento de protocolos internos, estudos comparativos, pesquisa clínica sem identificação direta e padronização de resultados, desde que meu nome e dados pessoais não sejam divulgados, em conformidade com o princípio da anonimização previsto na Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Fica vedada qualquer forma de comercialização, cessão ou compartilhamento das minhas imagens com terceiros que não tenham relação direta com o serviço prestado ou necessidade técnica comprovada.

Declaro estar ciente de que o uso externo das imagens, como divulgação em redes sociais, sites, materiais publicitários, folders, palestras, congressos ou quaisquer meios de comunicação, somente ocorrerá mediante minha autorização adicional e expressa, colhida separadamente no sistema. Tal autorização poderá abranger imagens anonimizadas ou parcialmente identificáveis, de acordo com minha escolha e ciência. Caso eu não concorde com a divulgação externa, nenhuma imagem será utilizada para esse fim.

Estou ciente de que todas as imagens serão armazenadas em ambiente seguro e que a clínica adotará medidas técnicas e administrativas compatíveis com a legislação vigente, visando impedir acessos não autorizados, vazamentos, perdas ou manipulações indevidas. Reconheço, porém, que mesmo diante das melhores práticas de segurança, nenhum sistema digital está completamente imune a riscos, e concordo que a clínica não poderá ser responsabilizada por eventos decorrentes de ataques cibernéticos ou atos de terceiros, desde que não haja negligência por parte da instituição.

Reconheço que posso, a qualquer momento, solicitar acesso às imagens, requerer correções, obter informações sobre o tratamento dos dados e revogar parcialmente esta autorização, respeitando-se a legalidade do uso anterior à revogação. Declaro compreender que a revogação não impede a clínica de manter as imagens no prontuário, por obrigação legal, ética, regulatória e sanitária, conforme prevê o Código de Ética e legislações correlatas.

Concordo que a clínica não se responsabiliza por interpretações equivocadas, expectativas irreais ou comparações feitas pelo próprio paciente com imagens externas, de terceiros ou manipuladas digitalmente. Reconheço que resultados estéticos podem variar conforme características individuais, e que imagens de outros pacientes não constituem garantia de resultado.

Por fim, autorizo o uso das imagens para fins internos e assistenciais, conforme descrito acima, e declaro que li atentamente todas as cláusulas deste termo, não restando dúvidas quanto ao seu conteúdo. Confirmo minha concordância mediante assinatura digital registrada no sistema, para que produza efeitos legais.
`;