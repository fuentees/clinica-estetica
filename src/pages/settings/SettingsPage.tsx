import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Building, Save, Loader2, MapPin, Globe, Phone, 
  Mail, FileText, Palette, CheckCircle2, Search, ImageIcon 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ImageUpload } from "../../components/ImageUpload";

// --- TIPAGEM ---
interface SettingsFormData {
  clinic_name: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  primary_color: string;
  
  // Endereço Detalhado
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
}

// --- MÁSCARAS ---
const maskCNPJ = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
const maskCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const { register, handleSubmit, setValue, watch, setFocus } = useForm<SettingsFormData>();
  
  // Monitora a cor para atualizar o preview em tempo real
  const primaryColor = watch("primary_color");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('clinic_id:clinic_id').eq('id', user.id).single();

      if (!profile?.clinic_id) {
        toast.error("Você não está vinculado a uma clínica.");
        return;
      }

      setClinicId(profile.clinic_id);

      const { data: clinic, error } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single();

      if (error) throw error;

      if (clinic) {
        setLogoUrl(clinic.logo_url || "");
        setValue('clinic_name', clinic.name);
        setValue('cnpj', clinic.cnpj || "");
        setValue('phone', clinic.phone || "");
        setValue('email', clinic.email || "");
        setValue('website', clinic.website || "");
        setValue('primary_color', clinic.primary_color || "#ec4899");

        setValue('cep', clinic.cep || "");
        setValue('rua', clinic.rua || "");
        setValue('numero', clinic.numero || "");
        setValue('bairro', clinic.bairro || "");
        setValue('cidade', clinic.cidade || "");
        setValue('estado', clinic.estado || "");
        setValue('complemento', clinic.complemento || "");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }

  // --- BUSCA DE CEP ---
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

  const onSubmit = async (data: SettingsFormData) => {
    if (!clinicId) return;
    setSaving(true);
    
    try {
      const payload = {
          name: data.clinic_name,
          cnpj: data.cnpj,
          phone: data.phone,
          email: data.email,
          website: data.website,
          primary_color: data.primary_color,
          logo_url: logoUrl,
          
          cep: data.cep,
          rua: data.rua,
          numero: data.numero,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          complemento: data.complemento,

          updatedAt: new Date().toISOString()
      };

      const { error } = await supabase.from('clinics').update(payload).eq('id', clinicId);

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handlers de Máscara
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue("cnpj", maskCNPJ(e.target.value));
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue("phone", maskPhone(e.target.value));
  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue("cep", maskCEP(e.target.value));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        <span className="text-gray-500 text-sm">Carregando dados da clínica...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
              <Building size={28} className="text-pink-600" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Clínica</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personalize a identidade e os dados da sua empresa.</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSubmit(onSubmit)} 
          disabled={saving} 
          className="bg-green-600 hover:bg-green-700 text-white px-6 h-10 shadow-lg shadow-green-600/20 transition-all hover:scale-105"
        >
          {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save size={18} className="mr-2" />} 
          Salvar Alterações
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* --- 1. IDENTIDADE VISUAL --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
            
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Palette size={20} className="text-pink-500" /> Identidade Visual
            </h2>
            
            <div className="grid md:grid-cols-12 gap-8">
                {/* LOGO */}
                <div className="md:col-span-4 flex flex-col gap-4">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Logotipo</label>
                    
                    <div className="w-full aspect-video border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center relative">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo Clínica" className="h-full w-full object-contain p-4" />
                        ) : (
                            <div className="text-center text-gray-400 p-4">
                                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">Nenhum logo carregado</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Botão de Upload Explícito - FORA da área de imagem para garantir o clique */}
                    <div className="w-full">
                       <ImageUpload label="Carregar Nova Imagem" folder="settings" onUpload={setLogoUrl} />
                       <p className="text-xs text-gray-500 mt-2 text-center">Formato recomendado: PNG Transparente.</p>
                    </div>
                </div>

                {/* CAMPOS VISUAIS */}
                <div className="md:col-span-8 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome Fantasia (Exibição)</label>
                        <Input {...register("clinic_name")} placeholder="Ex: VF Estética Avançada" className="h-11" />
                        <p className="text-xs text-gray-400 mt-1">Este nome aparecerá no cabeçalho dos documentos.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cor da Marca</label>
                        
                        {/* AQUI ESTÁ O TRUQUE: 
                           Usamos <label> em volta de tudo.
                           Clicar em QUALQUER lugar aqui (Previews, Caixa, Texto) vai abrir o seletor.
                        */}
                        <label className="cursor-pointer group">
                           <div className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 transition-colors">
                                
                                {/* Input Invisível (mas funcional) */}
                                <input 
                                  {...register("primary_color")} 
                                  type="color" 
                                  className="sr-only" // Escondido visualmente, mas acessível
                                />

                                {/* Caixa de Cor */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-sm border border-gray-200 shrink-0">
                                    <div className="w-full h-full" style={{ backgroundColor: primaryColor || '#000000' }}></div>
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Toque para alterar</span>
                                    <p className="text-xs text-gray-500 uppercase font-mono">{primaryColor || '#000000'}</p>
                                </div>
                                
                                {/* Previews */}
                                <div className="flex gap-2">
                                    <div className="h-9 px-3 rounded-lg bg-white dark:bg-gray-800 border flex items-center text-xs font-bold" style={{ color: primaryColor }}>
                                        Texto
                                    </div>
                                    <div className="h-9 px-3 rounded-lg flex items-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                                        Botão
                                    </div>
                                </div>
                           </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 2. ENDEREÇO --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>

            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-purple-500" /> Endereço e Localização
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">CEP</label>
                    <div className="relative">
                        <Input 
                            {...register("cep")} 
                            onChange={handleCEPChange} 
                            onBlur={checkCEP} 
                            placeholder="00000-000" 
                            maxLength={9}
                        />
                        {cepLoading ? (
                           <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-purple-600" />
                        ) : (
                           <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        )}
                    </div>
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Logradouro</label>
                    <Input {...register("rua")} placeholder="Rua..." disabled={cepLoading} />
                </div>
                
                <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Número</label>
                    <Input {...register("numero")} placeholder="123" />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Bairro</label>
                    <Input {...register("bairro")} disabled={cepLoading} />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Cidade</label>
                    <Input {...register("cidade")} disabled={cepLoading} />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">UF</label>
                    <Input {...register("estado")} placeholder="UF" disabled={cepLoading} />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Complemento</label>
                    <Input {...register("complemento")} placeholder="Sala, Bloco..." />
                </div>
            </div>
        </div>

        {/* --- 3. DADOS INSTITUCIONAIS --- */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> Dados Institucionais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Building size={14} className="text-gray-400"/> CNPJ / Razão Social
                    </label>
                    <Input 
                      {...register("cnpj")} 
                      onChange={handleCNPJChange}
                      placeholder="00.000.000/0000-00" 
                      maxLength={18}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Phone size={14} className="text-gray-400"/> Telefone / WhatsApp
                    </label>
                    <Input 
                      {...register("phone")} 
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000" 
                      maxLength={15}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail size={14} className="text-gray-400"/> Email Oficial
                    </label>
                    <Input {...register("email")} placeholder="contato@suaclinica.com" type="email" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Globe size={14} className="text-gray-400"/> Website / Instagram
                    </label>
                    <Input {...register("website")} placeholder="www.suaclinica.com.br" />
                </div>
            </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-8">
            <CheckCircle2 size={14} />
            <span>Seus dados são salvos automaticamente em nuvem segura.</span>
        </div>
      </form>
    </div>
  );
}