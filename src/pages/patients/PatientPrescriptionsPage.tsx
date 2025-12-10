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
  Clock
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
  professional: {
    first_name: string;
    last_name: string;
    role: string;
    registration_number?: string;
    formacao?: string;
  } | null;
  medications: any[];
  observations?: string;
}

export function PatientPrescriptionsPage() {
  const { patient } = useOutletContext<PatientContext>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // --- BUSCAR RECEITAS ---
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
          id, created_at, medications, observations,
          professional:profiles(first_name, last_name, role, registration_number, formacao)
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
      console.error("Erro ao buscar receitas:", error);
      toast.error("Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DE IMPRESSÃO (GERADOR DE PDF) ---
  const handlePrint = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    const profName = prescription.professional 
      ? `${prescription.professional.first_name} ${prescription.professional.last_name}`
      : "Profissional Responsável";
    
    const profReg = prescription.professional?.registration_number || "";
    const profSpec = prescription.professional?.formacao || "Especialista";
    const dateStr = format(new Date(prescription.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    // Cria uma janela pop-up para impressão
    const printWindow = window.open('', '', 'height=800,width=800');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receita - ${patient.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; max-width: 800px; mx-auto; }
              .header { text-align: center; border-bottom: 2px solid #db2777; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 2px; }
              .sub-logo { font-size: 12px; color: #666; margin-top: 5px; }
              
              .patient-info { margin-bottom: 40px; background: #fdf2f8; padding: 15px; border-radius: 10px; border-left: 4px solid #db2777; }
              .patient-name { font-size: 18px; font-weight: 700; color: #111; }
              .date { float: right; font-size: 14px; color: #666; }

              .rx-symbol { font-size: 40px; font-family: serif; color: #db2777; margin-bottom: 10px; font-style: italic; font-weight: bold; }
              
              .medication-list { list-style: none; padding: 0; }
              .medication-item { margin-bottom: 25px; page-break-inside: avoid; }
              .med-name { font-size: 16px; font-weight: 700; display: block; margin-bottom: 4px; }
              .med-dosage { font-weight: normal; color: #555; }
              .med-instructions { display: block; margin-top: 5px; font-size: 14px; color: #444; background: #f9fafb; padding: 8px; border-radius: 6px; }
              
              .observations { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 15px; font-size: 14px; color: #666; }
              
              .footer { margin-top: 80px; text-align: center; page-break-inside: avoid; }
              .signature-line { width: 300px; border-top: 1px solid #333; margin: 0 auto 10px auto; }
              .prof-name { font-weight: 700; font-size: 14px; }
              .prof-reg { font-size: 12px; color: #666; }
              
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">CLÍNICA ESTÉTICA</div>
              <div class="sub-logo">Excelência e Cuidado</div>
            </div>

            <div class="patient-info">
              <span class="date">${dateStr}</span>
              <div>PACIENTE</div>
              <div class="patient-name">${patient.name}</div>
            </div>

            <div class="rx-symbol">Rx</div>

            <ol class="medication-list">
              ${prescription.medications.map((med: any, index: number) => `
                <li class="medication-item">
                  <span class="med-name">
                    ${index + 1}. ${med.name} <span class="med-dosage">${med.dosage ? `(${med.dosage})` : ''}</span>
                  </span>
                  ${med.frequency ? `<div><strong>Posologia:</strong> ${med.frequency}</div>` : ''}
                  ${med.duration ? `<div><strong>Duração:</strong> ${med.duration}</div>` : ''}
                  ${med.instructions ? `<div class="med-instructions">${med.instructions}</div>` : ''}
                </li>
              `).join('')}
            </ol>

            ${prescription.observations ? `
              <div class="observations">
                <strong>Observações:</strong><br>
                ${prescription.observations}
              </div>
            ` : ''}

            <div class="footer">
              <div class="signature-line"></div>
              <div class="prof-name">${profName}</div>
              <div class="prof-reg">${profSpec} | ${profReg}</div>
            </div>
            
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("Permita pop-ups para imprimir a receita.");
    }
  };

  // --- AÇÕES GERAIS ---
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;
    try {
      const { error } = await supabase.from("prescriptions").delete().eq("id", id);
      if (error) throw error;
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      toast.success("Receita excluída.");
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const handleNewPrescription = () => {
    navigate(`/prescriptions/new?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600 w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER DA ABA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-pink-100 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText className="text-pink-600" size={24} /> 
            Histórico de Prescrições
          </h2>
          <p className="text-sm text-gray-500">
            Visualize e gerencie todas as receitas emitidas para {patient.name.split(' ')[0]}.
          </p>
        </div>
        
        <Button 
          onClick={handleNewPrescription}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 transition-all active:scale-95 rounded-xl"
        >
          <Plus size={18} className="mr-2" /> Nova Receita
        </Button>
      </div>

      {/* LISTA DE RECEITAS */}
      {prescriptions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <ScrollText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma receita encontrada.</p>
          <p className="text-xs text-gray-400">Clique em "Nova Receita" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prescriptions.map((recipe) => {
            const date = new Date(recipe.created_at);
            const dateStr = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            const timeStr = format(date, "HH:mm");
            
            const profName = recipe.professional 
              ? `${recipe.professional.first_name} ${recipe.professional.last_name}` 
              : "Profissional não identificado";
            
            const itemCount = Array.isArray(recipe.medications) ? recipe.medications.length : 0;

            return (
              <div key={recipe.id} className="group bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-pink-200 transition-all flex flex-col md:flex-row gap-6">
                
                {/* Data (Lateral Esquerda) */}
                <div className="flex md:flex-col items-center justify-center gap-2 md:gap-0 bg-pink-50 dark:bg-gray-700/50 p-4 rounded-xl min-w-[100px] border border-pink-100 dark:border-gray-600">
                  <Calendar size={20} className="text-pink-500 mb-1" />
                  <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                    {format(date, 'dd')}
                  </span>
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {format(date, 'MMM', { locale: ptBR })}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded mt-1">
                    {timeStr}
                  </span>
                </div>

                {/* Conteúdo Principal */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                      Receituário Médico 
                      <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                        #{recipe.id.slice(0, 8)}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Stethoscope size={14} className="text-pink-500" />
                    <span>Prescrito por: <span className="font-semibold text-gray-700 dark:text-gray-300">{profName}</span></span>
                  </div>

                  {/* Resumo dos Itens */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                      <Pill size={14} /> Itens Prescritos ({itemCount})
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {itemCount > 0 
                        ? recipe.medications.slice(0, 3).map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full"></span>
                                <span className="font-medium">{m.name}</span>
                                {m.dosage && <span className="text-gray-400 text-xs">({m.dosage})</span>}
                            </div>
                          ))
                        : <span className="italic text-gray-400">Ver observações</span>}
                      
                      {itemCount > 3 && <span className="text-xs text-pink-500 font-medium">+ {itemCount - 3} outros itens...</span>}
                    </div>
                  </div>
                  
                  {recipe.observations && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 italic">
                          <Clock size={12} className="mt-0.5" />
                          <p>Obs: {recipe.observations}</p>
                      </div>
                  )}
                </div>

                {/* Ações (Direita) */}
                <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePrint(recipe.id)}
                    className="w-full justify-start text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
                  >
                    <Printer size={16} className="mr-2" /> Imprimir
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(recipe.id)}
                    className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200"
                  >
                    <Trash2 size={16} className="mr-2" /> Excluir
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}