import { z } from "zod";

export const anamnesisSchema = z.object({
  // --- 1. GERAL & QUEIXA DETALHADA ---
  queixa_principal: z.any(),
  queixa_principal_detalhada: z.any(),
  tempo_queixa: z.any(),
  evolucao_queixa: z.any(), 
  fatores_agravantes: z.any(),
  fatores_melhora: z.any(),
  evento_especifico: z.any(),
  nivel_urgencia: z.any(),

  // --- 2. REGIONAIS DINÂMICAS (Mapeamento de Queixas) ---
  locais_gordura: z.any(),
  locais_flacidez_corporal: z.any(),
  locais_flacidez_facial: z.any(),
  locais_celulite: z.any(),
  locais_manchas: z.any(),
  locais_acne: z.any(),
  locais_estrias: z.any(),

  // --- 3. HISTÓRICO & ROTINA ---
  procedimentos_previos: z.any(),
  outros_procedimentos: z.any(),
  historico_falhas_tratamento: z.any(), 
  teve_intercorrencia: z.any(),
  intercorrencias_detalhes: z.any(),
  rotina_skincare: z.any(), 
  produtos_em_uso: z.any(), 

  // --- 4. EXPECTATIVAS ---
  expectativa_tipo: z.any(), 
  expectativa_ideal: z.any(), 
  expectativa_medo: z.any(), 

  // --- 5. SAÚDE GERAL (Sincronizado com TabSaude) ---
  possui_diabetes: z.any(),      // Novo
  possui_hipertensao: z.any(),   // Novo
  alteracoes_hormonais: z.any(),  // Novo
  doenca_hepatica: z.any(),      // Novo
  patologias_pele: z.any(),      // Novo (Resolve erro TS)
  discromias: z.any(),           // Novo (Resolve erro TS)
  outras_patologias_descricao: z.any(), // Novo
  
  usa_medicacao_continua: z.any(),
  lista_medicacoes: z.any(),
  ja_fez_cirurgia: z.any(),      // Novo
  detalhes_cirurgia: z.any(),    // Novo
  
  pratica_atividade: z.any(),
  atividade_fisica: z.any(),     // Sincronizado
  atividade_fisica_detalhes: z.any(),
  ingere_agua: z.any(),
  ingestao_agua_qtd: z.any(),
  doencas_cronicas: z.any(),
  outros_doencas: z.any(),
  alergias_medicamentosas: z.any(),
  alergia_cosmeticos: z.any(),
  outras_alergias: z.any(),      // Novo
  
  gestante: z.any(),
  lactante: z.any(),
  uso_anticoncepcional: z.any(),
  fumante: z.any(),
  uso_anticoagulante: z.any(),
  uso_retinoide: z.any(),
  marca_passo: z.any(),          // Novo
  implantes_metalicos: z.any(),
  historico_queloide: z.any(),
  filtro_solar_diario: z.any(),  // Novo
  sono_horas: z.any(),

  // --- 6. FACIAL ---
  biotipo_cutaneo: z.any(),
  fototipo: z.any(),
  facial_textura: z.any(),
  facial_acne_grau: z.any(),
  class_glogau: z.any(),
  pele_sensivel: z.any(),
  rosacea: z.any(),
  facial_lesoes: z.any(),
  facial_patologias: z.any(),
  facial_discromias: z.any(),
  facial_discromias_local: z.any(),
  facial_envelhecimento: z.any(),
  facial_rugas_local: z.any(),
  facial_observacoes: z.any(),
  tem_telangiectasias: z.any(),
  facial_telangiectasias_local: z.any(),
  facial_fitzpatrick: z.any(),
  facial_baumann: z.any(),
  facial_espessura: z.any(),
  facial_ostios: z.any(),
  facial_comedoes: z.any(),
  facial_olheiras_tipo: z.any(),

  // --- 7. CORPORAL ---
  peso: z.any(),
  altura: z.any(),
  imc: z.any(),
  pressao_arterial: z.any(),
  cintura_cm: z.any(),
  quadril_cm: z.any(),
  corporal_postura: z.any(),
  corporal_lipodistrofia: z.any(),
  corporal_gordura_local: z.any(),
  corporal_celulite_grau: z.any(),
  corporal_celulite_local: z.any(),
  corporal_estrias: z.any(),
  corporal_estrias_local: z.any(),
  corporal_flacidez_tipo: z.any(),
  corporal_flacidez_local: z.any(),
  corporal_observacoes: z.any(),
  corporal_distribuicao_gordura: z.any(),
  corporal_diastase_teste: z.any(),
  corporal_diastase_tipo: z.any(),
  corporal_aparencia_percebida: z.any(),
  corporal_aparencia_desejada: z.any(),
  corporal_adipometria_dados: z.any(), 
  corporal_perimetria_dados: z.any(), 

  // --- 8. MAPAS VISUAIS ---
  body_mapping: z.any(), 

  // --- 9. CAPILAR ---
  capilar_tipo: z.any(),
  capilar_frequencia_lavagem: z.any(),
  capilar_diametro: z.any(),
  capilar_oleosidade_fio: z.any(),
  capilar_oleosidade_couro: z.any(),
  capilar_elasticidade: z.any(),
  capilar_porosidade: z.any(),
  capilar_comprimento: z.any(),
  capilar_cor_natural: z.any(),
  capilar_cor_cosmetica: z.any(),
  capilar_uso_cosmeticos: z.any(),
  capilar_uso_quimica: z.any(),
  capilar_queda_diaria: z.any(),
  capilar_displasias_congenitas: z.any(),
  capilar_displasias_adquiridas: z.any(),
  capilar_alopecia_areata: z.any(),
  capilar_escala_savin: z.any(),
  capilar_escala_norwood: z.any(),
  capilar_classificacao_etiologica: z.any(),
  capilar_usa_bone: z.any(),
  capilar_usa_preso: z.any(),
  capilar_usa_secador: z.any(),
  capilar_usa_chapinha: z.any(),
});

export type AnamnesisFormValues = z.infer<typeof anamnesisSchema>;