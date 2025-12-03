import React from "react";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useController } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { PatientGallery } from "../../components/patients/PatientGallery";

// --- OPÇÕES FIXAS DE ANAMNESE ---
const DOENCAS_OPTIONS = [
  "Hipertensão",
  "Diabetes",
  "Cardiopatias",
  "Doenças Autoimunes",
  "Câncer",
  "Epilepsia / Convulsões",
];

const ALERGIAS_OPTIONS = [
  "Antibióticos",
  "Anestésicos",
  "Látex",
  "Cosméticos Específicos",
  "Alimentos",
];

const QUEIXAS_OPTIONS = [
  "Gordura Localizada",
  "Flacidez Facial",
  "Flacidez Corporal",
  "Celulite",
  "Manchas/Melasma",
  "Acne",
  "Envelhecimento",
];

// --- OPÇÕES DE CLASSIFICAÇÃO ESTÉTICA ---
const BIOTIPO_OPTIONS = ["Oleosa", "Seca", "Mista", "Normal", "Sensível"];
const FITZPATRICK_OPTIONS = ["I", "II", "III", "IV", "V", "VI"];
const GRAU_OPTIONS = ["Nenhum", "Leve", "Moderado", "Acentuado", "Grave"];

// ---------------- SCHEMA ----------------

const patientSchema = z.object({
  // A. Identificação Básica
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  date_of_birth: z.string().min(1, "Data de nascimento é obrigatória"),
  profissao: z.string().optional(),
  sexo: z.string().optional(),

  // B. Contato e Endereço
  address: z.string().optional(),

  // C. Anamnese de Saúde Geral (Arrays)
  doencas_cronicas: z.array(z.string()).optional(),
  alergias_medicamentosas: z.array(z.string()).optional(),

  gestante: z.boolean().optional(),
  lactante: z.boolean().optional(),
  uso_anticoncepcional: z.boolean().optional(),
  historico_queloide: z.boolean().optional(),

  // Segurança / contraindicações específicas
  historico_trombose: z.boolean().optional(),
  uso_anticoagulante: z.boolean().optional(),
  doenca_cardiaca_grave: z.boolean().optional(),
  marcapasso: z.boolean().optional(),
  protese_metalica: z.boolean().optional(),
  epilepsia: z.boolean().optional(),
  historico_cancer_recente: z.boolean().optional(),
  neuropatia_periferica: z.boolean().optional(),

  // Medicamentos em uso
  uso_corticoide: z.boolean().optional(),
  uso_imunossupressor: z.boolean().optional(),
  uso_hormonio: z.boolean().optional(),
  medicamentos_em_uso: z.string().optional(),

  // Vascular / linfático
  inchaco_pernas: z.boolean().optional(),
  varizes_importantes: z.boolean().optional(),
  historico_erisipela: z.boolean().optional(),
  sensacao_peso_pernas: z.boolean().optional(),

  // D. Anamnese Estética (Arrays)
  queixa_principal: z.array(z.string()).optional(),
  objetivo_paciente: z.string().optional(),
  tabagismo: z.boolean().optional(),
  consumo_alcool: z.string().optional(),
  exposicao_solar: z.string().optional(),
  uso_isotretinoina: z.boolean().optional(),

  // Skincare
  usa_sabonete_especifico: z.boolean().optional(),
  usa_hidratante: z.boolean().optional(),
  usa_acidos: z.boolean().optional(),
  detalhes_acidos: z.string().optional(),
  uso_protetor_solar: z.string().optional(),

  // Procedimentos prévios
  procedimentos_previos: z.string().optional(),

  // E. Classificações Estéticas
  fototipo: z.enum(FITZPATRICK_OPTIONS as [string, ...string[]]).optional(),
  biotipo_cutaneo: z.enum(BIOTIPO_OPTIONS as [string, ...string[]]).optional(),
  flacidez_corporal: z.enum(GRAU_OPTIONS as [string, ...string[]]).optional(),
  celulite_grau: z.enum(GRAU_OPTIONS as [string, ...string[]]).optional(),

  // Texto livre
  observacoes_saude: z.string().optional(),
  cirurgias_previas: z.string().optional(),

  // Expectativa / adesão
  expectativa_resultado: z
    .enum(["discreto", "visivel_progressivo", "rapido_intenso"])
    .optional(),
  adesao_cuidados: z.enum(["alta", "moderada", "baixa"]).optional(),

  // Prioridades de áreas
  prioridade_area_1: z.string().optional(),
  prioridade_area_2: z.string().optional(),
  prioridade_area_3: z.string().optional(),

  // Radar de risco (preenchido manualmente)
  risco_geral: z.enum(["baixo", "moderado", "alto"]).optional(),
  risco_eletro: z.enum(["baixo", "moderado", "alto"]).optional(),
  perfil_aderencia: z.enum(["baixo", "moderado", "alto"]).optional(),

  // Consentimento de imagens
  consent_uso_clinico: z.boolean().optional(),
  consent_uso_marketing: z.boolean().optional(),

  apto_status: z
    .enum(["Apto", "Apto com ressalvas", "Não apto"], {
      required_error: "O status de aptidão é obrigatório",
    })
    .default("Apto"),
});

type PatientFormData = z.infer<typeof patientSchema>;

// ---------------- COMPONENTE PRINCIPAL ----------------

export function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      doencas_cronicas: [],
      alergias_medicamentosas: [],
      queixa_principal: [],
      apto_status: "Apto",
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      void fetchPatientData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  // ---- idade calculada em tempo real ----
  const dateOfBirth = watch("date_of_birth");
  const patientAge = calculateAge(dateOfBirth);

  function calculateAge(dateString?: string | null) {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const arrayToString = (arr: unknown) =>
    Array.isArray(arr) ? arr.join("; ") : arr || "";

  const stringToArray = (str: string | null) =>
    str
      ? str
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

  async function fetchPatientData() {
    try {
      setIsLoadingData(true);

      const { data, error } = await supabase
        .from("patients")
        .select("*, profiles:profile_id (*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return;

      setProfileId(data.profile_id);

      // Dados do perfil (nome, e-mail, telefone)
      if (data.profiles) {
        setValue("first_name", data.profiles.first_name ?? "");
        setValue("last_name", data.profiles.last_name ?? "");
        setValue("email", data.profiles.email ?? "");
        setValue("phone", data.profiles.phone ?? "");
      }

      // Dados básicos
      setValue("cpf", data.cpf);
      setValue("rg", data.rg ?? "");
      setValue("date_of_birth", data.date_of_birth);
      setValue("address", data.address ?? "");
      setValue("profissao", data.profissao ?? "");
      setValue("sexo", data.sexo ?? "");

      // Booleans de saúde e segurança
      setValue("gestante", data.gestante ?? false);
      setValue("lactante", data.lactante ?? false);
      setValue("uso_anticoncepcional", data.uso_anticoncepcional ?? false);
      setValue("historico_queloide", data.historico_queloide ?? false);

      setValue("historico_trombose", data.historico_trombose ?? false);
      setValue("uso_anticoagulante", data.uso_anticoagulante ?? false);
      setValue("doenca_cardiaca_grave", data.doenca_cardiaca_grave ?? false);
      setValue("marcapasso", data.marcapasso ?? false);
      setValue("protese_metalica", data.protese_metalica ?? false);
      setValue("epilepsia", data.epilepsia ?? false);
      setValue(
        "historico_cancer_recente",
        data.historico_cancer_recente ?? false
      );
      setValue("neuropatia_periferica", data.neuropatia_periferica ?? false);

      setValue("uso_corticoide", data.uso_corticoide ?? false);
      setValue("uso_imunossupressor", data.uso_imunossupressor ?? false);
      setValue("uso_hormonio", data.uso_hormonio ?? false);
      setValue("medicamentos_em_uso", data.medicamentos_em_uso ?? "");

      setValue("inchaco_pernas", data.inchaco_pernas ?? false);
      setValue("varizes_importantes", data.varizes_importantes ?? false);
      setValue("historico_erisipela", data.historico_erisipela ?? false);
      setValue("sensacao_peso_pernas", data.sensacao_peso_pernas ?? false);

      // Estética / hábitos
      setValue("usa_sabonete_especifico", data.usa_sabonete_especifico ?? false);
      setValue("usa_hidratante", data.usa_hidratante ?? false);
      setValue("usa_acidos", data.usa_acidos ?? false);
      setValue("detalhes_acidos", data.detalhes_acidos ?? "");
      setValue("uso_protetor_solar", data.uso_protetor_solar ?? "");

      setValue("procedimentos_previos", data.procedimentos_previos ?? "");

      setValue("apto_status", data.apto_status ?? "Apto");
      setValue("observacoes_saude", data.observacoes_saude ?? "");
      setValue("cirurgias_previas", data.cirurgias_previas ?? "");

      // Classificações estéticas
      setValue("fototipo", data.fototipo ?? undefined);
      setValue("biotipo_cutaneo", data.biotipo_cutaneo ?? undefined);
      setValue("flacidez_corporal", data.flacidez_corporal ?? undefined);
      setValue("celulite_grau", data.celulite_grau ?? undefined);

      // Arrays vindos como strings
      setValue("doencas_cronicas", stringToArray(data.doencas_cronicas));
      setValue(
        "alergias_medicamentosas",
        stringToArray(data.alergias_medicamentosas)
      );
      setValue("queixa_principal", stringToArray(data.queixa_principal));

      // Hábitos / estética
      setValue("consumo_alcool", data.consumo_alcool ?? "");
      setValue("exposicao_solar", data.exposicao_solar ?? "");
      setValue("objetivo_paciente", data.objetivo_paciente ?? "");
      setValue("tabagismo", data.tabagismo ?? false);

      // Expectativa / prioridades / risco / consentimento
      setValue("expectativa_resultado", data.expectativa_resultado ?? undefined);
      setValue("adesao_cuidados", data.adesao_cuidados ?? undefined);
      setValue("prioridade_area_1", data.prioridade_area_1 ?? "");
      setValue("prioridade_area_2", data.prioridade_area_2 ?? "");
      setValue("prioridade_area_3", data.prioridade_area_3 ?? "");
      setValue("risco_geral", data.risco_geral ?? undefined);
      setValue("risco_eletro", data.risco_eletro ?? undefined);
      setValue("perfil_aderencia", data.perfil_aderencia ?? undefined);
      setValue("consent_uso_clinico", data.consent_uso_clinico ?? false);
      setValue("consent_uso_marketing", data.consent_uso_marketing ?? false);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoadingData(false);
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    try {
      const age = data.date_of_birth ? calculateAge(data.date_of_birth) : null;

      const dataToSave = {
        ...data,
        idade: age,
        doencas_cronicas: arrayToString(data.doencas_cronicas),
        alergias_medicamentosas: arrayToString(data.alergias_medicamentosas),
        queixa_principal: arrayToString(data.queixa_principal),
      };

      if (isEditing) {
        // 1. Atualiza perfil
        if (profileId) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              phone: data.phone,
            })
            .eq("id", profileId);

          if (profileError) throw profileError;
        }

        // 2. Atualiza ficha
        const { error: patientError } = await supabase
          .from("patients")
          .update(dataToSave)
          .eq("id", id);

        if (patientError) throw patientError;

        toast.success("Paciente atualizado!");
        navigate("/patients");
      } else {
        // 1. Cria perfil
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            role: "paciente",
          })
          .select()
          .single();

        if (profileError) throw profileError;
        if (!newProfile) throw new Error("Falha ao criar perfil do paciente.");

        // 2. Cria ficha
        const { error: patientError } = await supabase
          .from("patients")
          .insert({
            profile_id: newProfile.id,
            ...dataToSave,
          });

        if (patientError) throw patientError;

        toast.success("Paciente cadastrado com sucesso!");
        navigate("/patients");
      }
    } catch (error: any) {
      console.error("Erro ao salvar paciente:", error);
      toast.error(`Erro: ${error?.message || "Falha ao salvar"}`);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="mr-1" size={18} />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEditing ? "Editar Prontuário" : "Novo Prontuário"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* --- 1. IDENTIFICAÇÃO E CONTATO --- */}
        <Section title="1. Identificação e Contato">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Nome" error={errors.first_name?.message}>
              <Input {...register("first_name")} />
            </Field>
            <Field label="Sobrenome" error={errors.last_name?.message}>
              <Input {...register("last_name")} />
            </Field>
            <Field label="CPF" error={errors.cpf?.message}>
              <Input {...register("cpf")} />
            </Field>
            <Field label="RG">
              <Input {...register("rg")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Field label="Nascimento" error={errors.date_of_birth?.message}>
              <Input type="date" {...register("date_of_birth")} />
            </Field>

            <Field label="Idade atual">
              <Input
                readOnly
                value={patientAge !== null ? `${patientAge} anos` : "-"}
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </Field>

            <Field label="Sexo">
              <select
                {...register("sexo")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </Field>

            <Field label="Profissão">
              <Input
                {...register("profissao")}
                placeholder="Ex: Designer, Engenheiro"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Telefone/WhatsApp" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>

            <Field label="Endereço (Rua, Número, CEP)">
              <Input {...register("address")} />
            </Field>
          </div>
        </Section>

        {/* --- 2. ANAMNESE DE SAÚDE GERAL --- */}
        <Section title="2. Anamnese de Saúde Geral e Segurança">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Histórico médico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-700/50">
            <CheckboxGroup
              name="doencas_cronicas"
              label="Doenças crônicas / autoimunes"
              options={DOENCAS_OPTIONS}
              control={control}
            />
            <CheckboxGroup
              name="alergias_medicamentosas"
              label="Alergias (medicamentos / outros)"
              options={ALERGIAS_OPTIONS}
              control={control}
            />
            <Field label="Histórico de cirurgias prévias">
              <Input
                {...register("cirurgias_previas")}
                placeholder="Ex: Cirurgias relevantes"
              />
            </Field>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Risco para procedimentos (eletro / calor / crio)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-700/50">
            <Checkbox
              label="Histórico de trombose / tromboflebite"
              {...register("historico_trombose")}
            />
            <Checkbox
              label="Uso de anticoagulante / AAS contínuo"
              {...register("uso_anticoagulante")}
            />
            <Checkbox
              label="Doença cardíaca grave"
              {...register("doenca_cardiaca_grave")}
            />
            <Checkbox label="Marca-passo" {...register("marcapasso")} />
            <Checkbox
              label="Prótese metálica na área de tratamento"
              {...register("protese_metalica")}
            />
            <Checkbox label="Epilepsia / convulsões" {...register("epilepsia")} />
            <Checkbox
              label="Histórico de câncer recente"
              {...register("historico_cancer_recente")}
            />
            <Checkbox
              label="Neuropatia / redução de sensibilidade"
              {...register("neuropatia_periferica")}
            />
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Medicamentos em uso
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Checkbox label="Uso de corticoide sistêmico" {...register("uso_corticoide")} />
            <Checkbox
              label="Uso de imunossupressor"
              {...register("uso_imunossupressor")}
            />
            <Checkbox label="Uso de hormônios (TRH / anabólicos)" {...register("uso_hormonio")} />
            <Field label="Medicamentos em uso (detalhar)">
              <Input
                {...register("medicamentos_em_uso")}
                placeholder="Principais medicamentos, dose/frequência"
              />
            </Field>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Circulação / retenção / vascular
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Checkbox
              label="Tendência a inchaço em pernas / tornozelos"
              {...register("inchaco_pernas")}
            />
            <Checkbox
              label="Varizes importantes / dolorosas"
              {...register("varizes_importantes")}
            />
            <Checkbox
              label="Histórico de erisipela"
              {...register("historico_erisipela")}
            />
            <Checkbox
              label="Sensação de peso / cansaço nas pernas"
              {...register("sensacao_peso_pernas")}
            />
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Condições específicas (ginecológicas / pele)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Checkbox
              label="Histórico de queloide"
              {...register("historico_queloide")}
            />
            <Checkbox
              label="Uso de anticoncepcional / DIU"
              {...register("uso_anticoncepcional")}
            />
            <Checkbox label="Gestante" {...register("gestante")} />
            <Checkbox label="Lactante" {...register("lactante")} />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações de saúde (texto livre)
            </label>
            <textarea
              {...register("observacoes_saude")}
              placeholder="Condições relevantes, laudos, recomendações médicas..."
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24 resize-none"
              rows={4}
            />
          </div>
        </Section>

        {/* --- 3. ANAMNESE ESTÉTICA, HÁBITOS E SKINCARE --- */}
        <Section title="3. Anamnese Estética, Hábitos e Skincare">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Queixas e objetivos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-700/50">
            <CheckboxGroup
              name="queixa_principal"
              label="Queixa estética principal"
              options={QUEIXAS_OPTIONS}
              control={control}
            />
            <div className="space-y-3">
              <Field label="Objetivo específico do paciente">
                <Input
                  {...register("objetivo_paciente")}
                  placeholder="Ex: Reduzir 5 cm na cintura, suavizar manchas, etc."
                />
              </Field>
              <Field label="Procedimentos estéticos prévios">
                <Input
                  {...register("procedimentos_previos")}
                  placeholder="Ex: toxina botulínica, preenchedores, peelings, laser..."
                />
              </Field>
            </div>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-6">
            Hábitos e fatores de risco
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <Checkbox label="Tabagismo" {...register("tabagismo")} />
            <Field label="Consumo de álcool">
              <Input
                {...register("consumo_alcool")}
                placeholder="Ex: Socialmente, 1x por semana, diariamente..."
              />
            </Field>
            <Checkbox
              label="Uso de isotretinoína (Roacutan)"
              {...register("uso_isotretinoina")}
            />
            <Field label="Exposição solar">
              <Input
                {...register("exposicao_solar")}
                placeholder="Ex: Diária, trabalha ao ar livre, não usa protetor..."
              />
            </Field>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-6">
            Rotina de cuidados com a pele (skincare)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Checkbox
              label="Usa sabonete específico para o rosto"
              {...register("usa_sabonete_especifico")}
            />
            <Checkbox
              label="Usa hidratante facial regularmente"
              {...register("usa_hidratante")}
            />
            <Checkbox
              label="Usa ácidos na rotina"
              {...register("usa_acidos")}
            />
            <Field label="Protetor solar">
              <Input
                {...register("uso_protetor_solar")}
                placeholder="Ex: FPS 30 diário, só na praia, não usa..."
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Detalhes sobre ácidos utilizados">
              <Input
                {...register("detalhes_acidos")}
                placeholder="Ex: Ácido retinóico 0,025% à noite, ácido glicólico 10%, etc."
              />
            </Field>
          </div>
        </Section>

        {/* --- 4. CLASSIFICAÇÕES ESTÉTICAS --- */}
        <Section title="4. Classificações Estéticas">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Fototipo de Fitzpatrick">
              <select
                {...register("fototipo")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                {FITZPATRICK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Biotipo cutâneo">
              <select
                {...register("biotipo_cutaneo")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                {BIOTIPO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Flacidez corporal (grau)">
              <select
                {...register("flacidez_corporal")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                {GRAU_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Celulite (grau)">
              <select
                {...register("celulite_grau")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                {GRAU_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* --- 5. EXPECTATIVA, PRIORIDADES, RISCO, CONSENTIMENTO --- */}
        <Section title="5. Expectativas, Prioridades e Risco">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Expectativa de resultado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Como você espera os resultados?">
              <select
                {...register("expectativa_resultado")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                <option value="discreto">Discretos e naturais</option>
                <option value="visivel_progressivo">
                  Visíveis, mas progressivos
                </option>
                <option value="rapido_intenso">Rápidos e intensos</option>
              </select>
            </Field>

            <Field label="Disposição para seguir orientações em casa">
              <select
                {...register("adesao_cuidados")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                <option value="alta">Alta (segue tudo certinho)</option>
                <option value="moderada">Moderada</option>
                <option value="baixa">Baixa (prefere só o procedimento)</option>
              </select>
            </Field>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Áreas de maior prioridade (na visão do paciente)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="1ª prioridade (mais importante)">
              <Input
                {...register("prioridade_area_1")}
                placeholder="Ex: Abdômen, papada, coxas..."
              />
            </Field>
            <Field label="2ª prioridade">
              <Input {...register("prioridade_area_2")} />
            </Field>
            <Field label="3ª prioridade">
              <Input {...register("prioridade_area_3")} />
            </Field>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Radar de risco (preenchido pelo profissional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Risco clínico geral">
              <select
                {...register("risco_geral")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                <option value="baixo">Baixo</option>
                <option value="moderado">Moderado</option>
                <option value="alto">Alto</option>
              </select>
            </Field>
            <Field label="Risco para procedimentos eletro / térmicos">
              <select
                {...register("risco_eletro")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                <option value="baixo">Baixo</option>
                <option value="moderado">Moderado</option>
                <option value="alto">Alto</option>
              </select>
            </Field>
            <Field label="Perfil de adesão esperado">
              <select
                {...register("perfil_aderencia")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="">Selecione</option>
                <option value="alto">Alto</option>
                <option value="moderado">Moderado</option>
                <option value="baixo">Baixo</option>
              </select>
            </Field>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-2">
            Consentimento de imagens
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label="Autorizo uso de fotos para acompanhamento clínico"
              {...register("consent_uso_clinico")}
            />
            <Checkbox
              label="Autorizo uso de fotos em redes sociais, sem identificação"
              {...register("consent_uso_marketing")}
            />
          </div>

          <div className="mt-6 pt-4 border-t">
            <Field
              label="Status de aptidão clínica"
              error={errors.apto_status?.message}
            >
              <select
                {...register("apto_status")}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="Apto">Apto</option>
                <option value="Apto com ressalvas">
                  Apto com ressalvas (detalhar em observações de saúde)
                </option>
                <option value="Não apto">Não apto (contraindicação)</option>
              </select>
            </Field>
            <p className="text-xs text-gray-500 mt-1">
              Definido pelo profissional após análise das informações clínicas.
            </p>
          </div>

          <div className="md:w-1/2 mt-4">
            <Field label="URL da foto de rosto (identificação)">
              <Input placeholder="Campo futuro para upload direto de imagem" />
            </Field>
            <p className="text-xs text-gray-500 mt-1">
              Fotos de antes/depois serão organizadas na galeria do paciente.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/patients")}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 inline-block" size={16} />
                  Salvando...
                </>
              ) : (
                "Salvar prontuário"
              )}
            </Button>
          </div>
        </Section>

        {/* Galeria só na edição */}
        {isEditing && id && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Galeria de resultados (Histórico)
            </h2>
            <PatientGallery patientId={id} />
          </div>
        )}
      </form>
    </div>
  );
}

// ---------------- COMPONENTES AUXILIARES ----------------

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, ...props }, ref) => (
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      ref={ref}
      {...props}
      className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
    />
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </span>
  </label>
));
Checkbox.displayName = "Checkbox";

const CheckboxGroup = ({
  name,
  label,
  options,
  control,
}: {
  name: keyof PatientFormData;
  label: string;
  options: string[];
  control: any;
}) => {
  const { field } = useController({ name, control });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentValues: string[] = field.value || [];

    if (checked) {
      field.onChange([...currentValues, value]);
    } else {
      field.onChange(currentValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="md:col-span-1">
      <h4 className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </h4>
      <div className="space-y-2 text-sm">
        {options.map((option) => (
          <div key={option} className="flex items-center">
            <input
              type="checkbox"
              value={option}
              checked={field.value?.includes(option)}
              onChange={handleChange}
              className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {option}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
