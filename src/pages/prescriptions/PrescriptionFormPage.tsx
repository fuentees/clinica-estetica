import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Save, Plus, Trash2, Calendar, 
  Search, User, Stethoscope, Loader2, X, Printer 
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- TIPAGEM ---
type ComponentItem = {
    name: string;
    quantity: string;
};

type TreatmentItem = {
    name: string;
    components: ComponentItem[];
    observations: string;
};

type PrescriptionForm = {
    patient_id: string;
    professional_id: string;
    date: string;
    title: string;
    treatments: TreatmentItem[];
};

export function PrescriptionFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id'); // Recupera ID se for edição/visualização

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Listas
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);

  // Hook Form
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PrescriptionForm>({
    defaultValues: {
        date: new Date().toISOString().split('T')[0],
        title: "Recomendação Terapêutica",
        treatments: [{ name: "", components: [{ name: "", quantity: "" }], observations: "" }]
    }
  });

  const { fields: treatmentFields, append: appendTreatment, remove: removeTreatment } = useFieldArray({
    control,
    name: "treatments"
  });

  // Monitora mudanças para atualizar o papel A4 em tempo real
  const watchedValues = watch(); 

  // --- CARREGAR DADOS ---
  useEffect(() => {
    async function loadData() {
        try {
            setDataLoading(true);
            console.log("--- INICIANDO CARREGAMENTO ---");

            // 1. Buscar Pacientes (Traz tudo para garantir)
            const { data: pats, error: errPat } = await supabase
                .from('patients')
                .select('*') 
                .order('created_at', { ascending: false });
            
            if (errPat) console.error("Erro Pacientes:", errPat);
            setPatientsList(pats || []);

            // 2. Buscar Profissionais (Traz tudo da tabela PROFILES)
            const { data: profs, error: errProf } = await supabase
                .from('profiles')
                .select('*');
            
            if (errProf) console.error("Erro Profissionais:", errProf);
            setProfessionalsList(profs || []);

            // 3. Se for Edição, carrega a receita
            if (editId) {
                const { data: prescription, error: loadError } = await supabase
                    .from('prescriptions')
                    .select('*')
                    .eq('id', editId)
                    .single();
                
                if (loadError) throw loadError;
                
                if (prescription) {
                    reset({
                        patient_id: prescription.patient_id,
                        professional_id: prescription.professional_id,
                        date: prescription.date || prescription.created_at.split('T')[0],
                        title: prescription.notes,
                        treatments: prescription.medications || []
                    });
                }
            } else {
                // Se for Nova, seleciona usuário atual
                const { data: { user } } = await supabase.auth.getUser();
                if (user && profs) {
                    const currentUser = profs.find(p => p.id === user.id);
                    if (currentUser) setValue('professional_id', currentUser.id);
                }
            }

        } catch (error) {
            console.error("Erro Geral:", error);
            toast.error("Erro ao carregar dados.");
        } finally {
            setDataLoading(false);
        }
    }
    loadData();
  }, [setValue, reset, editId]);

  // --- SALVAR ---
  const onSubmit = async (data: PrescriptionForm) => {
    try {
        setLoading(true);
        console.log("Tentando salvar:", data);

        // Validação Manual
        if (!data.patient_id) {
            toast.error("Selecione um paciente!");
            setLoading(false);
            return;
        }

        const payload = {
            patient_id: data.patient_id,
            professional_id: data.professional_id,
            notes: data.title,
            medications: data.treatments,
            // Se tiver coluna 'date' no banco usa ela, senão o created_at resolve
            created_at: new Date().toISOString() 
        };

        let error;

        if (editId) {
             const res = await supabase.from('prescriptions').update(payload).eq('id', editId);
             error = res.error;
        } else {
             const res = await supabase.from('prescriptions').insert(payload);
             error = res.error;
        }

        if (error) throw error;
        toast.success("Receita salva com sucesso!");
        
        if (!editId) navigate('/prescriptions');

    } catch (error: any) {
        console.error(error);
        toast.error("Erro ao salvar: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- TRATAMENTO DE ERROS DO BOTÃO ---
  const onError = (errors: any) => {
      console.log("Erros de validação:", errors);
      toast.error("Preencha os campos obrigatórios (Paciente, Profissional, Nome do Tratamento)");
  };

  // --- HELPERS VISUAIS ROBUSTOS ---
  const getProfName = (id: string) => {
      if (!id) return '__________________________';
      const p = professionalsList.find(prof => prof.id === id);
      
      if (!p) return 'Profissional não encontrado';
      
      // Tenta montar o nome de todas as formas possíveis
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      return fullName || p.name || p.email || 'Profissional Sem Nome';
  };

  const getPatientName = (id: string) => {
      if (!id) return '__________________________';
      const p = patientsList.find(pat => pat.id === id);
      
      if (!p) return 'Paciente não encontrado';

      // Tenta montar o nome de todas as formas possíveis
      return p.name || p.full_name || p.nome || p.email || `Paciente (ID: ${p.id.slice(0,5)})`;
  };

  const handlePrint = () => {
      window.print();
  };

  if (dataLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row h-screen overflow-hidden main-container">
      
      {/* CSS DE IMPRESSÃO - FIXED E Z-INDEX ALTO */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          
          /* Esconde tudo */
          body * {
            visibility: hidden;
          }
          
          /* Exibe APENAS a área de impressão */
          #print-area, #print-area * {
            visibility: visible;
          }
          
          /* Posiciona o papel no topo */
          #print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 999999 !important;
            background: white !important;
            color: black !important; /* Força cor preta */
          }
          
          .no-print { display: none !important; }
        }
      `}</style>

      {/* --- LADO ESQUERDO: EDITOR (no-print) --- */}
      <div className="w-full md:w-1/2 lg:w-[45%] h-full flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shadow-xl no-print">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/prescriptions')} className="rounded-full h-10 w-10 p-0 hover:bg-gray-100">
                      <ArrowLeft size={20}/>
                  </Button>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editId ? 'Editar Receita' : 'Nova Receita'}
                    </h1>
                  </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} title="Imprimir">
                    <Printer size={18} className="mr-2"/> Imprimir
                </Button>
                
                {/* BOTÃO SALVAR COM TRATAMENTO DE ERRO */}
                <Button onClick={handleSubmit(onSubmit, onError)} disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg">
                    {loading ? <Loader2 className="animate-spin mr-2"/> : <Save size={18} className="mr-2"/>} Salvar
                </Button>
              </div>
          </div>

          {/* Form Scrollável */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                  
                  {/* SELECT PACIENTE */}
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Paciente</label>
                      <div className="relative">
                          <select 
                            {...register('patient_id', { required: true })} 
                            className={`w-full p-2.5 pl-3 pr-10 rounded-xl border ${errors.patient_id ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-900 outline-none focus:ring-2 focus:ring-pink-500 text-sm appearance-none`}
                          >
                              <option value="" style={{color: 'gray'}}>Selecione...</option>
                              {patientsList.map(p => (
                                  <option key={p.id} value={p.id} style={{color: 'black'}}>
                                      {/* Mostra nome ou fallback */}
                                      {p.name || p.full_name || `(Sem Nome - ID: ${p.id.slice(0,4)}...)`}
                                  </option>
                              ))}
                          </select>
                          <User size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                      </div>
                      {errors.patient_id && <span className="text-xs text-red-500">Obrigatório</span>}
                  </div>

                  {/* SELECT PROFISSIONAL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Profissional</label>
                          <div className="relative">
                              <select 
                                {...register('professional_id', { required: true })} 
                                className={`w-full p-2.5 pl-3 pr-10 rounded-xl border ${errors.professional_id ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-900 outline-none focus:ring-2 focus:ring-pink-500 text-sm appearance-none`}
                              >
                                  <option value="" style={{color: 'gray'}}>Selecione...</option>
                                  {professionalsList.map(p => {
                                      // Monta o nome do profissional para o dropdown
                                      const pName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || p.email;
                                      return (
                                          <option key={p.id} value={p.id} style={{color: 'black'}}>
                                              {pName}
                                          </option>
                                      );
                                  })}
                              </select>
                              <Stethoscope size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                          </div>
                          {errors.professional_id && <span className="text-xs text-red-500">Obrigatório</span>}
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label>
                          <input type="date" {...register('date')} className="w-full p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-pink-500 text-sm"/>
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título</label>
                      <input type="text" {...register('title')} className="w-full p-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium"/>
                  </div>
              </div>

              {/* Tratamentos */}
              <div className="space-y-4">
                  {treatmentFields.map((field, index) => (
                      <div key={field.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 relative">
                          <button onClick={() => removeTreatment(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tratamento</label>
                                  <div className="relative">
                                      <input 
                                        {...register(`treatments.${index}.name` as const, { required: true })} 
                                        className={`w-full p-2 rounded-lg border ${errors.treatments?.[index]?.name ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-900 outline-none focus:border-pink-500 text-sm font-medium`} 
                                        placeholder="Ex: Creme Noturno" 
                                      />
                                      <Search size={14} className="absolute right-3 top-2.5 text-gray-400"/>
                                  </div>
                                  {errors.treatments?.[index]?.name && <span className="text-[10px] text-red-500">Nome do tratamento é obrigatório</span>}
                              </div>
                              <TreatmentComponents index={index} control={control} register={register} />
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Observações</label>
                                  <textarea {...register(`treatments.${index}.observations` as const)} rows={2} className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-900 resize-none" placeholder="Modo de uso..." />
                              </div>
                          </div>
                      </div>
                  ))}
                  <button onClick={() => appendTreatment({ name: "", components: [{ name: "", quantity: "" }], observations: "" })} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50 transition-all flex items-center justify-center gap-2 text-sm font-bold">
                      <Plus size={16}/> Adicionar Item
                  </button>
              </div>
          </div>
      </div>

      {/* --- LADO DIREITO: PREVIEW (PAPEL A4 - ID print-area) --- */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] bg-gray-100 dark:bg-gray-950 items-center justify-center p-8 overflow-y-auto">
          <div id="print-area" className="w-full max-w-[21cm] min-h-[29.7cm] bg-white text-gray-900 shadow-2xl rounded-sm p-[2cm] relative transition-all scale-[0.85] lg:scale-100 origin-top">
              
              <div className="border-b-2 border-pink-600 pb-6 mb-8 flex justify-between items-end">
                  <div>
                      <h2 className="text-3xl font-serif font-bold text-gray-800">Clinica Estética</h2>
                      <p className="text-sm text-gray-500 mt-1">{getProfName(watchedValues.professional_id)}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Receituário</p>
                      <p className="text-sm font-medium">{new Date(watchedValues.date).toLocaleDateString()}</p>
                  </div>
              </div>

              <div className="space-y-8">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">Para:</p>
                      <p className="text-xl font-serif text-gray-900 font-bold">{getPatientName(watchedValues.patient_id)}</p>
                  </div>

                  <div className="text-center my-8">
                      <h3 className="text-lg font-bold uppercase tracking-widest border-b border-gray-200 inline-block pb-1">{watchedValues.title}</h3>
                  </div>

                  <div className="space-y-8">
                      {watchedValues.treatments?.map((t, idx) => (
                          <div key={idx} className="relative pl-6 border-l-2 border-pink-200">
                              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-pink-500"></div>
                              <h4 className="font-bold text-lg text-gray-800 mb-1">{t.name || 'Nome do Tratamento'}</h4>
                              
                              {t.components && t.components.length > 0 && t.components[0].name && (
                                  <ul className="mb-2 space-y-1 mt-2">
                                      {t.components.map((comp, cIdx) => (
                                          comp.name && (
                                              <li key={cIdx} className="text-sm text-gray-600 flex justify-between border-b border-dotted border-gray-300 pb-0.5 w-3/4">
                                                  <span>{comp.name}</span>
                                                  <span className="font-mono text-xs font-bold">{comp.quantity}</span>
                                              </li>
                                          )
                                      ))}
                                  </ul>
                              )}

                              {t.observations && (
                                  <p className="text-sm text-gray-600 italic mt-2 text-justify">
                                      "{t.observations}"
                                  </p>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="absolute bottom-[2cm] left-[2cm] right-[2cm] text-center border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-400">Documento gerado digitalmente.</p>
                  <p className="text-sm font-bold text-gray-600 mt-2">{getProfName(watchedValues.professional_id)}</p>
              </div>
          </div>
      </div>

    </div>
  );
}

// Subcomponente
function TreatmentComponents({ index, control, register }: any) {
    const { fields, append, remove } = useFieldArray({ control, name: `treatments.${index}.components` });
    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Fórmula / Componentes</label>
            <div className="space-y-2">
                {fields.map((field, k) => (
                    <div key={field.id} className="flex gap-2">
                        <input {...register(`treatments.${index}.components.${k}.name` as const)} placeholder="Ativo" className="flex-1 p-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900" />
                        <input {...register(`treatments.${index}.components.${k}.quantity` as const)} placeholder="Qtd" className="w-16 p-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900" />
                        <button type="button" onClick={() => remove(k)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                    </div>
                ))}
                <button type="button" onClick={() => append({ name: "", quantity: "" })} className="text-[10px] text-pink-600 font-bold flex items-center gap-1 hover:underline"><Plus size={10}/> Add Componente</button>
            </div>
        </div>
    )
}