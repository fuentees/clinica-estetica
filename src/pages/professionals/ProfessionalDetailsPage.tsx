import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Loader2, User, Briefcase, Mail, Phone, Percent, Award, 
  Camera, Shield, Clock, Calendar, Save, ArrowLeft
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid'; 

// --- CONSTANTES ---
const DAYS_OF_WEEK = [
    { value: 'Mon', label: 'Seg' }, { value: 'Tue', label: 'Ter' },
    { value: 'Wed', label: 'Qua' }, { value: 'Thu', label: 'Qui' },
    { value: 'Fri', label: 'Sex' }, { value: 'Sat', label: 'Sáb' },
    { value: 'Sun', label: 'Dom' },
];

const SPECIALTIES = [
    "Biomédica Esteta", "Dermatologista", "Esteticista Facial", "Esteticista Corporal", 
    "Enfermeira Esteta", "Cirurgião Plástico", "Fisioterapeuta Dermato", "Recepcionista", 
    "Gerente / Admin", "Outro"
];

// Tipagem do Formulário
interface ProfessionalFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    formacao: string; // Especialidade
    agenda_color: string;
    commission_rate: number;
    registration_number: string;
    avatar_url: string;
    working_days: string[];
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export default function ProfessionalDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isNew, setIsNew] = useState(false); 
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfessionalFormData>({
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
    const isMedicalStaff = ["profissional", "esteticista", "doutor", "medico", "biomedica"].includes(watchRole);
    const watchFirstName = watch("first_name");

    // FUNÇÃO DE CARREGAMENTO
    async function loadProfessional(profId: string) {
        setLoading(true);
        // Ajuste no select para incluir todos os campos necessários e evitar 'select *'
        const { data, error } = await supabase
            .from("profiles")
            .select(`
                id, first_name, last_name, name, email, phone, role, formacao, 
                agenda_color, commission_rate, registration_number, avatar_url, 
                working_days, start_time, end_time, is_active
            `)
            .eq("id", profId)
            .single(); 

        if (error) {
            console.error(error);
            toast.error("Erro ao carregar dados.");
            navigate("/professionals");
        } else if (data) {
            // Lógica para carregar nomes antigos que podem estar só em 'name' (fallback de leitura)
            let first = data.first_name;
            let last = data.last_name;
            if (!first && data.name) {
                const parts = data.name.split(' ');
                first = parts[0];
                last = parts.slice(1).join(' ');
            }

            reset({
                first_name: first || '',
                last_name: last || '',
                email: data.email || '',
                phone: data.phone || '',
                role: data.role || 'profissional',
                formacao: data.formacao || '',
                agenda_color: data.agenda_color || '#ec4899',
                commission_rate: data.commission_rate || 0,
                registration_number: data.registration_number || '',
                avatar_url: data.avatar_url || '',
                working_days: data.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                start_time: data.start_time?.slice(0, 5) || '09:00',
                end_time: data.end_time?.slice(0, 5) || '18:00',
                is_active: data.is_active ?? true
            });
            
            if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (id && id !== 'new') {
            setIsNew(false);
            loadProfessional(id); 
        } else if (id === 'new') {
            setIsNew(true);
            reset();
        }
        return () => {
            if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
        };
    }, [id, navigate, reset]); 

    // --- Upload de Avatar ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarPreview(URL.createObjectURL(file));
            setAvatarFile(file);
        }
    };

    const uploadAvatar = async (userId: string) => {
        if (!avatarFile) return null;
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;
        
        const { error } = await supabase.storage
            .from('avatars') 
            .upload(fileName, avatarFile, { upsert: true });

        if (error) {
            console.error("Erro upload:", error);
            return null;
        }
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
    }

    // --- Salvar (CORRIGIDO: Removida a propriedade 'name') ---
    const onSubmit = async (data: ProfessionalFormData) => {
        setLoading(true);
        let userId = id; 

        try {
            // Remove a propriedade 'name' do objeto que será enviado ao DB
            // Garantindo que só first_name e last_name sejam enviados
            const { first_name, last_name, ...dataToSaveWithoutName } = data;
            
            const dataToSave = { 
                first_name: first_name,
                last_name: last_name,
                ...dataToSaveWithoutName 
            };

            // --- INSERÇÃO (NOVO) ---
            if (isNew || userId === 'new') {
                const { data: newProfile, error: insertError } = await supabase
                    .from("profiles")
                    .insert(dataToSave)
                    .select('id')
                    .single();

                if (insertError) throw insertError;
                userId = newProfile.id; 
            } 
            
            // --- UPLOAD E UPDATE ---
            if (avatarFile && userId && userId !== 'new') {
                const uploadedUrl = await uploadAvatar(userId);
                if (uploadedUrl) {
                    dataToSave.avatar_url = uploadedUrl;
                }
            }

            const { error: updateError } = await supabase
                .from("profiles")
                .update(dataToSave)
                .eq("id", userId);

            if (updateError) throw updateError;
            
            const nameForToast = `${first_name} ${last_name}`.trim();
            toast.success(`Profissional ${nameForToast} salvo com sucesso!`);
            
            if (userId) navigate(`/professionals/${userId}`);

        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            // Mensagem mais amigável com o erro real
            const errorMessage = error.message || "Erro desconhecido.";
            toast.error(`Erro ao salvar: ${errorMessage}`); 
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin mr-2 text-pink-600 w-8 h-8" /></div>;

    const inputClass = "w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm";
    const labelClass = "text-xs font-bold text-gray-500 uppercase mb-1 block";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-6xl mx-auto p-2">
            
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {isNew ? 'Cadastrar Profissional' : 'Editar Perfil'}
                </h1>
                <button type="button" onClick={() => navigate('/professionals')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                    <ArrowLeft size={16}/> Voltar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA ESQUERDA */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><User size={16}/> Informações Básicas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                            
                            {/* Avatar */}
                            <div className="md:col-span-1 flex flex-col items-center">
                                <div className="relative w-28 h-28 mb-2">
                                    <div className="w-full h-full rounded-full border-4 border-pink-500/50 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? (<img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>) : (
                                            <span className="text-4xl font-bold text-pink-600">{watchFirstName?.[0]?.toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors">
                                        <Camera size={16}/>
                                    </label>
                                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </div>
                            </div>

                            {/* Campos */}
                            <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Nome</label>
                                    <input {...register("first_name", { required: "Nome obrigatório" })} className={inputClass} placeholder="Ex: Ana" />
                                    {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Sobrenome</label>
                                    <input {...register("last_name", { required: "Sobrenome obrigatório" })} className={inputClass} placeholder="Ex: Souza" />
                                    {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>E-mail</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-3 text-gray-400"/>
                                        <input {...register("email", { required: "Email obrigatório" })} className={`${inputClass} pl-10`} placeholder="ana@clinica.com" />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Telefone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-3 text-gray-400"/>
                                        <input {...register("phone")} className={`${inputClass} pl-10`} placeholder="(11) 99999-9999" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Briefcase size={16}/> Atuação</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Cargo</label>
                                <select {...register("role")} className={inputClass}>
                                    <option value="profissional">Profissional / Especialista</option>
                                    <option value="medico">Médico(a) / Doutor(a)</option>
                                    <option value="biomedica">Biomédica</option>
                                    <option value="esteticista">Esteticista</option>
                                    <option value="recepcionista">Recepcionista</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Especialidade</label>
                                <div className="relative">
                                    <Award size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
                                    <select {...register("formacao")} className={`${inputClass} pl-10 appearance-none`}>
                                        <option value="">Selecione...</option>
                                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {isMedicalStaff && (
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Número de Registro (CRM/COFEN)</label>
                                    <div className="relative">
                                        <Shield size={16} className="absolute left-3 top-3 text-gray-400"/>
                                        <input {...register("registration_number")} className={`${inputClass} pl-10`} placeholder="Ex: CRM/SP 123456" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA */}
                <div className="space-y-6">
                    
                    {isMedicalStaff && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Calendar size={16}/> Configurações de Agenda</h2>
                            
                            <label className={`${labelClass} flex items-center gap-1`}><Clock size={12}/> Dias de Trabalho</label>
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

                            <label className={labelClass}>Horário Padrão</label>
                            <div className="flex gap-4">
                                <input type="time" {...register('start_time')} className={inputClass} />
                                <input type="time" {...register('end_time')} className={inputClass} />
                            </div>

                            <div className="mt-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <input type="color" {...register("agenda_color")} className="h-8 w-8 p-0 border-0 rounded cursor-pointer bg-transparent" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Cor de Exibição</span>
                            </div>
                        </div>
                    )}

                    {isMedicalStaff && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Percent size={16}/> Financeiro</h2>
                            <label className={labelClass}>Comissão (%)</label>
                            <div className="relative">
                                <input type="number" {...register("commission_rate")} className={`${inputClass} pr-8 font-bold text-right text-green-600`} placeholder="0" step="0.1"/>
                                <span className="absolute right-3 top-2.5 text-gray-400 font-bold">%</span>
                            </div>
                        </div>
                    )}

                    {!isNew && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={16}/> Status</h2>
                            <label className="flex items-center gap-3">
                                <input type="checkbox" {...register("is_active")} className="w-5 h-5 text-red-600 rounded border-gray-300"/>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Manter perfil ativo</span>
                            </label>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-200 dark:shadow-none transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} 
                        Salvar Cadastro
                    </button>
                </div>
            </div>
        </form>
    );
}