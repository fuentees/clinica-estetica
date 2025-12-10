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
          supabase.from("patients").select("*").order("created_at", { ascending: false }),
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
        const { error } = await supabase
          .from("prescriptions")
          .update(payload)
          .eq("id", editId);
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

  const getProfName = (id: string) => {
    if (!id) return "........................................";
    const p = professionalsList.find((x) => x.id === id);
    return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}` : "Profissional";
  };

  const getPatientName = (id: string) => {
    if (!id) return "........................................";
    const p = patientsList.find((x) => x.id === id);
    return p?.name || p?.full_name || p?.email || "Paciente";
  };

  // -----------------------------------------------------
  // IMPRESSÃO — versão com injeção de Tailwind + Head
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
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  if (initializing)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-pink-600" />
      </div>
    );

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">

      {/* FORMULÁRIO */}
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
              <label className="text-xs font-bold">Paciente</label>
              <select {...register("patient_id", { required: true })} className="w-full p-2.5 rounded-xl border">
                <option value="">Selecione...</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.full_name || p.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Profissional + Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold">Profissional</label>
                <select {...register("professional_id")} className="w-full p-2.5 rounded-xl border">
                  <option value="">Selecione...</option>
                  {professionalsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold">Data</label>
                <input type="date" {...register("date")} className="w-full p-2.5 rounded-xl border" />
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="text-xs font-bold">Título</label>
              <input {...register("title")} className="w-full p-2.5 rounded-xl border" />
            </div>
          </div>

          {/* Tratamentos */}
          <div className="space-y-4">
            {treatmentFields.map((field, index) => (
              <div key={field.id} className="p-5 bg-white dark:bg-gray-800 rounded-xl border relative">
                <button type="button" onClick={() => removeTreatment(index)} className="absolute right-4 top-4 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold">Tratamento</label>
                    <input
                      {...register(`treatments.${index}.name` as const)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Ex: Creme Noturno"
                    />
                  </div>

                  <TreatmentComponents index={index} control={control} register={register} />

                  <div>
                    <label className="text-[10px] font-bold">Observações</label>
                    <textarea
                      {...register(`treatments.${index}.observations` as const)}
                      className="w-full p-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                appendTreatment({
                  name: "",
                  components: [{ name: "", quantity: "" }],
                  observations: "",
                })
              }
              className="w-full py-3 border-2 border-dashed rounded-xl text-gray-500 hover:text-pink-600"
            >
              <Plus size={16} className="mr-2" /> Adicionar Item
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------- */}
      {/* PREVIEW A4 (IMPRIME O CONTEÚDO) */}
      {/* -------------------------------------- */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] bg-gray-100 items-center justify-center p-8 overflow-y-auto">
        <div id="print-area" className="w-full max-w-[21cm] min-h-[29.7cm] bg-white p-[2cm] rounded shadow-lg">

          {/* Cabeçalho */}
          <div className="border-b-2 border-pink-600 pb-6 mb-6 flex justify-between">
            <div>
              <h2 className="text-3xl font-serif font-bold">Clínica Estética</h2>
              <p className="text-sm text-gray-500">{getProfName(watchedValues.professional_id)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-gray-500 tracking-widest">Receituário</p>
              <p className="text-sm">{new Date(watchedValues.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Paciente */}
          <div className="bg-gray-50 border p-4 rounded mb-6">
            <p className="text-xs uppercase text-gray-400 mb-1">Para:</p>
            <p className="text-xl font-serif font-bold">{getPatientName(watchedValues.patient_id)}</p>
          </div>

          {/* Título */}
          <div className="text-center my-6">
            <h3 className="text-lg font-bold uppercase tracking-widest border-b inline-block pb-1">
              {watchedValues.title}
            </h3>
          </div>

          {/* Lista de Tratamentos */}
          <div className="space-y-6">
            {watchedValues.treatments?.map((t, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-pink-300">
                <div className="absolute -left-[5px] top-0 w-2 h-2 round bg-pink-500"></div>
                <h4 className="font-bold text-gray-800">{t.name}</h4>

                {t.components?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {t.components.map(
                      (c, i) =>
                        c.name && (
                          <li key={i} className="flex justify-between text-gray-700 border-b pb-1 w-3/4">
                            <span>{c.name}</span>
                            <span className="font-mono text-xs">{c.quantity}</span>
                          </li>
                        )
                    )}
                  </ul>
                )}

                {t.observations && (
                  <p className="text-sm italic mt-2 text-gray-600">"{t.observations}"</p>
                )}
              </div>
            ))}
          </div>

          {/* Rodapé / Assinatura */}
          <div className="absolute bottom-[2cm] left-[2cm] right-[2cm] border-t pt-4 text-center">
            <p className="text-xs text-gray-400">Documento gerado digitalmente.</p>
            <p className="text-sm font-bold mt-2">{getProfName(watchedValues.professional_id)}</p>
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
    <div className="bg-gray-50 p-3 border border-dashed rounded-xl">
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
              <X size={14} className="text-gray-500 hover:text-red-500" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ name: "", quantity: "" })}
          className="text-[10px] text-pink-600 font-bold flex items-center gap-1"
        >
          <Plus size={10} /> Add Componente
        </button>
      </div>
    </div>
  );
}
