// Tipos de entrada (Baseados na Anamnese)
export interface PatientAnamnesis {
  age: number;
  sex: string;
  complaints: string[]; // Queixas
  chronicConditions: string[]; // Doenças
  medications: string[]; 
  lifestyle: {
    pregnant: boolean;
    lactating: boolean;
    keloidHistory: boolean;
    isotretinoin: boolean; // Roacutan
    smoker: boolean;
    sunExposure: string;
  };
  skin: {
    fototipo: string; // I-VI
    glogau: string; // I-IV
    biotipo: string; // Seca, Oleosa, Mista
    flacidez: string; // Leve/Mod/Grave
    acne: boolean;
    melasma: boolean;
  };
}

// JSON de Retorno Expandido
export interface AIPlanResult {
  // Injetáveis (O que já tínhamos)
  botox: Record<string, number>;
  preenchimento: Record<string, string>;
  bioestimuladores: {
    produto: string;
    sessoes: number;
    intervalo: string;
  };
  
  // NOVO: Gerenciamento de Pele
  pele: {
    limpeza: string; // Frequência sugerida
    peeling: string; // Tipo de ácido sugerido
    microagulhamento: string; // Indicação
  };

  // NOVO: Tecnologias
  tecnologias: {
    laser: string;
    radiofrequencia: string;
    outros: string;
  };

  alertas: string[];
  contraindicacoes: string[];
  justificativa: string;
}

export function generateInjectablePlan(patient: PatientAnamnesis): AIPlanResult {
  const result: AIPlanResult = {
    botox: {},
    preenchimento: {},
    bioestimuladores: { produto: "A avaliar", sessoes: 0, intervalo: "-" },
    pele: { limpeza: "Mensal", peeling: "Não indicado", microagulhamento: "Não" },
    tecnologias: { laser: "Não", radiofrequencia: "Não", outros: "-" },
    alertas: [],
    contraindicacoes: [],
    justificativa: "Protocolo global gerado com base na avaliação clínica."
  };

  // --- 1. SEGURANÇA (CRÍTICA) ---
  if (patient.lifestyle.pregnant) {
    result.contraindicacoes.push("Gestante: Apenas limpeza de pele básica e hidratação permitidas.");
    result.justificativa = "Protocolo restrito devido à gestação.";
    return result; 
  }
  if (patient.lifestyle.isotretinoin) {
    result.alertas.push("Uso de Roacutan: Pele extremamente sensível. Proibido laser ablativo e peelings médios/profundos.");
  }
  if (patient.skin.melasma && patient.lifestyle.sunExposure.includes('Alta')) {
    result.alertas.push("Melasma + Sol: Risco altíssimo de efeito rebote. Focar em gerenciamento térmico.");
  }

  // --- 2. GERENCIAMENTO DE PELE (NOVO) ---
  
  // Limpeza de Pele
  if (patient.skin.biotipo.includes('Oleosa') || patient.skin.acne) {
      result.pele.limpeza = "A cada 21 dias (Controle de oleosidade)";
      result.pele.peeling = "Ácido Salicílico ou Mandélico (Superficial)";
  } else if (patient.skin.biotipo.includes('Seca')) {
      result.pele.limpeza = "A cada 45 dias (Foco em Hidratação)";
  }

  // Microagulhamento / Cicatrizes
  if (patient.complaints.some(c => c.includes('Cicatrizes') || c.includes('Poros'))) {
      if (!patient.lifestyle.keloidHistory && !patient.lifestyle.isotretinoin) {
          result.pele.microagulhamento = "Indicado (Drug Delivery com Fatores de Crescimento)";
      } else {
          result.pele.microagulhamento = "Contraindicado (Histórico de Queloide ou Roacutan)";
      }
  }

  // --- 3. TECNOLOGIAS (NOVO) ---
  
  // Manchas / Melasma
  if (patient.skin.melasma || patient.complaints.some(c => c.includes('Manchas'))) {
      result.tecnologias.laser = "Luz Pulsada (IPL) ou Laser Q-Switched (Baixa energia)";
      result.tecnologias.outros = "LEDterapia Ambar/Vermelho";
  }

  // Flacidez (Tecnologias)
  if (patient.complaints.some(c => c.includes('Flacidez'))) {
      result.tecnologias.radiofrequencia = "Indicada (Ex: Multipolar) - Estimulo de colágeno sem agulhas";
      if (patient.age > 45) {
          result.tecnologias.outros += " / Considerar Ultraformer (HIFU)";
      }
  }

  // --- 4. INJETÁVEIS (LÓGICA ANTERIOR MANTIDA) ---
  
  const multiplier = patient.sex === 'Masculino' ? 1.5 : 1;
  
  // Toxina
  if (patient.age > 25 || patient.complaints.some(c => c.includes('Rugas'))) {
    result.botox = {
      "Glabela": Math.ceil((patient.age > 45 ? 25 : 20) * multiplier),
      "Testa": Math.ceil((patient.age > 55 ? 10 : 12) * multiplier),
      "Olhos": Math.ceil(12 * multiplier),
    };
  }

  // Preenchimento
  if (patient.age > 35 || patient.complaints.some(c => c.includes('Olheiras') || c.includes('Bigode'))) {
    if (patient.age > 40) {
        result.preenchimento["Malar"] = "1.0ml/lado (Sustentação)";
        result.preenchimento["Mento"] = "1.0ml";
    }
    if (patient.complaints.some(c => c.includes('Olheiras'))) {
        result.preenchimento["Olheiras"] = "1.0ml (Redensity II)";
    }
  }

  // Bioestimulador
  const hasFlacidez = patient.complaints.some(c => c.includes("Flacidez")) || patient.age > 30;
  if (hasFlacidez) {
    const isDarkSkin = ['IV', 'V', 'VI'].includes(patient.skin.fototipo);
    if (isDarkSkin) {
      result.bioestimuladores = { produto: "Radiesse (Hidroxiapatita)", sessoes: 2, intervalo: "45 dias" };
      result.justificativa += " Radiesse preferido para fototipos altos.";
    } else {
      result.bioestimuladores = { produto: "Sculptra", sessoes: 3, intervalo: "30 dias" };
    }
  }

  return result;
}