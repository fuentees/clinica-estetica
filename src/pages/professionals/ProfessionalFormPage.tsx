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
  ArrowLeft, Loader2, User, Briefcase, Mail, Phone, Palette, 
  Percent, Award, CheckCircle2, Camera, Shield, Clock, Calendar
} from "lucide-react";

// --- CONFIGURAÇÕES E CONSTANTES ---
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

// Schema de Validação
const professionalSchema = z.object({
  first_name: z.string().min(2, "Nome obrigatório"),
  last_name: z.string().min(2, "Sobrenome obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
  // O tipo 'doutor' é aceito aqui porque o banco o aceita, mas preferimos 'profissional'
  role: z.enum(["admin", "profissional", "esteticista", "recepcionista", "doutor"], {
    errorMap: () => ({ message: "Selecione um cargo válido" }),
  }),
  formacao: z.string().min(1, "Selecione a especialidade"),
  agenda_color: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  registration_number: z.string().optional(),
  
  // AVATAR URL é necessário para carregar o preview
  avatar_url: z.string().optional(),

  // CAMPOS DE DISPONIBILIDADE
  working_days: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  is_active: z.boolean().optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

export function ProfessionalFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
        role: "profissional",
        agenda_color: "#ec4899",
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
  const isMedicalStaff = ["profissional", "esteticista", "doutor"].includes(watchRole);
  const initials = (watchFirstName?.[0] || 'U').toUpperCase();

  useEffect(() => {
    if (id && id !== 'new') {
        setIsNew(false);
        loadProfessional(id);
    }
    return () => {
        if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    };
  }, [id]);

  async function loadProfessional(profId: string) {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", profId).single();
      
      if (error) {
          toast.error("Erro ao carregar dados. ID não encontrado.");
          navigate("/professionals");
      } else if (data) {
          // Ajuste de formato de hora para o campo input type="time"
          data.start_time = data.start_time?.slice(0, 5) || '09:00';
          data.end_time = data.end_time?.slice(0, 5) || '18:00';
          
          reset(data);
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setLoading(false);
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(URL.createObjectURL(file));
        // Lógica de upload real e atualização do avatar_url no banco viria aqui
    }
  };


  const onSubmit = async (data: ProfessionalFormData) => {
    setLoading(true);
    try {
        const days = data.working_days || [];
        
        const dataToSave = {
            ...data,
            working_days: days,
            // avatar_url: (URL do upload bem sucedido)
            start_time: data.start_time, 
            end_time: data.end_time,
        };

        if (isNew) {
            const { error } = await supabase.from("profiles").insert(dataToSave);
            if (error) throw error;
            toast.success("Profissional cadastrado!");
        } else {
            const { error } = await supabase.from("profiles").update(dataToSave).eq("id", id);
            if (error) throw error;
            toast.success("Dados atualizados!");
        }
        navigate("/professionals");
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast.error("Erro ao salvar: " + error.message);
    } finally {
        setLoading(false);
    }
  };
  
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;


  return (
    <div className="max-w-5xl mx-auto p-6">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate("/professionals")} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <ArrowLeft size={20} />
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isNew ? "Novo Colaborador" : `Editar ${watchFirstName || 'Profissional'}`}
                </h1>
                <p className="text-sm text-gray-500">Gerencie permissões, dados e comissões da equipe.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUNA ESQUERDA (2/3) - DADOS PRINCIPAIS */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* AVATAR E CONTATO */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><User size={16}/> Informações Básicas</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                            
                            {/* Visual Avatar UPLOAD AREA */}
                            <div className="md:col-span-1 flex flex-col items-center">
                                <div className="relative w-28 h-28 mb-2">
                                    <div className="w-full h-full rounded-full border-4 border-pink-500/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>
                                        ) : (
                                            <span className="text-4xl font-bold text-pink-600">{initials}</span>
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors">
                                        <Camera size={16}/>
                                    </label>
                                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </div>
                                <span className="text-xs text-gray-500">Máx. 5MB</span>
                            </div>

                            {/* Campos */}
                            <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome</label><Input {...register("first_name")} className="bg-gray-50 dark:bg-gray-900" placeholder="Ex: Ana" />{errors.first_name && <span className="text-xs text-red-500">{errors.first_name.message}</span>}</div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sobrenome</label><Input {...register("last_name")} className="bg-gray-50 dark:bg-gray-900" placeholder="Ex: Souza" />{errors.last_name && <span className="text-xs text-red-500">{errors.last_name.message}</span>}</div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-mail</label><div className="relative"><Mail size={16} className="absolute left-3 top-3 text-gray-400"/><Input {...register("email")} className="pl-10 bg-gray-50 dark:bg-gray-900" placeholder="ana@clinica.com" /></div></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Telefone</label><div className="relative"><Phone size={16} className="absolute left-3 top-3 text-gray-400"/><Input {...register("phone")} className="pl-10 bg-gray-50 dark:bg-gray-900" placeholder="(11) 99999-9999" /></div></div>
                                <input type="hidden" {...register("avatar_url")} /> {/* Campo oculto para salvar a URL após o upload */}
                            </div>
                        </div>
                    </div>

                    {/* DADOS PROFISSIONAIS E COMPLIANCE */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Briefcase size={16}/> Atuação e Compliance</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Cargo (Permissão)</label>
                                <select {...register("role")} className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm">
                                    <option value="profissional">Profissional / Especialista</option>
                                    <option value="esteticista">Esteticista</option>
                                    <option value="recepcionista">Recepcionista</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Especialidade</label>
                                <div className="relative">
                                    <Award size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                                    <select {...register("formacao")} className="w-full pl-10 p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm appearance-none">
                                        <option value="">Selecione...</option>
                                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {errors.formacao && <span className="text-xs text-red-500">{errors.formacao.message}</span>}
                            </div>
                            
                            {isMedicalStaff && (
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Número de Registro (CRM/CRO/COFEN)</label>
                                    <div className="relative">
                                        <Shield size={16} className="absolute left-3 top-3 text-gray-400"/>
                                        <Input {...register("registration_number")} className="pl-10 bg-gray-50 dark:bg-gray-900" placeholder="Ex: CRM/SP 123456" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA (1/3) - CONFIGURAÇÕES EXTRAS */}
                <div className="space-y-6">
                    
                    {/* CONFIGURAÇÕES DE AGENDA (HORÁRIOS E COR) */}
                    {isMedicalStaff && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Calendar size={16}/> Configurações de Agenda</h2>
                            
                            {/* DIAS DE TRABALHO */}
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1"><Clock size={12}/> Dias de Trabalho</label>
                            <div className="grid grid-cols-7 gap-1 mb-6">
                                {DAYS_OF_WEEK.map(day => (
                                    <label key={day.value} className={`relative block text-center border rounded-lg p-2 text-xs font-bold transition-colors cursor-pointer ${
                                        watch('working_days')?.includes(day.value) 
                                        ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-pink-50'
                                    }`}>
                                        <input type="checkbox" value={day.value} {...register('working_days')} className="absolute opacity-0"/>
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                            
                            {/* HORÁRIOS E COR */}
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Horário Padrão</label>
                            <div className="flex gap-4">
                                <Input type="time" {...register('start_time')} className="bg-gray-50 dark:bg-gray-900" />
                                <Input type="time" {...register('end_time')} className="bg-gray-50 dark:bg-gray-900" />
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Cor</label>
                                <input type="color" {...register("agenda_color")} className="h-8 w-8 p-1 bg-white border rounded cursor-pointer" />
                            </div>
                        </div>
                    )}

                    {/* FINANCEIRO (COMISSÃO) */}
                    {isMedicalStaff && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Percent size={16}/> Financeiro</h2>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Comissão (%)</label>
                            <div className="relative">
                                <Input type="number" {...register("commission_rate")} className="bg-gray-50 dark:bg-gray-900 pr-8 font-bold text-right" placeholder="0" step="0.1"/>
                                <span className="absolute right-3 top-2.5 text-gray-400 font-bold">%</span>
                            </div>
                        </div>
                    )}
                    
                    {/* STATUS E ARQUIVAMENTO (Soft Delete) */}
                    {!isNew && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={16}/> Status</h2>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" {...register("is_active")} className="w-5 h-5 text-red-600 rounded border-gray-300"/>
                                <span className="text-sm text-gray-700">Manter como Ativo</span>
                            </label>
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-200 dark:shadow-none transition-all">
                        {loading ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>} 
                        Salvar Cadastro
                    </Button>
                </div>
            </div>
        </form>
    </div>
  );
}