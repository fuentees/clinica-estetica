import { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  ScrollText, Plus, Loader2, Printer, Trash2,
  FileText, FilePenLine, CheckCircle2, AlertCircle, 
  Link as LinkIcon, Search, CalendarDays, ChevronDown, FilterX,
  Copy, MessageCircle, Share2, Eye, Send
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientContext {
  patient: {
    id: string;
    name: string;
    cpf?: string;
    phone?: string;
    mobile?: string;
  };
}

interface UnifiedPrescription {
  id: string;
  source: 'legacy' | 'evolution';
  created_at: string;
  title: string; 
  procedure_context?: string;
  is_signed: boolean;
  shared_at?: string; 
  viewed_at?: string;
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

type FilterType = 'all' | 'evolution' | 'legacy' | 'signed';

export function PatientPrescriptionsPage() {
  const { patient } = useOutletContext<PatientContext>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<UnifiedPrescription[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    if (patient?.id) fetchUnifiedPrescriptions();
  }, [patient?.id]);

  async function fetchUnifiedPrescriptions() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
          if (profile?.clinic_id) {
              const { data: clinic } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single();
              setClinicData(clinic);
          }
      }

      const { data: linksData } = await supabase
        .from('document_links')
        .select('file_path, created_at, viewed_at')
        .eq('patient_id', patient.id);

      const legacyQuery = supabase
        .from("prescriptions")
        .select(`id, created_at, date, medications, notes, professional:profiles!professional_id (first_name, last_name, role, registration_number, formacao, signature_data)`)
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      const evolutionQuery = supabase
        .from("evolution_records")
        .select(`id, date, subject, description, attachments, professional:profiles!professional_id (first_name, last_name, role, registration_number, formacao, signature_data)`)
        .eq("patient_id", patient.id)
        .order("date", { ascending: false });

      const [legacyRes, evoRes] = await Promise.all([legacyQuery, evolutionQuery]);

      const findLinkStatus = (itemId: string) => {
          if (!linksData) return { shared: false, viewed: null };
          const match = linksData.find((l: any) => l.file_path && l.file_path.includes(itemId));
          return {
              shared_at: match ? match.created_at : undefined,
              viewed_at: match ? match.viewed_at : undefined
          };
      };

      const legacyItems: UnifiedPrescription[] = (legacyRes.data || []).map((item: any) => {
        const status = findLinkStatus(item.id);
        return {
            id: item.id,
            source: 'legacy',
            created_at: item.date || item.created_at,
            title: item.notes || "Receita Avulsa",
            notes: item.notes,
            procedure_context: "Prescrição Direta",
            is_signed: !!item.professional?.signature_data,
            shared_at: status.shared_at,
            viewed_at: status.viewed_at,
            professional: Array.isArray(item.professional) ? item.professional[0] : item.professional,
            medications: item.medications || []
        };
      });

      const newItems: UnifiedPrescription[] = [];
      if (evoRes.data) {
          evoRes.data.forEach((r: any) => {
              let meds = [];
              if (r.attachments?.prescription && Array.isArray(r.attachments.prescription)) meds = r.attachments.prescription;
              else if (r.attachments?.prescriptions && Array.isArray(r.attachments.prescriptions)) meds = r.attachments.prescriptions;

              if (meds.length > 0) {
                  const status = findLinkStatus(r.id);
                  newItems.push({
                      id: r.id,
                      source: 'evolution',
                      created_at: r.date,
                      title: "Receita de Prontuário",
                      notes: "Receita vinculada à evolução",
                      procedure_context: r.subject || "Atendimento",
                      is_signed: !!(Array.isArray(r.professional) ? r.professional[0] : r.professional)?.signature_data,
                      shared_at: status.shared_at,
                      viewed_at: status.viewed_at,
                      professional: Array.isArray(r.professional) ? r.professional[0] : r.professional,
                      medications: meds
                  });
              }
          });
      }

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

  const generateDocumentHTML = (item: UnifiedPrescription) => {
    const prof = item.professional || {} as any;
    const profName = `${prof.first_name || "Profissional"} ${prof.last_name || ""}`;
    const profReg = `${prof.formacao || 'Especialista'} • ${prof.registration_number || ''}`;
    const clinicName = clinicData?.name || "CLÍNICA DE ESTÉTICA";
    const clinicAddress = clinicData?.address ? `${clinicData.address}` : "";
    const logoHtml = clinicData?.logo_url ? `<img src="${clinicData.logo_url}" class="logo" />` : `<h1>${clinicName}</h1>`;
    const dateStr = new Date(item.created_at).toLocaleDateString('pt-BR');

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Receita - ${patient.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Open+Sans:wght@400;600&display=swap');body{font-family:'Open Sans',sans-serif;padding:0;background:#fff;margin:0}.paper{max-width:100%;margin:0 auto;background:white;padding:20px;}.header{border-bottom:2px solid #059669;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:flex-end}.logo{max-height:70px;max-width:200px;object-fit:contain}.header h1{font-family:'Montserrat',sans-serif;color:#065f46;margin:0;font-size:20px}.header p{font-size:10px;color:#666;margin:5px 0 0 0}.meta{text-align:right}.meta-title{font-family:'Montserrat',sans-serif;font-weight:700;color:#059669;font-size:12px;text-transform:uppercase}.patient-box{background:#ecfdf5;border-left:4px solid #059669;padding:15px;border-radius:4px;margin-bottom:30px}.patient-label{font-size:10px;font-weight:800;text-transform:uppercase;color:#059669}.patient-name{font-family:'Montserrat',sans-serif;font-size:18px;font-weight:700;color:#111;margin:2px 0 0 0}.doc-title{text-align:center;margin-bottom:30px;font-family:'Montserrat',sans-serif;font-size:16px;font-weight:800;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:10px}.item{margin-bottom:25px;page-break-inside:avoid}.item-title{font-family:'Montserrat',sans-serif;font-weight:700;font-size:14px;color:#064e3b;margin-bottom:5px}.item-obs{background:#f9fafb;padding:10px;border-radius:6px;border:1px solid #e5e7eb;font-size:12px;color:#4b5563;font-style:italic}.footer{text-align:center;margin-top:50px;padding-top:20px;border-top:1px solid #eee}.sig-img{height:60px;display:block;margin:0 auto}.prof-name{font-family:'Montserrat',sans-serif;font-weight:700;font-size:14px;color:#111;margin-bottom:2px}.prof-reg{font-size:11px;color:#666}.digital-badge{display:inline-block;background:#d1fae5;color:#065f46;font-size:9px;font-weight:700;padding:4px 8px;border-radius:99px;margin-top:10px;text-transform:uppercase}@media print { body { padding: 0; } .paper { box-shadow: none; padding: 0; } }</style></head><body><div class="paper"><div class="header"><div>${logoHtml}<p>${clinicAddress}</p></div><div class="meta"><div class="meta-title">Documento Digital</div><div>${dateStr}</div></div></div><div class="patient-box"><div class="patient-label">Paciente</div><h2 class="patient-name">${patient.name}</h2></div><div class="doc-title">${item.title}</div>${item.medications.map((m:any,i)=>`<div class="item"><div class="item-title">${i+1}. ${m.name||m.drug} ${m.dosage?`(${m.dosage})`:''}</div>${m.components&&m.components.length?`<div style="font-size:11px;margin-bottom:5px">${m.components.map((c:any)=>`${c.name} ${c.quantity}`).join(' + ')}</div>`:''}<div class="item-obs">${m.observations||m.instructions||'Uso conforme orientação.'}</div></div>`).join('')}<div class="footer">${prof.signature_data?`<img src="${prof.signature_data}" class="sig-img"/>`:''}<div class="prof-name">Dr(a). ${profName}</div><div class="prof-reg">${profReg}</div><div class="digital-badge">Gerado via VILAGI System • Link Seguro</div></div></div></body></html>`;
  };

  const handleWhatsApp = async (item: UnifiedPrescription) => {
      setIsSharing(item.id);
      
      try {
        const htmlContent = generateDocumentHTML(item);
        
        // CORREÇÃO DE CHARSET E TIPO
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const fileName = `${patient.id}/${item.id}-${Date.now()}.html`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, blob, { 
                upsert: true,
                contentType: 'text/html;charset=utf-8'
            });
        
        if (uploadError) throw uploadError;

        const { data: linkData, error: dbError } = await supabase
            .from('document_links')
            .insert({
                patient_id: patient.id,
                file_path: fileName,
            })
            .select()
            .single();

        if (dbError) throw dbError;

        const appUrl = `${window.location.origin}/doc/${linkData.token}`;

        const rawPhone = patient.phone || patient.mobile || "";
        const cleanPhone = rawPhone.replace(/\D/g, '');
        let finalPhone = cleanPhone.length >= 10 && !cleanPhone.startsWith('55') ? `55${cleanPhone}` : cleanPhone;

        const message = `Olá ${patient.name.split(' ')[0]}! 👋\n\nAcesse sua receita digital de forma segura no link abaixo:\n\n🔐 *${appUrl}*\n\nEste link expira em 30 dias.`;
        const encoded = encodeURIComponent(message);
        const waUrl = finalPhone ? `https://wa.me/${finalPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

        setAllItems(prev => prev.map(i => i.id === item.id ? { ...i, shared_at: new Date().toISOString() } : i));
        
        await navigator.clipboard.writeText(appUrl);
        toast.success("Link seguro gerado e copiado!", { icon: "🔒" });
        
        window.open(waUrl, '_blank');

      } catch (err: any) {
          console.error(err);
          toast.error("Erro ao criar link seguro: " + err.message);
      } finally {
          setIsSharing(null);
      }
  };

  const { groupedItems, totalFiltered, hasMore } = useMemo(() => {
    const filtered = allItems.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            item.title?.toLowerCase().includes(searchLower) ||
            (item.procedure_context || "").toLowerCase().includes(searchLower) ||
            item.medications.some((m: any) => (m.name || m.drug || "").toLowerCase().includes(searchLower));

        let matchesType = true;
        if (activeFilter === 'evolution') matchesType = item.source === 'evolution';
        if (activeFilter === 'legacy') matchesType = item.source === 'legacy';
        if (activeFilter === 'signed') matchesType = item.is_signed === true;

        return matchesSearch && matchesType;
    });

    const visibleItems = filtered.slice(0, visibleCount);
    const groups: { [key: string]: UnifiedPrescription[] } = {};
    visibleItems.forEach(item => {
        const date = new Date(item.created_at);
        if (isNaN(date.getTime())) return;
        const key = format(date, 'MMMM yyyy', { locale: ptBR });
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (!groups[formattedKey]) groups[formattedKey] = [];
        groups[formattedKey].push(item);
    });

    return { groupedItems: groups, totalFiltered: filtered.length, hasMore: filtered.length > visibleCount };
  }, [allItems, searchTerm, visibleCount, activeFilter]);

  const handleDuplicate = (item: UnifiedPrescription) => {
      navigate(`/prescriptions/new?patient_id=${patient.id}`, { state: { replicateData: { title: item.title, treatments: item.medications } } });
      toast.success("Copiado para nova receita!");
  };

  const handleDeleteLegacy = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("prescriptions").delete().eq("id", id);
    setAllItems(prev => prev.filter(p => p.id !== id));
    toast.success("Excluída.");
  };

  const handleEditEvolution = () => navigate(`/patients/${patient.id}/evolution`);
  const handleNewPrescription = () => navigate(`/prescriptions/new?patient_id=${patient.id}`);

  const handlePrint = (item: UnifiedPrescription) => {
    const html = generateDocumentHTML(item);
    const printWindow = window.open('', '_blank', 'height=800,width=900');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.write(`<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); }</script>`);
      printWindow.document.close();
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-20">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-3xl text-pink-600">
            <ScrollText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Histórico de Receitas</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
               {allItems.length} documentos
            </p>
          </div>
        </div>
        <div className="flex-1 max-w-md">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={18}/>
                <input type="text" placeholder="Buscar..." className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm font-bold" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setVisibleCount(5); }} />
            </div>
        </div>
        <Button onClick={handleNewPrescription} className="h-12 px-6 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105">
          <Plus size={16} className="mr-2 text-pink-500" /> Nova
        </Button>
      </div>

      <div className="flex gap-3 pb-2 overflow-x-auto">
          {['all', 'evolution', 'legacy', 'signed'].map(f => (
             <button key={f} onClick={() => setActiveFilter(f as FilterType)} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-pink-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500'}`}>
                {f === 'all' ? 'Todas' : f === 'evolution' ? 'Prontuário' : f === 'legacy' ? 'Avulsas' : 'Assinadas'}
             </button>
          ))}
      </div>

      {totalFiltered === 0 ? (
        <div className="bg-white dark:bg-gray-800 py-32 rounded-[3rem] border-2 border-dashed border-gray-100 text-center"><p className="text-gray-500 font-black uppercase text-xs tracking-widest">Nenhum resultado.</p></div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedItems).map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-4 px-4 sticky top-32 z-10">
                 <div className="bg-white/90 backdrop-blur-md border border-gray-200 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm flex items-center gap-2"><CalendarDays size={14} className="text-pink-500"/> {groupLabel}</div>
                 <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {items.map((recipe) => (
                  <div key={`${recipe.source}-${recipe.id}`} className="group bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-8 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${recipe.source === 'evolution' ? 'bg-emerald-400' : 'bg-pink-400'}`}></div>
                      <div className={`flex md:flex-col items-center justify-center gap-1 p-6 rounded-3xl min-w-[130px] border ${recipe.source === 'evolution' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-pink-50/50 border-pink-100'}`}>
                        <span className={`text-3xl font-black italic tracking-tighter ${recipe.source === 'evolution' ? 'text-emerald-600' : 'text-pink-600'}`}>{recipe.created_at ? format(new Date(recipe.created_at), 'dd') : '--'}</span>
                        <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-2 ${recipe.source === 'evolution' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'}`}>{recipe.source === 'evolution' ? 'PRONTUÁRIO' : 'AVULSA'}</div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{recipe.title}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                               {recipe.source === 'evolution' ? <LinkIcon size={12}/> : <FileText size={12}/>} {recipe.procedure_context}
                            </p>
                          </div>
                          <div className="flex gap-2">
                              {recipe.viewed_at ? <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm"><Eye size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Visto {format(new Date(recipe.viewed_at), 'dd/MM')}</span></div> : recipe.shared_at ? <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm"><Send size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Enviado</span></div> : null}
                              {recipe.is_signed ? <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm"><CheckCircle2 size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Assinado</span></div> : <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl border border-gray-200"><AlertCircle size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">Pendente</span></div>}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                            {recipe.medications && recipe.medications.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                 {recipe.medications.map((m: any, idx: number) => (
                                   <span key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 shadow-sm flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${recipe.source === 'evolution' ? 'bg-emerald-400' : 'bg-pink-400'}`}></div> {m.name || m.drug}
                                   </span>
                                 ))}
                              </div>
                            ) : (<p className="italic text-xs text-gray-400">Ver detalhes.</p>)}
                        </div>
                        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold">Dr</div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{recipe.professional?.first_name} {recipe.professional?.last_name}</span></div>
                      </div>
                      <div className="flex flex-col gap-2 justify-center border-l border-gray-100 pl-6 min-w-[160px]">
                        <Button variant="outline" onClick={() => handlePrint(recipe)} className="h-9 rounded-xl border-gray-200 font-bold uppercase text-[9px] tracking-widest hover:bg-blue-50 hover:text-blue-600 w-full justify-start"><Printer size={14} className="mr-2" /> Imprimir</Button>
                        <Button variant="outline" onClick={() => handleWhatsApp(recipe)} disabled={isSharing === recipe.id} className={`h-9 rounded-xl border-gray-200 font-bold uppercase text-[9px] tracking-widest w-full justify-start transition-all ${recipe.shared_at ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'hover:bg-green-50 hover:text-green-600'}`}>
                          {isSharing === recipe.id ? <Loader2 className="animate-spin mr-2" size={14}/> : <Share2 size={14} className="mr-2" />} {isSharing === recipe.id ? 'Gerando...' : recipe.shared_at ? 'Reenviar Link' : 'Enviar Link'}
                        </Button>
                        <Button variant="outline" onClick={() => handleDuplicate(recipe)} className="h-9 rounded-xl border-gray-200 font-bold uppercase text-[9px] tracking-widest hover:bg-pink-50 hover:text-pink-600 w-full justify-start"><Copy size={14} className="mr-2" /> Repetir</Button>
                        {recipe.source === 'legacy' ? <button onClick={() => handleDeleteLegacy(recipe.id)} className="h-9 flex items-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all gap-2 text-[9px] font-bold uppercase tracking-widest w-full px-4"><Trash2 size={14} /> Excluir</button> : <div className="flex flex-col gap-1 w-full"><button onClick={handleEditEvolution} className="h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all gap-2 text-[9px] font-black uppercase tracking-widest border border-emerald-100"><FilePenLine size={14} /> Ver Prontuário</button><p className="text-[8px] text-gray-300 text-center font-bold uppercase tracking-widest">Vinculado (Leitura)</p></div>}
                      </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {hasMore && <div className="flex justify-center pt-8 pb-12"><Button onClick={() => setVisibleCount(prev => prev + 5)} variant="outline" className="h-12 px-8 rounded-full border-2 border-gray-200 text-gray-500 hover:border-pink-500 hover:text-pink-600 font-bold uppercase tracking-widest text-xs bg-white shadow-sm transition-all hover:scale-105"><ChevronDown size={16} className="mr-2"/> Carregar Mais Histórico</Button></div>}
        </div>
      )}
    </div>
  );
}