import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Loader2, User, Briefcase, Mail, Phone, 
  Percent, Award, CheckCircle2, Camera, Shield, Clock, Calendar, 
  MapPin, Upload
} from "lucide-react";

// --- CONFIGURAÇÕES ---
const DAYS_OF_WEEK = [
    { value: 'Mon', label: 'Seg' },
    { value: 'Tue', label: 'Ter' },
    { value: 'Wed', label: 'Qua' },
    { value: 'Thu', label: 'Qui' },
    { value: 'Fri', label: 'Sex' },
    { value: 'Sat', label: 'Sáb' },
    { value: 'Sun', label: 'Dom' },
];

const SPECIALTIES = [
    "Biomédica Esteta", "Dermatologista", "Esteticista Facial", "Esteticista Corporal", 
    "Enfermeira Esteta", "Cirurgião Plástico", "Fisioterapeuta Dermato", "Recepcionista", 
    "Gerente / Admin", "Outro"
];

// --- SCHEMA ---
const professionalSchema = z.object({
  first_name: z.string().min(2, "Nome obrigatório"),
  last_name: z.string().min(2, "Sobrenome obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(["admin", "profissional", "esteticista", "recepcionista", "doutor"], {
    errorMap: () => ({ message: "Selecione um cargo válido" }),
  }),
  formacao: z.string().min(1, "Selecione a especialidade"),
  registration_number: z.string().optional(),
  
  // Configs
  agenda_color: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  
  // Disponibilidade
  working_days: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  
  is_active: z.boolean().optional(),
  avatar_url: z.string().optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

export function ProfessionalFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
        role: "profissional",
        agenda_color: "#e11d48", // Rose-600 default
        commission_rate: 0,
        formacao: "",
        working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        start_time: '09:00',
        end_time: '18:00',
        is_active: true
    }
  });

  const watchRole = watch("role");
  const watchFirstName = watch("first_name");
  
  // Define quem precisa de dados médicos/agenda
  const isMedicalStaff = ["profissional", "esteticista", "doutor"].includes(watchRole);
  const initials = (watchFirstName?.[0] || 'U').toUpperCase();

  // --- CARREGAMENTO ---
  useEffect(() => {
    if (id && id !== 'new') {
        setIsNew(false);
        loadProfessional(id);
    }
    return () => {
        if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    };
  }, [id]);

  async function loadProfessional(profId: string) {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", profId).single();
      
      if (error) {
          toast.error("Profissional não encontrado.");
          navigate("/professionals");
      } else if (data) {
          // Ajuste de horários para input time
          const cleanStart = data.start_time?.slice(0, 5) || '09:00';
          const cleanEnd = data.end_time?.slice(0, 5) || '18:00';
          
          reset({ ...data, start_time: cleanStart, end_time: cleanEnd });
          
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setLoading(false);
  }
  
  // --- UPLOAD DE AVATAR (Preview) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
        
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        
        // Aqui você implementaria o upload para o Supabase Storage
        // const { data, error } = await supabase.storage.from('avatars').upload(...)
        // setValue("avatar_url", publicUrl);
        toast.success("Foto selecionada (Salvar para confirmar)");
    }
  };

  // --- SUBMIT ---
  const onSubmit = async (data: ProfessionalFormData) => {
    setLoading(true);
    try {
        const payload = {
            ...data,
            // Garante array
            working_days: data.working_days || [], 
            updated_at: new Date().toISOString(),
        };

        if (isNew) {
            // Em criação real, isso geralmente é feito via Auth SignUp + Trigger
            // Aqui estamos simulando inserção direta na tabela profiles
            const { error } = await supabase.from("profiles").insert(payload);
            if (error) throw error;
            toast.success("Colaborador cadastrado com sucesso!");
        } else {
            const { error } = await supabase.from("profiles").update(payload).eq("id", id);
            if (error) throw error;
            toast.success("Dados atualizados com sucesso!");
        }
        navigate("/professionals");
    } catch (error: any) {
        console.error("Erro:", error);
        toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-rose-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-6 font-sans">
        <div className="max-w-5xl mx-auto">
        
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/professionals")} className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {isNew ? "Novo Colaborador" : `Editar ${watchFirstName || 'Profissional'}`}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gestão de perfil, permissões e agenda.
                        </p>
                    </div>
                </div>
                
                {!isNew && (
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-rose-100 dark:border-rose-900/30">
                        <Shield size={14} />
                        {watchRole.toUpperCase()}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* --- COLUNA ESQUERDA (PRINCIPAL) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* CARD 1: PERFIL */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-400"></div>
                            
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <User size={16} className="text-rose-500"/> Informações Pessoais
                            </h2>
                            
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* ÁREA DO AVATAR */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>
                                            ) : (
                                                <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">{initials}</span>
                                            )}
                                        </div>
                                        
                                        <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 w-10 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-110 z-10 border-2 border-white dark:border-gray-800">
                                            <Camera size={18}/>
                                        </label>
                                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </div>
                                    <p className="text-xs text-gray-400 text-center">Recomendado:<br/>JPG/PNG (Máx 5MB)</p>
                                </div>

                                {/* INPUTS PESSOAIS */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Nome</label>
                                        <Input {...register("first_name")} className="bg-gray-50/50 dark:bg-gray-900 focus:bg-white transition-colors" placeholder="Ex: Ana" />
                                        {errors.first_name && <span className="text-xs text-red-500">{errors.first_name.message}</span>}
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Sobrenome</label>
                                        <Input {...register("last_name")} className="bg-gray-50/50 dark:bg-gray-900 focus:bg-white transition-colors" placeholder="Ex: Silva" />
                                        {errors.last_name && <span className="text-xs text-red-500">{errors.last_name.message}</span>}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">E-mail Corporativo</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                                            <Input {...register("email")} className="pl-10 bg-gray-50/50 dark:bg-gray-900 focus:bg-white transition-colors" placeholder="nome@clinica.com" />
                                        </div>
                                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">WhatsApp / Celular</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-3 text-gray-400"/>
                                            <Input {...register("phone")} className="pl-10 bg-gray-50/50 dark:bg-gray-900 focus:bg-white transition-colors" placeholder="(00) 00000-0000" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: DADOS PROFISSIONAIS */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Briefcase size={16} className="text-rose-500"/> Dados da Função
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Cargo / Permissão</label>
                                    <div className="relative">
                                        <select {...register("role")} className="w-full p-2.5 pl-3 border rounded-xl bg-gray-50/50 dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm appearance-none">
                                            <option value="profissional">Profissional / Especialista</option>
                                            <option value="esteticista">Esteticista</option>
                                            <option value="recepcionista">Recepcionista</option>
                                            <option value="admin">Administrador do Sistema</option>
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Especialidade Principal</label>
                                    <div className="relative">
                                        <Award size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                                        <select {...register("formacao")} className="w-full pl-10 p-2.5 border rounded-xl bg-gray-50/50 dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm appearance-none">
                                            <option value="">Selecione a área...</option>
                                            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                    {errors.formacao && <span className="text-xs text-red-500">{errors.formacao.message}</span>}
                                </div>
                                
                                {isMedicalStaff && (
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Registro Profissional (CRM/COFEN/Biomed)</label>
                                        <div className="relative">
                                            <Shield size={16} className="absolute left-3 top-3 text-gray-400"/>
                                            <Input {...register("registration_number")} className="pl-10 bg-gray-50/50 dark:bg-gray-900" placeholder="Ex: 123456-SP" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- COLUNA DIREITA (CONFIGURAÇÕES) --- */}
                    <div className="space-y-6">
                        
                        {/* CARD AGENDA */}
                        {isMedicalStaff && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Calendar size={16} className="text-rose-500"/> Agenda & Horários
                                </h2>
                                
                                {/* DIAS */}
                                <div className="space-y-2 mb-6">
                                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                                        <Clock size={12}/> Dias de Atendimento
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map(day => {
                                            const isSelected = watch('working_days')?.includes(day.value);
                                            return (
                                                <label key={day.value} className={`
                                                    cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition-all border
                                                    ${isSelected 
                                                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 dark:shadow-none' 
                                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-rose-300'
                                                    }
                                                `}>
                                                    <input type="checkbox" value={day.value} {...register('working_days')} className="hidden"/>
                                                    {day.label}
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                                
                                {/* HORÁRIOS */}
                                <div className="space-y-2 mb-6">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Horário Padrão</label>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <Input type="time" {...register('start_time')} className="bg-transparent border-none shadow-none text-center h-8 focus:ring-0" />
                                        <span className="text-gray-400 font-bold">-</span>
                                        <Input type="time" {...register('end_time')} className="bg-transparent border-none shadow-none text-center h-8 focus:ring-0" />
                                    </div>
                                </div>

                                {/* COR DA AGENDA */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Cor na Agenda</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative overflow-hidden w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                            <input type="color" {...register("agenda_color")} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0" />
                                        </div>
                                        <span className="text-sm text-gray-500">Clique para escolher</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CARD FINANCEIRO */}
                        {isMedicalStaff && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Percent size={16} className="text-rose-500"/> Financeiro
                                </h2>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Comissão (%)</label>
                                    <div className="relative">
                                        <Input type="number" {...register("commission_rate")} className="bg-gray-50/50 dark:bg-gray-900 pr-8 font-bold text-right" placeholder="0" step="0.5"/>
                                        <span className="absolute right-3 top-2.5 text-gray-400 font-bold">%</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Aplicado sobre o valor líquido dos procedimentos.</p>
                                </div>
                            </div>
                        )}
                        
                        {/* STATUS E AÇÕES */}
                        <div className="space-y-4">
                            {!isNew && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Ativo</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" {...register("is_active")} className="sr-only peer"/>
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 dark:peer-focus:ring-rose-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-600"></div>
                                    </label>
                                </div>
                            )}

                            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02]">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>} 
                                {isNew ? "Finalizar Cadastro" : "Salvar Alterações"}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
}