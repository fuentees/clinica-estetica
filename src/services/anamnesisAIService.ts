import { supabase } from '../lib/supabase';
import { calculateClinicalPlan, PatientAnamnesis } from '../lib/clinical-engine';

// --- TIPAGEM VILAGI CLINICAL AI™ ---
export interface ComprehensiveAnamnesisData {
  id?: string;
  name?: string;
  data_nascimento?: string;
  idade?: number;
  sexo?: 'Feminino' | 'Masculino';
  queixa_principal?: string[];
  doencas_cronicas?: string[];
  alergias_medicamentosas?: string[];
  lista_medicacoes?: string; 
  gestante?: boolean;
  lactante?: boolean;
  uso_retinoide?: boolean; 
  facial_fitzpatrick?: string; 
  biotipo_cutaneo?: string;
  flacidez?: string; 
  exposicao_solar?: string;
  facial_patologias?: string[]; 
  historico_queloide?: boolean;
}

interface SafetyAlert {
  type: 'danger' | 'warning' | 'info';
  message: string;
}

interface TreatmentSuggestion {
  treatmentName: string;
  reasoning: string;
  units?: Record<string, number | string>;
}

interface AIAnalysisResult {
  confidence_score: number; 
  risk_factors: SafetyAlert[];
  suggested_treatments: TreatmentSuggestion[];
  suggested_actives: { name: string; reason: string }[];
  homecare: { morning: string[]; night: string[] };
  ai_suggestions: string; 
  bodyMapAnalysis?: string[];
}

export class AnamnesisAIService {

  /**
   * FUNÇÃO PRINCIPAL: ANALISAR ANAMNESE
   * Cruzamento de Dados: Paciente + Estoque Real + Motor Matemático
   */
  static async analyzeAnamnesis(patient_id: string, data: ComprehensiveAnamnesisData): Promise<AIAnalysisResult> {
    console.log("🤖 IA Iniciada para:", data.name);

    try {
      // 1. SIMULAÇÃO DE PROCESSAMENTO (UX)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. CONSULTA AO ESTOQUE REAL (INVENTORY) - INTEGRAÇÃO VILAGI
      let availableToxins = "Toxina Botulínica (Genérica)";
      let availableBio = "Bioestimulador (Genérico)";
      
      try {
        const today = new Date().toISOString().split('T')[0]; // Data de hoje YYYY-MM-DD
        
        // Busca apenas produtos com ESTOQUE POSITIVO e VALIDADE EM DIA
        const { data: stock } = await supabase
          .from('inventory')
          .select('name, category')
          .gt('quantity', 0) // Tem na gaveta?
          .gte('expiration_date', today); // Não venceu?

        if (stock && stock.length > 0) {
          // Busca inteligente por Toxinas Disponíveis
          const toxin = stock.find((p: any) => 
            p.category === 'Injetaveis' && 
            (p.name.includes('Toxina') || p.name.includes('Botox') || p.name.includes('Dysport') || p.name.includes('Xeomin') || p.name.includes('Botulift'))
          );
          if (toxin) availableToxins = toxin.name;

          // Busca inteligente por Bioestimuladores Disponíveis
          const bio = stock.find((p: any) => 
            p.category === 'Injetaveis' && 
            (p.name.includes('Sculptra') || p.name.includes('Radiesse') || p.name.includes('Elleva') || p.name.includes('Diamond'))
          );
          if (bio) availableBio = bio.name;
        }
      } catch (err) {
        console.log("Aviso: Falha ao ler estoque físico, usando sugestões padrão.");
      }

      // 3. PREPARAÇÃO DOS DADOS PARA O MOTOR (NORMALIZAÇÃO)
      // O uso de 'as any' aqui previne os erros de tipagem do TypeScript
      const engineInput: PatientAnamnesis = {
        age: data.idade || calculateAge(data.data_nascimento),
        sex: (data.sexo as any) || 'Feminino',
        complaints: data.queixa_principal || [],
        
        // Tipagem forçada para garantir compatibilidade com o motor
        fototipo: (data.facial_fitzpatrick as any) || 'III',
        biotipo: (data.biotipo_cutaneo as any) || 'Mista',
        flacidez: (data.flacidez as any) || 'Leve',
        sunExposure: (data.exposicao_solar as any) || 'Moderada',
        
        pregnant: !!data.gestante,
        lactating: !!data.lactante,
        isotretinoin: !!data.uso_retinoide,
        melasma: !!(data.facial_patologias && data.facial_patologias.includes('Melasma')),
        keloidHistory: !!data.historico_queloide
      };

      // 4. EXECUÇÃO DO MOTOR MATEMÁTICO (Cálculos de Doses)
      const engineResult = calculateClinicalPlan(engineInput);

      // 5. REGRAS EXTRAS DE SEGURANÇA (Alergias Específicas)
      const alergias = (data.alergias_medicamentosas || []).join(' ').toLowerCase();
      if (alergias.includes('ovo') || alergias.includes('albumina')) {
        engineResult.contraindicacoes.push("ALERGIA A OVO: Proibido toxinas com albumina (ex: Botulift/Dysport). Indicado Xeomin.");
        engineResult.safetyScore -= 30;
        
        // Se a IA tinha selecionado uma toxina com albumina, reseta para Xeomin ou Genérica
        if (availableToxins.includes('Botulift') || availableToxins.includes('Dysport')) {
            availableToxins = "Toxina Botulínica (Xeomin - Obrigatório)";
        }
      }

      // 6. CONSTRUÇÃO DO LAUDO FINAL
      const result: AIAnalysisResult = {
        confidence_score: Math.max(0, engineResult.safetyScore),
        
        risk_factors: [
          ...engineResult.contraindicacoes.map((m:string) => ({ type: 'danger' as const, message: m })),
          ...engineResult.alertas.map((m:string) => ({ type: 'warning' as const, message: m }))
        ],
        
        suggested_treatments: [
          // Injetável 1: Toxina
          { 
            treatmentName: availableToxins, 
            reasoning: `Dose calculada para força muscular ${engineInput.sex}. Foco em terço superior.`, 
            units: engineResult.botox 
          },
          // Injetável 2: Bioestimulador (Se o motor indicou)
          ...(engineResult.bioestimuladores.sessoes > 0 ? [{
            treatmentName: availableBio,
            reasoning: `Protocolo para flacidez ${engineInput.flacidez}. ${engineResult.bioestimuladores.sessoes} sessões a cada ${engineResult.bioestimuladores.intervalo}.`
          }] : []),
          // Injetável 3: Preenchimento (Se o motor indicou)
          ...(Object.keys(engineResult.preenchimento).length > 0 ? [{
            treatmentName: "Preenchimento (Ácido Hialurônico)",
            reasoning: "Volumização estrutural e refinamento.",
            units: engineResult.preenchimento
          }] : [])
        ],

        suggested_actives: [
            ...(engineInput.melasma ? [{ name: 'Ácido Tranexâmico', reason: 'Controle vascular do melasma.' }] : []),
            ...(engineInput.biotipo === 'Oleosa' ? [{ name: 'Ácido Salicílico', reason: 'Controle de oleosidade.' }] : []),
            { name: 'Vitamina C', reason: 'Antioxidante universal.' }
        ],

        homecare: {
          morning: [
            "Gel de Limpeza", 
            "Vitamina C", 
            "Filtro Solar FPS 50+"
          ],
          night: [
            "Cleansing Oil", 
            engineInput.melasma ? "Clareador não-ácido" : "Hidratante Reparador"
          ]
        },

        ai_suggestions: engineResult.safetyScore > 80 
          ? "✅ Paciente apto para protocolos sugeridos. Auditoria aprovada." 
          : "⚠️ ALERTA DE SEGURANÇA: Protocolo restrito devido aos fatores de risco.",
        
        bodyMapAnalysis: ["Glabela", "Frontal", "Malar"]
      };

      // 7. REGISTRO NO SUPABASE (HISTÓRICO DE AUDITORIA)
      await supabase.from('ai_audits').insert({
        patient_id,
        clinical_data: data,
        report: result,
      });

      return result;

    } catch (error) {
      console.error('Erro fatal na VILAGI AI:', error);
      throw error;
    }
  }
}

// --- HELPER DE IDADE ---
function calculateAge(birthDateString?: string) {
  if (!birthDateString) return 30; // Default seguro
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}