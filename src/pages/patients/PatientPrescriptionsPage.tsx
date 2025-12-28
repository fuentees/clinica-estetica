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
  Pill
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
    signature_url?: string; // Adicionado para a assinatura
  } | null;
  medications: any[];
  observations?: string;
}

export function PatientPrescriptionsPage() {
  const { patient } = useOutletContext<PatientContext>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // 1. BUSCAR DADOS
  useEffect(() => {
    if (patient?.id) fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error("Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // 2. IMPRESSÃO COM ASSINATURA E CONSELHO
  // ------------------------------------------------------------------
  const handlePrint = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    // Dados do Profissional
    const profFirstName = prescription.professional?.first_name || "Profissional";
    const profLastName = prescription.professional?.last_name || "";
    const profName = `${profFirstName} ${profLastName}`;
    const profReg = prescription.professional?.registration_number || "";
    const profSpec = prescription.professional?.formacao || "Especialista";
    const profSignature = prescription.professional?.signature_url;

    // Lógica para determinar o prefixo do conselho (CRBM, CRM, etc)
    const getCouncilPrefix = (spec: string) => {
        const s = spec.toLowerCase();
        if (s.includes("biomédica") || s.includes("biomedicina")) return "CRBM";
        if (s.includes("médico") || s.includes("dermatologista") || s.includes("cirurgiã")) return "CRM";
        if (s.includes("enfermeir")) return "COREN";
        if (s.includes("fisioterapeuta")) return "CREFITO";
        if (s.includes("farmacêut")) return "CRF";
        if (s.includes("esteticista")) return "MEI/CNPJ";
        return "Registro";
    };

    const councilPrefix = getCouncilPrefix(profSpec);
    
    // Data
    const dateObj = new Date(prescription.created_at);
    const dateStr = dateObj.toLocaleDateString('pt-BR');

    const printWindow = window.open('', '_blank', 'height=800,width=900');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receita - ${patient.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
              @page { margin: 0; }
              body { 
                font-family: 'Inter', sans-serif; 
                background: white; 
                margin: 0; 
                padding: 20mm; 
                color: #1f2937;
                line-height: 1.5;
              }

              /* Cabeçalho */
              .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #db2777; 
                padding-bottom: 24px;
                margin-bottom: 24px;
              }
              .clinic-title { font-size: 30px; font-weight: 700; font-family: serif; color: #000; margin: 0; }
              .prof-info { font-size: 14px; color: #6b7280; margin-top: 4px; }
              
              .meta-info { text-align: right; }
              .meta-label { font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; }
              .meta-value { font-size: 14px; color: #000; margin-top: 2px; }

              /* Box do Paciente */
              .patient-box {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 24px;
              }
              .patient-label { font-size: 12px; text-transform: uppercase; color: #9ca3af; font-weight: bold; }
              .patient-name { font-size: 20px; font-family: serif; font-weight: 700; color: #000; margin-top: 4px; }

              /* Título Central */
              .doc-title {
                text-align: center;
                margin: 24px 0;
                text-transform: uppercase;
                font-weight: 700;
                font-size: 18px;
                letter-spacing: 2px;
                border-bottom: 1px solid #000;
                display: inline-block;
                padding-bottom: 4px;
                width: 100%;
              }

              /* Lista de Tratamentos */
              .treatment-item {
                position: relative;
                padding-left: 24px;
                border-left: 2px solid #f9a8d4; 
                margin-bottom: 24px;
              }
              .treatment-bullet {
                position: absolute;
                left: -6px; 
                top: 0;
                width: 10px;
                height: 10px;
                background-color: #db2777; 
                border-radius: 50%;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .treatment-name { font-weight: 700; font-size: 16px; color: #1f2937; margin-bottom: 8px; }

              /* Componentes */
              .component-list { list-style: none; padding: 0; margin: 0; }
              .component-item { 
                display: flex; justify-content: space-between; 
                border-bottom: 1px solid #f3f4f6; 
                padding: 4px 0; width: 80%; font-size: 14px; color: #374151; 
              }
              .comp-qty { font-family: monospace; font-size: 12px; }

              .obs-text { 
                font-size: 14px; font-style: italic; color: #4b5563; margin-top: 8px; 
              }

              /* Rodapé e Assinatura */
              .footer {
                position: fixed;
                bottom: 15mm;
                left: 20mm;
                right: 20mm;
                text-align: center;
                border-top: 1px solid #e5e7eb;
                padding-top: 10px;
              }
              .signature-img {
                max-height: 80px;
                max-width: 200px;
                display: block;
                margin: 0 auto -10px auto; /* Sobe um pouco para ficar sobre a linha */
                position: relative;
                z-index: 10;
              }
              .prof-name-footer { font-weight: 700; font-size: 14px; margin-top: 10px; }
              .prof-reg-footer { font-size: 12px; color: #6b7280; margin-top: 2px; }

            </style>
          </head>
          <body>
            
            <div class="header">
              <div>
                <h1 class="clinic-title">CLÍNICA ESTÉTICA</h1>
                <div class="prof-info">Dr(a). ${profName}</div>
              </div>
              <div class="meta-info">
                <div class="meta-label">Receituário</div>
                <div class="meta-value">${dateStr}</div>
              </div>
            </div>

            <div class="patient-box">
              <div class="patient-label">Para:</div>
              <div class="patient-name">${patient.name}</div>
            </div>

            <div class="doc-title">${prescription.notes || "Recomendação Terapêutica"}</div>

            <div>
              ${prescription.medications.map((item: any) => `
                <div class="treatment-item">
                  <div class="treatment-bullet"></div>
                  <div class="treatment-name">${item.name}</div>
                  
                  ${item.components && item.components.length > 0 ? `
                    <ul class="component-list">
                      ${item.components.map((c: any) => c.name ? `
                        <li class="component-item">
                          <span>${c.name}</span>
                          <span class="comp-qty">${c.quantity || ''}</span>
                        </li>
                      ` : '').join('')}
                    </ul>
                  ` : ''}

                  ${item.dosage ? `<div class="component-item"><span>Dosagem</span><span class="comp-qty">${item.dosage}</span></div>` : ''}
                  ${item.frequency ? `<div class="obs-text">Posologia: ${item.frequency}</div>` : ''}
                  ${item.instructions ? `<div class="obs-text">${item.instructions}</div>` : ''}
                  ${item.observations ? `<div class="obs-text">"${item.observations}"</div>` : ''}
                </div>
              `).join('')}
            </div>

            ${prescription.observations ? `
              <div style="margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px;">
                <strong style="font-size: 12px; text-transform: uppercase; color: #999;">Observações Gerais:</strong>
                <p style="font-size: 14px; margin-top: 4px;">${prescription.observations}</p>
              </div>
            ` : ''}

            <div class="footer">
              ${profSignature ? `<img src="${profSignature}" class="signature-img" alt="Assinatura" />` : ''}
              <div class="prof-name-footer">Dr(a). ${profName}</div>
              <div class="prof-reg-footer">${councilPrefix}: ${profReg}</div>
            </div>

            <script>
              window.onload = function() { 
                setTimeout(function(){ window.print(); }, 800); /* Tempo um pouco maior para carregar a imagem da assinatura */
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // --- AÇÕES ---
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir receita?")) return;
    const { error } = await supabase.from("prescriptions").delete().eq("id", id);
    if (!error) {
        setPrescriptions(prev => prev.filter(p => p.id !== id));
        toast.success("Excluído!");
    }
  };

  const handleNewPrescription = () => {
    navigate(`/prescriptions/new?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-8 h-8"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-pink-100 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText className="text-pink-600" size={24} /> Histórico de Receitas
          </h2>
          <p className="text-sm text-gray-500">Histórico clínico de {patient.name.split(' ')[0]}.</p>
        </div>
        <Button onClick={handleNewPrescription} className="bg-pink-600 text-white rounded-xl shadow-lg shadow-pink-200 hover:bg-pink-700 transition-colors">
          <Plus size={18} className="mr-2" /> Nova Receita
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">Nenhuma receita encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prescriptions.map((recipe) => (
            <div key={recipe.id} className="group bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-pink-200 transition-all flex flex-col md:flex-row gap-6">
                
                <div className="flex md:flex-col items-center justify-center gap-2 bg-pink-50 p-4 rounded-xl min-w-[100px] border border-pink-100">
                  <Calendar size={20} className="text-pink-500 mb-1" />
                  <span className="text-2xl font-black text-gray-800">{new Date(recipe.created_at).getDate()}</span>
                  <span className="text-xs font-bold text-gray-500 uppercase">{format(new Date(recipe.created_at), 'MMM', { locale: ptBR })}</span>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{recipe.notes || "Receita Médica"}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Stethoscope size={12} className="text-pink-500" />
                    <span>Dr(a). {recipe.professional?.first_name || 'Profissional'}</span>
                  </div>
                  
                  {/* Resumo visual rápido */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-600">
                     <div className="flex items-center gap-2 font-bold text-xs uppercase text-gray-400 mb-1"><Pill size={12}/> Resumo</div>
                     {recipe.medications.length > 0 ? (
                        <p className="line-clamp-2">{recipe.medications.map((m: any) => m.name).join(", ")}</p>
                     ) : <p className="italic text-xs">Sem itens listados</p>}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 border-gray-100">
                  <Button variant="outline" size="sm" onClick={() => handlePrint(recipe.id)} className="w-full justify-start text-gray-600 hover:text-blue-600 border-gray-200">
                    <Printer size={16} className="mr-2" /> Imprimir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(recipe.id)} className="w-full justify-start text-gray-600 hover:text-red-600 border-gray-200">
                    <Trash2 size={16} className="mr-2" /> Excluir
                  </Button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}