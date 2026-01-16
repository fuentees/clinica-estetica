import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  FileText, Plus, Search, 
  RefreshCw, AlertCircle, ChevronRight, FilePenLine, Trash2, Loader2, Pill, History, Stethoscope
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

// Interface para unificar os dois tipos de dados
interface UnifiedPrescription {
  id: string;
  source: 'legacy' | 'evolution'; // Para saber de onde veio
  date: string;
  patient_name: string;
  patient_id: string;
  professional_name: string;
  description: string;
}

export function PrescriptionsPage() {
  const navigate = useNavigate();
  // Alterado para usar a interface unificada
  const [prescriptions, setPrescriptions] = useState<UnifiedPrescription[]>([]);
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

      // ==========================================================
      // BUSCA 1: LEGADO (Tabela prescriptions antiga)
      // ==========================================================
      const legacyQuery = supabase
        .from('prescriptions')
        .select(`*, patient:patients!patient_id ( name ), professional:profiles!professional_id ( first_name, last_name )`)
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

      // ==========================================================
      // BUSCA 2: NOVA (Tabela evolution_records)
      // ==========================================================
      // *Nota: Se você não criou a coluna deleted_at ainda, remova o .is('deleted_at', null)
      const evolutionQuery = supabase
        .from('evolution_records')
        .select(`*, patient:patients!patient_id ( name ), professional:profiles!professional_id ( first_name, last_name )`)
        .eq('clinic_id', profile.clinic_id)
        .order('date', { ascending: false });

      // Executa as duas em paralelo
      const [legacyRes, evoRes] = await Promise.all([legacyQuery, evolutionQuery]);

      if (legacyRes.error) console.warn("Erro busca legado:", legacyRes.error);
      if (evoRes.error) console.warn("Erro busca nova:", evoRes.error);

      // ==========================================================
      // UNIFICAÇÃO DOS DADOS
      // ==========================================================
      
      // 1. Trata os dados antigos
      const legacyItems: UnifiedPrescription[] = (legacyRes.data || []).map((item: any) => ({
          id: item.id,
          source: 'legacy',
          date: item.created_at,
          patient_name: item.patient?.name || 'Paciente Removido',
          patient_id: item.patient_id,
          professional_name: item.professional?.first_name || 'Profissional',
          description: item.notes || "Receita Avulsa (Legado)"
      }));

      // 2. Trata os dados novos (Filtra apenas quem tem receita)
      const newItems: UnifiedPrescription[] = (evoRes.data || [])
        .filter((r: any) => Array.isArray(r.attachments?.prescription) && r.attachments.prescription.length > 0)
        .map((item: any) => ({
            id: item.id,
            source: 'evolution',
            date: item.date,
            patient_name: item.patient?.name || 'Paciente Removido',
            patient_id: item.patient_id,
            professional_name: item.professional?.first_name || 'Profissional',
            description: item.subject || "Evolução com Prescrição"
        }));

      // 3. Junta tudo e ordena
      const allData = [...newItems, ...legacyItems].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPrescriptions(allData);

    } catch (error: any) {
      console.error("Erro na listagem:", error);
      setErrorMsg("Erro ao carregar dados unificados: " + error.message);
      toast.error("Erro ao carregar lista.");
    } finally {
      setLoading(false);
    }
  }

  // Lógica de Delete (Só permite deletar LEGADO aqui por segurança)
  const handleDelete = async (item: UnifiedPrescription, e: any) => {
      e.stopPropagation();
      
      if (item.source === 'evolution') {
          return toast.error("Receitas do Prontuário devem ser editadas na ficha do paciente.");
      }

      if(!confirm("Tem certeza que deseja excluir esta receita antiga permanentemente?")) return;
      
      try {
        const { error } = await supabase.from('prescriptions').delete().eq('id', item.id);
        if(error) throw error;
        
        toast.success("Receita removida.");
        setPrescriptions(prev => prev.filter(p => p.id !== item.id));
      } catch (error) {
        toast.error("Erro ao excluir.");
      }
  }

  // Navegação Inteligente
  const handleOpenPrescription = (item: UnifiedPrescription) => {
      if (item.source === 'legacy') {
          // Vai para a tela antiga
          navigate(`/prescriptions/new?id=${item.id}`);
      } else {
          // Vai para o Prontuário Novo
          navigate(`/patients/${item.patient_id}/evolution`);
      }
  };

  const filtered = prescriptions.filter(item => {
      const pName = (item.patient_name || "").toLowerCase();
      const profName = (item.professional_name || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return pName.includes(term) || profName.includes(term);
  });

  const formatDateFixed = (dateString: string) => {
      if (!dateString) return "--/--/----";
      if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('pt-BR');
      return new Date(dateString + "T12:00:00").toLocaleDateString('pt-BR');
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
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Histórico Unificado (Legado + Prontuário)</p>
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
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Origem / Médico</div>
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
                        key={`${item.source}-${item.id}`} 
                        className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-pink-50/30 dark:hover:bg-gray-900/40 transition-all group cursor-pointer"
                        onClick={() => handleOpenPrescription(item)}
                    >
                        {/* PACIENTE */}
                        <div className="col-span-4 flex items-center gap-4">
                            {/* ÍCONE DE ORIGEM: History (Legado) ou Stethoscope (Prontuário) */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${item.source === 'evolution' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                {item.source === 'evolution' ? <Stethoscope size={20}/> : <History size={20}/>}
                            </div>
                            <div>
                                <div className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic truncate">
                                    {item.patient_name}
                                </div>
                                {/* Label indicando origem */}
                                <div className="text-[9px] font-bold uppercase tracking-widest mt-1 flex gap-2">
                                     {item.source === 'legacy' ? (
                                         <span className="text-gray-400 bg-gray-100 px-2 rounded">ANTIGO</span>
                                     ) : (
                                         <span className="text-emerald-600 bg-emerald-50 px-2 rounded">PRONTUÁRIO</span>
                                     )}
                                     <span className="text-gray-400 truncate max-w-[100px]">{item.description}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-3">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate block">
                                {item.professional_name}
                            </span>
                        </div>

                        <div className="col-span-2 hidden md:block text-center">
                            <span className="text-xs font-black text-gray-400 dark:text-gray-500 tabular-nums">
                                {formatDateFixed(item.date)}
                            </span>
                        </div>

                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-3">
                            <Button 
                                variant="ghost" 
                                className="h-10 px-4 rounded-xl text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                                onClick={(e) => { e.stopPropagation(); handleOpenPrescription(item); }}
                            >
                                <FilePenLine size={16}/> <span className="hidden sm:inline">Visualizar</span>
                            </Button>
                            
                            {/* BOTÃO DE EXCLUIR: Só aparece para LEGADO */}
                            {item.source === 'legacy' ? (
                                <button 
                                    className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    onClick={(e) => handleDelete(item, e)}
                                >
                                    <Trash2 size={18}/>
                                </button>
                            ) : (
                                // Espaço vazio para manter alinhamento em itens novos
                                <div className="w-10 h-10"></div>
                            )}

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