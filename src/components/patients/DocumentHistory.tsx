import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  FileText, MessageSquare, CheckCircle2, 
  ExternalLink, Share2, Clock, Trash2 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

interface DocumentHistoryProps {
  patientId: string;
  patientPhone: string;
}

export function DocumentHistory({ patientId, patientPhone }: DocumentHistoryProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, [patientId]);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('patient_consents')
        .select('*')
        .eq('patient_id', patientId)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      setDocs(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // ✅ NOTIFICAÇÃO VIA WHATSAPP
  const handleShareWhatsApp = (doc: any) => {
    const message = `Olá! Segue o link do seu ${doc.type === 'termo' ? 'Termo de Consentimento' : 'Guia de Orientações Pós'} referente ao procedimento ${doc.procedure_name}: ${window.location.origin}/view-doc/${doc.id}`;
    
    // Limpa o telefone para o padrão internacional do WhatsApp
    const cleanPhone = patientPhone.replace(/\D/g, "");
    const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    window.open(url, "_blank");
    toast.success("WhatsApp aberto!");
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
        <Clock size={14} /> Histórico de Documentos
      </h3>

      {docs.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
          <p className="text-[10px] font-black uppercase text-gray-300">Nenhum documento assinado</p>
        </div>
      ) : (
        docs.map((doc) => (
          <div key={doc.id} className="group bg-white border border-gray-100 p-5 rounded-[1.8rem] hover:shadow-xl transition-all flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${doc.type === 'termo' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                {doc.type === 'termo' ? <FileText size={20} /> : <MessageSquare size={20} />}
              </div>
              <div>
                <h4 className="font-black text-gray-900 uppercase italic text-sm leading-none">{doc.procedure_name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(doc.signed_at).toLocaleDateString('pt-BR')} às {new Date(doc.signed_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <CheckCircle2 size={10} className="text-green-500" />
                    <span className="text-[8px] font-black text-green-600 uppercase">Válido</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleShareWhatsApp(doc)}
                className="h-10 w-10 rounded-xl border-gray-100 hover:bg-green-50 hover:text-green-600"
              >
                <Share2 size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(`/view-doc/${doc.id}`, '_blank')}
                className="h-10 w-10 rounded-xl border-gray-100 hover:bg-gray-900 hover:text-white"
              >
                <ExternalLink size={16} />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}