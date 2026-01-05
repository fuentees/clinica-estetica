import { supabase } from '../lib/supabase';

// --- TIPAGEM AVANÇADA ---
export interface ComprehensiveAnamnesisData {
  nome?: string;
  idade?: number;
  data_nascimento?: string;
  queixa_principal?: string[];
  queixa_principal_detalhada?: string;
  tempo_queixa?: string;
  doencas_cronicas?: string[];
  outros_doencas?: string; 
  alergias_medicamentosas?: string[];
  alergia_cosmeticos?: string;
  usa_medicacao_continua?: boolean;
  lista_medicacoes?: string; 
  gestante?: boolean;
  lactante?: boolean;
  uso_retinoide?: boolean; 
  uso_anticoagulante?: boolean;
  implantes_metalicos?: boolean;
  historico_queloide?: boolean;
  teve_intercorrencia?: string; 
  intercorrencias_detalhes?: string;
  fumante?: boolean;
  uso_anticoncepcional?: boolean;
  pratica_atividade?: boolean;
  ingere_agua?: boolean;
  sono_horas?: string;
  exposicao_solar?: string; // "Baixa", "Moderada", "Alta"
  fototipo?: string; // "I", "II", "III", "IV", "V", "VI"
  biotipo_cutaneo?: string;
  facial_acne_grau?: string;
  facial_textura?: string;
  class_glogau?: string;
  pele_sensivel?: boolean;
  rosacea?: boolean;
  tem_telangiectasias?: boolean | string; 
  facial_lesoes?: string[];
  facial_patologias?: string[];
  capilar_tipo?: string;
  capilar_oleosidade_couro?: string;
  capilar_queda_diaria?: string;
  capilar_escala_savin?: string;
  capilar_escala_norwood?: string;
  capilar_displasias_congenitas?: string[];
  capilar_alopecia_areata?: string[];
  current_plan?: {
    products: { name: string; brand: string }[];
    areas: { label: string; type: string }[];
  };
  anamnesis_body_mapping?: any[];
}

interface SafetyAlert {
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  category: 'medication' | 'condition' | 'habit' | 'inconsistency' | 'procedure_conflict' | 'allergy';
}

interface TreatmentSuggestion {
  treatmentName: string;
  confidence: number;
  reasoning: string;
  contraindicated: boolean; 
  expectedResults?: string[];
  estimatedDowntime?: string;
  clinicalProtocol?: string; // Instrução técnica adicional
}

interface AIAnalysisResult {
  confidence_score: number; 
  risk_factors: SafetyAlert[];
  suggested_treatments: TreatmentSuggestion[];
  ai_suggestions: string; 
  bodyMapAnalysis?: string[];
  global_logic?: string; // Racional clínico unificado
}

export class AnamnesisAIService {

  // --- 1. MOTOR DE RACIOCÍNIO CLÍNICO (DOWNTIME & SENSIBILIDADE) ---
  private static calculateDowntime(treatment: string, data: ComprehensiveAnamnesisData): string {
    const fototipo = data.fototipo || 'II';
    const isDarkSkin = ['IV', 'V', 'VI'].includes(fototipo);
    const isSensitive = !!(data.pele_sensivel || data.rosacea);
    
    if (treatment.includes('Toxina')) return '4h (sem deitar ou exercícios)';
    if (treatment.includes('Preenchimento')) return isSensitive ? '72h (edema persistente)' : '24-48h';
    
    if (treatment.includes('Bioestimulador')) {
        return isDarkSkin ? '72h (monitorar HPI - Manchas)' : '48h (massagens 5-5-5 sugeridas)';
    }
    
    if (treatment.includes('Peeling') || treatment.includes('Microagulhamento')) {
        if (isDarkSkin) return '7 a 10 dias (preparo prévio obrigatório)';
        return '4 a 6 dias';
    }

    return 'Individualizado por protocolo';
  }

  // --- 2. ANALISADOR DE INTERAÇÕES E RISCOS SILENCIOSOS ---
  private static deepSafetyCheck(data: ComprehensiveAnamnesisData): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const textMeds = (data.lista_medicacoes || '').toLowerCase();
    const textChronic = (data.doencas_cronicas || []).join(' ').toLowerCase();

    // Alergias Ocultas (Ex: Ovos em Toxinas)
    const textAlergias = (data.alergias_medicamentosas || []).join(' ').toLowerCase();
    if (textAlergias.includes('ovo') || textAlergias.includes('albumina')) {
        alerts.push({ type: 'danger', title: 'RISCO: ALBUMINA', message: 'Toxinas Botulínicas com albumina (ex: Botulift) são proibidas. Use marcas como Xeomin.', category: 'allergy' });
    }

    // Interação Medicamentosa: Anti-inflamatórios x Bioestimuladores
    if (textMeds.includes('corticoide') || textMeds.includes('prednisona') || textMeds.includes('ibuprofeno')) {
        alerts.push({ type: 'warning', title: 'IMUNOSSUPRESSÃO TÉCNICA', message: 'Uso de anti-inflamatórios reduz a resposta de Bioestimuladores (Sculptra/Radiesse). Eficácia será menor.', category: 'medication' });
    }

    // Melasma x Exposição Solar
    if (data.exposicao_solar === 'Alta' && (data.facial_patologias?.includes('Melasma') || data.queixa_principal?.includes('Manchas'))) {
        alerts.push({ type: 'danger', title: 'RISCO DE REBOTE', message: 'Exposição solar alta detectada. Lasers ablativos e Peelings fortes causarão escurecimento imediato.', category: 'procedure_conflict' });
    }

    // Doenças Autoimunes x Injetáveis
    if (textChronic.includes('lupus') || textChronic.includes('artrite') || textChronic.includes('psoriase')) {
        alerts.push({ type: 'warning', title: 'AUTOIMUNE ATIVA', message: 'Risco de formação de granulomas com preenchedores definitivos ou bioestimuladores.', category: 'condition' });
    }

    return alerts;
  }

  // --- 3. MOTOR DE PRESCRIÇÃO E PROTOCOLOS ---
  private static suggestTreatments(data: ComprehensiveAnamnesisData, alerts: SafetyAlert[]): TreatmentSuggestion[] {
    const suggestions: TreatmentSuggestion[] = [];
    const hasDanger = alerts.some(a => a.type === 'danger');
    const queixas = data.queixa_principal || [];
    const fototipo = data.fototipo || 'II';

    // RUGAS / BOTOX
    if (queixas.includes('Rugas') || queixas.includes('Linhas de Expressão')) {
      const isContra = !!(data.gestante || data.lactante);
      suggestions.push({
        treatmentName: 'Toxina Botulínica Full Face',
        confidence: isContra ? 0 : 0.98,
        reasoning: isContra ? 'Contraindicado no período.' : 'Padrão ouro para terço superior.',
        contraindicated: isContra,
        estimatedDowntime: isContra ? '-' : this.calculateDowntime('Toxina', data),
        clinicalProtocol: 'Técnica de microdose para Glabela e Frontal.'
      });
    }

    // FLACIDEZ / BIOESTIMULAÇÃO
    if (queixas.includes('Flacidez') || (data.idade || 0) > 30) {
      const isDark = ['IV', 'V', 'VI'].includes(fototipo);
      const name = isDark ? 'Radiesse (Hidroxiapatita)' : 'Sculptra (PLLA)';
      
      suggestions.push({
        treatmentName: name,
        confidence: 0.95,
        reasoning: isDark ? 'Mais seguro para evitar manchas inflamatórias em fototipos altos.' : 'Máximo estímulo de colágeno para pele clara.',
        contraindicated: !!hasDanger,
        estimatedDowntime: this.calculateDowntime('Bioestimulador', data),
        clinicalProtocol: isDark ? 'Diluição Hiper-diluído 1:4' : 'Reconstituição 24h prévia'
      });
    }

    // CAPILAR
    if (queixas.includes('Queda de Cabelo') || data.capilar_escala_norwood) {
      suggestions.push({
        treatmentName: 'MMP Capilar + Laser LLLT',
        confidence: 0.92,
        reasoning: 'Melhora ancoragem folicular e microcirculação.',
        contraindicated: !!data.gestante,
        estimatedDowntime: '24h sem lavar o couro cabeludo',
        clinicalProtocol: 'Drug Delivery com Minoxidil e Fatores de Crescimento'
      });
    }

    return suggestions;
  }

  // --- 4. FUNÇÃO PRINCIPAL ---
  static async analyzeAnamnesis(patientId: string, anamnesisData: ComprehensiveAnamnesisData): Promise<AIAnalysisResult> {
    try {
      const deepAlerts = this.deepSafetyCheck(anamnesisData);
      const safetyAlerts = [
          ...deepAlerts,
          ...this.auditPlannedProcedures(anamnesisData),
          ...this.detectInconsistencies(anamnesisData)
      ];

      // Cálculo de Score baseado em severidade clínica
      let score = 100;
      safetyAlerts.forEach(a => {
        if (a.type === 'danger') score -= 45;
        if (a.type === 'warning') score -= 15;
      });
      score = Math.max(0, score);

      const suggestions = this.suggestTreatments(anamnesisData, safetyAlerts);

      const result: AIAnalysisResult = {
        confidence_score: score,
        risk_factors: safetyAlerts,
        suggested_treatments: suggestions,
        ai_suggestions: score > 80 ? "Protocolo de Alta Segurança." : score > 40 ? "Moderação Necessária." : "Crítico: Risco de Intercorrência.",
        global_logic: `Análise baseada em Fototipo ${anamnesisData.fototipo} e histórico medicamentoso.`
      };

      // Registro para Auditoria Médica
      await supabase.from('anamnesis_ai_analysis').insert({
        patient_id: patientId,
        anamnesis_data: anamnesisData,
        ai_suggestions: result.ai_suggestions,
        suggested_treatments: result.suggested_treatments,
        risk_factors: result.risk_factors,
        confidence_score: result.confidence_score,
        status: score < 50 ? 'flagged' : 'completed',
      });

      return result;

    } catch (error) {
      console.error('Erro na análise profunda:', error);
      throw error;
    }
  }

  // --- MÉTODOS AUXILIARES ORIGINAIS MANTIDOS ---
  private static auditPlannedProcedures(data: ComprehensiveAnamnesisData): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    if (!data.current_plan?.products) return alerts;
    const products = data.current_plan.products.map(p => p.name.toLowerCase());
    if (products.some(p => p.includes('toxina')) && (data.gestante || data.lactante)) {
        alerts.push({ type: 'danger', title: 'PLANEJAMENTO INVÁLIDO', message: 'Toxina não permitida para gestantes.', category: 'procedure_conflict' });
    }
    return alerts;
  }

  private static detectInconsistencies(data: ComprehensiveAnamnesisData): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    if (data.usa_medicacao_continua === false && (data.lista_medicacoes?.length || 0) > 3) {
      alerts.push({ type: 'info', title: 'DADOS DIVERGENTES', message: 'Medicações listadas, mas campo contínuo marcado como "Não".', category: 'inconsistency' });
    }
    return alerts;
  }

  static async getPatientAnalysis(patientId: string) {
      const { data } = await supabase.from('anamnesis_ai_analysis')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .maybeSingle();
      return data;
  }
}