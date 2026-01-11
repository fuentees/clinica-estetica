/**
 * VILAGI CLINICAL ENGINE - Motor de Cálculos Estéticos
 * Responsável por determinar doses e segurança.
 */

// ✅ Adicionado 'export' aqui
export interface PatientAnamnesis {
  age: number;
  sex: 'Feminino' | 'Masculino';
  complaints: string[];
  fototipo: string;     // Ex: 'I', 'II', 'III'...
  biotipo: string;      // Ex: 'Seca', 'Oleosa'...
  flacidez: string;     // Ex: 'Leve', 'Moderada'...
  pregnant: boolean;
  lactating: boolean;
  isotretinoin: boolean;
  sunExposure: string;
  melasma: boolean;
  keloidHistory: boolean;
}

// ✅ Adicionado 'export' aqui
export interface AIPlanResult {
  botox: Record<string, number>;
  preenchimento: Record<string, string>;
  bioestimuladores: { produto: string; sessoes: number; intervalo: string };
  pele: { limpeza: string; peeling: string; microagulhamento: string; mesoterapia: string };
  tecnologias: { laser: string; radiofrequencia: string; outros: string };
  alertas: string[];
  contraindicacoes: string[];
  justificativa: string;
  safetyScore: number;
}

// ✅ Adicionado 'export' aqui
export function calculateClinicalPlan(patient: PatientAnamnesis): AIPlanResult {
  const result: AIPlanResult = {
    botox: {},
    preenchimento: {},
    bioestimuladores: { produto: "A avaliar", sessoes: 0, intervalo: "-" },
    pele: { limpeza: "Mensal", peeling: "Não indicado", microagulhamento: "Não", mesoterapia: "Não" },
    tecnologias: { laser: "Não", radiofrequencia: "Não", outros: "-" },
    alertas: [],
    contraindicacoes: [],
    justificativa: "Protocolo base gerado automaticamente.",
    safetyScore: 100
  };

  const hasComplaint = (term: string) => patient.complaints.some(c => c.toLowerCase().includes(term.toLowerCase()));

  // 1. SEGURANÇA CRÍTICA
  if (patient.pregnant || patient.lactating) {
    result.safetyScore = 0;
    result.contraindicacoes.push("GESTANTE/LACTANTE: Contraindicação absoluta para injetáveis.");
    result.justificativa = "Protocolo bloqueado por segurança gestacional.";
    return result;
  }

  if (patient.isotretinoin) {
    result.safetyScore -= 40;
    result.alertas.push("Uso de Isotretinoína (Roacutan): Risco de má cicatrização. Proibido Peelings.");
  }

  // 2. HARMONIZAÇÃO (BOTOX)
  const multiplier = patient.sex === 'Masculino' ? 1.5 : 1;
  
  // Se tiver mais de 25 anos OU queixa de rugas
  if (patient.age > 25 || hasComplaint('Ruga') || hasComplaint('Linha')) {
    result.botox = {
      "Glabela": Math.ceil((patient.age > 45 ? 25 : 20) * multiplier),
      "Frontal": Math.ceil((patient.age > 50 ? 12 : 10) * multiplier),
      "Orbicular": Math.ceil(12 * multiplier),
    };
  }

  // 3. PREENCHIMENTO (ÁCIDO HIALURÔNICO)
  if (patient.age > 35 || hasComplaint('Olheira') || hasComplaint('Bigode')) {
      if (patient.flacidez !== 'Leve') {
          result.preenchimento["Malar"] = "1.0ml a 2.0ml (Sustentação)";
      }
      if (hasComplaint('Olheira')) {
          result.preenchimento["Olheiras"] = "1.0ml (Redensity II)";
      }
  }

  // 4. BIOESTIMULADORES
  if (patient.age > 30 || patient.flacidez !== 'Leve') {
    const isDarkSkin = ['IV', 'V', 'VI'].includes(patient.fototipo);
    
    result.bioestimuladores = {
      produto: isDarkSkin ? "Radiesse (Hidroxiapatita de Cálcio)" : "Sculptra (Ácido Poli-L-Lático)",
      sessoes: patient.flacidez === 'Grave' ? 3 : 2,
      intervalo: "45 a 60 dias"
    };
  }

  return result;
}