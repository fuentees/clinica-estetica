import { useEffect, useState, useRef } from "react";
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
  PenTool, Eraser, Sparkles
} from "lucide-react";

// --- CONFIGURAÇÕES ---
const DAYS_OF_WEEK = [
    { value: 'Mon', label: 'Seg' }, { value: 'Tue', label: 'Ter' },
    { value: 'Wed', label: 'Qua' }, { value: 'Thu', label: 'Qui' },
    { value: 'Fri', label: 'Sex' }, { value: 'Sat', label: 'Sáb' },
    { value: 'Sun', label: 'Dom' },
];

const SPECIALTIES = [
    "Biomédica Esteta", "Dermatologista", "Esteticista", "Enfermeira Esteta", 
    "Cirurgião Plástico", "Fisioterapeuta Dermato", "Outro"
];

const COUNCIL_MAP: Record<string, string> = {
    "Biomédica Esteta": "CRBM",
    "Dermatologista": "CRM",
    "Cirurgião Plástico": "CRM",
    "Enfermeira Esteta": "COREN",
    "Fisioterapeuta Dermato": "CREFITO",
    "Esteticista": "Registro/MEI",
    "Outro": "Registro Profissional"
};

const isValidUUID = (uuid: string | undefined) => {
    if (!uuid) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

// --- SCHEMA ---
const professionalSchema = z.object({
  first_name: z.string().min(2, "Nome obrigatório"),
  last_name: z.string().min(2, "Sobrenome obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(["admin", "profissional", "recepcionista"]),
  formacao: z.string().optional(),
  registration_number: z.string().optional(),
  agenda_color: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  working_days: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  is_active: z.boolean().optional(),
  avatar_url: z.string().optional(),
  signature_data: z.string().optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

const defaultValues: Partial<ProfessionalFormData> = {
    role: "profissional",
    agenda_color: "#db2777", // Pink padrão
    commission_rate: 0,
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    start_time: '09:00',
    end_time: '18:00',
    is_active: true
};

export function ProfessionalFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Refs Assinatura
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues
  });

  const watchRole = watch("role");
  const watchFirstName = watch("first_name");
  const watchFormacao = watch("formacao");
  const isMedicalStaff = watchRole === "profissional"; 
  const councilLabel = watchFormacao ? (COUNCIL_MAP[watchFormacao] || "Registro") : "Especialidade";
  const initials = (watchFirstName?.[0] || 'U').toUpperCase();

  // --- CARREGAMENTO ---
  useEffect(() => {
    if (!isValidUUID(id)) {
        setIsNew(true);
        reset(defaultValues); 
        return; 
    }
    setIsNew(false);
    loadProfessional(id!);
  }, [id, reset]);

  async function loadProfessional(profId: string) {
      if (!isValidUUID(profId)) return;
      setLoading(true);
      try {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", profId).single();
          if (error) {
              if (error.code !== 'PGRST116') toast.error("Erro ao buscar.");
              navigate("/professionals");
          } else if (data) {
              const cleanStart = data.start_time?.slice(0, 5) || '09:00';
              const cleanEnd = data.end_time?.slice(0, 5) || '18:00';
              reset({ ...data, start_time: cleanStart, end_time: cleanEnd });
              if (data.avatar_url) setAvatarPreview(data.avatar_url);
              if (data.signature_data) setSignaturePreview(data.signature_data);
          }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
  }
  
  // --- ASSINATURA ---
  const startDrawing = (e: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
      ctx.lineTo(x, y);
      ctx.stroke();
  };

  const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
          const dataUrl = canvas.toDataURL("image/png");
          setValue("signature_data", dataUrl);
      }
  };

  const clearSignature = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          setValue("signature_data", "");
          setSignaturePreview(null);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
    }
  };

  const onSubmit = async (data: ProfessionalFormData) => {
    setLoading(true);
    try {
        const payload = {
            ...data,
            working_days: data.working_days || [], 
            updated_at: new Date().toISOString(),
        };
        if (isNew) {
            const { error } = await supabase.from("profiles").insert(payload);
            if (error) throw error;
            toast.success("Profissional cadastrado!");
        } else {
            const { error } = await supabase.from("profiles").update(payload).eq("id", id);
            if (error) throw error;
            toast.success("Dados atualizados!");
        }
        navigate("/professionals");
    } catch (error: any) {
        toast.error(`Erro: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  // --- ESTILOS COMPARTILHADOS (Baseado no Layout.tsx) ---
  const inputClassName = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm";
  const labelClassName = "text-xs font-bold text-gray-500 uppercase mb-1.5 block";
  const cardClassName = "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden";

  return (
    <div className="font-sans">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/professionals")} className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        {isNew ? "Novo Colaborador" : `Editar: ${watchFirstName}`}
                        {isNew && <Sparkles size={18} className="text-pink-500 animate-pulse" />}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestão completa de perfil e permissões.
                    </p>
                </div>
            </div>
            
            {!isNew && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 text-pink-700 dark:text-pink-300 px-4 py-2 rounded-xl text-sm font-bold border border-pink-100 dark:border-gray-700 shadow-sm">
                    <Shield size={16} />
                    {watchRole.toUpperCase()}
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. DADOS PESSOAIS */}
                    <div className={cardClassName}>
                        {/* Detalhe de gradiente no topo do card (igual menu ativo) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-purple-600"></div>
                        
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <User size={18} className="text-pink-600"/> Informações Pessoais
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-600 shadow-lg">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 border-4 border-transparent flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>
                                        ) : (
                                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-tr from-pink-600 to-purple-600">
                                                {initials}
                                            </span>
                                        )}
                                    </div>
                                    <label className="absolute bottom-1 right-1 w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 z-10 border-2 border-white dark:border-gray-800">
                                        <Camera size={18}/>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                                <span className="text-xs font-medium text-gray-400">JPG ou PNG (Max 5MB)</span>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClassName}>Nome</label>
                                    <Input {...register("first_name")} className={inputClassName.replace('pl-10', 'pl-4')} placeholder="Ex: Ana" />
                                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                                </div>
                                <div>
                                    <label className={labelClassName}>Sobrenome</label>
                                    <Input {...register("last_name")} className={inputClassName.replace('pl-10', 'pl-4')} placeholder="Ex: Silva" />
                                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className={labelClassName}>Email de Login</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-3 text-gray-400"/>
                                        <Input {...register("email")} className={inputClassName} placeholder="nome@clinica.com" />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className={labelClassName}>WhatsApp / Celular</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-3 top-3 text-gray-400"/>
                                        <Input {...register("phone")} className={inputClassName} placeholder="(00) 00000-0000" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. DADOS DA FUNÇÃO */}
                    <div className={cardClassName}>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Briefcase size={18} className="text-purple-600"/> Atuação Profissional
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClassName}>Cargo no Sistema</label>
                                <div className="relative">
                                    <select {...register("role")} className={inputClassName.replace('pl-10', 'pl-4')}>
                                        <option value="profissional">Profissional / Especialista</option>
                                        <option value="recepcionista">Recepcionista</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            {isMedicalStaff && (
                                <>
                                    <div>
                                        <label className={labelClassName}>Especialidade</label>
                                        <div className="relative">
                                            <Award size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                                            <select {...register("formacao")} className={inputClassName}>
                                                <option value="">Selecione...</option>
                                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className={labelClassName}>
                                            NÚMERO <span className="text-pink-600">{councilLabel}</span>
                                        </label>
                                        <div className="relative">
                                            <Shield size={18} className="absolute left-3 top-3 text-gray-400"/>
                                            <Input {...register("registration_number")} className={inputClassName} placeholder="Digite o número do registro" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. ASSINATURA DIGITAL */}
                    {isMedicalStaff && (
                        <div className={cardClassName}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <PenTool size={18} className="text-pink-600"/> Assinatura Digital
                                </h2>
                                <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="text-xs hover:bg-gray-50 border-gray-200 text-gray-500">
                                    <Eraser size={14} className="mr-1"/> Limpar
                                </Button>
                            </div>
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900 flex justify-center overflow-hidden relative h-40 w-full hover:border-pink-300 transition-colors" style={{ touchAction: 'none' }}>
                                {signaturePreview && !isDrawing ? (
                                    <img src={signaturePreview} alt="Assinatura" className="h-full object-contain p-2" />
                                ) : (
                                    <canvas
                                        ref={canvasRef}
                                        width={600} height={160}
                                        className="w-full h-full cursor-crosshair"
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                    />
                                )}
                                {!signaturePreview && !isDrawing && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300 pointer-events-none text-sm font-bold opacity-50 tracking-widest uppercase">Assine Aqui</span>}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- COLUNA DIREITA (CONFIGURAÇÕES) --- */}
                <div className="space-y-6">
                    
                    {isMedicalStaff && (
                        <div className={cardClassName}>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Calendar size={18} className="text-purple-600"/> Agenda & Horários
                            </h2>
                            
                            <div className="space-y-2 mb-6">
                                <label className={labelClassName}>
                                    <Clock size={12} className="inline mr-1"/> Dias de Atendimento
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => {
                                        const isSelected = watch('working_days')?.includes(day.value);
                                        return (
                                            <label key={day.value} className={`
                                                cursor-pointer rounded-xl px-3 py-2 text-xs font-bold transition-all border shadow-sm
                                                ${isSelected 
                                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-pink-500/20' 
                                                    : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                                }
                                            `}>
                                                <input type="checkbox" value={day.value} {...register('working_days')} className="hidden"/>
                                                {day.label}
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            <div className="space-y-2 mb-6">
                                <label className={labelClassName}>Horário Padrão</label>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <Input type="time" {...register('start_time')} className="bg-transparent border-none shadow-none text-center h-8 focus:ring-0" />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <Input type="time" {...register('end_time')} className="bg-transparent border-none shadow-none text-center h-8 focus:ring-0" />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className={labelClassName}>Cor na Agenda</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative overflow-hidden w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-sm ring-2 ring-offset-2 ring-transparent hover:ring-pink-200 transition-all">
                                        <input type="color" {...register("agenda_color")} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0" />
                                    </div>
                                    <span className="text-xs text-gray-500">Toque para alterar cor</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <label className={labelClassName}>
                                    <Percent size={14} className="inline mr-1"/> Comissão (%)
                                </label>
                                <Input type="number" {...register("commission_rate")} className={`${inputClassName} font-bold text-purple-600`} />
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {!isNew && (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Status Ativo</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register("is_active")} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-200 dark:peer-focus:ring-pink-900 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-pink-600 peer-checked:to-purple-600"></div>
                                </label>
                            </div>
                        )}
                        
                        {/* BOTÃO PRINCIPAL COM GRADIENTE DO LAYOUT */}
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg hover:shadow-pink-500/30 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 size={20}/>} 
                            {isNew ? "FINALIZAR CADASTRO" : "SALVAR ALTERAÇÕES"}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}