import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 
import { 
  FileSignature, Plus, Trash2, Search, 
  Loader2, Edit3, FileText, Eye, EyeOff, Copy, 
  MessageSquare, LayoutGrid, ShieldCheck, Printer,
  Building 
} from "lucide-react";
import { Button } from "../../components/ui/button";

interface Template {
  id?: string;
  title: string;
  content: string;
  status: 'rascunho' | 'ativo';
  type: 'termo' | 'pos';
  clinic_id?: string;
  usage_count?: number;
}

const LEGAL_VARIABLES = [
  { label: "Paciente", code: "{PACIENTE_NOME}", mock: "JOÃO DA SILVA" },
  { label: "CPF", code: "{PACIENTE_CPF}", mock: "123.456.789-00" },
  { label: "Profissional", code: "{PROFISSIONAL_NOME}", mock: "DRA. ANA VILAGI" },
  { label: "Data", code: "{DATA_ATUAL}", mock: new Date().toLocaleDateString('pt-BR') },
  { label: "Clínica", code: "{CLINICA_NOME}", mock: "VILAGI ESTÉTICA" },
];

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean']
  ],
};

export default function ConsentTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicInfo, setClinicInfo] = useState({ name: "Carregando...", logo_url: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'termo' | 'pos'>('termo');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasChanges, setHasChanges] = useState(false);

  const [currentTemplate, setCurrentTemplate] = useState<Template>({
    title: "", content: "", status: 'rascunho', type: 'termo'
  });

  useEffect(() => { fetchClinicAndTemplates(); }, []);

  async function fetchClinicAndTemplates() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`clinic_id, clinics:clinic_id ( name, logo_url )`)
        .eq('id', user.id)
        .single();

      if (profile?.clinic_id) {
        setClinicId(profile.clinic_id);
        const clinicData = profile.clinics as any;
        setClinicInfo({
          name: clinicData?.name || "Sua Clínica",
          logo_url: clinicData?.logo_url || ""
        });
        
        const { data: temps } = await supabase.from('consent_templates').select('*').eq('clinic_id', profile.clinic_id).is('deleted_at', null).order('title');
        
        if (temps) {
          const { data: usageData } = await supabase.from('patient_consents').select('template_id');
          const templatesWithUsage = temps.map(t => ({
            ...t,
            usage_count: usageData?.filter(u => u.template_id === t.id).length || 0
          }));
          setTemplates(templatesWithUsage as Template[]);
        }
      }
    } catch (error) { toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const templateType = t.type || 'termo';
      return templateType === activeTab && t.title.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [templates, searchTerm, activeTab]);

  const previewContent = useMemo(() => {
    let text = currentTemplate.content;
    LEGAL_VARIABLES.forEach(v => {
      const regex = new RegExp(v.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      text = text.replace(regex, `<span style="background-color: #fef3c7; color: #92400e; padding: 0 4px; border-radius: 4px; font-weight: bold;">${v.mock}</span>`);
    });
    return text;
  }, [currentTemplate.content]);

  const handleDuplicate = async (t: Template) => {
    try {
      const { id, usage_count, ...rest } = t;
      const { error } = await supabase.from('consent_templates').insert({ ...rest, title: `${t.title} (CÓPIA)`, status: 'rascunho', clinic_id: clinicId });
      if (error) throw error;
      toast.success("Modelo duplicado!");
      fetchClinicAndTemplates();
    } catch (error) { toast.error("Erro ao duplicar."); }
  };

  const handleEdit = (t: Template) => {
    setCurrentTemplate({ ...t, type: t.type || 'termo' });
    setIsEditing(true);
    setIsPreviewMode(false);
    setHasChanges(false);
  };

  const handleExit = () => {
    if (hasChanges && !confirm("Deseja sair sem salvar as alterações?")) return;
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!currentTemplate.title || !currentTemplate.content) return toast.error("Preencha título e conteúdo.");
    
    setSaving(true);
    try {
      // ✅ Bug de Criação Resolvido: Forçando o TYPE herdar a aba ativa se for novo
      const payload: any = {
        title: currentTemplate.title,
        content: currentTemplate.content,
        status: currentTemplate.status,
        type: currentTemplate.id ? currentTemplate.type : activeTab, 
        clinic_id: clinicId,
      };

      if (currentTemplate.id) payload.id = currentTemplate.id;

      const { error } = await supabase.from('consent_templates').upsert(payload);
      if (error) throw error;

      toast.success("Salvo com sucesso!");
      setIsEditing(false);
      setHasChanges(false);
      fetchClinicAndTemplates();
    } catch (error: any) { 
      toast.error("Erro ao salvar: " + error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" size={50} /></div>;

  return (
    <div className="max-w-[1300px] mx-auto p-8 space-y-8 animate-in fade-in duration-500 min-h-screen print:p-0">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-[6px] border-gray-900 pb-8 mb-4 print:hidden">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-gray-900 text-white rounded-[1.5rem] shadow-xl"><FileSignature size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">BIBLIOTECA DIGITAL</h1>
            <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.4em] mt-2 italic">{clinicInfo.name}</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => { setCurrentTemplate({ title: "", content: "", status: 'rascunho', type: activeTab }); setIsEditing(true); setHasChanges(false); }} className="bg-gray-900 hover:bg-black text-white rounded-2xl px-10 h-16 font-black uppercase text-xs shadow-2xl transition-all border-b-4 border-pink-600">
            <Plus size={20} className="mr-2 text-pink-500"/> NOVO MODELO
          </Button>
        )}
      </div>

      {/* TABS */}
      {!isEditing && (
        <div className="flex gap-4 mb-2 print:hidden">
           <button onClick={() => setActiveTab('termo')} className={`flex items-center gap-3 px-8 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 ${activeTab === 'termo' ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-pink-200'}`}><FileText size={18} /> Termos Jurídicos</button>
           <button onClick={() => setActiveTab('pos')} className={`flex items-center gap-3 px-8 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 ${activeTab === 'pos' ? 'bg-pink-500 border-pink-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-pink-200'}`}><MessageSquare size={18} /> Orientações Pós</button>
        </div>
      )}

      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          <div className="space-y-6 lg:col-span-1 print:hidden">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-lg space-y-8">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Estado do Modelo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setCurrentTemplate({...currentTemplate, status: 'rascunho'}); setHasChanges(true); }} className={`h-12 rounded-xl border-2 font-black uppercase text-[8px] transition-all ${currentTemplate.status === 'rascunho' ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>Rascunho</button>
                  <button onClick={() => { setCurrentTemplate({...currentTemplate, status: 'ativo'}); setHasChanges(true); }} className={`h-12 rounded-xl border-2 font-black uppercase text-[8px] transition-all ${currentTemplate.status === 'ativo' ? 'bg-pink-500 border-pink-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>Publicar</button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-gray-50">
                <h4 className="text-[9px] font-black text-pink-500 uppercase tracking-widest italic">Variáveis</h4>
                <div className="grid grid-cols-1 gap-2">
                  {LEGAL_VARIABLES.map(v => (
                    <button key={v.code} onClick={() => { setCurrentTemplate(p => ({...p, content: p.content + ` ${v.code} `})); setHasChanges(true); }} disabled={isPreviewMode} className="flex flex-col p-4 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl transition-all text-left disabled:opacity-30 group">
                      <span className="text-[8px] font-black text-gray-400 uppercase group-hover:text-pink-400 mb-1">{v.label}</span>
                      <span className="text-xs font-mono font-bold tracking-tighter leading-none">{v.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => window.print()} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] gap-2 shadow-xl">
                <Printer size={16} /> Gerar PDF Final
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-gray-100 min-h-[850px] flex flex-col overflow-hidden print:border-0 print:shadow-none">
               <div className="p-8 border-b-2 flex items-center justify-between gap-6 bg-white sticky top-0 z-20 print:hidden">
                  <input disabled={isPreviewMode} value={currentTemplate.title} onChange={e => { setCurrentTemplate({...currentTemplate, title: e.target.value.toUpperCase()}); setHasChanges(true); }} className="bg-transparent text-2xl font-black uppercase italic outline-none w-full tracking-tighter" placeholder="NOME DO DOCUMENTO..." />
                  <div className="flex gap-3">
                    <Button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`h-12 px-6 rounded-xl font-black text-[10px] uppercase ${isPreviewMode ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'}`}>
                      {isPreviewMode ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </Button>
                    <Button variant="outline" onClick={handleExit} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] border-2 hover:bg-gray-50">SAIR</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-black text-white rounded-xl px-8 h-12 font-black uppercase text-[10px] shadow-xl">
                       {saving ? <Loader2 className="animate-spin" size={16}/> : "SALVAR"}
                    </Button>
                  </div>
               </div>
               
               <div className="flex-1 p-10 bg-gray-100/30 print:bg-white print:p-0">
                 <div id="printable-area" className={`mx-auto max-w-[800px] bg-white shadow-xl min-h-[1000px] transition-all duration-500 print:shadow-none print:max-w-full ${isPreviewMode ? 'p-16 ring-4 ring-pink-500/10 print:ring-0 print:p-0' : ''}`}>
                    
                    {/* ✅ CABEÇALHO CORRIGIDO: Logo -> Nome -> TÍTULO EM BAIXO */}
                    {(isPreviewMode || window.matchMedia('print').matches) && (
                      <div className="flex flex-col items-center mb-10 border-b pb-10 text-center bg-white">
                        {clinicInfo.logo_url ? (
                          <img 
                            src={clinicInfo.logo_url} 
                            alt="Logo Clínica" 
                            className="max-h-24 w-auto object-contain mb-2 block mx-auto" 
                            style={{ maxWidth: '220px', height: 'auto' }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 border-2 border-dashed border-gray-200">
                             <Building className="text-gray-300" size={32} />
                          </div>
                        )}
                        
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 block">
                          {clinicInfo.name}
                        </span>

                        <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tighter border-t pt-6 w-full max-w-[80%] border-gray-100">
                          {currentTemplate.title || 'Título do Documento'}
                        </h2>
                      </div>
                    )}

                    {isPreviewMode ? (
                      <div className="prose prose-pink max-w-none text-gray-800 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: previewContent }} />
                    ) : (
                      <ReactQuill 
                        theme="snow" 
                        value={currentTemplate.content} 
                        onChange={(val) => { setCurrentTemplate({...currentTemplate, content: val}); setHasChanges(true); }} 
                        modules={quillModules} 
                        className="h-full border-none font-medium" 
                      />
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 overflow-hidden shadow-sm divide-y-2 divide-gray-50">
          {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
            <div key={t.id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-all group">
              <div className="flex items-center gap-8">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeTab === 'termo' ? 'bg-gray-900 text-white shadow-lg' : 'bg-pink-500 text-white shadow-lg'}`}>
                    {activeTab === 'termo' ? <FileText size={20}/> : <MessageSquare size={20}/>}
                 </div>
                 <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                       <span className="font-black text-gray-900 uppercase italic text-[16px] tracking-tight group-hover:text-pink-600 transition-colors">{t.title}</span>
                       {(t.usage_count || 0) > 0 && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest leading-none">Em Uso</span>}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] mt-0.5 ${t.status === 'ativo' ? 'text-emerald-500' : 'text-gray-300'}`}>{t.status}</span>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => handleDuplicate(t)} variant="outline" className="h-12 w-12 rounded-xl border-2 hover:bg-pink-50 hover:text-pink-500 transition-all shadow-sm"><Copy size={18}/></Button>
                <Button onClick={() => handleEdit(t)} variant="outline" className="h-12 w-12 rounded-xl border-2 hover:bg-gray-900 hover:text-white transition-all shadow-sm"><Edit3 size={18}/></Button>
                <Button onClick={async () => { if((t.usage_count || 0) > 0) return toast.error("Documento em uso."); if(confirm("Excluir permanentemente?")) { await supabase.from('consent_templates').delete().eq('id', t.id); fetchClinicAndTemplates(); } }} variant="outline" disabled={(t.usage_count || 0) > 0} className="h-12 w-12 rounded-xl border-2 hover:bg-red-50 text-red-400 transition-all shadow-sm"><Trash2 size={18}/></Button>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
              <LayoutGrid size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum modelo localizado</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0; padding: 0 !important; box-shadow: none !important; border: 0 !important; }
          .print\:hidden { display: none !important; }
          .ql-editor { padding: 0 !important; }
        }
        .ql-editor { font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.6; padding: 60px !important; color: #111; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 2px solid #f9f9f9 !important; padding: 15px 40px !important; background: #fff !important; }
        .prose { font-family: 'Inter', sans-serif; line-height: 1.8; color: #111; }
      `}</style>
    </div>
  );
}