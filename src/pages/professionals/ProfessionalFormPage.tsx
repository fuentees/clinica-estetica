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
    agenda_color: "#db2777",
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
      setLoading(true);
      try {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", profId).single();
          if (error) {
              if (error.code !== 'PGRST116') toast.error("Erro ao buscar profissional.");
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
        toast.error(`Erro ao salvar: ${error.message}`);
    }
  };
  
  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando Perfil...</p>
    </div>
  );

  const inputClassName = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm";
  const labelClassName = "text-xs font-bold text-gray-500 uppercase mb-1.5 block";
  const cardClassName = "bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden";

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-6">
                <Button variant="ghost" onClick={() => navigate("/professionals")} className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 rounded-2xl h-14 w-14 p-0 shadow-inner transition-all">
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
                        {isNew ? "Novo Colaborador" : `Perfil: ${watchFirstName}`}
                        {isNew && <Sparkles size={24} className="text-pink-500 animate-pulse" />}
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Configurações de Acesso e Registro Clínico</p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* COLUNA ESQUERDA (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    <div className={cardClassName}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-purple-600"></div>
                        <h2 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                            <User size={18} className="text-pink-600"/> Dados Cadastrais
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group w-36 h-36 rounded-[2.5rem] p-1 bg-gradient-to-tr from-pink-500 to-purple-600 shadow-xl">
                                    <div className="w-full h-full rounded-[2.2rem] bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-800 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[0.98]">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>
                                        ) : (
                                            <span className="text-5xl font-black text-pink-600 italic uppercase">
                                                {initials}
                                            </span>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 transition-all border-4 border-white dark:border-gray-800">
                                        <Camera size={20}/>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Foto de Perfil</span>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className={labelClassName}>Nome</label>
                                    <Input {...register("first_name")} className="h-12 rounded-xl font-bold bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500" placeholder="Ana" />
                                    {errors.first_name && <p className="text-rose-500 text-[10px] font-bold uppercase mt-1">{errors.first_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className={labelClassName}>Sobrenome</label>
                                    <Input {...register("last_name")} className="h-12 rounded-xl font-bold bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500" placeholder="Silva" />
                                    {errors.last_name && <p className="text-rose-500 text-[10px] font-bold uppercase mt-1">{errors.last_name.message}</p>}
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className={labelClassName}>Email Corporativo</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-4 top-3.5 text-gray-400"/>
                                        <Input {...register("email")} className="h-12 pl-12 rounded-xl font-bold bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500" placeholder="ana.silva@clinica.com" />
                                    </div>
                                    {errors.email && <p className="text-rose-500 text-[10px] font-bold uppercase mt-1">{errors.email.message}</p>}
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className={labelClassName}>WhatsApp Profissional</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-3.5 text-gray-400"/>
                                        <Input {...register("phone")} className="h-12 pl-12 rounded-xl font-bold bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500" placeholder="(11) 99999-9999" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cardClassName}>
                        <h2 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                            <Briefcase size={18} className="text-purple-600"/> Atuação Profissional
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className={labelClassName}>Permissão no Sistema</label>
                                <select {...register("role")} className="w-full h-12 px-4 rounded-xl border-0 bg-gray-50 dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none">
                                    <option value="profissional">👨‍⚕️ Especialista Técnico</option>
                                    <option value="recepcionista">📅 Recepcionista / Front Desk</option>
                                    <option value="admin">⚙️ Administrador do Sistema</option>
                                </select>
                            </div>

                            {isMedicalStaff && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className={labelClassName}>Formação Principal</label>
                                        <div className="relative">
                                            <Award size={18} className="absolute left-4 top-3.5 text-gray-400 pointer-events-none"/>
                                            <select {...register("formacao")} className="w-full h-12 pl-12 rounded-xl border-0 bg-gray-50 dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none">
                                                <option value="">Selecione...</option>
                                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className={labelClassName}>Número do Registro Profissional ({councilLabel})</label>
                                        <div className="relative">
                                            <Shield size={18} className="absolute left-4 top-3.5 text-gray-400"/>
                                            <Input {...register("registration_number")} className="h-12 pl-12 rounded-xl font-bold bg-gray-50 border-0 focus:ring-2 focus:ring-pink-500" placeholder="000.000-00" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {isMedicalStaff && (
                        <div className={cardClassName}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <PenTool size={18} className="text-pink-600"/> Assinatura Autenticada
                                </h2>
                                <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="h-10 rounded-xl font-bold text-[10px] uppercase border-gray-100 dark:border-gray-700">
                                    <Eraser size={14} className="mr-2"/> Limpar
                                </Button>
                            </div>
                            <div className="border-4 border-dashed border-gray-50 dark:border-gray-900 rounded-[2rem] bg-gray-50/30 dark:bg-gray-950 flex justify-center overflow-hidden relative h-48 w-full hover:border-pink-100 transition-colors" style={{ touchAction: 'none' }}>
                                {signaturePreview && !isDrawing ? (
                                    <img src={signaturePreview} alt="Assinatura" className="h-full object-contain p-4" />
                                ) : (
                                    <canvas
                                        ref={canvasRef}
                                        width={800} height={200}
                                        className="w-full h-full cursor-crosshair"
                                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                    />
                                )}
                                {!signaturePreview && !isDrawing && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-200 pointer-events-none text-xs font-black uppercase tracking-[0.5em] italic">Assinar no campo acima</span>}
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUNA DIREITA (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {isMedicalStaff && (
                        <div className={cardClassName}>
                            <h2 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                <Calendar size={18} className="text-purple-600"/> Escala & Agenda
                            </h2>
                            
                            <div className="space-y-4 mb-10">
                                <label className={labelClassName}>Frequência de Atendimento</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => {
                                        const isSelected = watch('working_days')?.includes(day.value);
                                        return (
                                            <label key={day.value} className={`
                                                cursor-pointer rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-tighter transition-all border shadow-sm
                                                ${isSelected 
                                                    ? 'bg-gray-900 text-white border-transparent' 
                                                    : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800 hover:border-pink-200'
                                                }
                                            `}>
                                                <input type="checkbox" value={day.value} {...register('working_days')} className="hidden"/>
                                                {day.label}
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-10">
                                <label className={labelClassName}>Janela de Horário</label>
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <Input type="time" {...register('start_time')} className="bg-transparent border-0 shadow-none text-center font-black italic text-sm p-0 focus:ring-0" />
                                    <Clock size={16} className="text-gray-300" />
                                    <Input type="time" {...register('end_time')} className="bg-transparent border-0 shadow-none text-center font-black italic text-sm p-0 focus:ring-0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClassName}>Cor na Agenda</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative overflow-hidden w-12 h-12 rounded-2xl shadow-xl">
                                            <input type="color" {...register("agenda_color")} className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer border-0 p-0" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={labelClassName}>Comissão (%)</label>
                                    <div className="relative">
                                        <Percent size={14} className="absolute left-3 top-3.5 text-gray-400"/>
                                        <Input type="number" {...register("commission_rate")} className="h-12 pl-10 font-black italic text-purple-600 bg-gray-50 border-0 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {!isNew && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acesso ao Sistema</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register("is_active")} className="sr-only peer"/>
                                    <div className="w-14 h-8 bg-gray-100 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        )}
                        
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full h-16 bg-gray-900 hover:bg-black text-white font-black uppercase text-sm tracking-[0.2em] rounded-[2rem] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-pink-500/10 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} className="text-pink-500"/>} 
                            {isNew ? "Concluir Cadastro" : "Sincronizar Perfil"}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    </div>
  );
}