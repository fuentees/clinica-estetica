import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { toast } from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import { 
  Loader2, 
  CheckCircle2, 
  Building, 
  FileText, 
  PenTool, 
  Eraser, 
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import * as Constants from "../../data/anamnesisOptions"; 

// Hash de segurança para o conteúdo
async function generateContentHash(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function SignGeneralTermPage() {
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Dados vindos do Banco (via Função Segura)
  const [pageData, setPageData] = useState<any>(null);
  
  // Formulário
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    async function loadSecureData() {
      try {
        if (!patientId) {
            setErrorMsg("Link inválido (falta ID).");
            setLoading(false);
            return;
        }
        
        // Chamada RPC (Segura)
        const { data, error } = await supabase
          .rpc('get_signing_page_data', { p_patient_id: patientId });

        if (error) throw error;

        if (data && data.length > 0) {
            setPageData(data[0]); // Pega o primeiro resultado
        } else {
            setErrorMsg("Documento não encontrado ou link expirado.");
        }

      } catch (err) {
        console.error(err);
        setErrorMsg("Erro de conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    }
    loadSecureData();
  }, [patientId]);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setSignature("");
  };

  const handleSaveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
        setSignature("");
    } else {
        setSignature(sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png") || "");
    }
  };

  const handleSubmit = async () => {
    if (!agreed) return toast.error("É necessário aceitar os termos.");
    if (!signature) return toast.error("Por favor, assine no campo indicado.");
    if (!pageData?.clinic_id) return toast.error("Erro de sistema: Clínica não carregada.");

    setSaving(true);
    try {
      const content = Constants.TERMO_LGPD_COMPLETO || "Termo de Consentimento.";
      const hash = await generateContentHash(content);

      // Envia usando a função segura de escrita
      const { error } = await supabase.rpc('submit_public_signature', {
        p_patient_id: patientId,
        p_clinic_id: pageData.clinic_id,
        p_signature: signature,
        p_content: content,
        p_hash: hash,
        p_user_agent: navigator.userAgent
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Assinado com sucesso!");

    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // TELA DE CARREGAMENTO
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando Documento...</p>
        </div>
    </div>
  );

  // TELA DE ERRO (LINK QUEBRADO)
  if (errorMsg) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-500 mb-6">{errorMsg}</p>
        <p className="text-xs text-gray-400">Solicite um novo link à clínica.</p>
    </div>
  );

  // TELA DE SUCESSO
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center animate-in zoom-in-95">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-sm">
            <CheckCircle2 size={48} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Tudo Pronto!</h1>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Obrigado, <strong>{pageData?.patient_name?.split(' ')[0]}</strong>.<br/>
            Seu termo foi assinado e arquivado com segurança.
        </p>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 w-full max-w-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Pode fechar esta janela.</p>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (CONTRATO)
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER DA MARCA */}
      <div className="bg-white px-6 py-8 shadow-sm border-b border-gray-100 flex flex-col items-center sticky top-0 z-20">
        {pageData?.clinic_logo_url ? (
            <img 
                src={pageData.clinic_logo_url} 
                alt="Logo" 
                className="h-20 w-auto object-contain mb-4" 
            />
        ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Building size={24} className="text-gray-300" />
            </div>
        )}
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight text-center">Termo de Consentimento</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{pageData?.clinic_name}</p>
      </div>

      <div className="max-w-xl mx-auto p-5 space-y-6 mt-2"> 
        
        {/* TEXTO DO CONTRATO */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                <FileText size={18} className="text-pink-600"/>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Cláusulas</h3>
            </div>
            
            <div className="h-[350px] overflow-y-auto pr-3 custom-scrollbar text-sm text-gray-600 leading-7 text-justify font-medium">
                {(Constants.TERMO_LGPD_COMPLETO || "Texto do termo não carregado.").split('\n').map((p, i) => (
                    p.trim() && <p key={i} className="mb-3">{p}</p>
                ))}
            </div>
        </div>

        {/* CHECKBOX DE ACEITE */}
        <div 
            onClick={() => setAgreed(!agreed)}
            className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98] ${agreed ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-white border-gray-200'}`}
        >
            <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${agreed ? 'bg-pink-600 border-pink-600' : 'bg-white border-gray-300'}`}>
                {agreed && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <label className="text-sm font-semibold text-gray-700 leading-snug cursor-pointer select-none">
                Li e aceito os termos de responsabilidade e uso de dados acima.
            </label>
        </div>

        {/* CAMPO DE ASSINATURA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <PenTool size={14} className="text-pink-600"/> Sua Assinatura
                </span>
                <button 
                    onClick={handleClear} 
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-200"
                >
                    <Eraser size={12} className="inline mr-1"/> Limpar
                </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 overflow-hidden relative touch-none">
                {!signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-50">Assine aqui</span>
                    </div>
                )}
                <SignatureCanvas 
                    ref={sigCanvas}
                    onEnd={handleSaveSignature}
                    canvasProps={{ className: "w-full h-64" }} 
                    backgroundColor="transparent"
                />
            </div>
        </div>

        {/* BOTÃO DE CONFIRMAR */}
        <div className="sticky bottom-4 pt-2">
            <button 
                onClick={handleSubmit}
                disabled={saving || !agreed || !signature}
                className={`w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    agreed && signature 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                {saving ? "Salvando..." : "Confirmar Assinatura"}
            </button>
        </div>

      </div>
    </div>
  );
}