import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Edit, Trash2, Tag, Clock, Stethoscope, Loader2, Sparkles, Database 
} from 'lucide-react';
// Removido 'Input' pois estamos usando input HTML nativo estilizado
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// Lista de procedimentos padrões para importação automática
const DEFAULT_SERVICES = [
  // TOXINAS
  { name: 'Toxina Botulínica (Terço Superior)', category: 'Toxina', price: 1200, duration: 30, description: 'Testa, Glabela e Pés de Galinha' },
  { name: 'Toxina Botulínica (Full Face)', category: 'Toxina', price: 1800, duration: 45, description: 'Face completa e pescoço (Nefertiti)' },
  { name: 'Toxina Botulínica (Hiperidrose)', category: 'Toxina', price: 2500, duration: 60, description: 'Aplicação em axilas ou palmas' },
  
  // PREENCHEDORES
  { name: 'Preenchimento Labial (1ml)', category: 'Preenchedor', price: 1500, duration: 45, description: 'Volumização e contorno labial' },
  { name: 'Preenchimento de Olheiras', category: 'Preenchedor', price: 1500, duration: 45, description: 'Tratamento de profundidade infraorbital' },
  { name: 'Preenchimento de Malar (Top Model Look)', category: 'Preenchedor', price: 3000, duration: 60, description: 'Sustentação da maçã do rosto' },
  { name: 'Preenchimento de Mento (Queixo)', category: 'Preenchedor', price: 1500, duration: 45, description: 'Projeção e alongamento do queixo' },
  { name: 'Preenchimento de Mandíbula', category: 'Preenchedor', price: 3000, duration: 60, description: 'Definição do contorno facial' },
  { name: 'Rinomodelação', category: 'Preenchedor', price: 1800, duration: 45, description: 'Correção estética do nariz com AH' },

  // BIOESTIMULADORES
  { name: 'Sculptra (1 Frasco)', category: 'Bioestimulador', price: 2800, duration: 45, description: 'Ácido Poli-L-Lático para flacidez' },
  { name: 'Radiesse (1 Seringa)', category: 'Bioestimulador', price: 2900, duration: 45, description: 'Hidroxiapatita de Cálcio' },
  { name: 'Elleva', category: 'Bioestimulador', price: 2700, duration: 45, description: 'Bioestimulador de colágeno' },
  { name: 'Fios de PDO (Liso - Pacote 10)', category: 'Bioestimulador', price: 1500, duration: 60, description: 'Estímulo de colágeno local' },
  { name: 'Fios de Sustentação (Espiculados - Par)', category: 'Bioestimulador', price: 1200, duration: 60, description: 'Efeito lifting imediato' },

  // TECNOLOGIAS
  { name: 'Ultraformer (Full Face)', category: 'Tecnologia', price: 2500, duration: 60, description: 'Ultrassom Microfocado para lifting' },
  { name: 'Ultraformer (Papada)', category: 'Tecnologia', price: 800, duration: 30, description: 'Tratamento de gordura e flacidez submentoniana' },
  { name: 'Laser Lavieen (Face)', category: 'Tecnologia', price: 800, duration: 30, description: 'Laser Thulium para qualidade de pele (BB Laser)' },
  { name: 'Luz Pulsada', category: 'Tecnologia', price: 600, duration: 30, description: 'Tratamento de manchas e vasos' },

  // FACIAL
  { name: 'Limpeza de Pele Profunda', category: 'Facial', price: 250, duration: 60, description: 'Extração de comedões e hidratação' },
  { name: 'Peeling Químico', category: 'Facial', price: 350, duration: 30, description: 'Renovação celular e manchas' },
  { name: 'Microagulhamento', category: 'Facial', price: 500, duration: 45, description: 'Indução percutânea de colágeno' },
  { name: 'HydraGloss Lips', category: 'Facial', price: 200, duration: 30, description: 'Hidratação profunda dos lábios' },

  // CORPORAL
  { name: 'Enzimas (Gordura Localizada)', category: 'Corporal', price: 350, duration: 30, description: 'Aplicação de lipolíticos' },
  { name: 'Enzimas (Celulite)', category: 'Corporal', price: 350, duration: 30, description: 'Tratamento para celulite e flacidez' },
  { name: 'PEIM (Secagem de Vasinhos)', category: 'Corporal', price: 400, duration: 30, description: 'Procedimento Estético Injetável para Microvasos' },
];

export function TreatmentsPage() {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id:clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) {
          toast.error("Erro de permissão: Clínica não identificada.");
          return;
      }

      const { data, error } = await supabase
        .from('services') 
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTreatments(data || []);

    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      toast.error('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }

  const handleImportDefaults = async () => {
      if(!confirm("Isso irá adicionar vários procedimentos padrões ao seu catálogo. Deseja continuar?")) return;
      
      try {
          setImporting(true);
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
          
          if (!profile?.clinic_id) throw new Error("Clínica não encontrada");

          const servicesToInsert = DEFAULT_SERVICES.map(service => ({
              ...service,
              clinic_id: profile.clinic_id,
              is_active: true
          }));

          const { error } = await supabase.from('services').insert(servicesToInsert);

          if (error) throw error;

          toast.success("Catálogo importado com sucesso!");
          fetchServices();

      } catch (error: any) {
          console.error(error);
          toast.error("Erro na importação: " + error.message);
      } finally {
          setImporting(false);
      }
  };

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast.success('Serviço removido.');
      setTreatments(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      toast.error('Erro ao remover.');
    }
  }

  const filtered = treatments.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (duration: any) => {
    if (!duration) return '--';
    return String(duration) + ' min';
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase">
            <Tag size={28} className="text-pink-600" /> Catálogo de Serviços
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 ml-1">
            Gerencie protocolos, preços e duração
          </p>
        </div>
        
        <div className="flex gap-3">
            {/* BOTÃO MÁGICO DE IMPORTAÇÃO */}
            {treatments.length === 0 && (
                <Button 
                    onClick={handleImportDefaults}
                    disabled={importing}
                    variant="outline"
                    className="h-14 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-pink-500 hover:text-pink-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3"
                >
                    {importing ? <Loader2 className="animate-spin" /> : <Database size={18} />}
                    Importar Padrões
                </Button>
            )}

            <Link to="/services/new">
            <Button className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                <Plus size={18} className="text-pink-500" /> Criar Novo Serviço
            </Button>
            </Link>
        </div>
      </div>

      {/* BUSCA */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center group focus-within:ring-2 focus:ring-pink-500/20 transition-all">
        <div className="pl-4 text-gray-300 group-focus-within:text-pink-500 transition-colors">
            <Search size={22} />
        </div>
        <input 
            type="text"
            placeholder="Buscar procedimento (ex: Botox, Preenchimento)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 bg-transparent outline-none text-sm font-bold text-gray-700 dark:text-white placeholder-gray-400"
        />
      </div>

      {/* TABELA */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-50 dark:border-gray-700">
                <tr>
                  <th className="px-8 py-6">Procedimento</th>
                  <th className="px-8 py-6">Categoria</th>
                  <th className="px-8 py-6">Duração</th>
                  <th className="px-8 py-6">Valor Base</th>
                  <th className="px-8 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                        <Loader2 className="animate-spin text-pink-600 mx-auto mb-4" size={40} />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Carregando...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                   <tr>
                      <td colSpan={5} className="py-32 text-center">
                         <div className="flex flex-col items-center gap-4">
                            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-200">
                                <Sparkles size={40} />
                            </div>
                            <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">
                                Nenhum serviço encontrado.
                            </p>
                            {/* CORREÇÃO DO ERRO AQUI: MUDADO DE variant="link" para "ghost" */}
                            <Button variant="ghost" onClick={handleImportDefaults} className="text-pink-600 font-bold hover:bg-pink-50">
                                Clique aqui para importar sugestões
                            </Button>
                         </div>
                      </td>
                   </tr>
                ) : (
                  filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-pink-50/30 dark:hover:bg-gray-900/40 transition-colors group cursor-default">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <p className="text-base font-black text-gray-900 dark:text-white italic tracking-tighter uppercase group-hover:text-pink-600 transition-colors">{item.name}</p>
                            <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-0.5">{item.description || 'Sem descrição'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {item.category}
                        </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-wider">
                        <Clock size={16} className="text-orange-500" />
                        {formatDuration(item.duration)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 text-lg tracking-tighter">
                        <span className="text-xs font-bold text-emerald-400 mr-1">R$</span>
                        {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="ghost" 
                          className="h-10 px-4 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all"
                          onClick={() => navigate(`/services/${item.id}/edit`)}
                        >
                            <Edit size={16} /> Editar
                        </Button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}