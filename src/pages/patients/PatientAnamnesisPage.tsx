import React, { useEffect, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  Save,
  HeartPulse,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  Activity,
  Brain,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SignaturePad } from "../../components/SignaturePad";

// --- OPÇÕES FIXAS ---
const DOENCAS = [
  "Hipertensão",
  "Diabetes",
  "Cardiopatias",
  "Autoimunes",
  "Epilepsia",
  "Tireoide",
];
const ALERGIAS = [
  "Antibióticos",
  "Anestésicos",
  "Látex",
  "Cosméticos",
  "AAS/Dipirona",
  "Frutos do Mar",
];
const QUEIXAS = [
  "Gordura Localizada",
  "Flacidez",
  "Celulite",
  "Melasma",
  "Acne",
  "Rugas",
  "Cicatrizes",
  "Estrias",
];
const FOTOTIPOS = ["I", "II", "III", "IV", "V", "VI"];
const BIOTIPOS = ["Normal", "Seca", "Oleosa", "Mista", "Sensível"];
const GRAUS_ESTETICOS = ["Nenhum", "Leve", "Moderado", "Severo"];

const PROCEDIMENTOS_LISTA = [
  "Toxina Botulínica",
  "Preenchimento",
  "Bioestimulador",
  "Fios de PDO",
  "Laser / Luz Pulsada",
  "Peeling Químico",
  "Microagulhamento",
  "Cirurgia Plástica",
];

// helpers
const strToArray = (s: string | null | undefined) =>
  s ? s.split("; ").map((v) => v.trim()).filter(Boolean) : [];

const arrayToStr = (a: any) => (Array.isArray(a) ? a.join("; ") : a);

export function PatientAnamnesisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "queixa" | "saude" | "fisico" | "plano" | "termos"
  >("queixa");
  const [patientName, setPatientName] = useState("");
  const [signatureData, setSignatureData] = useState("");

  const { register, handleSubmit, setValue, control, watch } = useForm();

  // Monitores
  const teveIntercorrencia = watch("teve_intercorrencia");
  const usaMedicacao = watch("usa_medicacao_continua");
  const tabagismo = watch("tabagismo");
  const consumoAlcool = watch("consumo_alcool");
  const praticaAtividade = watch("atividade_fisica");
  const peso = watch("peso");
  const altura = watch("altura");

  // Cálculo de IMC
  useEffect(() => {
    if (peso && altura) {
      const pesoNum = Number(peso);
      const alturaNum = Number(altura);
      if (alturaNum > 0) {
        const imcCalc = pesoNum / (alturaNum * alturaNum);
        if (!isNaN(imcCalc) && isFinite(imcCalc)) {
          setValue("imc", imcCalc.toFixed(2));
        }
      }
    }
  }, [peso, altura, setValue]);

  useEffect(() => {
    if (id) fetchAnamnesis();
  }, [id]);

  async function fetchAnamnesis() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select(`*, profiles:profile_id(first_name, last_name)`)
        .eq("id", id)
        .single();

      if (error) throw error;

      setPatientName(
        `${data.profiles?.first_name || ""} ${
          data.profiles?.last_name || ""
        }`.trim()
      );

      // Arrays
      setValue("doencas_cronicas", strToArray(data.doencas_cronicas));
      setValue(
        "alergias_medicamentosas",
        strToArray(data.alergias_medicamentosas)
      );
      setValue("queixa_principal", strToArray(data.queixa_principal));
      setValue("procedimentos_previos", strToArray(data.procedimentos_previos));

      // Booleans
      [
        "gestante",
        "lactante",
        "uso_anticoncepcional",
        "historico_queloide",
        "tabagismo",
        "uso_isotretinoina",
        "termo_aceito",
        "autoriza_foto",
        "autoriza_midia",
        "usa_medicacao_continua",
        "uso_anticoagulante",
        "uso_corticoide",
        "uso_retinoide",
        "alergia_anestesico",
        "alergia_latex",
        "expectativa_realista",
        "pele_sensivel",
        "tendencia_acne",
        "melasma_manchas",
        "implantes_metalicos",
      ].forEach((key) => {
        // @ts-ignore
        setValue(key, Boolean(data[key]));
      });

      // Textos e Números
      [
        "observacoes_saude",
        "objetivo_paciente",
        "consumo_alcool",
        "exposicao_solar",
        "fototipo",
        "biotipo_cutaneo",
        "apto_status",
        "outros_procedimentos",
        "cirurgias_previas",
        "queixa_principal_detalhada",
        "objetivo_especifico",
        "tempo_queixa",
        "fatores_agravantes",
        "fatores_melhora",
        "nivel_urgencia",
        "evento_especifico",
        "ultimo_procedimento_data",
        "ultimo_procedimento_local",
        "satisfacao_previas",
        "outros_doencas",
        "alergia_cosmeticos",
        "lista_medicacoes",
        "diagnostico_sop",
        "tabagismo_carga",
        "frequencia_alcool",
        "atividade_fisica",
        "atividade_fisica_detalhes",
        "sono_horas",
        "ingestao_agua",
        "estresse_nivel",
        "peso",
        "altura",
        "imc",
        "pressao_arterial",
        "cintura_cm",
        "quadril_cm",
        "class_glogau",
        "grau_flacidez_facial",
        "grau_celulite",
        "satisfacao_imagem_corporal",
        "preferencia_plano",
        "motivacao_principal",
        "red_flags_profissional",
        "plano_inicial",
        "prioridade_regioes",
        "numero_sessoes_estimado",
        "intervalo_sessoes",
      ].forEach((key) => {
        // @ts-ignore
        setValue(key, data[key] ?? "");
      });

      // Intercorrência Lógica
      if (
        data.intercorrencias_previas &&
        data.intercorrencias_previas.length > 3 &&
        data.intercorrencias_previas !== "Não"
      ) {
        setValue("teve_intercorrencia", true);
        setValue("intercorrencias_detalhes", data.intercorrencias_previas);
      } else {
        setValue("teve_intercorrencia", false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar anamnese.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      let intercorrenciaFinal = "Não";
      if (data.teve_intercorrencia) {
        intercorrenciaFinal =
          data.intercorrencias_detalhes || "Sim, sem detalhes.";
      }

      const payload = {
        ...data,
        doencas_cronicas: arrayToStr(data.doencas_cronicas),
        alergias_medicamentosas: arrayToStr(data.alergias_medicamentosas),
        queixa_principal: arrayToStr(data.queixa_principal),
        procedimentos_previos: arrayToStr(data.procedimentos_previos),
        intercorrencias_previas: intercorrenciaFinal,
      };

      delete payload.profiles;
      delete payload.teve_intercorrencia;
      delete payload.intercorrencias_detalhes;

      const { error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      if (signatureData) {
        console.log(
          "Assinatura capturada, pronta para upload/salvamento:",
          signatureData
        );
      }

      toast.success("Anamnese salva com sucesso!");
      navigate(`/patients/${id}/history`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-red-600" />
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/patients/${id}/history`)}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Anamnese Completa
            </h1>
            <p className="text-sm text-gray-500">{patientName}</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
        >
          {saving ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          Salvar
        </Button>
      </div>

      {/* Menu de Abas */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl mb-6 overflow-x-auto shadow-sm border border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === "queixa"}
          onClick={() => setActiveTab("queixa")}
          icon={<ClipboardList size={18} />}
          label="1. Queixa & Histórico"
        />
        <TabButton
          active={activeTab === "saude"}
          onClick={() => setActiveTab("saude")}
          icon={<HeartPulse size={18} />}
          label="2. Saúde Geral"
        />
        <TabButton
          active={activeTab === "fisico"}
          onClick={() => setActiveTab("fisico")}
          icon={<Activity size={18} />}
          label="3. Exame Físico"
        />
        <TabButton
          active={activeTab === "plano"}
          onClick={() => setActiveTab("plano")}
          icon={<Brain size={18} />}
          label="4. Diagnóstico & Plano"
        />
        <TabButton
          active={activeTab === "termos"}
          onClick={() => setActiveTab("termos")}
          icon={<FileCheck size={18} />}
          label="5. Termos"
        />
      </div>

      <form className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[600px]">
        {/* --- ABA 1: QUEIXA & HISTÓRICO --- */}
        <div className={activeTab === "queixa" ? "block" : "hidden"}>
          <Section title="Queixa Principal & Objetivos">
            <div className="space-y-8">
              {/* O que mais incomoda hoje */}
              <Field label="O que mais incomoda hoje?">
                <CheckboxGroup
                  name="queixa_principal"
                  label="Selecione as principais queixas:"
                  options={QUEIXAS}
                  control={control}
                />
                <div className="mt-4">
                  <textarea
                    {...register("queixa_principal_detalhada")}
                    className="w-full input-area min-h-[160px]"
                    placeholder="Se desejar, detalhe as regiões (ex.: flacidez em terço inferior do rosto, gordura localizada em abdome infraumbilical, celulite em culote, etc.)."
                  />
                </div>
              </Field>

              {/* Objetivo desejado */}
              <Field label="Qual resultado você gostaria de alcançar?">
                <div className="space-y-3">
                  <select
                    {...register("objetivo_paciente")}
                    className="w-full input-select"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="Melhorar textura e viço da pele">
                      Melhorar textura e viço da pele
                    </option>
                    <option value="Reduzir gordura localizada / medidas">
                      Reduzir gordura localizada / medidas
                    </option>
                    <option value="Controlar acne e oleosidade">
                      Controlar acne e oleosidade
                    </option>
                    <option value="Suavizar rugas e linhas de expressão">
                      Suavizar rugas e linhas de expressão
                    </option>
                    <option value="Melhorar contorno facial/corporal">
                      Melhorar contorno facial/corporal
                    </option>
                    <option value="Clarear manchas / melasma">
                      Clarear manchas / melasma
                    </option>
                    <option value="Outro">Outro</option>
                  </select>
                  <textarea
                    {...register("objetivo_especifico")}
                    className="w-full input-area min-h-[160px]"
                    placeholder="Descreva com suas palavras o resultado ideal que você imagina (ex.: ‘rosto mais afinado e descansado’, ‘abdômen mais definido’, ‘melhorar a flacidez do interno de coxa’, etc.)."
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <InputWithLabel
                label="Há quanto tempo?"
                {...register("tempo_queixa")}
              />
              <InputWithLabel
                label="Fatores de Piora"
                {...register("fatores_agravantes")}
              />
              <InputWithLabel
                label="Fatores de Melhora"
                {...register("fatores_melhora")}
              />
              <InputWithLabel
                label="Evento Específico"
                {...register("evento_especifico")}
                placeholder="Ex: casamento, viagem, data limite..."
              />
            </div>

            <div className="mt-4">
              <LabelSlider
                label="Urgência (1-5)"
                name="nivel_urgencia"
                register={register}
                min="1"
                max="5"
                low="Baixa"
                high="Alta"
              />
            </div>
          </Section>

          <Section title="Histórico Estético">
            <div className="mb-6">
              <CheckboxGroup
                name="procedimentos_previos"
                label="Já realizou:"
                options={PROCEDIMENTOS_LISTA}
                control={control}
              />
              <div className="mt-4">
                <Field label="Outros procedimentos / locais / datas">
                  <textarea
                    {...register("outros_procedimentos")}
                    className="w-full input-area min-h-[180px]"
                    placeholder="Descreva outros procedimentos realizados, onde foram feitos, há quanto tempo e se ficou satisfeito(a)..."
                  />
                </Field>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800/40 mt-4">
              <label className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2 mb-2">
                <AlertTriangle size={16} /> Intercorrências Prévias?
              </label>
              <div className="flex flex-wrap gap-6 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="nao"
                    {...register("teve_intercorrencia")}
                    onChange={() => setValue("teve_intercorrencia", false)}
                    checked={teveIntercorrencia === false}
                    className="w-4 h-4 text-red-600"
                  />
                  <span>Não</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="sim"
                    {...register("teve_intercorrencia")}
                    onChange={() => setValue("teve_intercorrencia", true)}
                    checked={teveIntercorrencia === true}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="font-bold text-red-700">Sim</span>
                </label>
              </div>
              {teveIntercorrencia && (
                <Field label="Descreva a intercorrência">
                  <textarea
                    {...register("intercorrencias_detalhes")}
                    className="w-full input-area min-h-[200px] border-red-300 dark:border-red-700"
                    placeholder="Descreva a complicação, qual procedimento, quando ocorreu, como foi tratado e se houve sequelas..."
                  />
                </Field>
              )}
            </div>
          </Section>
        </div>

        {/* --- ABA 2: SAÚDE GERAL --- */}
        <div className={activeTab === "saude" ? "block" : "hidden"}>
          <div className="grid md:grid-cols-2 gap-8">
            <Section
              title="Doenças Crônicas"
              className="border-l-4 border-red-500 bg-red-50/40"
            >
              <CheckboxGroup
                name="doencas_cronicas"
                label="Selecione as doenças diagnosticadas:"
                options={DOENCAS}
                control={control}
              />
              <div className="mt-6">
                <Field label="Outras doenças / diagnósticos relevantes">
                  <textarea
                    {...register("outros_doencas")}
                    className="w-full input-area min-h-[200px]"
                    placeholder="Descreva outras doenças, diagnósticos importantes, histórico familiar relevante, uso prévio de quimioterapia/radioterapia, etc."
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Alergias"
              className="border-l-4 border-red-500 bg-red-50/40"
            >
              <CheckboxGroup
                name="alergias_medicamentosas"
                label="Alergias conhecidas:"
                options={ALERGIAS}
                control={control}
              />
              <div className="mt-6">
                <Field label="Outras alergias (cosméticos, alimentos, contato, etc.)">
                  <textarea
                    {...register("alergia_cosmeticos")}
                    className="w-full input-area min-h-[200px]"
                    placeholder="Descreva alergias a cosméticos, ácidos, fragrâncias, esmalte, metais, alimentos, entre outras."
                  />
                </Field>
              </div>
            </Section>
          </div>

          <Section title="Medicamentos e Riscos">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  {...register("usa_medicacao_continua")}
                  className="w-5 h-5 text-red-600 rounded"
                />
                Usa medicação contínua?
              </label>
            </div>
            {usaMedicacao && (
              <Field label="Descreva as medicações de uso contínuo">
                <textarea
                  {...register("lista_medicacoes")}
                  className="w-full input-area min-h-[200px]"
                  placeholder="Descreva nome, dose e horário das medicações contínuas (incluindo anticoagulantes, hormônios, ansiolíticos, antidepressivos, etc.)"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t dark:border-gray-700">
              <Check
                name="uso_anticoagulante"
                label="Anticoagulante?"
                register={register}
              />
              <Check
                name="uso_corticoide"
                label="Corticoide sistêmico?"
                register={register}
              />
              <Check
                name="uso_retinoide"
                label="Roacutan oral?"
                register={register}
              />
              <Check
                name="implantes_metalicos"
                label="Implantes metálicos?"
                register={register}
              />
            </div>
          </Section>

          <Section title="Histórico Ginecológico / Hormonal">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Check name="gestante" label="Gestante?" register={register} />
              <Check name="lactante" label="Lactante?" register={register} />
              <Check
                name="uso_anticoncepcional"
                label="Anticoncepcional?"
                register={register}
              />
            </div>
            <div className="mt-6">
              <Field label="Descreva diagnósticos hormonais / ginecológicos relevantes">
                <textarea
                  {...register("diagnostico_sop")}
                  className="w-full input-area min-h-[180px]"
                  placeholder="Descreva diagnósticos hormonais, uso de reposição hormonal, alterações de ciclo, SOP, menopausa, TPM intensa, etc."
                />
              </Field>
            </div>
          </Section>

          <Section title="Observações gerais de saúde">
            <Field label="Descreva outras observações clínicas importantes">
              <textarea
                {...register("observacoes_saude")}
                className="w-full input-area min-h-[200px]"
                placeholder="Use este espaço para registrar qualquer outra informação relevante sobre a saúde geral do paciente, exames recentes, encaminhamentos médicos ou observações adicionais."
              />
            </Field>
          </Section>
        </div>

        {/* --- ABA 3: EXAME FÍSICO --- */}
        <div className={activeTab === "fisico" ? "block" : "hidden"}>
          <Section title="Análise de Pele">
            <div className="grid md:grid-cols-3 gap-6">
              <SelectField
                label="Fototipo"
                name="fototipo"
                register={register}
                options={FOTOTIPOS}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <SelectField
                label="Biotipo Cutâneo"
                name="biotipo_cutaneo"
                register={register}
                options={BIOTIPOS}
              />
              <SelectField
                label="Classificação de Glogau"
                name="class_glogau"
                register={register}
                options={["I", "II", "III", "IV"]}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <SelectField
                label="Flacidez Facial"
                name="grau_flacidez_facial"
                register={register}
                options={GRAUS_ESTETICOS}
              />
              <SelectField
                label="Celulite (região predominante)"
                name="grau_celulite"
                register={register}
                options={GRAUS_ESTETICOS}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t dark:border-gray-700">
              <Check name="pele_sensivel" label="Pele sensível" register={register} />
              <Check
                name="tendencia_acne"
                label="Tendência à acne"
                register={register}
              />
              <Check
                name="melasma_manchas"
                label="Melasma / manchas"
                register={register}
              />
              <Check
                name="historico_queloide"
                label="Histórico de quelóide"
                register={register}
              />
            </div>
          </Section>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <Section title="Hábitos de Vida">
              <div className="grid grid-cols-2 gap-4">
                <InputWithLabel
                  label="Sono (horas/noite)"
                  type="number"
                  {...register("sono_horas")}
                />
                <InputWithLabel
                  label="Ingestão de água (L/dia)"
                  type="number"
                  step="0.1"
                  {...register("ingestao_agua")}
                />
              </div>

              {/* Tabagismo */}
              <div className="mt-6 space-y-2">
                <span className="label">Tabagismo</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={true as any}
                      checked={!!tabagismo}
                      onChange={() => setValue("tabagismo", true)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={false as any}
                      checked={!tabagismo}
                      onChange={() => setValue("tabagismo", false)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Não</span>
                  </label>
                </div>
                {tabagismo && (
                  <Field label="Descreva a carga / frequência">
                    <textarea
                      {...register("tabagismo_carga")}
                      className="w-full input-area min-h-[160px]"
                      placeholder="Descreva: ex. 10 cigarros/dia há 5 anos; ex-tabagista há 3 anos; narguilé social, etc."
                    />
                  </Field>
                )}
              </div>

              {/* Álcool */}
              <div className="mt-6 space-y-2">
                <span className="label">Consumo de álcool</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Sim"
                      checked={consumoAlcool === "Sim"}
                      onChange={() => setValue("consumo_alcool", "Sim")}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Não"
                      checked={consumoAlcool === "Não" || !consumoAlcool}
                      onChange={() => setValue("consumo_alcool", "Não")}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Não</span>
                  </label>
                </div>
                {consumoAlcool === "Sim" && (
                  <Field label="Descreva a frequência / tipo de bebida">
                    <textarea
                      {...register("frequencia_alcool")}
                      className="w-full input-area min-h-[160px]"
                      placeholder="Descreva: ex. 2x/semana (fim de semana), vinho, cerveja social, destilados em festas, etc."
                    />
                  </Field>
                )}
              </div>

              {/* Atividade física */}
              <div className="mt-6 space-y-2">
                <span className="label">Atividade física</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Sim"
                      checked={praticaAtividade === "Sim"}
                      onChange={() => setValue("atividade_fisica", "Sim")}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Não"
                      checked={praticaAtividade === "Não" || !praticaAtividade}
                      onChange={() => setValue("atividade_fisica", "Não")}
                      className="w-4 h-4 text-red-600"
                    />
                    <span>Não</span>
                  </label>
                </div>
                {praticaAtividade === "Sim" && (
                  <Field label="Descreva tipo e frequência de atividade física">
                    <textarea
                      {...register("atividade_fisica_detalhes")}
                      className="w-full input-area min-h-[160px]"
                      placeholder="Descreva: musculação 4x/semana, caminhada 3x/semana, treino funcional, pilates, dança, etc."
                    />
                  </Field>
                )}
              </div>

              <div className="mt-6 pt-4 border-t dark:border-gray-700">
                <LabelSlider
                  label="Nível de estresse (1-5)"
                  name="estresse_nivel"
                  register={register}
                  min="1"
                  max="5"
                  low="Tranquilo"
                  high="Muito estressado"
                />
              </div>
            </Section>

            <Section title="Medidas Corporais">
              <div className="grid grid-cols-2 gap-4">
                <InputWithLabel
                  label="Peso (kg)"
                  type="number"
                  step="0.1"
                  {...register("peso")}
                />
                <InputWithLabel
                  label="Altura (m)"
                  type="number"
                  step="0.01"
                  {...register("altura")}
                />
                <div>
                  <label className="label">IMC</label>
                  <Input readOnly {...register("imc")} className="bg-gray-100" />
                </div>
                <InputWithLabel
                  label="Pressão arterial"
                  {...register("pressao_arterial")}
                  placeholder="Ex: 12/8"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                <InputWithLabel
                  label="Cintura (cm)"
                  type="number"
                  {...register("cintura_cm")}
                />
                <InputWithLabel
                  label="Quadril (cm)"
                  type="number"
                  {...register("quadril_cm")}
                />
              </div>
            </Section>
          </div>
        </div>

        {/* --- ABA 4: DIAGNÓSTICO & PLANO --- */}
        <div className={activeTab === "plano" ? "block" : "hidden"}>
          <Section title="Perfil e Expectativa">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <LabelSlider
                  label="Satisfação com a imagem corporal (0-10)"
                  name="satisfacao_imagem_corporal"
                  register={register}
                  min="0"
                  max="10"
                  low="Muito insatisfeito(a)"
                  high="Muito satisfeito(a)"
                />
              </div>
              <div className="space-y-2">
                <label className="label">Preferência de plano</label>
                <select
                  {...register("preferencia_plano")}
                  className="w-full input-select"
                >
                  <option value="">Selecione</option>
                  <option value="Rapido">Plano rápido / intensivo</option>
                  <option value="Gradual">Plano gradual / suave</option>
                  <option value="Indefinido">A critério do profissional</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <Field label="Descreva a motivação principal para o tratamento">
                <textarea
                  {...register("motivacao_principal")}
                  className="w-full input-area min-h-[180px]"
                  placeholder="Descreva: autoestima, evento específico, recomendação médica, tentativa após falha com outros tratamentos, etc."
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Plano Terapêutico"
            className="border-l-4 border-red-500 bg-red-50/40"
          >
            <Field label="Descreva o plano terapêutico proposto">
              <textarea
                {...register("plano_inicial")}
                className="w-full input-area min-h-[220px]"
                placeholder="Descreva as etapas do plano: número de sessões, técnicas principais, associação com home care, intervalos, cuidados essenciais, etc."
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <InputWithLabel
                label="Regiões prioritárias"
                {...register("prioridade_regioes")}
              />
              <InputWithLabel
                label="Sessões estimadas"
                type="number"
                {...register("numero_sessoes_estimado")}
              />
              <InputWithLabel
                label="Intervalo entre sessões"
                {...register("intervalo_sessoes")}
                placeholder="Ex: 15 em 15 dias / 1x ao mês"
              />
            </div>

            <div className="mt-6">
              <Field label="Pontos de atenção / Red flags profissionais">
                <textarea
                  {...register("red_flags_profissional")}
                  className="w-full input-area min-h-[200px]"
                  placeholder="Descreva restrições, cuidados especiais, limitações clínicas, comportamentos de risco ou qualquer ponto importante para acompanhamento e segurança."
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* --- ABA 5: TERMOS --- */}
        <div className={activeTab === "termos" ? "block" : "hidden"}>
          <div className="max-w-2xl mx-auto text-center space-y-8 py-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 text-left">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-4">
                Checklist de Documentação
              </h3>
              <div className="space-y-4">
                <Check name="termo_aceito" label="TCLE assinado" register={register} />
                <Check
                  name="autoriza_foto"
                  label="Autoriza fotos para prontuário"
                  register={register}
                />
                <Check
                  name="autoriza_midia"
                  label="Autoriza uso de imagens em redes sociais (anonimizado)"
                  register={register}
                />
              </div>
            </div>

            <div className="pt-6 border-t dark:border-gray-700">
              <label className="block text-lg font-bold mb-4">
                Parecer final de aptidão
              </label>
              <select
                {...register("apto_status")}
                className="w-full p-4 text-xl border-2 border-red-200 rounded-xl text-center font-bold dark:bg-gray-900 dark:text-white"
              >
                <option value="Apto">✅ APTO</option>
                <option value="Apto com ressalvas">⚠️ APTO COM RESSALVAS</option>
                <option value="Não apto">🚫 NÃO APTO</option>
              </select>
            </div>

            <div className="mt-8 text-left">
              <label className="label-bold mb-2 block">Assinatura do Paciente</label>
              <SignaturePad
                onEnd={(data) => setSignatureData(data)}
                isLoading={saving}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// --- COMPONENTES VISUAIS ---
const Section = ({ title, children, className = "" }: any) => (
  <div
    className={`p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-8 ${className}`}
  >
    <div className="mb-4 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border-l-4 border-red-600">
      <h2 className="text-lg font-bold text-red-800 dark:text-red-100">{title}</h2>
    </div>
    {children}
  </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all whitespace-nowrap ${
      active
        ? "bg-red-50 text-red-700 font-bold border border-red-300 shadow-sm"
        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`}
  >
    {icon} <span className="hidden md:inline">{label}</span>
  </button>
);

const InputWithLabel = React.forwardRef(({ label, ...props }: any, ref) => (
  <div className="w-full">
    <label className="label">{label}</label>
    <Input {...props} ref={ref} />
  </div>
));
InputWithLabel.displayName = "InputWithLabel";

const Field = ({ label, children }: any) => (
  <div className="w-full">
    <label className="label">{label}</label>
    {children}
  </div>
);

const CheckboxGroup = ({ name, label, options, control }: any) => {
  const { field } = useController({ name, control, defaultValue: [] });
  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">
        {label}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt: string) => (
          <label
            key={opt}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60 p-1 rounded"
          >
            <input
              type="checkbox"
              value={opt}
              checked={field.value?.includes(opt)}
              onChange={(e) => {
                const val = e.target.value;
                const curr = field.value || [];
                field.onChange(
                  e.target.checked
                    ? [...curr, val]
                    : curr.filter((v: any) => v !== val)
                );
              }}
              className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
};

const Check = ({ name, label, register }: any) => (
  <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-md">
    <input
      type="checkbox"
      {...register(name)}
      className="rounded text-red-600 focus:ring-red-500 w-5 h-5"
    />
    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </label>
);

const SelectField = ({ label, name, register, options }: any) => (
  <div className="w-full">
    <label className="label">{label}</label>
    <select {...register(name)} className="w-full input-select">
      <option value="">Selecione</option>
      {options.map((o: string) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const LabelSlider = ({ label, name, register, min, max, low, high }: any) => (
  <div className="w-full">
    <label className="label mb-2 flex justify-between">
      <span>{label}</span>
    </label>
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400">{low}</span>
      <input
        type="range"
        min={min}
        max={max}
        {...register(name)}
        className="w-full accent-red-600 cursor-pointer"
      />
      <span className="text-xs text-gray-400">{high}</span>
    </div>
  </div>
);

// CSS esperado no Tailwind:
// .label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
// .input-area { @apply w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none; }
// .input-select { @apply w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-red-500 outline-none; }
// .label-bold { @apply block text-sm font-bold text-gray-800 dark:text-gray-100 mb-1; }
