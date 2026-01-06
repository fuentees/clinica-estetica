import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Save, Plus, Trash2, Stethoscope, Loader2, Printer, X 
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- TIPAGEM (INTEGRAL) ---
type ComponentItem = { name: string; quantity: string };
type TreatmentItem = { name: string; components: ComponentItem[]; observations: string };
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
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PrescriptionForm>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      title: "Recomendação Terapêutica",
      treatments: [
        {
          name: "",
          components: [{ name: "", quantity: "" }],
          observations: "",
        },
      ],
    },
  });

  const { fields: treatmentFields, append: appendTreatment, remove: removeTreatment } =
    useFieldArray({ control, name: "treatments" });

  const watchedValues = watch();

  // ---------------------------
  // CARREGAMENTO DOS DADOS (SaaS READY)
  // ---------------------------
  useEffect(() => {
    async function initPage() {
      try {
        setInitializing(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // 1. Pega ClinicID
        const { data: profile } = await supabase
            .from("profiles")
            .select("clinicId")
            .eq("id", user.id)
            .single();

        if (!profile?.clinicId) throw new Error("Sem clínica vinculada");
        setClinicId(profile.clinicId);

        // 2. Carrega Listas
        const [patsRes, profsRes] = await Promise.all([
          supabase.from("patients").select("*").eq("clinicId", profile.clinicId).order("name", { ascending: true }),
          supabase.from("profiles").select("*").eq("clinicId", profile.clinicId), 
        ]);

        setPatientsList(patsRes.data || []);
        setProfessionalsList(profsRes.data || []);

        // 3. Edição
        if (editId) {
          const { data: pres } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("id", editId)
            .single();

          if (pres) {
            reset({
              patient_id: pres.patientId,       
              professional_id: pres.professionalId,
              date: pres.date ? new Date(pres.date).toISOString().split("T")[0] : "",
              title: pres.notes,
              treatments: pres.medications || [],
            });
          }
        } else {
          const prof = profsRes.data?.find((p: any) => p.id === user.id);
          if (prof) setValue("professional_id", prof.id);
        }
      } catch (err) {
        toast.error("Erro ao sincronizar dados da clínica.");
        console.error(err);
      } finally {
        setInitializing(false);
      }
    }

    initPage();
  }, [editId, reset, setValue]);

  // ---------------------------
  // SALVAR RECEITA
  // ---------------------------
  const onSubmit = async (data: PrescriptionForm) => {
    try {
      setLoading(true);

      if (!data.patient_id) return toast.error("Selecione um paciente.");
      if (!data.professional_id) return toast.error("Selecione um profissional.");
      if (!clinicId) return toast.error("Erro de identificação da clínica.");

      const payload = {
        clinicId: clinicId,
        patientId: data.patient_id,
        professionalId: data.professional_id,
        notes: data.title,
        medications: data.treatments,
        date: new Date(data.date).toISOString(),
      };

      if (editId) {
        const { error } = await supabase.from("prescriptions").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Prescrição atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("prescriptions").insert(payload);
        if (error) throw error;
        toast.success("Nova receita registrada!");
        navigate("/prescriptions");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---
  const getProfessionalDetails = (id: string) => {
    if (!id) return null;
    return professionalsList.find((x) => x.id === id);
  };

  const getPatientName = (id: string) => {
    if (!id) return "........................................";
    const p = patientsList.find((x) => x.id === id);
    return p?.name || p?.full_name || p?.email || "Paciente";
  };

  const getCouncilLabel = (formacao?: string) => {
      if (!formacao) return "Registro";
      const f = formacao.toLowerCase();
      if (f.includes('bioméd') || f.includes('biomed')) return "CRBM";
      if (f.includes('farmac')) return "CRF";
      if (f.includes('enferm')) return "COREN";
      if (f.includes('fisiotera')) return "CREFITO";
      if (f.includes('medic') || f.includes('médic') || f.includes('dermatologista')) return "CRM";
      if (f.includes('estetic') || f.includes('estétic')) return "MEI/CNPJ";
      return "Registro";
  };

  // -----------------------------------------------------
  // LOGICA DE IMPRESSÃO (AJUSTADA: ASSINATURA + FONTE)
  // -----------------------------------------------------
  const handlePrint = () => {
    const content = document.getElementById("print-area")?.innerHTML;
    if (!content) return toast.error("Sem conteúdo para impressão.");
    const headHTML = document.querySelector("head")?.innerHTML || "";
    const printWindow = window.open("", "_blank", "width=800,height=1000");

    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          ${headHTML}
          <style>
            @page { margin: 0; }
            body { background: white !important; padding: 20mm; font-family: 'Inter', sans-serif; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-hidden { display: none !important; }
            
            /* --- AJUSTES DA ASSINATURA --- */
            .signature-img-print {
                max-height: 80px; 
                display: block; 
                margin: 0 auto 10px auto; /* Margem positiva para afastar da linha */
                position: relative; 
                z-index: 10;
                transform: translateY(-5px); /* Ajuste fino para subir */
            }

            /* --- AJUSTES DO NOME DO PACIENTE --- */
            .patient-name-print {
                font-size: 14px !important; /* Fonte reduzida conforme solicitado */
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  if (initializing)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="animate-spin w-12 h-12 text-pink-600 mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Acessando Arquivos da Clínica...</p>
      </div>
    );

  const profDetails = getProfessionalDetails(watchedValues.professional_id);
  const council = getCouncilLabel(profDetails?.formacao);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden animate-in fade-in duration-500">

      {/* LADO ESQUERDO: CONFIGURAÇÃO (45%) */}
      <div className="w-full md:w-1/2 lg:w-[45%] border-r bg-white dark:bg-gray-900 flex flex-col shadow-2xl">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/prescriptions")} className="rounded-2xl h-11 w-11 p-0 bg-gray-50 hover:bg-gray-100">
              <ArrowLeft size={22} />
            </Button>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter uppercase">{editId ? "Revisar" : "Nova"} <span className="text-pink-600">Receita</span></h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Editor de Documentos</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="h-11 px-4 border-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95">
              <Printer size={18} className="mr-2" /> PDF
            </Button>
            <Button disabled={loading} className="bg-gray-900 hover:bg-black text-white h-11 px-6 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95" onClick={handleSubmit(onSubmit)}>
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2 text-pink-500" /> Salvar</>}
            </Button>
          </div>
        </div>

        {/* FORMULÁRIO SCROLLABLE */}
        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar pb-32">

          {/* DADOS BASE */}
          <div className="bg-gray-50 dark:bg-gray-800/40 p-8 rounded-[2rem] space-y-6 border border-gray-100 dark:border-gray-800 shadow-inner">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Paciente Selecionado</label>
              <select {...register("patient_id", { required: true })} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm">
                <option value="">Buscar paciente...</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.full_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Emitente</label>
                <select {...register("professional_id")} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm">
                  {professionalsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Emissão</label>
                <input type="date" {...register("date")} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cabeçalho do Documento</label>
              <input {...register("title")} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm" placeholder="Ex: Recomendação Pós-Peeling" />
            </div>
          </div>

          {/* LISTA DE TRATAMENTOS DINÂMICA */}
          <div className="space-y-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Stethoscope size={14} className="text-pink-600" /> Itens da Prescrição
            </h2>
            {treatmentFields.map((field, index) => (
              <div key={field.id} className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 relative shadow-lg animate-in slide-in-from-bottom-4 duration-500">
                <button type="button" onClick={() => removeTreatment(index)} className="absolute right-6 top-6 h-10 w-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <Trash2 size={18} />
                </button>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Protocolo / Medicamento</label>
                    <input
                      {...register(`treatments.${index}.name` as const)}
                      className="w-full h-12 px-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl font-bold focus:border-pink-500 transition-colors outline-none"
                      placeholder="Ex: SkinCare Noturno"
                    />
                  </div>

                  <TreatmentComponents index={index} control={control} register={register} />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instruções de Uso (Posologia)</label>
                    <textarea
                      {...register(`treatments.${index}.observations` as const)}
                      className="w-full p-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl font-medium text-sm focus:border-pink-500 transition-colors outline-none resize-none h-24"
                      placeholder="Ex: Aplicar 3 gotas antes de dormir..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => appendTreatment({ name: "", components: [{ name: "", quantity: "" }], observations: "" })}
              className="w-full py-6 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] text-gray-400 hover:text-pink-600 hover:border-pink-100 transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"
            >
              <Plus size={20} /> Adicionar Novo Protocolo
            </button>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: PREVIEW A4 (55%) */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] bg-gray-50 dark:bg-gray-950 items-center justify-center p-12 overflow-y-auto custom-scrollbar">
        <div id="print-area" className="w-full max-w-[21cm] min-h-[29.7cm] bg-white p-[2.5cm] shadow-2xl flex flex-col justify-between text-gray-800 relative ring-1 ring-gray-100">
          
          <div>
            {/* Logo/Nome Clínica */}
            <div className="border-b-4 border-pink-600 pb-8 mb-10 flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter text-gray-900 uppercase">VF <span className="text-pink-600"> Clinic</span></h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Health & Visual Excellence</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Emissão</p>
                <p className="text-sm font-black italic">{new Date(watchedValues.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Cabeçalho Paciente */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-12">
              {/* Mudado de Destinatário para Paciente */}
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Paciente</p>
              {/* Classe nova para impressão reduzir a fonte */}
              <p className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase patient-name-print">{getPatientName(watchedValues.patient_id)}</p>
            </div>

            <div className="text-center mb-16">
              <h3 className="text-xl font-black uppercase italic tracking-[0.2em] border-b-2 border-gray-900 inline-block pb-1">
                {watchedValues.title}
              </h3>
            </div>

            {/* Itens da Receita */}
            <div className="space-y-12">
              {watchedValues.treatments?.map((t, idx) => (
                <div key={idx} className="relative pl-8 border-l-2 border-pink-100">
                  <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                  <h4 className="font-black text-lg text-gray-900 uppercase tracking-tighter italic mb-4">{t.name}</h4>

                  {t.components?.length > 0 && (
                    <ul className="mb-6 space-y-2">
                      {t.components.map((c, i) => c.name && (
                        <li key={i} className="flex justify-between items-center text-gray-600 border-b border-gray-50 pb-1 w-2/3 text-sm">
                          <span className="font-medium">{c.name}</span>
                          <span className="font-black italic text-gray-400">{c.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {t.observations && (
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-sm font-medium leading-relaxed italic text-gray-500">
                        {t.observations}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ASSINATURA AUTOMÁTICA */}
          <div className="mt-20 text-center">
            {profDetails?.signature_data ? (
               <div className="flex justify-center -mb-6 relative z-10">
                  {/* Classe para impressão ajustar posição */}
                  <img src={profDetails.signature_data} className="h-24 object-contain signature-img-print" alt="Assinatura" />
               </div>
            ) : (
               <div className="h-16"></div>
            )}

            <div className="border-t-2 border-gray-200 pt-6 w-1/2 mx-auto">
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest italic">
                   Dr(a). {profDetails ? `${profDetails.first_name} ${profDetails.last_name}` : "Especialista"}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">
                    {council}: {profDetails?.registration_number || '---'}
                </p>
            </div>
            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] mt-8">Documento Oficial Autenticado</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE DE FÓRMULAS ---
function TreatmentComponents({ index, control, register }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `treatments.${index}.components`,
  });

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Fórmula Personalizada / Ativos</label>
      <div className="space-y-3">
        {fields.map((field, k) => (
          <div key={field.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
            <input
              {...register(`treatments.${index}.components.${k}.name`)}
              placeholder="Nome do Ativo"
              className="flex-1 h-10 px-3 bg-white dark:bg-gray-800 border-0 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-pink-500"
            />
            <input
              {...register(`treatments.${index}.components.${k}.quantity`)}
              placeholder="Qtd"
              className="w-20 h-10 px-3 bg-white dark:bg-gray-800 border-0 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button type="button" onClick={() => remove(k)} className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-rose-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ name: "", quantity: "" })}
          className="h-10 px-4 text-[10px] text-pink-600 font-black uppercase tracking-widest flex items-center gap-2 hover:bg-pink-50 rounded-xl transition-all mt-2"
        >
          <Plus size={14} /> Novo Ativo
        </button>
      </div>
    </div>
  );
}