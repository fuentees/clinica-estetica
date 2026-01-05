/**
 * TIPAGENS DE ENTRADA (Anamnese)
 */
export type Fototipo = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type Biotipo = 'Seca' | 'Oleosa' | 'Mista' | 'Normal';
export type Flacidez = 'Leve' | 'Moderada' | 'Grave';
export type Sexo = 'Feminino' | 'Masculino';

export interface PatientAnamnesis {
  age: number;
  sex: Sexo;
  complaints: string[]; // Ex: ["Rugas", "Manchas", "Flacidez"]
  chronicConditions: string[];
  medications: string[]; 
  lifestyle: {
    pregnant: boolean;
    lactating: boolean;
    keloidHistory: boolean;
    isotretinoin: boolean; // Uso de Roacutan
    smoker: boolean;
    sunExposure: 'Baixa' | 'Moderada' | 'Alta';
  };
  skin: {
    fototipo: Fototipo;
    biotipo: Biotipo;
    flacidez: Flacidez;
    acne: boolean;
    melasma: boolean;
  };
}

/**
 * ESTRUTURA DE RETORNO (Resultado da IA)
 */
export interface AIPlanResult {
  botox: Record<string, number>;
  preenchimento: Record<string, string>;
  bioestimuladores: {
    produto: string;
    sessoes: number;
    intervalo: string;
  };
  pele: {
    limpeza: string;
    peeling: string;
    microagulhamento: string;
    mesoterapia: string;
  };
  tecnologias: {
    laser: string;
    radiofrequencia: string;
    outros: string;
  };
  alertas: string[];
  contraindicacoes: string[];
  justificativa: string;
}

/**
 * MOTOR DE INTELIGÊNCIA CLÍNICA
 */
export function generateInjectablePlan(patient: PatientAnamnesis): AIPlanResult {
  const result: AIPlanResult = {
    botox: {},
    preenchimento: {},
    bioestimuladores: { produto: "A avaliar", sessoes: 0, intervalo: "-" },
    pele: { limpeza: "Mensal", peeling: "Não indicado", microagulhamento: "Não", mesoterapia: "Não indicada" },
    tecnologias: { laser: "Não", radiofrequencia: "Não", outros: "-" },
    alertas: [],
    contraindicacoes: [],
    justificativa: "Protocolo global gerado com base na análise clínica multivariada."
  };

  // Helper interno para busca de queixas (case-insensitive)
  const hasComplaint = (term: string) => 
    patient.complaints.some(c => c.toLowerCase().includes(term.toLowerCase()));

  // --- 1. SEGURANÇA E CONTRAINDICAÇÕES (CRÍTICO) ---
  if (patient.lifestyle.pregnant || patient.lifestyle.lactating) {
    result.contraindicacoes.push("GESTANTE/LACTANTE: Contraindicação absoluta para injetáveis e tecnologias ablativas.");
    result.pele.limpeza = "Limpeza de pele suave/orgânica sem ácidos";
    result.justificativa = "Protocolo limitado exclusivamente a suporte de barreira cutânea devido ao período gestacional.";
    return result; 
  }

  if (patient.lifestyle.isotretinoin) {
    result.alertas.push("Uso de Isotretinoína (Roacutan): Risco de má cicatrização. Evitar peelings e lasers.");
    result.pele.peeling = "Contraindicado";
    result.pele.microagulhamento = "Contraindicado";
  }

  // --- 2. HARMONIZAÇÃO (BOTOX E PREENCHIMENTO) ---
  const multiplier = patient.sex === 'Masculino' ? 1.5 : 1; // Ajuste de dose para força muscular masculina
  
  // Toxina Botulínica
  if (patient.age > 25 || hasComplaint('Ruga') || hasComplaint('Linha')) {
    result.botox = {
      "Glabela": Math.ceil((patient.age > 45 ? 25 : 20) * multiplier),
      "Frontal": Math.ceil((patient.age > 50 ? 12 : 10) * multiplier),
      "Orbicular": Math.ceil(12 * multiplier),
    };
  }

  // Ácido Hialurônico (Preenchimento)
  if (patient.age > 35 || hasComplaint('Olheira') || hasComplaint('Bigode Chinês') || hasComplaint('Volume')) {
    if (patient.age > 40 || patient.skin.flacidez !== 'Leve') {
      result.preenchimento["Malar/Zigomático"] = "1.0ml a 2.0ml (Sustentação de terço médio)";
      result.preenchimento["Mento"] = "1.0ml (Projeção e perfilometria)";
    }
    if (hasComplaint('Olheira')) {
      result.preenchimento["Goteira Lacrimal"] = "1.0ml (Baixa higroscopicidade)";
    }
    if (hasComplaint('Lábio') || patient.age < 35) {
      result.preenchimento["Lábios"] = "1.0ml (Refinamento/Hidratação)";
    }
  }

  // --- 3. BIOESTIMULADORES DE COLÁGENO ---
  if (patient.age > 30 || patient.skin.flacidez !== 'Leve' || hasComplaint('Flacidez')) {
    // Escolha baseada em Fototipo para evitar manchas inflamatórias
    const isDarkSkin = ['IV', 'V', 'VI'].includes(patient.skin.fototipo);
    
    if (isDarkSkin) {
      result.bioestimuladores = { 
        produto: "Radiesse (Hidroxiapatita de Cálcio)", 
        sessoes: 2, 
        intervalo: "45 a 60 dias" 
      };
      result.justificativa += " Radiesse selecionado por segurança em fototipos altos.";
    } else {
      result.bioestimuladores = { 
        produto: "Sculptra (Ácido Poli-L-Lático)", 
        sessoes: 3, 
        intervalo: "30 a 45 dias" 
      };
    }
  }

  // --- 4. GERENCIAMENTO DE PELE ---
  
  // Limpeza e Peeling
  if (patient.skin.biotipo === 'Oleosa' || patient.skin.acne) {
    result.pele.limpeza = "A cada 21-28 dias (Foco em controle sebáceo)";
    result.pele.peeling = "Peeling de Ácido Salicílico ou Retinoico";
  } else if (patient.skin.biotipo === 'Seca') {
    result.pele.limpeza = "A cada 45 dias (Foco em Hidratação)";
    result.pele.mesoterapia = "Skinboosters (Ácido Hialurônico não reticulado)";
  }

  // Microagulhamento
  if (hasComplaint('Cicatriz') || hasComplaint('Poro')) {
    if (!patient.lifestyle.keloidHistory && !patient.lifestyle.isotretinoin) {
      result.pele.microagulhamento = "Indicado (Drug Delivery com Vitamina C/Fatores de Crescimento)";
    } else {
      result.pele.microagulhamento = "Risco de Queloide/Cicatriz detectado: Não realizar.";
    }
  }

  // --- 5. TECNOLOGIAS ---
  
  // Melasma e Manchas
  if (patient.skin.melasma || hasComplaint('Mancha')) {
    result.tecnologias.laser = "Laser Lavieen (Modo Thulium) ou Laser Q-Switched";
    result.tecnologias.outros = "LEDterapia Vermelho/Âmbar (Foto-biomodulação)";
    
    if (patient.lifestyle.sunExposure === 'Alta') {
      result.alertas.push("Exposição Solar Alta: Risco de rebote no Melasma. Obrigatório filtro solar com cor.");
    }
  }

  // Flacidez Muscular/Estrutural
  if (patient.skin.flacidez === 'Grave' || (patient.age > 45 && hasComplaint('Flacidez'))) {
    result.tecnologias.radiofrequencia = "Radiofrequência Microagulhada ou Multipolar";
    result.tecnologias.outros += " / Ultrassom Microfocado (HIFU) para SMAS";
  }

  return result;
}