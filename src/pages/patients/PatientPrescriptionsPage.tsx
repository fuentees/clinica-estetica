import { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ScrollText, Plus, Loader2, Printer, Trash2,
  FileText, FilePenLine, CheckCircle2, AlertCircle, 
  Link as LinkIcon, Search, CalendarDays, ChevronDown, FilterX
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

interface UnifiedPrescription {
  id: string;
  source: 'legacy' | 'evolution';
  created_at: string;
  title: string; 
  procedure_context?: string;
  is_signed: boolean;
  notes: string;
  professional: {
    first_name: string;
    last_name: string;
    role: string;
    registration_number?: string;
    formacao?: string;
    signature_data?: string;
  } | null;
  medications: any[];
}

export function PatientPrescriptionsPage() {
  const { patient } = useOutletContext<PatientContext>();
  const navigate = useNavigate();
  
  // Estados de Dados
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<UnifiedPrescription[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);

  // Estados de Controle de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    if (patient?.id) fetchUnifiedPrescriptions();
  }, [patient?.id]);

  async function fetchUnifiedPrescriptions() {
    try {
      setLoading(true);
      
      // 1. DADOS DA CLÍNICA
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
          if (profile?.clinic_id) {
              const { data: clinic } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single();
              setClinicData(clinic);
          }
      }

      // 2. BUSCA LEGADO
      const legacyQuery = supabase
        .from("prescriptions")
        .select(`
          id, created_at, medications, notes,
          professional:profiles!professional_id (
             first_name, last_name, role, registration_number, formacao, signature_data
          )
        `)
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      // 3. BUSCA NOVO
      // ⚠️ Removi filtros restritivos para garantir que traga tudo
      const evolutionQuery = supabase
        .from("evolution_records")
        .select(`
          id, date, subject, description, attachments,
          professional:profiles!professional_id (
             first_name, last_name, role, registration_number, formacao, signature_data
          )
        `)
        .eq("patient_id", patient.id)
        .order("date", { ascending: false });

      const [legacyRes, evoRes] = await Promise.all([legacyQuery, evolutionQuery]);

      // --- TRATAMENTO ROBUSTO ---
      
      // A. Legado
      const legacyItems: UnifiedPrescription[] = (legacyRes.data || []).map((item: any) => ({
        id: item.id,
        source: 'legacy',
        created_at: item.created_at,
        notes: item.notes,
        title: item.notes || "Receita Avulsa",
        procedure_context: "Prescrição Direta",
        is_signed: !!item.professional?.signature_data,
        professional: Array.isArray(item.professional) ? item.professional[0] : item.professional,
        medications: item.medications || []
      }));

      // B. Prontuário (Lógica Blindada de Extração)
      const newItems: UnifiedPrescription[] = [];
      
      if (evoRes.data) {
        evoRes.data.forEach((r: any) => {
            // Tenta pegar a receita de qualquer jeito (singular ou plural)
            let meds = [];
            
            if (r.attachments?.prescription && Array.isArray(r.attachments.prescription)) {
                meds = r.attachments.prescription;
            } else if (r.attachments?.prescriptions && Array.isArray(r.attachments.prescriptions)) {
                meds = r.attachments.prescriptions;
            }

            // Se achou remédios, adiciona na lista
            if (meds.length > 0) {
                newItems.push({
                    id: r.id,
                    source: 'evolution',
                    created_at: r.date,
                    notes: "Receita de Prontuário", // Fallback
                    title: "Receita de Prontuário",
                    procedure_context: r.subject || "Atendimento",
                    is_signed: !!(Array.isArray(r.professional) ? r.professional[0] : r.professional)?.signature_data,
                    professional: Array.isArray(r.professional) ? r.professional[0] : r.professional,
                    medications: meds
                });
            }
        });
      }

      // Unifica e Ordena
      const merged = [...newItems, ...legacyItems].sort((a, b) => 
         new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllItems(merged);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE FILTRO E AGRUPAMENTO ---
  const { groupedItems, totalFiltered, hasMore } = useMemo(() => {
    const filtered = allItems.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
            item.title?.toLowerCase().includes(searchLower) ||
            item.procedure_context?.toLowerCase().includes(searchLower) ||
            item.medications.some((m: any) => (m.name || m.drug)?.toLowerCase().includes(searchLower))
        );
    });

    const visibleItems = filtered.slice(0, visibleCount);
    
    const groups: { [key: string]: UnifiedPrescription[] } = {};
    visibleItems.forEach(item => {
        const date = new Date(item.created_at);
        const key = format(date, 'MMMM yyyy', { locale: ptBR });
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
        
        if (!groups[formattedKey]) groups[formattedKey] = [];
        groups[formattedKey].push(item);
    });

    return { 
        groupedItems: groups, 
        totalFiltered: filtered.length,
        hasMore: filtered.length > visibleCount 
    };
  }, [allItems, searchTerm, visibleCount]);


  // --- IMPRESSÃO PREMIUM ---
  const handlePrint = (item: UnifiedPrescription) => {
    const prof = item.professional || {} as any;
    const profName = `${prof.first_name || "Profissional"} ${prof.last_name || ""}`;
    const profReg = prof.registration_number || "";
    const profSpec = prof.formacao || "Especialista";
    const profSignature = prof.signature_data;

    const getCouncilPrefix = (spec: string) => {
        if (!spec) return "Registro";
        const s = spec.toLowerCase();
        if (s.includes("bioméd") || s.includes("biomed")) return "CRBM";
        if (s.includes("médic") || s.includes("dermatologista")) return "CRM";
        if (s.includes("enferm")) return "COREN";
        if (s.includes("fisiotera")) return "CREFITO";
        if (s.includes("farmac")) return "CRF";
        return "Registro";
    };

    const councilPrefix = getCouncilPrefix(profSpec);
    const clinicName = clinicData?.name || "CLÍNICA DE ESTÉTICA";
    const clinicAddress = clinicData?.address ? `${clinicData.address} ${clinicData?.phone ? '• ' + clinicData.phone : ''}` : "";
    const clinicLogo = clinicData?.logo_url;
    const dateStr = new Date(item.created_at).toLocaleDateString('pt-BR');
    const logoHtml = clinicLogo 
      ? `<img src="${clinicLogo}" alt="${clinicName}" style="max-height: 80px; max-width: 250px; object-fit: contain;" />` 
      : `<h1 class="clinic-name-print">${clinicName}</h1>`;

    const printWindow = window.open('', '_blank', 'height=800,width=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receituário - ${patient.name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Open+Sans:wght@400;600&display=swap');
              @page { margin: 0; size: A4; }
              body { font-family: 'Open Sans', sans-serif; padding: 0; margin: 0; color: #333; line-height: 1.5; }
              .print-container { padding: 40px; max-width: 800px; margin: 0 auto; position: relative; min-height: 95vh; }
              .header-print { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #db2777; padding-bottom: 20px; margin-bottom: 40px; }
              .clinic-name-print { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 24px; color: #1f2937; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
              .clinic-sub-print { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
              .doc-type-print { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 12px; color: #db2777; text-transform: uppercase; letter-spacing: 2px; text-align: right; }
              .doc-date-print { font-size: 14px; font-weight: 800; font-style: italic; color: #111; margin-top: 4px; text-align: right; }
              .patient-box-print { background: #fdf2f8; border-left: 4px solid #db2777; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
              .patient-label-print { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #db2777; letter-spacing: 1px; margin-bottom: 4px; }
              .patient-name-print { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; text-transform: uppercase; }
              .doc-title-print { text-align: center; margin-bottom: 40px; }
              .doc-title-text-print { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #111; padding-bottom: 4px; display: inline-block; font-style: italic; }
              .treatment-item-print { margin-bottom: 30px; page-break-inside: avoid; }
              .treatment-name-print { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 800; text-transform: uppercase; color: #111; margin-bottom: 10px; padding-left: 15px; border-left: 3px solid #fce7f3; }
              .component-row-print { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; color: #4b5563; width: 80%; margin-left: 15px; }
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
                  <div>${logoHtml}<p class="clinic-sub-print">${clinicAddress}</p></div>
                  <div class="text-right"><p class="doc-type-print">Documento Terapêutico</p><p class="doc-date-print">${dateStr}</p></div>
                </div>
                <div class="patient-box-print"><p class="patient-label-print">Paciente</p><p class="patient-name-print">${patient.name}</p></div>
                <div class="doc-title-print"><h3 class="doc-title-text-print">${item.title}</h3></div>
                
                <div class="space-y-8">
                  ${(item.medications || []).map((m: any, idx: number) => `
                    <div class="treatment-item-print">
                      <h4 class="treatment-name-print">${idx + 1}. ${m.name || m.drug}</h4>
                      ${m.dosage ? `<div style="margin-left: 15px; font-size: 13px; color: #666;"><strong>Dose:</strong> ${m.dosage}</div>` : ''}
                      ${m.components && m.components.length > 0 ? `
                         <div style="margin-bottom: 10px;">
                           ${m.components.map((c:any) => `
                             <div class="component-row-print"><span style="font-weight: 600;">${c.name}</span><span style="font-weight: 800; font-style: italic;">${c.quantity}</span></div>
                           `).join('')}
                         </div>
                      ` : ''}
                      <div class="obs-box-print">${m.observations || m.instructions || 'Uso conforme orientação.'}</div>
                    </div>
                  `).join('')}
                </div>

                <div class="footer-print">
                  ${profSignature ? `<img src="${profSignature}" class="signature-img-print" />` : '<div style="height:40px"></div>'}
                  <div class="prof-line-print"></div>
                  <p class="prof-name-print">Dr(a). ${profName}</p>
                  <p class="prof-reg-print">${councilPrefix}: ${profReg}</p>
                  <p class="clinic-footer-print">Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} • VILAGI System</p>
                </div>
            </div>
            <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDeleteLegacy = async (id: string) => {
    if (!confirm("Excluir receita antiga?")) return;
    await supabase.from("prescriptions").delete().eq("id", id);
    setAllItems(prev => prev.filter(p => p.id !== id));
    toast.success("Excluída.");
  };

  const handleEditEvolution = () => {
    navigate(`/patients/${patient.id}/evolution`);
    toast("Localize o registro na timeline para editar.", { icon: "ℹ️" });
  };

  const handleNewPrescription = () => navigate(`/prescriptions/new?patient_id=${patient.id}`);

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-20">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-3xl text-pink-600">
            <ScrollText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Histórico de Receitas</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
               {allItems.length} prescrições • {totalFiltered} exibidas
            </p>
          </div>
        </div>
        
        <div className="flex-1 max-w-md">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={18}/>
                <input 
                    type="text"
                    placeholder="Filtrar por remédio, data ou título..."
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm font-bold text-gray-700 transition-all"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setVisibleCount(5); }}
                />
            </div>
        </div>

        <Button 
          onClick={handleNewPrescription} 
          className="h-12 px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105"
        >
          <Plus size={16} className="mr-2 text-pink-500" /> Nova
        </Button>
      </div>

      {totalFiltered === 0 ? (
        <div className="bg-white dark:bg-gray-800 py-32 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-200">
            <FileText size={40} />
          </div>
          <p className="text-gray-500 font-black uppercase text-xs tracking-widest italic">
              {searchTerm ? "Nenhum resultado para a busca" : "Nenhuma prescrição registrada"}
          </p>
          {searchTerm && (
              <Button variant="ghost" onClick={() => setSearchTerm("")} className="mt-2 text-pink-600 font-bold text-xs uppercase tracking-widest hover:bg-pink-50">
                  <FilterX size={14} className="mr-2"/> Limpar Filtros
              </Button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* RENDERIZAÇÃO AGRUPADA POR DATA */}
          {Object.entries(groupedItems).map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* Separador de Data */}
              <div className="flex items-center gap-4 px-4 sticky top-32 z-10">
                 <div className="bg-white/90 backdrop-blur-md border border-gray-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm flex items-center gap-2">
                    <CalendarDays size={14} className="text-pink-500"/>
                    {groupLabel}
                 </div>
                 <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {items.map((recipe) => (
                  <div key={`${recipe.source}-${recipe.id}`} className="group bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-8 relative overflow-hidden">
                      
                      {/* Borda Lateral de Status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${recipe.source === 'evolution' ? 'bg-emerald-400' : 'bg-pink-400'}`}></div>

                      {/* Indicador de Data & Origem */}
                      <div className={`flex md:flex-col items-center justify-center gap-1 p-6 rounded-3xl min-w-[130px] border ${recipe.source === 'evolution' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-pink-50/50 border-pink-100'}`}>
                        <span className={`text-3xl font-black italic tracking-tighter ${recipe.source === 'evolution' ? 'text-emerald-600' : 'text-pink-600'}`}>
                            {format(new Date(recipe.created_at), 'dd')}
                        </span>
                        <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-2 ${recipe.source === 'evolution' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'}`}>
                            {recipe.source === 'evolution' ? 'PRONTUÁRIO' : 'AVULSA'}
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                                {recipe.title}
                            </h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                               {recipe.source === 'evolution' ? <LinkIcon size={12}/> : <FileText size={12}/>}
                               {recipe.procedure_context}
                            </p>
                          </div>

                          {/* Badge de Status Legal */}
                          {recipe.is_signed ? (
                              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm" title="Documento assinado digitalmente">
                                  <CheckCircle2 size={14}/> 
                                  <span className="text-[10px] font-black uppercase tracking-widest">Assinado</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl border border-gray-200" title="Sem assinatura digital">
                                  <AlertCircle size={14}/>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Pendente</span>
                              </div>
                          )}
                        </div>
                        
                        {/* Chips de Medicamentos */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                            {recipe.medications && recipe.medications.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                 {recipe.medications.map((m: any, idx: number) => (
                                   <span key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 shadow-sm flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${recipe.source === 'evolution' ? 'bg-emerald-400' : 'bg-pink-400'}`}></div>
                                      {m.name || m.drug}
                                   </span>
                                 ))}
                              </div>
                            ) : (
                              <p className="italic text-xs text-gray-400">Ver detalhes no documento.</p>
                            )}
                        </div>

                        {/* Profissional */}
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold">Dr</div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {recipe.professional?.first_name} {recipe.professional?.last_name}
                            </span>
                        </div>
                      </div>

                      {/* Ações Laterais */}
                      <div className="flex flex-row md:flex-col justify-center gap-3 md:pl-8 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 min-w-[140px]">
                        <Button variant="outline" onClick={() => handlePrint(recipe)} className="h-10 rounded-xl border-gray-200 font-bold uppercase text-[9px] tracking-widest hover:bg-blue-50 hover:text-blue-600">
                          <Printer size={14} className="mr-2" /> Imprimir
                        </Button>
                        
                        {recipe.source === 'legacy' ? (
                            <button 
                                onClick={() => handleDeleteLegacy(recipe.id)} 
                                className="h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all gap-2 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                        ) : (
                            <div className="flex flex-col gap-1 w-full">
                                <button 
                                    onClick={handleEditEvolution} 
                                    className="h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all gap-2 text-[9px] font-black uppercase tracking-widest border border-emerald-100"
                                >
                                  <FilePenLine size={14} /> Ver Prontuário
                                </button>
                                <p className="text-[8px] text-gray-300 text-center font-bold uppercase tracking-widest">Vinculado (Leitura)</p>
                            </div>
                        )}
                      </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* BOTÃO CARREGAR MAIS */}
          {hasMore && (
              <div className="flex justify-center pt-8 pb-12">
                  <Button 
                    onClick={() => setVisibleCount(prev => prev + 5)} 
                    variant="outline" 
                    className="h-12 px-8 rounded-full border-2 border-gray-200 text-gray-500 hover:border-pink-500 hover:text-pink-600 font-bold uppercase tracking-widest text-xs bg-white shadow-sm transition-all hover:scale-105"
                  >
                      <ChevronDown size={16} className="mr-2"/> Carregar Mais Histórico
                  </Button>
              </div>
          )}
        </div>
      )}
    </div>
  );
}