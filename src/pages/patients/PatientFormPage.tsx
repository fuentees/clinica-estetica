import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, User, MapPin } from "lucide-react";

// =========================================
// SCHEMA DE VALIDAÇÃO
// =========================================
const patientSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  cpf: z.string().optional().or(z.literal("")), 
  rg: z.string().optional(),
  date_of_birth: z.string().min(1, "Data de nascimento é obrigatória"),
  sexo: z.string().optional(),
  profissao: z.string().optional(),
  estado_civil: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  address: z.string().optional(), 
});

type PatientFormData = z.infer<typeof patientSchema>;

// =========================================
// HELPERS DE MÁSCARA
// =========================================
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");
};

const maskCEP = (value: string) => {
  return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");
};

// =========================================
// COMPONENTE PRINCIPAL
// =========================================
export function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const dateOfBirth = watch("date_of_birth");

  const calculateAge = (dateString: string) => {
    if (!dateString) return "";
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return isNaN(age) ? "" : age;
  };
  
  const patientAge = calculateAge(dateOfBirth);

  const checkCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue("rua", data.logradouro);
        setValue("bairro", data.bairro);
        setValue("cidade", data.localidade);
        setValue("estado", data.uf);
        setFocus("numero"); 
        toast.success("Endereço localizado!");
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  useEffect(() => {
    if (isEditing && id) {
      fetchPatientData();
    }
  }, [id, isEditing]);

  async function fetchPatientData() {
    try {
      setIsLoadingData(true);
      const { data, error } = await supabase
        .from("patients")
        .select("*") 
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        if (data.name) {
             const parts = data.name.split(' ');
             setValue("first_name", parts[0] || "");
             setValue("last_name", parts.slice(1).join(' ') || "");
        }
        setValue("cpf", data.cpf || "");
        setValue("rg", data.rg || "");
        setValue("email", data.email || "");
        setValue("phone", data.phone || data.telefone || "");
        setValue("date_of_birth", data.date_of_birth || "");
        setValue("profissao", data.profissao || "");
        setValue("sexo", data.sexo || "");
        setValue("cep", data.cep || "");
        setValue("rua", data.rua || "");
        setValue("numero", data.numero || "");
        setValue("bairro", data.bairro || "");
        setValue("cidade", data.cidade || "");
        setValue("estado", data.estado || "");

        if (!data.rua && data.address) {
            setValue("rua", data.address); 
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar dados do paciente.");
    } finally {
      setIsLoadingData(false);
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    try {
      const ageCalc = data.date_of_birth ? calculateAge(data.date_of_birth) : null;
      const ageInt = typeof ageCalc === "number" ? ageCalc : null;
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      const fullAddress = `${data.rua || ""}, ${data.numero || ""} - ${data.bairro || ""}, ${data.cidade || ""} - ${data.estado || ""}, CEP: ${data.cep || ""}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Busca o clinicId corretamente (usando aspas se necessário no select, mas aqui no insert usamos o objeto)
      const { data: profile } = await supabase
        .from("profiles")
        .select(`"clinicId"`) // Aspas duplas caso o banco esteja sensível
        .eq("id", user.id)
        .single();

      // Ajuste para ler clinicId independente do formato (camel ou snake)
      const userClinicId = profile?.clinicId || (profile as any)?.clinic_id;

      if (!userClinicId) {
        throw new Error("Usuário sem clínica vinculada.");
      }

      const patientDataToSave = {
        clinicId: userClinicId, // ID da clínica garantido
        name: fullName, 
        email: data.email || null,
        phone: data.phone,
        cpf: data.cpf,
        rg: data.rg,
        date_of_birth: data.date_of_birth,
        idade: ageInt,
        profissao: data.profissao,
        sexo: data.sexo,
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        address: fullAddress,
        // REMOVIDO: updatedAt: new Date().toISOString(), <-- ISSO CAUSAVA O ERRO
      };

      if (isEditing) {
        const { error } = await supabase.from("patients").update(patientDataToSave).eq("id", id);
        if (error) throw error;
        toast.success("Cadastro atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("patients").insert(patientDataToSave);
        if (error) throw error;
        toast.success("Paciente cadastrado com sucesso!");
        navigate("/patients");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro: ${error.message || "Falha ao salvar"}`);
    }
  };

  if (isLoadingData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
        <Loader2 className="animate-spin text-pink-600" size={40}/>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Buscando dados...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-10 bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/patients")} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl text-gray-400 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
              {isEditing ? "Editar Cadastro" : "Novo Paciente"}
            </h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestão de prontuário e ficha cadastral</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <Section title="Identificação Pessoal" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InputWithLabel label="Primeiro Nome" {...register("first_name")} error={errors.first_name?.message} placeholder="Ex: Maria" />
            <InputWithLabel label="Sobrenome" {...register("last_name")} error={errors.last_name?.message} placeholder="Ex: Silva" />
            
            <InputWithLabel 
              label="CPF" 
              {...register("cpf")} 
              onChange={(e) => setValue("cpf", maskCPF(e.target.value))} 
              maxLength={14} 
              placeholder="000.000.000-00" 
            />

            <InputWithLabel label="RG" {...register("rg")} maxLength={20} placeholder="Digite o RG" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <InputWithLabel label="Nascimento" type="date" {...register("date_of_birth")} error={errors.date_of_birth?.message} />
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Idade</label>
              <div className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 flex items-center font-bold italic">
                {patientAge ? `${patientAge} anos` : "---"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gênero</label>
              <select {...register("sexo")} className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-bold transition-all">
                <option value="">Selecione</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <InputWithLabel label="Profissão" {...register("profissao")} placeholder="Ex: Arquiteta" />
          </div>
        </Section>

        <Section title="Localização e Contato" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputWithLabel 
              label="Telefone / WhatsApp" 
              {...register("phone")} 
              onChange={(e) => setValue("phone", maskPhone(e.target.value))} 
              maxLength={15} 
              placeholder="(00) 00000-0000" 
            />
            <InputWithLabel label="E-mail" type="email" {...register("email")} error={errors.email?.message} placeholder="exemplo@email.com" />
            
            <div className="relative">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CEP</label>
              <div className="relative">
                <Input 
                    {...register("cep")} 
                    onChange={(e) => setValue("cep", maskCEP(e.target.value))} 
                    onBlur={checkCEP} 
                    maxLength={9} 
                    placeholder="00000-000"
                    className="h-11 rounded-xl pr-10 font-bold"
                />
                {cepLoading && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-pink-500" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
            <div className="md:col-span-7">
              <InputWithLabel label="Rua / Logradouro" {...register("rua")} placeholder="Nome da rua..." />
            </div>
            <div className="md:col-span-2">
              <InputWithLabel label="Nº" {...register("numero")} placeholder="123" />
            </div>
            <div className="md:col-span-3">
              <InputWithLabel label="Bairro" {...register("bairro")} placeholder="Ex: Centro" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <InputWithLabel label="Cidade" {...register("cidade")} placeholder="Ex: São Paulo" />
            <InputWithLabel label="Estado (UF)" {...register("estado")} placeholder="Ex: SP" />
          </div>
        </Section>

        <div className="flex justify-end gap-4 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl">
          <Button type="button" variant="outline" onClick={() => navigate("/patients")} className="h-14 px-8 rounded-2xl font-bold">
            Descartar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="h-14 px-12 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02]">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// =========================================
// SUB-COMPONENTES
// =========================================
interface InputWithLabelProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputWithLabel = React.forwardRef<HTMLInputElement, InputWithLabelProps>(
  ({ label, error, ...props }, ref) => (
    <div className="w-full">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
      <Input 
        {...props} 
        ref={ref} 
        className={`h-11 rounded-xl font-bold bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-pink-500 transition-all ${error ? 'border-red-500 ring-red-100' : ''}`} 
      />
      {error && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1">{error}</p>}
    </div>
  )
);
InputWithLabel.displayName = "InputWithLabel";

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500 transition-all group-hover:w-2"></div>
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-xl">
        <Icon size={22} />
      </div>
      <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{title}</h2>
    </div>
    {children}
  </div>
);