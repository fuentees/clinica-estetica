import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  FileText, Plus, Search, 
  RefreshCw, AlertCircle, ChevronRight, FilePenLine, Trash2, Loader2, Pill 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

export function PrescriptionsPage() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Identificar Clínica
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id:clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) throw new Error("Clínica não identificada");

      // 2. Busca Otimizada com JOIN
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
            *,
            patient:patients!patient_id ( name ),
            professional:profiles!professional_id ( first_name, last_name, email )
        `)
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

      if (error) {
          console.warn("Tentativa de Join falhou, tentando busca manual...", error);
          const { data: rawData, error: rawError } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('clinic_id', profile.clinic_id)
            .order('created_at', { ascending: false });
            
          if (rawError) throw rawError;
          
          if (rawData) {
              const pIds = rawData.map((r: any) => r.patient_id).filter(Boolean);
              const profIds = rawData.map((r: any) => r.professional_id).filter(Boolean);
              
              const [pats, profs] = await Promise.all([
                  supabase.from('patients').select('id, name').in('id', pIds),
                  supabase.from('profiles').select('id, first_name, last_name').in('id', profIds)
              ]);
              
              const enriched = rawData.map((item: any) => ({
                  ...item,
                  patient: pats.data?.find((p: any) => p.id === item.patient_id),
                  professional: profs.data?.find((p: any) => p.id === item.professional_id)
              }));
              
              setPrescriptions(enriched);
              return;
          }
      }

      setPrescriptions(data || []);

    } catch (error: any) {
      console.error("Erro na listagem:", error);
      setErrorMsg("Não foi possível carregar as receitas. " + error.message);
      toast.error("Erro ao carregar lista.");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, e: any) => {
      e.stopPropagation();
      if(!confirm("Tem certeza que deseja excluir esta receita permanentemente?")) return;
      
      try {
        const { error } = await supabase.from('prescriptions').delete().eq('id', id);
        if(error) throw error;
        
        toast.success("Receita removida.");
        setPrescriptions(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        toast.error("Erro ao excluir.");
      }
  }

  const handleOpenPrescription = (id: string) => {
      navigate(`/prescriptions/new?id=${id}`);
  };

  const filtered = prescriptions.filter(item => {
      const pName = (item.patient?.name || "Paciente Removido").toLowerCase();
      const profName = (item.professional?.first_name || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return pName.includes(term) || profName.includes(term);
  });

  const getProfName = (item: any) => {
      const p = item.professional;
      if (!p) return 'Profissional Desconhecido';
      if (p.first_name) return `Dr(a). ${p.first_name} ${p.last_name || ''}`;
      return p.email || 'Profissional';
  }

  // ✅ CORREÇÃO DE DATA:
  // Se a string for curta (ex: '2023-10-08'), adicionamos T12:00 para forçar meio-dia
  // Assim o fuso horário não joga para o dia anterior
  const formatDateFixed = (dateString: string) => {
      if (!dateString) return "--/--/----";
      
      // Se for formato ISO completo com hora, usa normal
      if (dateString.includes('T') && dateString.includes('Z')) {
          return new Date(dateString).toLocaleDateString('pt-BR');
      }
      
      // Se for apenas data (YYYY-MM-DD), adiciona meio dia
      if (dateString.length === 10) {
          return new Date(dateString + "T12:00:00").toLocaleDateString('pt-BR');
      }

      return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-4 md:p-8 max-w-[1400px] mx-auto pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl text-white shadow-lg shadow-pink-200 dark:shadow-none">
                <Pill size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Central de <span className="text-pink-600">Receitas</span></h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de prescrições e orientações</p>
            </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <Button 
                variant="outline" 
                onClick={fetchPrescriptions} 
                className="rounded-2xl h-14 w-14 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
                <RefreshCw size={22} className={loading ? "animate-spin text-pink-500" : "text-gray-400"}/>
            </Button>
            <Button 
                onClick={() => navigate('/prescriptions/new')}
                className="flex-1 md:flex-none bg-gray-900 hover:bg-black text-white rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95"
            >
                <Plus size={20} className="mr-2 text-pink-500"/> Nova Prescrição
            </Button>
        </div>
      </div>

      {/* BUSCA */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center group focus-within:ring-2 focus:ring-pink-500/20 transition-all">
          <div className="pl-4 text-gray-300 group-focus-within:text-pink-500 transition-colors">
              <Search size={22}/>
          </div>
          <input 
              type="text" 
              placeholder="Localizar receita por paciente ou profissional..." 
              className="w-full p-4 bg-transparent outline-none text-sm font-bold text-gray-700 dark:text-white placeholder-gray-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-5 rounded-[1.5rem] flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-2">
              <AlertCircle size={24} />
              <div>
                  <p className="font-black uppercase text-xs tracking-widest">Atenção</p>
                  <p className="text-sm font-medium">{errorMsg}</p>
              </div>
          </div>
      )}

      {/* LISTAGEM */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Header Tabela */}
        <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Paciente</div>
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Médico/Profissional</div>
            <div className="col-span-2 hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data</div>
            <div className="col-span-5 md:col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</div>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                   <Loader2 className="animate-spin text-pink-600" size={32} />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Carregando...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-32 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
                       <FileText size={40}/>
                    </div>
                    <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">Nenhuma receita encontrada</p>
                </div>
            ) : (
                filtered.map((item) => (
                    <div 
                        key={item.id} 
                        className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-pink-50/30 dark:hover:bg-gray-900/40 transition-all group cursor-pointer"
                        onClick={() => handleOpenPrescription(item.id)}
                    >
                        <div className="col-span-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 border border-blue-100 dark:border-blue-800">
                                {item.patient?.name?.charAt(0) || '?'}
                            </div>
                            <div className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic truncate">
                                {item.patient?.name || 'Paciente Removido'}
                            </div>
                        </div>

                        <div className="col-span-3">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate block">
                                {getProfName(item)}
                            </span>
                        </div>

                        <div className="col-span-2 hidden md:block text-center">
                            <span className="text-xs font-black text-gray-400 dark:text-gray-500 tabular-nums">
                                {/* AQUI: Usando a função corrigida */}
                                {formatDateFixed(item.date || item.created_at)}
                            </span>
                        </div>

                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-3">
                            <Button 
                                variant="ghost" 
                                className="h-10 px-4 rounded-xl text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                                onClick={(e) => { e.stopPropagation(); handleOpenPrescription(item.id); }}
                            >
                                <FilePenLine size={16}/> <span className="hidden sm:inline">Editar</span>
                            </Button>
                            
                            <button 
                                className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                onClick={(e) => handleDelete(item.id, e)}
                            >
                                <Trash2 size={18}/>
                            </button>

                            <ChevronRight size={20} className="text-gray-200 group-hover:text-pink-300 group-hover:translate-x-1 transition-all"/>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}