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

  // D. Anamnese Estética (Arrays)
  queixa_principal: z.array(z.string()).optional(),
  objetivo_paciente: z.string().optional(),
  tabagismo: z.boolean().optional(),
  consumo_alcool: z.string().optional(),
  exposicao_solar: z.string().optional(),
  uso_isotretinoina: z.boolean().optional(),

  // E. Classificações Estéticas (Novos Campos)
  fototipo: z.enum(FITZPATRICK_OPTIONS as [string, ...string[]]).optional(),
  biotipo_cutaneo: z.enum(BIOTIPO_OPTIONS as [string, ...string[]]).optional(),
  flacidez_corporal: z.enum(GRAU_OPTIONS as [string, ...string[]]).optional(),
  celulite_grau: z.enum(GRAU_OPTIONS as [string, ...string[]]).optional(),

  // Texto livre
  observacoes_saude: z.string().optional(),
  cirurgias_previas: z.string().optional(),

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

      // Dados específicos do paciente
      setValue("cpf", data.cpf);
      setValue("rg", data.rg ?? "");
      setValue("date_of_birth", data.date_of_birth);
      setValue("address", data.address ?? "");
      setValue("profissao", data.profissao ?? "");
      setValue("sexo", data.sexo ?? "");

      setValue("gestante", data.gestante ?? false);
      setValue("lactante", data.lactante ?? false);
      setValue("uso_anticoncepcional", data.uso_anticoncepcional ?? false);
      setValue("historico_queloide", data.historico_queloide ?? false);
      setValue("uso_isotretinoina", data.uso_isotretinoina ?? false);

      setValue("apto_status", data.apto_status ?? "Apto");
      setValue("observacoes_saude", data.observacoes_saude ?? "");
      setValue("cirurgias_previas", data.cirurgias_previas ?? "");

      // Classificações estéticas
      setValue("fototipo", data.fototipo ?? undefined);
      setValue("biotipo_cutaneo", data.biotipo_cutaneo ?? undefined);
      setValue("flacidez_corporal", data.flacidez_corporal ?? undefined);
      setValue("celulite_grau", data.celulite_grau ?? undefined);

      // Arrays vindos como strings no banco
      setValue("doencas_cronicas", stringToArray(data.doencas_cronicas));
      setValue(
        "alergias_medicamentosas",
        stringToArray(data.alergias_medicamentosas)
      );
      setValue("queixa_principal", stringToArray(data.queixa_principal));

      setValue("consumo_alcool", data.consumo_alcool ?? "");
      setValue("exposicao_solar", data.exposicao_solar ?? "");
      setValue("objetivo_paciente", data.objetivo_paciente ?? "");
      setValue("tabagismo", data.tabagismo ?? false);
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

            {/* Idade calculada */}
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
        <Section title="2. Anamnese de Saúde Geral">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <Checkbox
              label="Histórico de queloide?"
              {...register("historico_queloide")}
            />
            <Checkbox
              label="Uso de anticoncepcional/DIU?"
              {...register("uso_anticoncepcional")}
            />
            <Checkbox label="Gestante?" {...register("gestante")} />
            <Checkbox label="Lactante?" {...register("lactante")} />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações de saúde (texto livre)
            </label>
            <textarea
              {...register("observacoes_saude")}
              placeholder="Condições de saúde relevantes, comorbidades, medicamentos em uso..."
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24 resize-none"
              rows={4}
            />
          </div>
        </Section>

        {/* --- 3. ANAMNESE ESTÉTICA E HÁBITOS --- */}
        <Section title="3. Anamnese Estética e Hábitos">
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
              <Field label="Objetivo específico">
                <Input
                  {...register("objetivo_paciente")}
                  placeholder="Ex: Reduzir 5 cm na cintura"
                />
              </Field>
              <Field label="Procedimentos já realizados">
                <Input
                  {...register("consumo_alcool")}
                  placeholder="Ex: Toxina, preenchimento, peelings..."
                />
              </Field>
            </div>
          </div>

          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-6">
            Hábitos e fatores de risco
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t items-end">
            <Checkbox label="Tabagismo?" {...register("tabagismo")} />
            <Field label="Consumo de álcool">
              <Input
                {...register("consumo_alcool")}
                placeholder="Ex: Socialmente, diariamente"
              />
            </Field>
            <Checkbox
              label="Uso de isotretinoína (Roacutan)?"
              {...register("uso_isotretinoina")}
            />
            <Field label="Exposição solar">
              <Input
                {...register("exposicao_solar")}
                placeholder="Ex: Diária, não usa protetor"
              />
            </Field>
          </div>
        </Section>

        {/* --- 4. CLASSIFICAÇÕES ESTÉTICAS --- */}
        <Section title="4. Classificações estéticas">
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

        {/* --- 5. FINALIZAÇÃO E STATUS --- */}
        <Section title="5. Finalização e documentação">
          <div className="mt-2">
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
                  Apto com ressalvas (detalhar nas observações)
                </option>
                <option value="Não apto">Não apto (contraindicação)</option>
              </select>
            </Field>
            <p className="text-xs text-gray-500 mt-1">
              Definido pelo profissional após avaliação clínica.
            </p>
          </div>

          <div className="md:w-1/2 mt-4">
            <Field label="URL foto rosto (identificação)">
              <Input placeholder="Campo futuro para upload de imagem de rosto" />
            </Field>
            <p className="text-xs text-gray-500 mt-1">
              Fotos de antes/depois são salvas na galeria do paciente.
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
