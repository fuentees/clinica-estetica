import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ScrollText, 
  Plus, 
  Loader2, 
  Calendar, 
  Printer, 
  Trash2,
  Stethoscope,
  Pill,
  ArrowRight,
  FileText
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientContext {
  patient: {
    id: string;
    name: string;
    cpf?: string;
  };
}

interface Prescription {
  id: string;
  created_at: string;
  notes?: string;
  professional: {
    first_name: string;
    last_name: string;
    role: string;
    registration_number?: string;
    formacao?: string;
    signature_url?: string;
  } | null;
  medications: any[];
  observations?: string;
}

export function PatientPrescriptionsPage() {
  const { patient } = useOutletContext<PatientContext>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    if (patient?.id) fetchPrescriptions();
  }, [patient?.id]);

  async function fetchPrescriptions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id, created_at, medications, observations, notes,
          professional:profiles(first_name, last_name, role, registration_number, formacao, signature_url)
        `)
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        professional: Array.isArray(item.professional) ? item.professional[0] : item.professional
      }));

      setPrescriptions(formatted);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar histórico de receitas.");
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    const profName = `${prescription.professional?.first_name || "Profissional"} ${prescription.professional?.last_name || ""}`;
    const profReg = prescription.professional?.registration_number || "";
    const profSpec = prescription.professional?.formacao || "Especialista";
    const profSignature = prescription.professional?.signature_url;

    const getCouncilPrefix = (spec: string) => {
        const s = spec.toLowerCase();
        if (s.includes("biomédica") || s.includes("biomedicina")) return "CRBM";
        if (s.includes("médico") || s.includes("dermatologista")) return "CRM";
        if (s.includes("enfermeir")) return "COREN";
        if (s.includes("fisioterapeuta")) return "CREFITO";
        if (s.includes("farmacêut")) return "CRF";
        return "Registro";
    };

    const councilPrefix = getCouncilPrefix(profSpec);
    const dateStr = new Date(prescription.created_at).toLocaleDateString('pt-BR');

    const printWindow = window.open('', '_blank', 'height=800,width=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receituário - ${patient.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 20mm; color: #111; line-height: 1.6; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #db2777; padding-bottom: 10px; margin-bottom: 30px; }
              .clinic-title { font-size: 28px; font-weight: 700; margin: 0; }
              .patient-section { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
              .doc-title { text-align: center; font-size: 20px; font-weight: 700; text-transform: uppercase; margin: 20px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              .med-item { margin-bottom: 25px; padding-left: 15px; border-left: 3px solid #f9a8d4; }
              .med-name { font-weight: 700; font-size: 17px; }
              .footer { position: fixed; bottom: 20mm; left: 0; right: 0; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
              .signature-img { max-height: 70px; margin-bottom: -15px; position: relative; z-index: 10; }
            </style>
          </head>
          <body>
            <div class="header">
              <div><h1 class="clinic-title">DIAGNÓSTICO ESTÉTICO</h1><small>${profSpec}</small></div>
              <div style="text-align: right"><strong>Data:</strong> ${dateStr}</div>
            </div>
            <div class="patient-section"><strong>PACIENTE:</strong> ${patient.name}</div>
            <div class="doc-title">${prescription.notes || "Receituário Técnico"}</div>
            ${prescription.medications.map((m: any) => `
              <div class="med-item">
                <div class="med-name">${m.name}</div>
                ${m.dosage ? `<div><strong>Dose:</strong> ${m.dosage}</div>` : ''}
                ${m.frequency ? `<div><strong>Uso:</strong> ${m.frequency}</div>` : ''}
                ${m.observations ? `<div style="font-style: italic">"${m.observations}"</div>` : ''}
              </div>
            `).join('')}
            <div class="footer">
              ${profSignature ? `<img src="${profSignature}" class="signature-img" />` : ''}
              <div><strong>Dr(a). ${profName}</strong></div>
              <div>${councilPrefix}: ${profReg}</div>
            </div>
            <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta receita do prontuário?")) return;
    const { error } = await supabase.from("prescriptions").delete().eq("id", id);
    if (!error) {
        setPrescriptions(prev => prev.filter(p => p.id !== id));
        toast.success("Receita excluída com sucesso.");
    }
  };

  const handleNewPrescription = () => {
    navigate(`/prescriptions/new?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`);
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-pink-600" size={40} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Resgatando Arquivo Digital...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER DA SEÇÃO */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-3xl text-pink-600">
            <ScrollText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Histórico de Receitas</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Prescrições, orientações e homecare</p>
          </div>
        </div>
        <Button 
          onClick={handleNewPrescription} 
          className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105"
        >
          <Plus size={18} className="mr-2 text-pink-500" /> Emitir Nova Receita
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 py-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
            <FileText size={40} />
          </div>
          <p className="text-gray-500 font-black uppercase text-xs tracking-widest italic">Nenhuma prescrição registrada para este paciente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {prescriptions.map((recipe) => (
            <div key={recipe.id} className="group bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:border-pink-100 transition-all duration-500 flex flex-col md:flex-row gap-8">
                
                {/* Indicador de Data */}
                <div className="flex md:flex-col items-center justify-center gap-1 bg-pink-50 dark:bg-pink-900/20 p-6 rounded-3xl min-w-[120px] border border-pink-100 dark:border-pink-900/30">
                  <span className="text-3xl font-black text-pink-600 italic tracking-tighter">{format(new Date(recipe.created_at), 'dd')}</span>
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">{format(new Date(recipe.created_at), 'MMM', { locale: ptBR })}</span>
                  <div className="h-px w-8 bg-pink-200 my-2 hidden md:block"></div>
                  <Calendar size={16} className="text-pink-300 hidden md:block" />
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{recipe.notes || "Receituário Estético"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Stethoscope size={14} className="text-pink-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsável: Dr(a). {recipe.professional?.first_name || 'Profissional'}</span>
                    </div>
                  </div>
                  
                  {/* Resumo de Itens */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                     <div className="flex items-center gap-2 font-black text-[9px] uppercase text-gray-400 tracking-[0.2em] mb-3">
                        <Pill size={12} className="text-pink-500"/> Composição da Receita
                     </div>
                     {recipe.medications.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                           {recipe.medications.map((m: any, idx) => (
                             <span key={idx} className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                                {m.name}
                             </span>
                           ))}
                        </div>
                     ) : (
                        <p className="italic text-xs text-gray-400">Sem itens detalhados nesta prescrição.</p>
                     )}
                  </div>
                </div>

                {/* Ações Laterais */}
                <div className="flex flex-row md:flex-col justify-center gap-3 md:pl-8 border-t md:border-t-0 md:border-l border-gray-50 dark:border-gray-800 pt-6 md:pt-0">
                  <Button variant="outline" onClick={() => handlePrint(recipe.id)} className="flex-1 h-12 rounded-xl border-gray-200 font-bold uppercase text-[9px] tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <Printer size={16} className="mr-2" /> Imprimir
                  </Button>
                  <button onClick={() => handleDelete(recipe.id)} className="p-3 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}