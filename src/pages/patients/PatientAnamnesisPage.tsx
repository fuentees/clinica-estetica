import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList,
  Heart,
  Smile,
  User,
  Loader2,
  Save,
  MapPin // <--- ADICIONADO AQUI
} from "lucide-react";

import { supabase } from "../../lib/supabase"; 
import { Button } from "../../components/ui/button";

// Imports organizados dos dados e componentes compartilhados
import * as Constants from "../../data/anamnesisOptions";
import * as Components from "../../components/anamnesis/AnamnesisFormComponents";

// =========================================
// UTILS LOCAIS
// =========================================
const strToArray = (s: string | null | undefined) => s ? s.split("; ").map((v) => v.trim()).filter(Boolean) : [];
const arrayToStr = (a: any) => (Array.isArray(a) ? a.join("; ") : a);

// =========================================
// SCHEMA ZOD (Apenas Clínico)
// =========================================
const stringOrNull = z.string().optional();
const arrayOrNull = z.array(z.string()).optional();
const boolOrNull = z.boolean().optional();

// Schema focado apenas nos dados clínicos
const clinicalSchema = z.object({
  queixa_principal: arrayOrNull,
  queixa_principal_detalhada: stringOrNull,
  tempo_queixa: stringOrNull,
  fatores_agravantes: stringOrNull,
  fatores_melhora: stringOrNull,
  evento_especifico: stringOrNull,
  nivel_urgencia: stringOrNull,
  procedimentos_previos: arrayOrNull,
  outros_procedimentos: stringOrNull,
  teve_intercorrencia: stringOrNull, 
  intercorrencias_detalhes: stringOrNull,
  doencas_cronicas: arrayOrNull,
  outros_doencas: stringOrNull,
  alergias_medicamentosas: arrayOrNull,
  alergia_cosmeticos: stringOrNull,
  usa_medicacao_continua: z.boolean().optional(),
  lista_medicacoes: stringOrNull,
  gestante: boolOrNull,
  lactante: boolOrNull,
  uso_anticoncepcional: boolOrNull,
  fumante: boolOrNull,
  uso_anticoagulante: boolOrNull,
  uso_retinoide: boolOrNull,
  implantes_metalicos: boolOrNull,
  historico_queloide: boolOrNull,
  pratica_atividade: stringOrNull, 
  atividade_fisica_detalhes: stringOrNull,
  ingere_agua: stringOrNull,
  ingestao_agua_qtd: stringOrNull,
  sono_horas: stringOrNull,
  biotipo_cutaneo: stringOrNull,
  fototipo: stringOrNull,
  facial_textura: stringOrNull,
  facial_acne_grau: stringOrNull,
  class_glogau: stringOrNull,
  pele_sensivel: boolOrNull,
  rosacea: boolOrNull,
  facial_lesoes: arrayOrNull,
  facial_patologias: arrayOrNull,
  tem_telangiectasias: stringOrNull, 
  facial_telangiectasias_local: arrayOrNull,
  facial_discromias: arrayOrNull,
  facial_discromias_local: arrayOrNull,
  facial_envelhecimento: arrayOrNull,
  facial_rugas_local: arrayOrNull,
  facial_observacoes: stringOrNull,
  peso: stringOrNull,
  altura: stringOrNull,
  imc: stringOrNull,
  pressao_arterial: stringOrNull,
  cintura_cm: stringOrNull,
  quadril_cm: stringOrNull,
  corporal_postura: arrayOrNull,
  corporal_lipodistrofia: arrayOrNull,
  corporal_gordura_local: arrayOrNull,
  corporal_celulite_grau: stringOrNull,
  corporal_celulite_local: arrayOrNull,
  corporal_estrias: arrayOrNull,
  corporal_estrias_local: arrayOrNull,
  corporal_flacidez_tipo: arrayOrNull,
  corporal_flacidez_local: arrayOrNull,
  corporal_observacoes: stringOrNull,
}).catchall(z.any());

// =========================================
// PÁGINA PRINCIPAL
// =========================================
export default function PatientAnamnesisPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"queixa" | "saude" | "facial" | "corporal">("queixa");

  const { register, handleSubmit, setValue, control, watch } = useForm({
    resolver: zodResolver(clinicalSchema)
  });

  // Monitores para renderização condicional
  const teveIntercorrencia = watch("teve_intercorrencia");
  const usaMedicacao = watch("usa_medicacao_continua");
  const praticaAtividade = watch("pratica_atividade");
  const ingereAgua = watch("ingere_agua");
  const temTelangiectasias = watch("tem_telangiectasias");

  useEffect(() => {
    if (id) fetchAnamnesis();
  }, [id]);

  async function fetchAnamnesis() {
    try {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
      if (error) throw error;
      if (!data) return;

      const formData: any = { ...data };

      // Converter strings do banco de volta para arrays
      const arrayFields = ["doencas_cronicas", "alergias_medicamentosas", "queixa_principal", "procedimentos_previos", "facial_lesoes", "facial_patologias", "facial_discromias", "facial_envelhecimento", "corporal_postura", "corporal_lipodistrofia", "corporal_estrias", "corporal_flacidez_tipo", "facial_telangiectasias_local", "facial_discromias_local", "facial_rugas_local", "corporal_gordura_local", "corporal_celulite_local", "corporal_estrias_local", "corporal_flacidez_local"];
      arrayFields.forEach(key => { formData[key] = strToArray(data[key]); });

      // Ajustes de Booleanos e Radios
      formData.teve_intercorrencia = data.intercorrencias_previas && data.intercorrencias_previas !== "Não" ? "true" : "false";
      if (data.intercorrencias_previas && data.intercorrencias_previas !== "Não") {
          formData.intercorrencias_detalhes = data.intercorrencias_previas;
      }
      formData.pratica_atividade = data.pratica_atividade ? "true" : "false";
      formData.ingere_agua = data.ingere_agua ? "true" : "false";
      formData.tem_telangiectasias = data.tem_telangiectasias ? "true" : "false";

      // Preenche o formulário
      Object.keys(formData).forEach(key => setValue(key, formData[key]));

    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      let intercorrenciaFinal = "Não";
      if (data.teve_intercorrencia === "true") intercorrenciaFinal = data.intercorrencias_detalhes || "Sim, sem detalhes.";

      // Prepara payload convertendo arrays para string
      const payload = {
        doencas_cronicas: arrayToStr(data.doencas_cronicas),
        alergias_medicamentosas: arrayToStr(data.alergias_medicamentosas),
        queixa_principal: arrayToStr(data.queixa_principal),
        procedimentos_previos: arrayToStr(data.procedimentos_previos),
        facial_lesoes: arrayToStr(data.facial_lesoes),
        facial_patologias: arrayToStr(data.facial_patologias),
        facial_discromias: arrayToStr(data.facial_discromias),
        facial_envelhecimento: arrayToStr(data.facial_envelhecimento),
        corporal_postura: arrayToStr(data.corporal_postura),
        corporal_lipodistrofia: arrayToStr(data.corporal_lipodistrofia),
        corporal_estrias: arrayToStr(data.corporal_estrias),
        corporal_flacidez_tipo: arrayToStr(data.corporal_flacidez_tipo),
        facial_telangiectasias_local: arrayToStr(data.facial_telangiectasias_local),
        facial_discromias_local: arrayToStr(data.facial_discromias_local),
        facial_rugas_local: arrayToStr(data.facial_rugas_local),
        corporal_gordura_local: arrayToStr(data.corporal_gordura_local),
        corporal_celulite_local: arrayToStr(data.corporal_celulite_local),
        corporal_estrias_local: arrayToStr(data.corporal_estrias_local),
        corporal_flacidez_local: arrayToStr(data.corporal_flacidez_local),
        
        // Campos simples
        queixa_principal_detalhada: data.queixa_principal_detalhada,
        tempo_queixa: data.tempo_queixa,
        fatores_agravantes: data.fatores_agravantes,
        fatores_melhora: data.fatores_melhora,
        evento_especifico: data.evento_especifico,
        nivel_urgencia: data.nivel_urgencia,
        outros_procedimentos: data.outros_procedimentos,
        outros_doencas: data.outros_doencas,
        alergia_cosmeticos: data.alergia_cosmeticos,
        usa_medicacao_continua: data.usa_medicacao_continua,
        lista_medicacoes: data.lista_medicacoes,
        gestante: data.gestante,
        lactante: data.lactante,
        uso_anticoncepcional: data.uso_anticoncepcional,
        fumante: data.fumante,
        uso_anticoagulante: data.uso_anticoagulante,
        uso_retinoide: data.uso_retinoide,
        implantes_metalicos: data.implantes_metalicos,
        historico_queloide: data.historico_queloide,
        atividade_fisica_detalhes: data.atividade_fisica_detalhes,
        ingestao_agua_qtd: data.ingestao_agua_qtd,
        sono_horas: data.sono_horas,
        biotipo_cutaneo: data.biotipo_cutaneo,
        fototipo: data.fototipo,
        facial_textura: data.facial_textura,
        facial_acne_grau: data.facial_acne_grau,
        class_glogau: data.class_glogau,
        pele_sensivel: data.pele_sensivel,
        rosacea: data.rosacea,
        facial_observacoes: data.facial_observacoes,
        peso: data.peso,
        altura: data.altura,
        imc: data.imc,
        pressao_arterial: data.pressao_arterial,
        cintura_cm: data.cintura_cm,
        quadril_cm: data.quadril_cm,
        corporal_celulite_grau: data.corporal_celulite_grau,
        corporal_observacoes: data.corporal_observacoes,

        intercorrencias_previas: intercorrenciaFinal,
        pratica_atividade: data.pratica_atividade === "true",
        ingere_agua: data.ingere_agua === "true",
        tem_telangiectasias: data.tem_telangiectasias === "true",
      };

      await supabase.from("patients").update(payload).eq("id", id);
      toast.success("Anamnese clínica salva!");
    } catch (err) { 
        console.error(err); 
        toast.error("Erro ao salvar."); 
    } finally { 
        setSaving(false); 
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[600px]">
      
      {/* Navegação Interna (Sub-abas Clínicas) */}
      <div className="flex flex-wrap gap-2 mb-8 border-b dark:border-gray-700 pb-2">
        <Components.TabButton active={activeTab === "queixa"} onClick={() => setActiveTab("queixa")} icon={<ClipboardList size={18} />} label="1. Queixa" />
        <Components.TabButton active={activeTab === "saude"} onClick={() => setActiveTab("saude")} icon={<Heart size={18} />} label="2. Saúde" />
        <Components.TabButton active={activeTab === "facial"} onClick={() => setActiveTab("facial")} icon={<Smile size={18} />} label="3. Facial" />
        <Components.TabButton active={activeTab === "corporal"} onClick={() => setActiveTab("corporal")} icon={<User size={18} />} label="4. Corporal" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        
        {/* --- ABA 1: QUEIXA --- */}
        <div className={activeTab === "queixa" ? "block" : "hidden"}>
          <Components.Section title="Queixa Principal & Objetivos">
            <div className="space-y-8">
              <Components.Field label="O que mais incomoda hoje?">
                <Components.CheckboxGroup name="queixa_principal" label="Selecione as principais queixas:" options={Constants.QUEIXAS} control={control} />
                <div className="mt-4"><textarea {...register("queixa_principal_detalhada")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]" placeholder="Detalhamento da queixa..." /></div>
              </Components.Field>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Components.InputWithLabel label="Há quanto tempo?" {...register("tempo_queixa")} />
                <Components.InputWithLabel label="Fatores de Piora" {...register("fatores_agravantes")} />
                <Components.InputWithLabel label="Fatores de Melhora" {...register("fatores_melhora")} />
                <Components.InputWithLabel label="Evento Específico" {...register("evento_especifico")} />
              </div>
              <div className="mt-4"><Components.LabelSlider label="Urgência (1-5)" name="nivel_urgencia" register={register} min="1" max="5" low="Baixa" high="Alta" /></div>
            </div>
          </Components.Section>
          <Components.Section title="Histórico Estético">
            <Components.ProcedureListWithDates control={control} register={register} setValue={setValue} list={Constants.PROCEDIMENTOS_LISTA} />
             <div className="mt-4"><Components.InputWithLabel label="Outros Procedimentos / Detalhes" {...register("outros_procedimentos")} /></div>
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 mt-4">
              <Components.YesNoRadio label="Já teve alguma intercorrência?" name="teve_intercorrencia" register={register} watchValue={teveIntercorrencia} />
              {(teveIntercorrencia === "true") && (<textarea {...register("intercorrencias_detalhes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="Descreva a complicação..." />)}
            </div>
          </Components.Section>
        </div>

        {/* --- ABA 2: SAÚDE GERAL --- */}
        <div className={activeTab === "saude" ? "block" : "hidden"}>
          <div className="grid md:grid-cols-2 gap-8">
            <Components.Section title="Histórico Clínico">
              <Components.CheckboxGroup name="doencas_cronicas" label="Doenças Crônicas:" options={Constants.DOENCAS} control={control} />
              <div className="mt-4"><Components.InputWithLabel label="Outras doenças / Obs" {...register("outros_doencas")} /></div>
            </Components.Section>
            <Components.Section title="Alergias">
              <Components.CheckboxGroup name="alergias_medicamentosas" label="Alergias:" options={Constants.ALERGIAS} control={control} />
              <div className="mt-4"><Components.InputWithLabel label="Outras Alergias (Cosméticos/Alimentos)" {...register("alergia_cosmeticos")} /></div>
            </Components.Section>
          </div>
          <Components.Section title="Medicamentos e Hábitos">
            <div className="flex items-center gap-4 mb-4"><Components.CheckboxItem name="usa_medicacao_continua" label="Usa medicação contínua?" register={register} /></div>
            {usaMedicacao && (<textarea {...register("lista_medicacoes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none h-20 mb-4" placeholder="Quais medicações?" />)}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t dark:border-gray-700">
               <Components.CheckboxItem name="gestante" label="Gestante" register={register} />
               <Components.CheckboxItem name="lactante" label="Lactante" register={register} />
               <Components.CheckboxItem name="uso_anticoncepcional" label="Anticoncepcional" register={register} />
               <Components.CheckboxItem name="fumante" label="Tabagismo" register={register} />
               <Components.CheckboxItem name="uso_anticoagulante" label="Anticoagulante" register={register} />
               <Components.CheckboxItem name="uso_retinoide" label="Roacutan" register={register} />
               <Components.CheckboxItem name="implantes_metalicos" label="Implantes Metálicos" register={register} />
               <Components.CheckboxItem name="historico_queloide" label="Quelóide" register={register} />
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-6 pt-6 border-t dark:border-gray-700">
               <div>
                  <Components.YesNoRadio label="Pratica atividade física?" name="pratica_atividade" register={register} watchValue={praticaAtividade} />
                  {(praticaAtividade === "true") && (<div className="bg-gray-50 p-4 rounded-md"><Components.InputWithLabel label="Frequência (vezes/semana)" {...register("atividade_fisica_detalhes")} placeholder="Ex: 3x" /></div>)}
               </div>
               <div>
                  <Components.YesNoRadio label="Ingestão de água adequada?" name="ingere_agua" register={register} watchValue={ingereAgua} />
                  {(ingereAgua === "true") && (<div className="bg-gray-50 p-4 rounded-md"><Components.InputWithLabel label="Quantidade Aproximada (Litros/dia)" {...register("ingestao_agua_qtd")} type="number" step="0.1" /></div>)}
               </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-6"><Components.InputWithLabel label="Sono (h/noite)" {...register("sono_horas")} type="number" /></div>
          </Components.Section>
        </div>

        {/* --- ABA 3: FACIAL --- */}
        <div className={activeTab === "facial" ? "block" : "hidden"}>
           <Components.Section title="Análise da Pele">
             <div className="grid md:grid-cols-3 gap-6">
                <Components.SelectField label="Biotipo Cutâneo" name="biotipo_cutaneo" register={register} options={Constants.BIOTIPOS} />
                <Components.SelectField label="Fototipo" name="fototipo" register={register} options={Constants.FOTOTIPOS} />
                <Components.SelectField label="Textura ao Toque" name="facial_textura" register={register} options={Constants.TEXTURAS_PELE} />
             </div>
             <div className="grid md:grid-cols-3 gap-6 mt-4">
                <Components.SelectField label="Grau de Acne" name="facial_acne_grau" register={register} options={Constants.GRAUS_ACNE} />
                <Components.SelectField label="Classificação de Glogau" name="class_glogau" register={register} options={["Tipo I", "Tipo II", "Tipo III", "Tipo IV"]} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sensibilidade?</label>
                  <div className="flex gap-4 mt-2"><Components.CheckboxItem name="pele_sensivel" label="Sim" register={register} /><Components.CheckboxItem name="rosacea" label="Rosácea" register={register} /></div>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t dark:border-gray-700"><Components.CheckboxGroup name="facial_lesoes" label="Lesões Elementares (Acne/Outros):" options={Constants.LESOES_ACNE} control={control} /></div>
             <div className="mt-6 pt-6 border-t dark:border-gray-700"><Components.CheckboxGroup name="facial_patologias" label="Patologias e Dermatites:" options={Constants.PATOLOGIAS_PELE} control={control} /></div>
             <div className="grid md:grid-cols-2 gap-8 mt-6 pt-6 border-t dark:border-gray-700">
                <div>
                   <h4 className="font-semibold mb-2">Vascularização</h4>
                   <Components.YesNoRadio label="Possui Telangiectasias?" name="tem_telangiectasias" register={register} watchValue={temTelangiectasias} />
                   {(temTelangiectasias === "true") && (<div className="bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Região Acometida:</label><Components.RegionGrid name="facial_telangiectasias_local" options={Constants.REGIOES_FACIAIS} control={control} /></div>)}
                </div>
                <div>
                   <h4 className="font-semibold mb-2">Discromias (Manchas)</h4>
                   <Components.CheckboxGroup name="facial_discromias" label="Tipo:" options={Constants.DISCROMIAS} control={control} />
                   <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100"><label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Região das Manchas:</label><Components.RegionGrid name="facial_discromias_local" options={Constants.REGIOES_FACIAIS} control={control} /></div>
                </div>
             </div>
             <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h4 className="font-semibold mb-2">Sinais de Envelhecimento</h4>
                <Components.CheckboxGroup name="facial_envelhecimento" label="Presença de:" options={Constants.ENVELHECIMENTO_SINAIS} control={control} />
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100"><label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><MapPin size={12}/> Região das Rugas/Flacidez:</label><Components.RegionGrid name="facial_rugas_local" options={Constants.REGIOES_FACIAIS} control={control} /></div>
             </div>
             <div className="mt-6"><Components.Field label="Observações Faciais Gerais"><textarea {...register("facial_observacoes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="Anote aqui outras percepções da avaliação visual e palpatória..." /></Components.Field></div>
           </Components.Section>
        </div>

        {/* --- ABA 4: CORPORAL --- */}
        <div className={activeTab === "corporal" ? "block" : "hidden"}>
           <Components.Section title="Medidas e Sinais Vitais">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Components.InputWithLabel label="Peso (kg)" type="number" step="0.1" {...register("peso")} />
                 <Components.InputWithLabel label="Altura (m)" type="number" step="0.01" {...register("altura")} />
                 <Components.InputWithLabel label="IMC" readOnly {...register("imc")} className="bg-gray-100 dark:bg-gray-700" />
                 <Components.InputWithLabel label="PA" {...register("pressao_arterial")} />
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"><Components.InputWithLabel label="Cintura (cm)" type="number" {...register("cintura_cm")} /><Components.InputWithLabel label="Quadril (cm)" type="number" {...register("quadril_cm")} /></div>
           </Components.Section>
           <Components.Section title="Análise Corporal">
             <div className="mb-6"><Components.CheckboxGroup name="corporal_postura" label="Alterações Posturais:" options={Constants.ALTERACOES_POSTURAIS} control={control} /></div>
             <div className="grid md:grid-cols-2 gap-8 pt-6 border-t dark:border-gray-700">
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Lipodistrofia (Gordura Localizada)</h4>
                    <Components.CheckboxGroup name="corporal_lipodistrofia" label="Tipo:" options={Constants.TIPOS_LIPODISTROFIA} control={control} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região da Gordura:</label><Components.RegionGrid name="corporal_gordura_local" options={Constants.REGIOES_CORPORAIS} control={control} /></div>
                 </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Fibroedema Gelóide (Celulite)</h4>
                    <Components.SelectField label="Grau Predominante" name="corporal_celulite_grau" register={register} options={Constants.GRAUS_ACNE} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região da Celulite:</label><Components.RegionGrid name="corporal_celulite_local" options={Constants.REGIOES_CORPORAIS} control={control} /></div>
                 </div>
             </div>
             <div className="grid md:grid-cols-2 gap-8 mt-6 pt-6 border-t dark:border-gray-700">
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Estrias</h4>
                    <Components.CheckboxGroup name="corporal_estrias" label="Tipo:" options={Constants.TIPOS_ESTRIAS} control={control} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região das Estrias:</label><Components.RegionGrid name="corporal_estrias_local" options={Constants.REGIOES_CORPORAIS} control={control} /></div>
                 </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-red-700">Flacidez Corporal</h4>
                    <Components.CheckboxGroup name="corporal_flacidez_tipo" label="Tipo:" options={Constants.FLACIDEZ_CORPORAL} control={control} />
                    <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100"><label className="block text-xs font-bold text-red-800 mb-1 flex items-center gap-1"><MapPin size={12}/> Região da Flacidez:</label><Components.RegionGrid name="corporal_flacidez_local" options={Constants.REGIOES_CORPORAIS} control={control} /></div>
                 </div>
             </div>
             <div className="mt-6"><Components.Field label="Observações Corporais Gerais"><textarea {...register("corporal_observacoes")} className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none" placeholder="Outras alterações, edema, cicatrizes..." /></Components.Field></div>
           </Components.Section>
        </div>

        {/* BOTÃO SALVAR (Comportamento fixo na parte inferior do form) */}
        <div className="flex justify-end pt-6 border-t mt-6">
             <Button type="submit" disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white px-8">
                 {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} 
                 Salvar Anamnese
             </Button>
        </div>
      </form>
    </div>
  );
}