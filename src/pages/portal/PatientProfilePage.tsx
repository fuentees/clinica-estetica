import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  User, Phone, MapPin, Calendar, 
  CreditCard, Save, Loader2, Mail 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// Máscaras simples para o formulário
const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
const maskCEP = (v: string) => v.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2");

export function PatientProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    cpf: "",
    date_of_birth: "",
    phone: "",
    cep: "",
    address: "", // Endereço completo ou Rua
    numero: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Usuário não autenticado.");

      // 2. Busca os dados na tabela 'patients' pelo email
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          cpf: data.cpf || "",
          date_of_birth: data.date_of_birth || "",
          phone: data.phone || "",
          cep: data.cep || "",
          address: data.rua || data.address || "", // Fallback para sistemas antigos
          numero: data.numero || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || ""
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  // Busca CEP automática (Igual ao admin)
  const checkCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        }));
        toast.success("Endereço encontrado!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Atualiza apenas os campos permitidos (Contato e Endereço)
      const { error } = await supabase
        .from('patients')
        .update({
          phone: formData.phone,
          cep: formData.cep,
          rua: formData.address,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          // address: antigo mantido para compatibilidade se necessário
          address: `${formData.address}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`
        })
        .eq('id', formData.id);

      if (error) throw error;
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-pink-600" size={32}/>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando seus dados...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-inner">
            <User size={32} className="text-gray-400" />
        </div>
        <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                Meu Perfil
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mantenha seus dados atualizados</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SEÇÃO 1: DADOS FIXOS (Bloqueados) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-200 dark:bg-gray-700"></div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <CreditCard size={14}/> Dados Pessoais (Protegidos)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                    <Input value={formData.name} disabled className="bg-gray-50 dark:bg-gray-900 font-bold border-transparent"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CPF</label>
                    <Input value={formData.cpf} disabled className="bg-gray-50 dark:bg-gray-900 font-bold border-transparent"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail (Login)</label>
                    <Input value={formData.email} disabled className="bg-gray-50 dark:bg-gray-900 font-bold border-transparent"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nascimento</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <Input 
                            value={formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString('pt-BR') : ''} 
                            disabled 
                            className="pl-10 bg-gray-50 dark:bg-gray-900 font-bold border-transparent"
                        />
                    </div>
                </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-4 italic">
                * Para alterar nome ou CPF, entre em contato com a recepção.
            </p>
        </div>

        {/* SEÇÃO 2: CONTATO E ENDEREÇO (Editáveis) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500 group-hover:w-2 transition-all"></div>
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <MapPin size={14} className="text-pink-600"/> Contato e Localização
            </h3>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Celular / WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-600" size={18}/>
                        <Input 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
                            className="pl-12 h-12 rounded-xl font-bold border-gray-200 dark:border-gray-700 focus:ring-pink-500 bg-white dark:bg-gray-900"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">CEP</label>
                        <Input 
                            value={formData.cep} 
                            onChange={(e) => setFormData({...formData, cep: maskCEP(e.target.value)})}
                            onBlur={checkCEP}
                            maxLength={9}
                            className="h-12 rounded-xl font-bold border-gray-200 dark:border-gray-700 focus:ring-pink-500"
                            placeholder="00000-000"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Número</label>
                        <Input 
                            value={formData.numero} 
                            onChange={(e) => setFormData({...formData, numero: e.target.value})}
                            className="h-12 rounded-xl font-bold border-gray-200 dark:border-gray-700 focus:ring-pink-500"
                            placeholder="123"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Endereço (Rua)</label>
                    <Input 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="h-12 rounded-xl font-bold border-gray-200 dark:border-gray-700 focus:ring-pink-500"
                        placeholder="Nome da rua..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bairro</label>
                        <Input 
                            value={formData.bairro} 
                            onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                            className="h-12 rounded-xl font-bold border-gray-200 dark:border-gray-700 focus:ring-pink-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cidade / UF</label>
                        <Input 
                            value={formData.cidade ? `${formData.cidade} - ${formData.estado}` : ''} 
                            disabled
                            className="h-12 rounded-xl font-bold border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Botão de Salvar Flutuante ou Fixo */}
        <Button 
            type="submit" 
            disabled={saving}
            className="w-full h-14 bg-gray-900 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
        >
            {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
            {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>

      </form>
    </div>
  );
}