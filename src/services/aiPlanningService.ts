// Tipos para a IA
interface PatientAnamnesis {
  age: number;
  skinType: string; // Fitzpatrick
  complaints: string[]; // Queixas
  chronicConditions: string[];
  medications: string[]; // Ex: Roacutan
  lifestyle: {
    smoker: boolean;
    pregnant: boolean;
    lactating: boolean;
    keloidHistory: boolean;
  };
}

export interface AIPlanResult {
  botox: Record<string, number>;
  preenchimento: Record<string, string>;
  bioestimuladores: {
    produto: string;
    sessoes: number;
    intervalo: string;
  };
  alertas: string[];
  contraindicacoes: string[];
  justificativa: string;
}

/**
 * Simula uma IA Clínica que gera recomendações baseadas em protocolos dermatológicos
 */
export function generateInjectablePlan(patient: PatientAnamnesis): AIPlanResult {
  const result: AIPlanResult = {
    botox: {},
    preenchimento: {},
    bioestimuladores: { produto: "Não indicado", sessoes: 0, intervalo: "-" },
    alertas: [],
    contraindicacoes: [],
    justificativa: "Análise baseada nos dados clínicos fornecidos."
  };

  // 1. ANÁLISE DE SEGURANÇA (Critical Checks)
  if (patient.lifestyle.pregnant || patient.lifestyle.lactating) {
    result.contraindicacoes.push("Gestação/Lactação: Contraindicação absoluta para toxina e bioestimuladores.");
    result.justificativa = "Procedimento suspenso devido à gestação/lactação.";
    return result; // Para a análise aqui por segurança
  }

  if (patient.medications.some(m => m.toLowerCase().includes('roacutan') || m.toLowerCase().includes('isotretinoína'))) {
    result.alertas.push("Uso de Isotretinoína: Pele sensível e cicatrização lenta. Evitar procedimentos ablativos.");
  }

  if (patient.lifestyle.keloidHistory) {
    result.alertas.push("Histórico de Queloide: Evitar bioestimuladores corporais ou injetáveis com muita reação inflamatória.");
  }

  // 2. PROTOCOLO DE TOXINA BOTULÍNICA (Baseado em Idade e Queixa)
  const needsBotox = patient.complaints.some(c => c.includes('Rugas') || c.includes('Linhas') || c.includes('Envelhecimento'));
  
  if (needsBotox) {
    // Doses sugeridas (Conservative approach)
    result.botox = {
      "Glabela (Bravo)": patient.age > 45 ? 25 : 20,
      "Frontal (Testa)": patient.age > 50 ? 10 : 12, // Em idosos, cuidado com ptose
      "Orbicular (Pés de galinha)": 12,
    };
    
    if (patient.complaints.includes("Bruxismo") || patient.complaints.includes("Rosto quadrado")) {
      result.botox["Masseter"] = 30;
    }
  }

  // 3. PROTOCOLO DE PREENCHIMENTO (Baseado em Perda de Volume)
  const needsVolume = patient.age > 35 || patient.complaints.includes("Flacidez") || patient.complaints.includes("Olheiras");

  if (needsVolume) {
    if (patient.complaints.includes("Olheiras")) result.preenchimento["Olheiras (Redensity II)"] = "1.0ml";
    if (patient.complaints.includes("Bigode Chinês")) result.preenchimento["Sulco Nasogeniano"] = "1.0ml";
    
    // Harmonização básica
    if (patient.age > 40) {
      result.preenchimento["Malar (Sustentação)"] = "1.0ml por lado";
      result.preenchimento["Mentual (Queixo)"] = "1.0ml";
    }
  }

  // 4. PROTOCOLO DE BIOESTIMULADORES (Baseado em Flacidez e Pele)
  if (patient.complaints.includes("Flacidez") || patient.age > 30) {
    if (patient.skinType === 'IV' || patient.skinType === 'V' || patient.skinType === 'VI') {
      // Peles morenas/negras
      result.bioestimuladores = {
        produto: "Radiesse (Hidroxiapatita)",
        sessoes: 2,
        intervalo: "45 dias"
      };
      result.justificativa += " Radiesse escolhido por menor risco de edema em fototipos altos.";
    } else {
      // Peles claras
      result.bioestimuladores = {
        produto: "Sculptra (Ácido P. L-Lático)",
        sessoes: 3,
        intervalo: "30 dias"
      };
    }
  }

  // 5. RECOMENDAÇÕES GERAIS
  if (patient.lifestyle.smoker) {
    result.alertas.push("Tabagismo: Resultados de bioestimuladores podem ser reduzidos em até 40%.");
  }

  return result;
}