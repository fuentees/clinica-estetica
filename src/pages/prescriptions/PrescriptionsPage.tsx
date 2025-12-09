import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  FileText, Plus, Search, Calendar, User, 
  Stethoscope, Printer, Trash2, RefreshCw, AlertCircle, ChevronRight, Eye 
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
      
      // --- QUERY CORRIGIDA E OTIMIZADA ---
      // Agora buscamos também os IDs (patient_id, professional_id) para os links funcionarem!
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id, 
          created_at, 
          notes,
          patient_id,
          professional_id,
          patient:patients(id, name),
          professional:profiles(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false }); // Ordena por data (mais recente no topo)

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error: any) {
      console.error("Erro:", error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, e: any) => {
      e.stopPropagation();
      if(!confirm("Tem certeza que deseja excluir esta receita?")) return;
      
      const { error } = await supabase.from('prescriptions').delete().eq('id', id);
      if(error) return toast.error("Erro ao excluir");
      
      toast.success("Receita removida");
      fetchPrescriptions(); 
  }

  // Função Simples de Impressão Rápida
  const handleQuickPrint = (item: any, e: any) => {
      e.stopPropagation();
      // Em um cenário real, aqui você geraria o PDF.
      // Como solução rápida, enviamos para a tela de edição em modo de impressão ou abrimos um popup.
      // Por enquanto, vamos navegar para a tela de detalhes (que tem o botão de imprimir).
      navigate(`/prescriptions/new?duplicate=${item.id}`); 
      toast("Abrindo para impressão...", { icon: '🖨️' });
  };

  const filtered = prescriptions.filter(item => {
      const pName = item.patient?.name || "Desconhecido";
      return pName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Helpers
  const getProfName = (p: any) => {
      const prof = Array.isArray(p.professional) ? p.professional[0] : p.professional;
      if (!prof) return 'Não identificado';
      if (prof.first_name) return `Dr(a). ${prof.first_name} ${prof.last_name || ''}`;
      return 'Profissional';
  }

  const getPatientName = (p: any) => {
      const pat = Array.isArray(p.patient) ? p.patient[0] : p.patient;
      return pat?.name || 'Paciente não identificado';
  }

  const getPatientId = (p: any) => {
      const pat = Array.isArray(p.patient) ? p.patient[0] : p.patient;
      return pat?.id;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-2 md:p-6 max-w-[1600px] mx-auto">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl text-pink-600 shadow-sm">
                <FileText size={28} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Receituário</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Histórico de prescrições e documentos.</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <Button 
                variant="outline" 
                onClick={fetchPrescriptions} 
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                title="Atualizar Lista"
            >
                <RefreshCw size={20} className={loading ? "animate-spin text-pink-500" : "text-gray-500"}/>
            </Button>
            <Button 
                onClick={() => navigate('/prescriptions/new')}
                className="flex-1 md:flex-none bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl h-11 shadow-lg shadow-pink-200 dark:shadow-none transition-all hover:scale-105"
            >
                <Plus size={20} className="mr-2"/> Nova Receita
            </Button>
        </div>
      </div>

      {/* --- FILTROS --- */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
          <div className="pl-4 text-gray-400">
              <Search size={20}/>
          </div>
          <input 
              type="text" 
              placeholder="Buscar receita por nome do paciente..." 
              className="w-full p-3 bg-transparent rounded-xl outline-none text-gray-700 dark:text-white placeholder-gray-400 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      {/* --- MENSAGEM DE ERRO --- */}
      {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-600">
              <AlertCircle size={24} />
              <p className="text-sm font-medium">{errorMsg}</p>
          </div>
      )}

      {/* --- LISTAGEM (TABELA PREMIUM) --- */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Cabeçalho da Tabela */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4 md:col-span-3">Paciente</div>
            <div className="col-span-4 md:col-span-3">Profissional</div>
            <div className="col-span-2 hidden md:block">Data</div>
            <div className="col-span-4 md:col-span-4 text-right">Ações</div>
        </div>

        {/* Corpo da Tabela */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
                <div className="p-10 text-center text-gray-400">Carregando lista...</div>
            ) : filtered.length === 0 && !errorMsg ? (
                <div className="p-20 text-center flex flex-col items-center">
                    <FileText size={48} className="text-gray-200 mb-4"/>
                    <p className="text-gray-500 font-medium">Nenhuma receita encontrada</p>
                </div>
            ) : (
                filtered.map((item) => {
                    const patientId = getPatientId(item);
                    return (
                        <div 
                            key={item.id} 
                            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                            // Ao clicar na linha, abre detalhes (futuro) ou nada por enquanto para não confundir
                        >
                            {/* Paciente (Clicável) */}
                            <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                    <User size={16}/>
                                </div>
                                <div 
                                    className="font-bold text-gray-900 dark:text-white truncate hover:text-pink-600 hover:underline cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (patientId) navigate(`/patients/${patientId}`);
                                        else toast.error("Paciente sem ID vinculado");
                                    }}
                                >
                                    {getPatientName(item)}
                                </div>
                            </div>

                            {/* Profissional */}
                            <div className="col-span-4 md:col-span-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="truncate">{getProfName(item)}</span>
                            </div>

                            {/* Data */}
                            <div className="col-span-2 hidden md:block text-sm text-gray-500 font-medium">
                                {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            </div>

                            {/* Ações */}
                            <div className="col-span-4 md:col-span-4 flex items-center justify-end gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={(e) => handleQuickPrint(item, e)}
                                    title="Imprimir / Ver"
                                >
                                    <Printer size={18}/>
                                </Button>
                                
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleDelete(item.id, e)}
                                    title="Excluir"
                                >
                                    <Trash2 size={18}/>
                                </Button>

                                <div className="text-gray-300">
                                    <ChevronRight size={18}/>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
}