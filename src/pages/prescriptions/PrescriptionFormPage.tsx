import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, Save, Plus, Trash2, Stethoscope, Loader2, Printer, X 
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

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function PrescriptionFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);
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
      date: getLocalDateString(),
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // 1. Pega ClinicID
        const { data: profile } = await supabase
            .from("profiles")
            .select("clinic_id")
            .eq("id", user.id)
            .single();

        if (!profile?.clinic_id) throw new Error("Sem clínica vinculada");
        setClinicId(profile.clinic_id);

        // 2. Carrega Dados da Clínica
        const { data: clinic } = await supabase
            .from("clinics")
            .select("*")
            .eq("id", profile.clinic_id)
            .single();
        
        setClinicData(clinic);

        // 3. Carrega Listas
        const [patsRes, profsRes] = await Promise.all([
          supabase.from("patients").select("*").eq("clinic_id", profile.clinic_id).order("name", { ascending: true }),
          supabase.from("profiles").select("*").eq("clinic_id", profile.clinic_id), 
        ]);

        setPatientsList(patsRes.data || []);
        setProfessionalsList(profsRes.data || []);

        // 4. Edição
        if (editId) {
          const { data: pres } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("id", editId)
            .single();

          if (pres) {
            const safeDate = pres.date ? String(pres.date).split("T")[0] : "";

            reset({
              patient_id: pres.patient_id,      
              professional_id: pres.professional_id, 
              date: safeDate, 
              title: pres.notes,
              treatments: pres.medications || [],
            });
          }
        } else {
          const prof = profsRes.data?.find((p: any) => p.id === user.id);
          if (prof) setValue("professional_id", prof.id);
          
          const urlPatientId = searchParams.get("patient_id");
          if (urlPatientId) setValue("patient_id", urlPatientId);
        }
      } catch (err) {
        toast.error("Erro ao sincronizar dados.");
        console.error(err);
      } finally {
        setInitializing(false);
      }
    }

    initPage();
  }, [editId, reset, setValue, searchParams]);

  const onSubmit = async (data: PrescriptionForm) => {
    try {
      setLoading(true);

      if (!data.patient_id) return toast.error("Selecione um paciente.");
      if (!data.professional_id) return toast.error("Selecione um profissional.");
      if (!clinicId) return toast.error("Erro de identificação da clínica.");

      const payload = {
        clinic_id: clinicId,
        patient_id: data.patient_id,
        professional_id: data.professional_id,
        notes: data.title,
        medications: data.treatments,
        date: data.date, 
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
      return "Registro";
  };

  const formatDisplayDate = (dateString: string) => {
      if (!dateString) return "--/--/----";
      const parts = dateString.split('-');
      if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
      }
      return dateString;
  };

  // ✅ DADOS PARA IMPRESSÃO (Prepara antes)
  const profDetails = getProfessionalDetails(watchedValues.professional_id);
  const council = getCouncilLabel(profDetails?.formacao);
  const clinicName = clinicData?.name || "CLÍNICA DE ESTÉTICA";
  const clinicAddress = clinicData?.address ? `${clinicData.address} • ${clinicData.phone || ''}` : "Excelência em Tratamentos";
  const clinicLogo = clinicData?.logo_url; // URL do Logo

  // -----------------------------------------------------
  // LOGICA DE IMPRESSÃO (IGUAL AO PRONTUÁRIO)
  // -----------------------------------------------------
  const handlePrint = () => {
    const content = document.getElementById("print-area")?.innerHTML;
    if (!content) return toast.error("Sem conteúdo para impressão.");
    
    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;

    // ✅ Prepara o HTML do Logo para a impressão
    const logoHtml = clinicLogo 
      ? `<img src="${clinicLogo}" alt="${clinicName}" style="max-height: 80px; max-width: 250px; object-fit: contain;" />` 
      : `<h1 class="clinic-name-print">${clinicName}</h1>`;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Receita - ${getPatientName(watchedValues.patient_id)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Open+Sans:wght@400;600&display=swap');
            @page { margin: 0; size: A4; }
            body { 
                background: white !important; 
                padding: 0; 
                margin: 0; 
                font-family: 'Open Sans', sans-serif; 
                color: #333;
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
            }
            .print-container { padding: 40px; max-width: 800px; margin: 0 auto; min-height: 95vh; position: relative; }
            
            /* Header com suporte a Logo */
            .header-print { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #db2777; padding-bottom: 20px; margin-bottom: 40px; }
            .clinic-name-print { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 24px; color: #1f2937; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
            .clinic-sub-print { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
            
            .doc-type-print { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 12px; color: #db2777; text-transform: uppercase; letter-spacing: 2px; text-align: right; }
            .doc-date-print { font-size: 14px; font-weight: 800; font-style: italic; color: #111; margin-top: 4px; text-align: right; }

            /* Restante dos estilos (igual ao anterior) */
            .patient-box-print { background: #fdf2f8; border-left: 4px solid #db2777; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
            .patient-label-print { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #db2777; letter-spacing: 1px; margin-bottom: 4px; }
            .patient-name-print { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; text-transform: uppercase; }
            .doc-title-print { text-align: center; margin-bottom: 40px; }
            .doc-title-text-print { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #111; padding-bottom: 4px; display: inline-block; font-style: italic; }
            .treatment-item-print { margin-bottom: 30px; page-break-inside: avoid; }
            .treatment-name-print { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 800; text-transform: uppercase; color: #111; margin-bottom: 10px; padding-left: 15px; border-left: 3px solid #fce7f3; }
            .component-row-print { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; color: #4b5563; width: 80%; margin-left: 15px; }
            .component-name-print { font-weight: 600; }
            .component-qty-print { font-weight: 800; font-style: italic; }
            .obs-box-print { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6; margin-top: 10px; margin-left: 15px; font-size: 13px; font-style: italic; color: #6b7280; line-height: 1.5; }
            .footer-print { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 40px; background: white; }
            .signature-img-print { height: 70px; display: block; margin: 0 auto 10px auto; }
            .prof-line-print { width: 250px; border-top: 1px solid #d1d5db; margin: 0 auto 10px auto; }
            .prof-name-print { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 14px; text-transform: uppercase; color: #111; }
            .prof-reg-print { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
            .clinic-footer-print { font-size: 9px; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; }
          </style>
        </head>
        <body>
            <div class="print-container">
                <div class="header-print">
                  <div>
                    ${logoHtml}
                    <p class="clinic-sub-print">${clinicAddress}</p>
                  </div>
                  <div class="text-right">
                    <p class="doc-type-print">Documento</p>
                    <p class="doc-date-print">${formatDisplayDate(watchedValues.date)}</p>
                  </div>
                </div>

                ${document.getElementById("patient-section-preview")?.outerHTML || ''}
                ${document.getElementById("doc-title-preview")?.outerHTML || ''}
                ${document.getElementById("treatments-preview")?.outerHTML || ''}
                ${document.getElementById("footer-preview")?.outerHTML || ''}
            </div>
        </body>
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
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Carregando Editor...</p>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden animate-in fade-in duration-500">

      {/* LADO ESQUERDO: CONFIGURAÇÃO (45%) */}
      <div className="w-full md:w-1/2 lg:w-[45%] border-r bg-white dark:bg-gray-900 flex flex-col shadow-2xl z-20">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/prescriptions")} className="rounded-2xl h-11 w-11 p-0 bg-gray-50 hover:bg-gray-100">
              <ArrowLeft size={22} />
            </Button>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter uppercase">{editId ? "Editar" : "Nova"} <span className="text-pink-600">Receita</span></h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recomendação Avulsa</p>
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Paciente</label>
              <select {...register("patient_id", { required: true })} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm">
                <option value="">Buscar paciente...</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.full_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional</label>
                <select {...register("professional_id")} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm">
                  {professionalsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                <input type="date" {...register("date")} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Documento</label>
              <input {...register("title")} className="w-full h-12 px-4 rounded-2xl border-0 bg-white dark:bg-gray-900 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none shadow-sm" placeholder="Ex: Protocolo Home Care" />
            </div>
          </div>

          {/* LISTA DE TRATAMENTOS DINÂMICA */}
          <div className="space-y-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Stethoscope size={14} className="text-pink-600" /> Itens da Receita
            </h2>
            {treatmentFields.map((field, index) => (
              <div key={field.id} className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 relative shadow-lg animate-in slide-in-from-bottom-4 duration-500">
                <button type="button" onClick={() => removeTreatment(index)} className="absolute right-6 top-6 h-10 w-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <Trash2 size={18} />
                </button>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Item</label>
                    <input
                      {...register(`treatments.${index}.name` as const)}
                      className="w-full h-12 px-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl font-bold focus:border-pink-500 transition-colors outline-none"
                      placeholder="Ex: Sabonete Facial"
                    />
                  </div>

                  <TreatmentComponents index={index} control={control} register={register} />

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Modo de Uso</label>
                    <textarea
                      {...register(`treatments.${index}.observations` as const)}
                      className="w-full p-4 border-2 border-gray-50 dark:border-gray-700 rounded-2xl font-medium text-sm focus:border-pink-500 transition-colors outline-none resize-none h-24"
                      placeholder="Instruções..."
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
              <Plus size={20} /> Adicionar Item
            </button>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: PREVIEW A4 (55%) */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] bg-gray-100 dark:bg-gray-950 items-center justify-center p-12 overflow-y-auto custom-scrollbar">
        <div id="print-area" className="w-full max-w-[21cm] min-h-[29.7cm] bg-white p-[2.5cm] shadow-2xl flex flex-col justify-between relative ring-1 ring-gray-200">
          
          <div>
            {/* ✅ CABEÇALHO PREVIEW COM LOGO */}
            <div className="header-print flex justify-between items-end border-b-2 border-pink-600 pb-5 mb-10">
              <div>
                {clinicLogo ? (
                  <img src={clinicLogo} alt={clinicName} className="max-h-20 object-contain mb-2" />
                ) : (
                  <h1 className="clinic-name-print text-2xl font-black text-gray-900 uppercase tracking-tighter">{clinicName}</h1>
                )}
                <p className="clinic-sub-print text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{clinicAddress}</p>
              </div>
              <div className="text-right">
                <p className="doc-type-print text-xs font-bold text-pink-600 uppercase tracking-widest">Documento</p>
                <p className="doc-date-print text-sm font-black italic text-gray-900 mt-1">{formatDisplayDate(watchedValues.date)}</p>
              </div>
            </div>

            {/* PACIENTE (Com ID para o seletor de impressão) */}
            <div id="patient-section-preview" className="patient-box-print bg-pink-50 border-l-4 border-pink-500 p-5 rounded-lg mb-10">
              <p className="patient-label-print text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Paciente</p>
              <p className="patient-name-print text-xl font-black text-gray-900 uppercase tracking-tighter">{getPatientName(watchedValues.patient_id)}</p>
            </div>

            <div id="doc-title-preview" className="doc-title-print text-center mb-10">
              <h3 className="doc-title-text-print text-lg font-black uppercase tracking-[0.2em] border-b-2 border-gray-900 inline-block pb-1 italic">
                {watchedValues.title}
              </h3>
            </div>

            {/* ITENS (Com ID para o seletor de impressão) */}
            <div id="treatments-preview" className="space-y-8">
              {watchedValues.treatments?.map((t, idx) => (
                <div key={idx} className="treatment-item-print mb-8">
                  <h4 className="treatment-name-print text-base font-black text-gray-900 uppercase tracking-tighter italic mb-3 pl-4 border-l-4 border-pink-100">{t.name}</h4>

                  {t.components?.length > 0 && (
                    <div className="mb-4 pl-4 w-3/4">
                      {t.components.map((c, i) => c.name && (
                        <div key={i} className="component-row-print flex justify-between text-sm py-1 border-b border-dashed border-gray-200 text-gray-600">
                          <span className="font-semibold">{c.name}</span>
                          <span className="font-black italic text-gray-400">{c.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {t.observations && (
                    <div className="obs-box-print bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm font-medium italic text-gray-500 ml-4">
                        {t.observations}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ (Com ID para o seletor de impressão) */}
          <div id="footer-preview" className="footer-print text-center mt-20">
            {profDetails?.signature_data ? (
                <img src={profDetails.signature_data} className="signature-img-print h-20 mx-auto mb-2" alt="Assinatura" />
            ) : (
                <div className="h-16"></div>
            )}

            <div className="prof-line-print w-64 border-t border-gray-300 mx-auto mb-2"></div>
            <p className="prof-name-print text-sm font-black text-gray-900 uppercase tracking-widest italic">
                Dr(a). {profDetails ? `${profDetails.first_name} ${profDetails.last_name}` : "Especialista"}
            </p>
            <p className="prof-reg-print text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
                {council}: {profDetails?.registration_number || '---'}
            </p>
            <p className="clinic-footer-print text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] mt-6">Documento Oficial Autenticado</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE ---
function TreatmentComponents({ index, control, register }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `treatments.${index}.components` });

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Fórmula / Ativos</label>
      <div className="space-y-3">
        {fields.map((field, k) => (
          <div key={field.id} className="flex gap-3">
            <input {...register(`treatments.${index}.components.${k}.name`)} placeholder="Nome do Ativo" className="flex-1 h-10 px-3 bg-white dark:bg-gray-800 border-0 rounded-xl text-xs font-bold shadow-sm outline-none" />
            <input {...register(`treatments.${index}.components.${k}.quantity`)} placeholder="Qtd" className="w-20 h-10 px-3 bg-white dark:bg-gray-800 border-0 rounded-xl text-xs font-bold shadow-sm outline-none" />
            <button type="button" onClick={() => remove(k)} className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-rose-500"><X size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={() => append({ name: "", quantity: "" })} className="h-10 px-4 text-[10px] text-pink-600 font-black uppercase tracking-widest flex items-center gap-2 hover:bg-pink-50 rounded-xl mt-2"><Plus size={14} /> Novo Ativo</button>
      </div>
    </div>
  );
}