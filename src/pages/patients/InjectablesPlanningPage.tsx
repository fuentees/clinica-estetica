import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Plus, Trash2, Calendar, Syringe, MapPin, Loader2, ClipboardCheck, History, Target, Info, Link as LinkIcon } from 'lucide-react';
import { BodyMappingComponent } from '../../components/anamnesis/BodyMappingComponent';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { usePatientTreatments } from '../../hooks/usePatientTreatments'; // Hook de tratamentos

// --- INTERFACES ---
interface MarkedArea {
  id: string;
  x: number;
  y: number;
  label: string;
  description?: string;
  type: 'facial' | 'corporal';
}

interface InjectableProduct {
  id: string;
  name: string;
  brand: string;
  volume: string;
  dilution?: string;
}

interface InjectablePlan {
  id?: string;
  patient_id: string;
  clinic_id: string;
  treatment_id?: string; // ✅ NOVO CAMPO: Vínculo com Tratamento Maior
  date: string;
  areas: MarkedArea[];
  products: InjectableProduct[];
  notes: string;
  total_units?: number;
  professional_notes?: string;
  next_session_date?: string;
}

export function InjectablesPlanningPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  
  // ✅ Busca Tratamentos Ativos do Paciente
  const { data: patientTreatments, isLoading: loadingTreatments } = usePatientTreatments(patientId || '');

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<InjectablePlan[]>([]);
  const [viewMode, setViewMode] = useState<'face' | 'body'>('face');

  const [currentPlan, setCurrentPlan] = useState<InjectablePlan>({
    patient_id: patientId || '',
    clinic_id: '', 
    treatment_id: '', // Inicializa vazio
    date: new Date().toISOString().split('T')[0],
    areas: [],
    products: [],
    notes: '',
    total_units: 0,
    professional_notes: '',
    next_session_date: '',
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState<InjectableProduct>({
    id: '', name: '', brand: '', volume: '', dilution: '',
  });

  const commonProducts = [
    { name: 'Toxina Botulínica', brand: 'Botox', volume: '100U' },
    { name: 'Toxina Botulínica', brand: 'Dysport', volume: '300U' },
    { name: 'Ácido Hialurônico', brand: 'Juvederm', volume: '1ml' },
    { name: 'Ácido Hialurônico', brand: 'Restylane', volume: '1ml' },
    { name: 'Sculptra', brand: 'Galderma', volume: '5ml' },
    { name: 'Radiesse', brand: 'Merz', volume: '1.5ml' },
  ];

  useEffect(() => {
    if (patientId) loadPlans();
  }, [patientId]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('injectable_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });
      if (error) throw error;
      if (data) setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleSavePlan = async () => {
    if (!currentPlan.areas.length) return toast.error('Marque pelo menos uma área');
    if (!currentPlan.products.length) return toast.error('Adicione pelo menos um produto');

    setLoading(true);
    try {
      // Prepara payload, removendo tratamento vazio se não selecionado
      const payload = {
          ...currentPlan,
          clinic_id: profile?.clinic_id,
          patient_id: patientId,
          treatment_id: currentPlan.treatment_id || null // Garante null se vazio
      };

      const { error } = await supabase.from('injectable_plans').insert([payload]);

      if (error) throw error;

      toast.success('Plano salvo com sucesso!');
      loadPlans();
      
      // Reset do formulário
      setCurrentPlan({
        patient_id: patientId || '',
        clinic_id: '',
        treatment_id: '', // Reset
        date: new Date().toISOString().split('T')[0],
        areas: [],
        products: [],
        notes: '',
        total_units: 0,
        professional_notes: '',
        next_session_date: '',
      });
    } catch (error) {
      toast.error('Erro ao salvar plano');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.brand) return toast.error('Preencha nome e marca');
    const productWithId = { ...newProduct, id: `prod-${Date.now()}` };
    setCurrentPlan({ ...currentPlan, products: [...currentPlan.products, productWithId] });
    setNewProduct({ id: '', name: '', brand: '', volume: '', dilution: '' });
    setShowProductForm(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter">
            <Syringe className="text-pink-600" size={32} />
            Planejamento <span className="text-pink-600">Injetáveis</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Mapeamento técnico e registro de substâncias</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button onClick={() => setViewMode('face')} className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${viewMode === 'face' ? 'bg-white dark:bg-gray-800 shadow-md text-pink-600' : 'text-gray-400'}`}>Face</button>
          <button onClick={() => setViewMode('body')} className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${viewMode === 'body' ? 'bg-white dark:bg-gray-800 shadow-md text-pink-600' : 'text-gray-400'}`}>Corpo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna do Mapa (Lado Esquerdo) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[700px] relative">
          <div className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <Target size={14}/> Interactive Mapping Mode
          </div>
          <BodyMappingComponent
            value={currentPlan.areas}
            onChange={(areas) => setCurrentPlan({ ...currentPlan, areas })}
            viewMode={viewMode}
          />
        </div>

        {/* Coluna de Dados (Lado Direito) */}
        <div className="space-y-6">
          
          {/* ✅ NOVO: Seção de Vínculo com Tratamento */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <LinkIcon size={14} className="text-blue-500"/> Vincular a Tratamento
             </h2>
             {loadingTreatments ? (
                 <div className="h-10 w-full bg-gray-100 animate-pulse rounded-xl"></div>
             ) : (
                 <select 
                    value={currentPlan.treatment_id || ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, treatment_id: e.target.value})}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-0 font-bold text-sm text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-pink-500"
                 >
                    <option value="">-- Sem vínculo (Avulso) --</option>
                    {patientTreatments?.map((t: any) => (
                        <option key={t.id} value={t.id}>
                            {t.treatments?.name || 'Tratamento sem nome'} 
                            {t.status === 'active' ? ' (Em andamento)' : ''}
                        </option>
                    ))}
                 </select>
             )}
          </div>

          {/* Seção 1: Datas */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-4">
              <Calendar size={18} className="text-pink-500" /> Datas da Sessão
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Data da Aplicação *</label>
                <input type="date" value={currentPlan.date} onChange={(e) => setCurrentPlan({ ...currentPlan, date: e.target.value })} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-pink-500 transition-all font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Próxima Sessão (Retorno)</label>
                <input type="date" value={currentPlan.next_session_date || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, next_session_date: e.target.value })} className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-pink-500 transition-all font-bold" />
              </div>
            </div>
          </div>

          {/* Seção 2: Insumos */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2"><ClipboardCheck size={18} className="text-pink-600"/> Produtos</h3>
              <button onClick={() => setShowProductForm(!showProductForm)} className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-xl hover:scale-110 transition-transform"><Plus size={20} /></button>
            </div>

            {showProductForm && (
              <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                <input placeholder="Nome do Produto *" className="w-full h-10 px-3 rounded-lg border-0 bg-white dark:bg-gray-800 text-sm" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <input placeholder="Marca *" className="w-full h-10 px-3 rounded-lg border-0 bg-white dark:bg-gray-800 text-sm" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Volume/Unid" className="h-10 px-3 rounded-lg border-0 bg-white dark:bg-gray-800 text-sm" value={newProduct.volume} onChange={e => setNewProduct({...newProduct, volume: e.target.value})} />
                  <input placeholder="Diluição" className="h-10 px-3 rounded-lg border-0 bg-white dark:bg-gray-800 text-sm" value={newProduct.dilution} onChange={e => setNewProduct({...newProduct, dilution: e.target.value})} />
                </div>
                <Button onClick={handleAddProduct} className="w-full h-10 bg-pink-600 text-white rounded-lg font-bold uppercase text-[10px]">Adicionar Produto</Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {commonProducts.map((p, i) => (
                <button key={i} onClick={() => setCurrentPlan({...currentPlan, products: [...currentPlan.products, {...p, id: `q-${Date.now()}-${i}`, dilution: ''}]})} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-pink-600 rounded-full text-[10px] font-black uppercase border border-gray-100 transition-all">+ {p.brand}</button>
              ))}
            </div>

            <div className="space-y-3">
              {currentPlan.products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 group">
                  <div>
                    <p className="font-black text-gray-800 dark:text-white text-sm">{p.brand} - {p.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{p.volume} {p.dilution && `• Dil: ${p.dilution}`}</p>
                  </div>
                  <button onClick={() => setCurrentPlan({...currentPlan, products: currentPlan.products.filter(x => x.id !== p.id)})} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Observações e Total Units */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
             <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Total de Unidades (Geral)</label>
                <input type="number" value={currentPlan.total_units || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, total_units: Number(e.target.value) })} placeholder="Ex: 50" className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-0 font-bold text-gray-700 dark:text-white" />
             </div>
             <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Notas da Sessão</label>
                <textarea value={currentPlan.notes} onChange={e => setCurrentPlan({...currentPlan, notes: e.target.value})} placeholder="Observações gerais sobre a aplicação..." className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-0 text-sm h-24 resize-none" />
             </div>
             <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Anotações Profissionais (Privadas)</label>
                <textarea value={currentPlan.professional_notes || ''} onChange={e => setCurrentPlan({...currentPlan, professional_notes: e.target.value})} placeholder="Técnicas, profundidade, reações..." className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-0 text-sm h-24 resize-none" />
             </div>
             
             <Button onClick={handleSavePlan} disabled={loading} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02]">
               {loading ? <Loader2 className="animate-spin" /> : <Save size={20} className="mr-2"/>} Salvar Plano Completo
             </Button>
          </div>

          {/* Histórico Simplificado */}
          {plans.length > 0 && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14}/> Últimos Planos</h3>
              <div className="space-y-3">
                {plans.slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex justify-between items-center">
                    <p className="text-xs font-black">{new Date(p.date).toLocaleDateString()}</p>
                    <div className="text-[9px] font-bold text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-2 py-1 rounded-lg uppercase">{p.total_units} units</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}