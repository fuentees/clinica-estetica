import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Save, Plus, Trash2, Search, User, Stethoscope, Loader2, Printer, X 
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- TIPAGEM ---
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

  // React Hook Form
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
  // CARREGAMENTO DOS DADOS
  // ---------------------------
  useEffect(() => {
    async function initPage() {
      try {
        setInitializing(true);

        const [patsRes, profsRes] = await Promise.all([
          supabase.from("patients").select("*").order("name", { ascending: true }),
          supabase.from("profiles").select("*"), 
        ]);

        setPatientsList(patsRes.data || []);
        setProfessionalsList(profsRes.data || []);

        if (editId) {
          const { data: pres } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("id", editId)
            .single();

          if (pres) {
            reset({
              patient_id: pres.patient_id,
              professional_id: pres.professional_id,
              date: pres.date || pres.created_at?.split("T")[0],
              title: pres.notes,
              treatments: pres.medications || [],
            });
          }
        } else {
          const { data: userData } = await supabase.auth.getUser();
          const user = userData?.user;

          if (user) {
            const prof = profsRes.data?.find((p: any) => p.id === user.id);
            if (prof) setValue("professional_id", prof.id);
          }
        }
      } catch (err) {
        toast.error("Erro ao carregar dados do sistema.");
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

      const payload = {
        patient_id: data.patient_id,
        professional_id: data.professional_id,
        notes: data.title,
        medications: data.treatments,
        created_at: new Date().toISOString(),
      };

      if (editId) {
        const { error } = await supabase.from("prescriptions").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Receita atualizada!");
      } else {
        const { error } = await supabase.from("prescriptions").insert(payload);
        if (error) throw error;
        toast.success("Receita criada!");
        navigate("/prescriptions");
      }
    } catch (err: any) {
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

  // --- LÓGICA DO CONSELHO (Prioridade para Biomedicina) ---
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
  // IMPRESSÃO (PDF)
  // -----------------------------------------------------
  const handlePrint = () => {
    const content = document.getElementById("print-area")?.innerHTML;
    if (!content) return alert("Nenhum conteúdo para impressão.");

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
            body { background: white !important; padding: 20mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            .signature-img-print {
                max-height: 80px; 
                display: block; 
                margin: 0 auto -15px auto; 
                position: relative; 
                z-index: 10;
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
      }, 500);
    };
  };

  if (initializing)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-pink-600" />
      </div>
    );

  const profDetails = getProfessionalDetails(watchedValues.professional_id);
  const council = getCouncilLabel(profDetails?.formacao);

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">

      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="w-full md:w-1/2 lg:w-[45%] border-r bg-white dark:bg-gray-900 flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/prescriptions")} className="rounded-full h-10 w-10 p-0">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-bold">{editId ? "Editar Receita" : "Nova Receita"}</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer size={18} className="mr-2" /> Imprimir
            </Button>
            <Button className="bg-pink-600 text-white" onClick={handleSubmit(onSubmit)}>
              <Save size={18} className="mr-2" /> Salvar
            </Button>
          </div>
        </div>

        {/* CAMPOS */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Paciente */}
          <div className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-xl space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Paciente</label>
              <select {...register("patient_id", { required: true })} className="w-full p-2.5 rounded-xl border mt-1 bg-white">
                <option value="">Selecione...</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.full_name || p.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Profissional</label>
                <select {...register("professional_id")} className="w-full p-2.5 rounded-xl border mt-1 bg-white">
                  <option value="">Selecione...</option>
                  {professionalsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                <input type="date" {...register("date")} className="w-full p-2.5 rounded-xl border mt-1 bg-white" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
              <input {...register("title")} className="w-full p-2.5 rounded-xl border mt-1 bg-white" />
            </div>
          </div>

          {/* Tratamentos */}
          <div className="space-y-4">
            {treatmentFields.map((field, index) => (
              <div key={field.id} className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 relative">
                <button type="button" onClick={() => removeTreatment(index)} className="absolute right-4 top-4 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Tratamento</label>
                    <input
                      {...register(`treatments.${index}.name` as const)}
                      className="w-full p-2 border rounded-lg mt-1"
                      placeholder="Ex: Creme Noturno"
                    />
                  </div>

                  <TreatmentComponents index={index} control={control} register={register} />

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Observações</label>
                    <textarea
                      {...register(`treatments.${index}.observations` as const)}
                      className="w-full p-2 border rounded-lg mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => appendTreatment({ name: "", components: [{ name: "", quantity: "" }], observations: "" })}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-pink-600 font-bold text-xs uppercase tracking-wider"
            >
              <Plus size={16} className="mr-2 inline" /> Adicionar Item
            </button>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: PREVIEW A4 (IMPRIME O CONTEÚDO) */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] bg-gray-100 items-center justify-center p-8 overflow-y-auto">
        <div id="print-area" className="w-full max-w-[21cm] min-h-[29.7cm] bg-white p-[2cm] rounded shadow-lg flex flex-col justify-between text-gray-800">

          {/* CONTEÚDO SUPERIOR */}
          <div>
            {/* Cabeçalho */}
            <div className="border-b-2 border-pink-600 pb-6 mb-6 flex justify-between">
              <div>
                <h2 className="text-3xl font-serif font-bold text-pink-600">Clínica Estética</h2>
                <p className="text-sm text-gray-500">
                    {profDetails ? `${profDetails.first_name} ${profDetails.last_name}` : "..."}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-gray-500 tracking-widest">Receituário</p>
                <p className="text-sm">{new Date(watchedValues.date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Paciente */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded mb-8">
              <p className="text-xs uppercase text-gray-400 mb-1 font-bold">Para:</p>
              <p className="text-xl font-serif font-bold text-gray-800">{getPatientName(watchedValues.patient_id)}</p>
            </div>

            {/* Título */}
            <div className="text-center my-8">
              <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-gray-800 inline-block pb-1">
                {watchedValues.title}
              </h3>
            </div>

            {/* Lista de Tratamentos */}
            <div className="space-y-8">
              {watchedValues.treatments?.map((t, idx) => (
                <div key={idx} className="relative pl-6 border-l-4 border-pink-200">
                  <div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-pink-500 border-2 border-white"></div>
                  <h4 className="font-bold text-lg text-gray-800 mb-2">{t.name}</h4>

                  {t.components?.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {t.components.map(
                        (c, i) =>
                          c.name && (
                            <li key={i} className="flex justify-between text-gray-700 border-b border-gray-100 pb-1 w-3/4 text-sm">
                              <span>{c.name}</span>
                              <span className="font-bold text-xs">{c.quantity}</span>
                            </li>
                          )
                      )}
                    </ul>
                  )}

                  {t.observations && (
                    <p className="text-sm italic text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                        "{t.observations}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ + ASSINATURA */}
          <div className="mt-12 text-center">
            
            {/* Imagem da Assinatura (se existir) */}
            {profDetails?.signature_url ? (
               <div className="flex justify-center -mb-4 relative z-10">
                  <img src={profDetails.signature_url} className="h-20 object-contain signature-img-print" alt="Assinatura" />
               </div>
            ) : (
               <div className="h-16"></div>
            )}

            <div className="border-t border-gray-400 pt-4 w-2/3 mx-auto">
                <p className="text-sm font-bold text-gray-900">
                    Dr(a). {profDetails ? `${profDetails.first_name} ${profDetails.last_name}` : "Profissional"}
                </p>
                
                {/* AQUI ESTÁ A CORREÇÃO: MOSTRA APENAS O CONSELHO E NÚMERO */}
                <p className="text-xs text-gray-500 uppercase mt-1">
                    {council}: {profDetails?.registration_number || '---'}
                </p>
            </div>
            
            <p className="text-[10px] text-gray-300 mt-4">Documento gerado digitalmente.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// -----------------------------------
// COMPONENTE DE COMPONENTES
// -----------------------------------
function TreatmentComponents({ index, control, register }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `treatments.${index}.components`,
  });

  return (
    <div className="bg-gray-50 p-3 border border-dashed border-gray-300 rounded-xl">
      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">
        Fórmula / Componentes
      </label>

      <div className="space-y-2">
        {fields.map((field, k) => (
          <div key={field.id} className="flex gap-2">
            <input
              {...register(`treatments.${index}.components.${k}.name`)}
              placeholder="Ativo"
              className="flex-1 p-2 border rounded-lg text-xs"
            />
            <input
              {...register(`treatments.${index}.components.${k}.quantity`)}
              placeholder="Qtd"
              className="w-16 p-2 border rounded-lg text-xs"
            />
            <button type="button" onClick={() => remove(k)}>
              <X size={14} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ name: "", quantity: "" })}
          className="text-[10px] text-pink-600 font-bold flex items-center gap-1 mt-2"
        >
          <Plus size={10} /> Add Componente
        </button>
      </div>
    </div>
  );
}