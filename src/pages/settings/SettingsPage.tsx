import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Building, Save, Loader2, MapPin, 
  // Phone, // Removed unused import
  // Mail, // Removed unused import
  FileText, Palette, ImageIcon,
  Landmark, Percent, ShieldCheck, AlertCircle, Clock, Trash2, UploadCloud
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// --- TIPAGEM ---
interface SettingsFormData {
  clinic_name: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  primary_color: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  bank_name: string;
  bank_agency: string;
  bank_account: string;
  pix_key: string;
  default_commission: string;
}

// --- MÁSCARAS ---
const maskCNPJ = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
const maskCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // const [cepLoading, setCepLoading] = useState(false); // Unused state
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<{ date: string; user: string } | null>(null);
  const [initialData, setInitialData] = useState<any>(null);

  const { register, handleSubmit, setValue, watch, setFocus } = useForm<SettingsFormData>();
  const primaryColor = watch("primary_color");
  const formData = watch();

  // ✅ Bloqueio Hard: Campos críticos obrigatórios
  const isFormValid = useMemo(() => {
    const critical = ['clinic_name', 'cnpj', 'cep', 'rua', 'numero', 'cidade', 'estado'];
    return critical.every(f => !!formData[f as keyof SettingsFormData]);
  }, [formData]);

  // ✅ Status de Configuração
  const completionStatus = useMemo(() => {
    const critical = ['clinic_name', 'cnpj', 'cep', 'bank_account', 'pix_key'];
    const missing = critical.filter(f => !formData[f as keyof SettingsFormData]);
    return { isComplete: missing.length === 0, missingCount: missing.length };
  }, [formData]);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('clinic_id, role').eq('id', user.id).single();
      setUserRole(profile?.role || 'user');
      setClinicId(profile?.clinic_id);

      if (profile?.clinic_id) {
        const { data: clinic, error } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single();
        
        if (error) throw error;

        if (clinic) {
          setInitialData(clinic);
          setLogoUrl(clinic.logo_url || "");
          setLastUpdate(clinic.updated_at ? { 
            date: new Date(clinic.updated_at).toLocaleString('pt-BR'), 
            user: clinic.updated_by_name || "Sistema" 
          } : null);

          // Preenchendo o formulário
          setValue('clinic_name', clinic.name || "");
          setValue('cnpj', clinic.cnpj || "");
          setValue('phone', clinic.phone || "");
          setValue('email', clinic.email || "");
          setValue('website', clinic.website || "");
          setValue('primary_color', clinic.primary_color || "#000000");
          setValue('cep', clinic.cep || "");
          setValue('rua', clinic.rua || "");
          setValue('numero', clinic.numero || "");
          setValue('bairro', clinic.bairro || "");
          setValue('cidade', clinic.cidade || "");
          setValue('estado', clinic.estado || "");
          setValue('complemento', clinic.complemento || "");
          
          // Campos Financeiros (JSONB)
          const bankData = clinic.bank_account || {};
          setValue('bank_name', bankData.bank_name || "");
          setValue('bank_agency', bankData.bank_agency || "");
          setValue('bank_account', bankData.bank_account || "");
          setValue('pix_key', clinic.pix_key || "");
          setValue('default_commission', String(clinic.default_commission || ""));
        }
      }
    } catch (error) { 
      console.error(error);
      toast.error("Erro ao carregar configurações."); 
    } finally { 
      setLoading(false); 
    }
  }

  // ✅ LOGICA DE UPLOAD UNIFICADA NO QUADRADO
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clinicId}-${Math.random()}.${fileExt}`;
      
      // Upload para o bucket 'public' ou 'logos' (verifique qual você criou)
      // Assumindo 'logos' conforme seu código original, mas garanta que o bucket existe
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      setLogoUrl(publicUrl);
      toast.success("Logo carregado! Clique em salvar para confirmar.");
    } catch (error) { 
      console.error(error);
      toast.error("Erro no upload."); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    toast.success("Logo removido da visualização. Salve para confirmar.");
  };

  const checkCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    // setCepLoading(true); // Se quiser usar loading no CEP
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue("rua", data.logradouro);
        setValue("bairro", data.bairro);
        setValue("cidade", data.localidade);
        setValue("estado", data.uf);
        setFocus("numero");
      }
    } catch (error) { 
      toast.error("Erro ao buscar CEP."); 
    } finally { 
      // setCepLoading(false); 
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!clinicId) return;

    // Verificação de concorrência (Opcional, mas boa prática)
    const { data: latest } = await supabase.from('clinics').select('updated_at').eq('id', clinicId).single();
    // Comparação simples de datas (pode precisar de ajuste dependendo do formato do banco)
    // if (latest && initialData && latest.updated_at !== initialData.updated_at) {
    //   return toast.error("⚠️ Erro de Concorrência: Outro usuário alterou estes dados.");
    // }

    // Verificação de mudanças críticas financeiras
    const initialBank = initialData?.bank_account || {};
    const financeChanged = 
      data.bank_account !== (initialBank.bank_account || "") || 
      data.pix_key !== (initialData?.pix_key || "") ||
      parseFloat(data.default_commission) !== (initialData?.default_commission || 0);

    if (financeChanged) {
      if (!confirm("⚠️ Alterações financeiras detectadas. Confirmar?")) return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

      // Montando o payload para corresponder às colunas do banco
      // Lembre-se que criamos 'bank_account' como JSONB no SQL anterior
      const payload = {
        name: data.clinic_name,
        cnpj: data.cnpj,
        phone: data.phone,
        email: data.email,
        website: data.website,
        primary_color: data.primary_color,
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        complemento: data.complemento,
        logo_url: logoUrl,
        pix_key: data.pix_key,
        default_commission: parseFloat(data.default_commission) || 0,
        
        // Salvando dados bancários estruturados no campo JSONB
        bank_account: {
            bank_name: data.bank_name,
            bank_agency: data.bank_agency,
            bank_account: data.bank_account
        },

        updated_at: new Date().toISOString(),
        updated_by_name: profile?.full_name || 'Admin'
      };

      const { error } = await supabase.from('clinics').update(payload).eq('id', clinicId);
      if (error) throw error;
      
      toast.success("Configurações salvas!");
      fetchSettings(); // Recarrega os dados para atualizar o estado inicial
    } catch (error: any) { 
        console.error(error);
        toast.error(`Erro ao salvar: ${error.message}`); 
    } finally { 
        setSaving(false); 
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'owner';

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 space-y-6 animate-in fade-in duration-500">
      
      {/* AUDIT BAR */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
        {lastUpdate && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
            <Clock size={14} className="text-pink-500" />
            Última alteração: <span className="text-gray-900">{lastUpdate.date}</span> por <span className="text-gray-900 italic">{lastUpdate.user}</span>
          </div>
        )}
        {!completionStatus.isComplete && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            <AlertCircle size={14} /> Incompleto ({completionStatus.missingCount} campos)
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><Building size={28} className="text-pink-600" /></div>
          <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase italic tracking-tighter leading-none">Minha Clínica</h1>
              <p className="text-sm text-gray-500">Identidade, Governança e Dados.</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={saving || !isFormValid} 
            className={`px-10 h-14 rounded-2xl shadow-2xl transition-all border-b-4 ${!isFormValid ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white border-green-500'}`}
          >
            {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save size={18} className="mr-2 text-green-500" />} 
            <span className="font-black uppercase text-xs">Salvar Alterações</span>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* --- 1. IDENTIDADE VISUAL UNIFICADA --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 italic"><Palette size={20} className="text-pink-500" /> Identidade Visual</h2>
            
            <div className="grid md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Logotipo da Unidade</label>
                    
                    {/* QUADRADO DE UPLOAD UNIFICADO */}
                    <div className="relative group w-full aspect-square border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-pink-300 hover:bg-pink-50/30">
                        {logoUrl ? (
                            <>
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-6" />
                              {/* Overlay de Troca */}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                                <UploadCloud size={24} className="mb-2" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Trocar Imagem</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                              </label>
                              {/* Botão Deletar */}
                              <button onClick={handleRemoveLogo} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                                <Trash2 size={14} />
                              </button>
                            </>
                        ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              {uploading ? (
                                <Loader2 className="animate-spin text-pink-500" size={32} />
                              ) : (
                                <>
                                  <div className="p-4 bg-white rounded-2xl shadow-sm mb-2"><ImageIcon size={24} className="text-gray-300" /></div>
                                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest text-center px-4">Clique para enviar<br/>PNG ou JPG</span>
                                </>
                              )}
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="md:col-span-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome Fantasia (Exibição) *</label>
                        <Input {...register("clinic_name")} className="h-12 rounded-xl font-bold border-2" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cor de Destaque</label>
                        <div className="flex items-center gap-4 p-3 border border-gray-100 rounded-2xl bg-gray-50/50">
                            <input {...register("primary_color")} type="color" className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Código Hexadecimal</p>
                                <span className="text-sm font-mono font-bold uppercase">{primaryColor}</span>
                            </div>
                            {/* Preview document */}
                            <div className="h-10 px-4 rounded-xl border flex items-center justify-center text-[10px] font-black uppercase" style={{ color: primaryColor, borderColor: primaryColor + '40' }}>Preview</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 2. FINANCEIRO & REPASSES --- */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden ${!isAdmin && 'opacity-60'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            {!isAdmin && (
              <div className="absolute inset-0 z-10 bg-white/40 flex items-center justify-center">
                  <div className="bg-gray-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl">
                    <ShieldCheck size={16} className="text-pink-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Acesso Restrito</span>
                  </div>
              </div>
            )}
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 italic"><Landmark size={20} className="text-blue-500" /> Financeiro & Dados Bancários</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input {...register("bank_name")} placeholder="Banco" disabled={!isAdmin} className="md:col-span-2 h-11 rounded-xl" />
                <Input {...register("bank_account")} placeholder="Conta com Dígito" disabled={!isAdmin} className="md:col-span-2 h-11 rounded-xl" />
                <Input {...register("pix_key")} placeholder="Chave PIX Oficial" disabled={!isAdmin} className="md:col-span-2 h-11 rounded-xl" />
                <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 text-white rounded-xl"><Percent size={18}/></div>
                    <span className="text-xs font-black uppercase italic">Comissão Padrão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input {...register("default_commission")} type="number" max="100" min="0" disabled={!isAdmin} className="w-16 h-10 text-center font-black rounded-lg border-2" />
                    <span className="font-black text-blue-500">%</span>
                  </div>
                </div>
            </div>
        </div>

        {/* --- 3. ENDEREÇO --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 italic"><MapPin size={20} className="text-purple-500" /> Endereço e Localização</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input {...register("cep")} onChange={(e) => setValue("cep", maskCEP(e.target.value))} onBlur={checkCEP} placeholder="CEP *" maxLength={9} className="font-bold border-2 h-11 rounded-xl" />
                <Input {...register("rua")} placeholder="Rua / Logradouro *" className="md:col-span-2 h-11 rounded-xl" />
                <Input {...register("numero")} placeholder="Número *" className="h-11 rounded-xl" />
                <Input {...register("bairro")} placeholder="Bairro" className="h-11 rounded-xl" />
                <Input {...register("cidade")} placeholder="Cidade *" className="h-11 rounded-xl" />
                <Input {...register("estado")} placeholder="UF *" maxLength={2} className="h-11 uppercase rounded-xl" />
                <Input {...register("complemento")} placeholder="Sala..." className="h-11 rounded-xl" />
            </div>
        </div>

        {/* --- 4. DADOS INSTITUCIONAIS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 italic"><FileText size={20} className="text-emerald-500" /> Dados Institucionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input {...register("cnpj")} onChange={(e) => setValue("cnpj", maskCNPJ(e.target.value))} placeholder="CNPJ *" maxLength={18} className="font-mono border-2 h-11 rounded-xl" />
                <Input {...register("phone")} onChange={(e) => setValue("phone", maskPhone(e.target.value))} placeholder="WhatsApp" maxLength={15} className="h-11 rounded-xl" />
                <Input {...register("email")} placeholder="E-mail Oficial" type="email" className="h-11 rounded-xl" />
                <Input {...register("website")} placeholder="Website" className="h-11 rounded-xl" />
            </div>
        </div>
      </div>
    </div>
  );
}