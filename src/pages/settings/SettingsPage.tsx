import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Building, Save, Loader2, MapPin, Globe, Phone, 
  Mail, FileText, Palette 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ImageUpload } from "../../components/ImageUpload";

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettingsId(data.id);
        setLogoUrl(data.logo_url || "");
        
        setValue('clinic_name', data.clinic_name);
        setValue('cnpj', data.cnpj);
        setValue('address', data.address);
        setValue('phone', data.phone);
        setValue('email', data.email);
        setValue('website', data.website);
        setValue('primary_color', data.primary_color);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const payload = {
          ...data,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
      };

      if (settingsId) {
          const { error } = await supabase
            .from('clinic_settings')
            .update(payload)
            .eq('id', settingsId);
          if (error) throw error;
      } else {
          const { error } = await supabase
            .from('clinic_settings')
            .insert(payload);
          if (error) throw error;
      }

      toast.success("Configurações salvas!");
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Building size={24} className="text-gray-700 dark:text-white" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações da Clínica</h1>
            <p className="text-sm text-gray-500">Personalize os dados que aparecem nos documentos e recibos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Identidade Visual */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Palette size={18} className="text-pink-500" /> Identidade Visual
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Logotipo da Clínica</label>
                    <div className="h-48 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center overflow-hidden relative">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-full object-contain p-2" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <p className="text-xs">Nenhum logo</p>
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2">
                             {/* Reutilizando seu componente ImageUpload */}
                             <div className="opacity-0 hover:opacity-100 transition-opacity absolute inset-0 cursor-pointer">
                                <ImageUpload label="Alterar" folder="settings" onUpload={setLogoUrl} />
                             </div>
                             <Button type="button" variant="secondary" size="sm" className="shadow pointer-events-none">Alterar</Button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Recomendado: PNG transparente.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Clínica (Exibição)</label>
                        <Input {...register("clinic_name")} placeholder="Ex: Estética Avançada Dra. Ana" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cor Principal (Hex)</label>
                        <div className="flex gap-2">
                            <Input {...register("primary_color")} type="color" className="w-12 h-10 p-1 cursor-pointer" />
                            <Input {...register("primary_color")} placeholder="#000000" className="flex-1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Dados Institucionais */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> Dados Cadastrais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2 dark:text-gray-300"><Building size={14}/> Razão Social / CNPJ</label>
                    <Input {...register("cnpj")} placeholder="00.000.000/0001-00" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2 dark:text-gray-300"><Phone size={14}/> Telefone / WhatsApp Oficial</label>
                    <Input {...register("phone")} placeholder="(00) 00000-0000" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2 dark:text-gray-300"><Mail size={14}/> Email de Contato</label>
                    <Input {...register("email")} placeholder="contato@clinica.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2 dark:text-gray-300"><Globe size={14}/> Site / Instagram</label>
                    <Input {...register("website")} placeholder="@suaclinica" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2 dark:text-gray-300"><MapPin size={14}/> Endereço Completo</label>
                    <Input {...register("address")} placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-8 shadow-lg">
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} 
                Salvar Alterações
            </Button>
        </div>
      </form>
    </div>
  );
}