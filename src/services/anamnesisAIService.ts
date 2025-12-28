import { supabase } from '../lib/supabase';

// --- TIPAGEM COMPLETA E ROBUSTA ---
export interface ComprehensiveAnamnesisData {
  // Dados Pessoais
  nome?: string;
  idade?: number;
  data_nascimento?: string;

  // 1. Identificação e Queixa
  queixa_principal?: string[];
  queixa_principal_detalhada?: string;
  tempo_queixa?: string;
  
  // 2. Saúde Geral (CRÍTICO)
  doencas_cronicas?: string[];
  outros_doencas?: string; 
  alergias_medicamentosas?: string[];
  alergia_cosmeticos?: string;
  
  // 3. Medicamentos (CRÍTICO)
  usa_medicacao_continua?: boolean;
  lista_medicacoes?: string; 
  
  // 4. Fatores de Risco Absolutos
  gestante?: boolean;
  lactante?: boolean;
  uso_retinoide?: boolean; 
  uso_anticoagulante?: boolean;
  implantes_metalicos?: boolean;
  historico_queloide?: boolean;
  teve_intercorrencia?: string; 
  intercorrencias_detalhes?: string;

  // 5. Hábitos
  fumante?: boolean;
  uso_anticoncepcional?: boolean;
  pratica_atividade?: boolean;
  ingere_agua?: boolean;
  sono_horas?: string;
  exposicao_solar?: string;
  
  // 6. Análise Facial/Corporal
  fototipo?: string; 
  biotipo_cutaneo?: string;
  facial_acne_grau?: string;
  facial_textura?: string;
  class_glogau?: string;
  pele_sensivel?: boolean;
  rosacea?: boolean;
  tem_telangiectasias?: boolean | string; 
  facial_lesoes?: string[];
  facial_patologias?: string[];
  
  // 7. CAPILAR (NOVO!)
  capilar_tipo?: string;
  capilar_oleosidade_couro?: string;
  capilar_queda_diaria?: string;
  capilar_escala_savin?: string;
  capilar_escala_norwood?: string;
  capilar_displasias_congenitas?: string[];
  capilar_alopecia_areata?: string[];

  // 8. O QUE O PROFISSIONAL ESTÁ PLANEJANDO
  current_plan?: {
    products: { name: string; brand: string }[];
    areas: { label: string; type: string }[];
  };

  // 9. Mapa Visual
  anamnesis_body_mapping?: any[];
}

interface SafetyAlert {
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  category: 'medication' | 'condition' | 'habit' | 'inconsistency' | 'procedure_conflict';
}

interface TreatmentSuggestion {
  treatmentName: string;
  confidence: number;
  reasoning: string;
  contraindicated: boolean; 
  expectedResults?: string[];
}

interface AIAnalysisResult {
  confidence_score: number; 
  risk_factors: SafetyAlert[];
  suggested_treatments: TreatmentSuggestion[];
  ai_suggestions: string; 
  bodyMapAnalysis?: string[];
}

export class AnamnesisAIService {

  // --- 1. MOTOR DE SEGURANÇA ---
  private static analyzeSafety(data: ComprehensiveAnamnesisData): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    const textMeds = (data.lista_medicacoes || '').toLowerCase();
    const textDoencas = (data.doencas_cronicas || []).join(' ').toLowerCase() + ' ' + (data.outros_doencas || '').toLowerCase();

    // --- GESTAÇÃO & LACTAÇÃO ---
    if (data.gestante) {
      alerts.push({ type: 'danger', title: 'GESTANTE', message: 'Contraindicação absoluta para Injetáveis, Lasers, Peelings Químicos e Tratamentos Capilares Sistêmicos.', category: 'condition' });
    }
    if (data.lactante) {
      alerts.push({ type: 'warning', title: 'LACTANTE', message: 'Toxina Botulínica: Segurança não estabelecida. Evitar ativos sistêmicos (ex: Finasterida).', category: 'condition' });
    }

    // --- MEDICAMENTOS PERIGOSOS ---
    if (data.uso_retinoide || textMeds.includes('roacutan') || textMeds.includes('isotretinoína')) {
      alerts.push({ type: 'danger', title: 'USO DE ROACUTAN', message: 'Risco severo de cicatrização inestética. Procedimentos invasivos proibidos por 6 meses.', category: 'medication' });
    }
    if (data.uso_anticoagulante || textMeds.includes('aas') || textMeds.includes('aspirina') || textMeds.includes('marevan') || textMeds.includes('xarelto')) {
      alerts.push({ type: 'warning', title: 'ANTICOAGULANTES', message: 'Alto risco de hematomas. Alertar paciente sobre "downtime" prolongado.', category: 'medication' });
    }

    // --- HÁBITOS ---
    if (data.fumante) {
      alerts.push({ type: 'warning', title: 'TABAGISMO', message: 'Reduz vascularização e produção de colágeno em 40-50%. Prejudica tratamentos de queda capilar.', category: 'habit' });
    }

    return alerts;
  }

  // --- 2. AUDITOR DE PLANEJAMENTO ---
  private static auditPlannedProcedures(data: ComprehensiveAnamnesisData): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    if (!data.current_plan || !data.current_plan.products) return alerts;

    const products = data.current_plan.products.map(p => p.name.toLowerCase() + ' ' + p.brand.toLowerCase());

    // TOXINA
    if (products.some(p => p.includes('toxina') || p.includes('botox') || p.includes('dysport'))) {
        if (data.gestante || data.lactante) {
            alerts.push({ type: 'danger', title: 'ERRO NO PLANEJAMENTO: TOXINA', message: 'Você incluiu Toxina Botulínica no plano, mas a paciente é Gestante/Lactante. REMOVA IMEDIATAMENTE.', category: 'procedure_conflict' });
        }
    }

    // PREENCHEDORES
    if (products.some(p => p.includes('hialurônico') || p.includes('preenchedor'))) {
        if (data.uso_anticoagulante) {
            alerts.push({ type: 'warning', title: 'ALERTA DE PREENCHIMENTO', message: 'Paciente anticoagulado. Risco alto de hematoma compressivo. Usar cânula obrigatória.', category: 'procedure_conflict' });
        }
    }

    // BIOESTIMULADORES
    if (products.some(p => p.includes('bioestimulador') || p.includes('sculptra') || p.includes('radiesse'))) {
        const textDoencas = (data.doencas_cronicas || []).join(' ').toLowerCase();
        if (textDoencas.includes('autoimune') || textDoencas.includes('lupus')) {
            alerts.push({ type: 'danger', title: 'ERRO NO PLANEJAMENTO: BIOESTIMULADOR', message: 'Contraindicado em doenças autoimunes ativas.', category: 'procedure_conflict' });
        }
    }

    return alerts;
  }

  // --- 3. DETECTOR DE INCONSISTÊNCIAS ---
  private static detectInconsistencies(data: ComprehensiveAnamnesisData): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];
    // Diz que não usa remédio, mas escreveu lista
    if (data.usa_medicacao_continua === false && data.lista_medicacoes && data.lista_medicacoes.length > 3) {
      alerts.push({ type: 'info', title: 'INCONSISTÊNCIA: MEDICAMENTOS', message: 'Paciente marcou "Não usa medicação", mas preencheu a lista. Verifique na consulta.', category: 'inconsistency' });
    }
    return alerts;
  }

  // --- 4. MOTOR DE TRATAMENTOS ---
  private static suggestTreatments(data: ComprehensiveAnamnesisData, safetyAlerts: SafetyAlert[]): TreatmentSuggestion[] {
    const suggestions: TreatmentSuggestion[] = [];
    const hasDanger = safetyAlerts.some(a => a.type === 'danger');
    const queixas = data.queixa_principal || [];

    // GORDURA
    if (queixas.includes('Gordura Localizada')) {
      if (hasDanger) {
        suggestions.push({ treatmentName: 'Enzimas Lipolíticas', confidence: 0, reasoning: 'SUSPENSO: Contraindicações absolutas detectadas.', contraindicated: true });
      } else {
        suggestions.push({ treatmentName: 'Protocolo Lipo Enzimática + USG', confidence: 0.95, reasoning: 'Combinação padrão ouro para gordura localizada.', contraindicated: false, expectedResults: ['Redução de medidas', 'Melhora do contorno'] });
      }
    }

    // RUGAS
    if (queixas.includes('Rugas') || queixas.includes('Linhas de Expressão')) {
        if (data.gestante || data.lactante) {
             suggestions.push({ treatmentName: 'Toxina Botulínica', confidence: 0, reasoning: 'CONTRAINDICADO: Gestação/Lactação.', contraindicated: true });
        } else {
            suggestions.push({ treatmentName: 'Toxina Botulínica (Botox)', confidence: 0.98, reasoning: 'Padrão ouro para rugas dinâmicas.', contraindicated: false, expectedResults: ['Suavização de linhas', 'Prevenção'] });
        }
    }

    // FLACIDEZ
    if (queixas.includes('Flacidez')) {
        const autoimune = (data.doencas_cronicas || []).join('').toLowerCase().includes('autoimune');
        if (autoimune) {
             suggestions.push({ treatmentName: 'Bioestimuladores', confidence: 0, reasoning: 'CONTRAINDICADO: Risco em doenças autoimunes.', contraindicated: true });
        } else {
             suggestions.push({ treatmentName: 'Bioestimulador (Sculptra/Radiesse)', confidence: 0.95, reasoning: 'Excelente indicação para este perfil.', contraindicated: false });
        }
    }

    // --- CAPILAR (NOVO!) ---
    if (queixas.includes('Queda de Cabelo') || queixas.includes('Calvície') || data.capilar_escala_norwood || data.capilar_escala_savin) {
        if (data.gestante) {
             suggestions.push({ treatmentName: 'Finasterida/Dutasterida', confidence: 0, reasoning: 'CONTRAINDICADO: Gestação (Teratogênico).', contraindicated: true });
             suggestions.push({ treatmentName: 'LEDterapia Capilar', confidence: 0.9, reasoning: 'Opção segura (fotobiomodulação) para gestantes.', contraindicated: false });
        } else {
             suggestions.push({ treatmentName: 'MMP Capilar + Intradermoterapia', confidence: 0.92, reasoning: 'Protocolo injetável para estímulo de crescimento e ancoragem.', contraindicated: false, expectedResults: ['Redução da queda', 'Aumento da densidade'] });
        }
        
        if (data.capilar_oleosidade_couro === 'Descamativo (Caspa)' || data.capilar_oleosidade_couro === 'Oleoso') {
             suggestions.push({ treatmentName: 'Detox Capilar + Alta Frequência', confidence: 0.85, reasoning: 'Necessário controle da oleosidade/seborreia para sucesso do tratamento de queda.', contraindicated: false });
        }
    }

    return suggestions;
  }

  // --- FUNÇÃO PRINCIPAL ---
  static async analyzeAnamnesis(patientId: string, anamnesisData: ComprehensiveAnamnesisData): Promise<AIAnalysisResult> {
    try {
      const safetyAlerts = this.analyzeSafety(anamnesisData);
      const planningAlerts = this.auditPlannedProcedures(anamnesisData);
      const inconsistencyAlerts = this.detectInconsistencies(anamnesisData);
      
      const allAlerts = [...safetyAlerts, ...planningAlerts, ...inconsistencyAlerts];

      let score = 100;
      allAlerts.forEach(a => {
          if (a.type === 'danger') score -= 40;
          if (a.type === 'warning') score -= 15;
          if (a.type === 'info') score -= 5;
      });
      score = Math.max(0, score);

      const suggestions = this.suggestTreatments(anamnesisData, allAlerts);

      const bodyMapAnalysis: string[] = [];
      if (anamnesisData.anamnesis_body_mapping) {
        anamnesisData.anamnesis_body_mapping.forEach((area: any) => {
           const label = area.label || 'Área sem nome';
           const view = area.view === 'side' ? '(Perfil)' : area.view === 'back' ? '(Costas)' : '';
           bodyMapAnalysis.push(`${label} ${view}`);
        });
      }

      let summary = score > 80 ? "Paciente seguro. Planejamento adequado." : score > 50 ? "Atenção: Existem fatores de risco ou conflitos no planejamento." : "ALTO RISCO: Revise o planejamento imediatamente.";

      const result: AIAnalysisResult = {
        confidence_score: score,
        risk_factors: allAlerts,
        suggested_treatments: suggestions,
        ai_suggestions: summary,
        bodyMapAnalysis
      };

      await supabase.from('anamnesis_ai_analysis').insert({
        patient_id: patientId,
        anamnesis_data: anamnesisData,
        ai_suggestions: result.ai_suggestions,
        suggested_treatments: result.suggested_treatments,
        risk_factors: result.risk_factors,
        confidence_score: result.confidence_score,
        status: score < 50 ? 'flagged' : 'pending',
      });

      return result;

    } catch (error) {
      console.error('Erro AI:', error);
      throw error;
    }
  }

  static async getPatientAnalysis(patientId: string) {
      const { data } = await supabase.from('anamnesis_ai_analysis')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
  }
}