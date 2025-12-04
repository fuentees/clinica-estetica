import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import React from "react";

// Schema APENAS para Dados Cadastrais
const patientSchema = z.object({
  // Identificação
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  date_of_birth: z.string().min(1, "Data de nascimento é obrigatória"),
  sexo: z.string().optional(),
  profissao: z.string().optional(),
  estado_civil: z.string().optional(),

  // Contato
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  phone: z.string().min(1, "Telefone é obrigatório"),
  
  // Endereço
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  address: z.string().optional(), // Mantido para compatibilidade com banco
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  // Monitora data para calcular idade
  const dateOfBirth = watch('date_of_birth');
  
  const calculateAge = (dateString: string) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return isNaN(age) ? '' : age;
  };

  const patientAge = calculateAge(dateOfBirth);

  // Busca de CEP
  const checkCEP = async (e: any) => {
      const cep = e.target.value.replace(/\D/g, '');
      if (cep.length !== 8) return;

      setCepLoading(true);
      try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          
          if (!data.erro) {
              setValue('rua', data.logradouro);
              setValue('bairro', data.bairro);
              setValue('cidade', data.localidade);
              setValue('estado', data.uf);
              document.getElementById('numero-input')?.focus();
              toast.success("Endereço encontrado!");
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
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileId(data.profile_id);
        
        // Perfil
        if (data.profiles) {
            // @ts-ignore
            setValue('first_name', data.profiles.first_name);
            // @ts-ignore
            setValue('last_name', data.profiles.last_name);
            // @ts-ignore
            setValue('email', data.profiles.email || '');
            // @ts-ignore
            setValue('phone', data.profiles.phone || '');
        }
        
        // Dados Gerais
        setValue('cpf', data.cpf);
        setValue('rg', data.rg || '');
        setValue('date_of_birth', data.date_of_birth);
        setValue('profissao', data.profissao || '');
        setValue('sexo', data.sexo || '');
        
        // Endereço (Tenta carregar no campo genérico se os específicos estiverem vazios)
        setValue('rua', data.address || '');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setIsLoadingData(false);
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    try {
      const ageCalc = data.date_of_birth ? calculateAge(data.date_of_birth) : null;
      const ageInt = typeof ageCalc === 'number' ? ageCalc : null;

      // Junta endereço para salvar no campo único do banco
      const fullAddress = `${data.rua || ''}, ${data.numero || ''} - ${data.bairro || ''}, ${data.cidade || ''} - ${data.estado || ''}, CEP: ${data.cep || ''}`;

      const patientDataToSave = {
        cpf: data.cpf,
        rg: data.rg,
        date_of_birth: data.date_of_birth,
        idade: ageInt,
        address: fullAddress,
        profissao: data.profissao,
        sexo: data.sexo,
      };

      if (isEditing) {
        if (profileId) {
            await supabase.from('profiles').update({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
            }).eq('id', profileId);
        }

        const { error } = await supabase.from("patients").update(patientDataToSave).eq("id", id);
        if (error) throw error;
        toast.success("Cadastro atualizado!");

      } else {
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

        const { error: patientError } = await supabase
          .from("patients")
          .insert({
            profile_id: newProfile.id,
            ...patientDataToSave
          });

        if (patientError) throw patientError;
        toast.success("Paciente cadastrado!");
        navigate("/patients");
      }
      
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(`Erro ao salvar: ${error.message || 'Falha desconhecida'}`);
    }
  };

  if (isLoadingData) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
           <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isEditing ? "Dados Cadastrais" : "Novo Paciente"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* 1. DADOS PESSOAIS */}
        <Section title="Identificação Pessoal">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InputWithLabel label="Nome" {...register("first_name")} error={errors.first_name?.message} />
                <InputWithLabel label="Sobrenome" {...register("last_name")} error={errors.last_name?.message} />
                <InputWithLabel label="CPF" {...register("cpf")} error={errors.cpf?.message} />
                <InputWithLabel label="RG" {...register("rg")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                <InputWithLabel label="Data de Nascimento" type="date" {...register("date_of_birth")} error={errors.date_of_birth?.message} />
                
                {/* IDADE CALCULADA */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idade</label>
                     <div className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 h-[38px] flex items-center">
                        {patientAge ? `${patientAge} anos` : '-'}
                     </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
                    <select {...register("sexo")} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white h-[38px]">
                        <option value="">Selecione</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
                
                <InputWithLabel label="Profissão" {...register("profissao")} />
            </div>
        </Section>

        {/* 2. CONTATO E ENDEREÇO */}
        <Section title="Endereço e Contato">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <InputWithLabel label="Telefone/WhatsApp" {...register("phone")} error={errors.phone?.message} />
                <InputWithLabel label="Email" type="email" {...register("email")} error={errors.email?.message} />
                
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                    <div className="relative">
                        <Input {...register("cep")} onBlur={checkCEP} placeholder="00000-000" />
                        {cepLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="md:col-span-2">
                    <InputWithLabel label="Rua / Logradouro" {...register("rua")} />
                 </div>
                 <div className="md:col-span-1">
                    <InputWithLabel label="Número" id="numero-input" {...register("numero")} />
                 </div>
                 <div className="md:col-span-1">
                    <InputWithLabel label="Bairro" {...register("bairro")} />
                 </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                 <InputWithLabel label="Cidade" {...register("cidade")} />
                 <InputWithLabel label="Estado (UF)" {...register("estado")} />
                 <input type="hidden" {...register("address")} />
            </div>
        </Section>

        <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700 mt-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/patients")}>Voltar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white px-8">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Salvar Cadastro"}
            </Button>
        </div>

      </form>
    </div>
  );
}

// --- COMPONENTES VISUAIS AUXILIARES ---

const InputWithLabel = React.forwardRef(({ label, error, ...props }: any, ref) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <Input {...props} ref={ref} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
));

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pl-2">{title}</h2>
        {children}
    </div>
);