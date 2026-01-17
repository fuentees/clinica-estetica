import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Loader2, FileX, ShieldCheck, Printer, Lock, Unlock, KeyRound } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

export function DocumentViewerPage() {
  const { token } = useParams();
  
  // Estados de Controle
  const [step, setStep] = useState<'loading' | 'auth' | 'view'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // Dados do Documento
  const [linkData, setLinkData] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  
  // Input da Senha
  const [accessCode, setAccessCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (token) fetchMetadata();
  }, [token]);

  // 1. BUSCA APENAS OS METADADOS (Sem baixar o arquivo ainda)
  async function fetchMetadata() {
    try {
      setStep('loading');
      
      const { data, error: dbError } = await supabase
        .from('document_links')
        .select(`
            id, file_path, patient_id, expires_at,
            patient:patients(name, cpf)
        `)
        .eq('token', token)
        .single();

      if (dbError || !data) throw new Error("Documento não encontrado.");

      if (new Date(data.expires_at) < new Date()) {
          throw new Error("Este link expirou por segurança.");
      }

      // Prepara os dados para a validação
      const patientData = data.patient as any;
      const realName = Array.isArray(patientData) ? patientData[0]?.name : patientData?.name;
      const realCpf = Array.isArray(patientData) ? patientData[0]?.cpf : patientData?.cpf;

      setPatientName(realName || "Paciente");
      setLinkData({ ...data, patientCpf: realCpf });

      // Se o paciente NÃO tiver CPF cadastrado, libera direto (fallback)
      if (!realCpf) {
          downloadContent(data);
      } else {
          setStep('auth'); // Vai para tela de senha
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar.");
    }
  }

  // 2. VALIDA A SENHA (4 DIGITOS)
  const handleVerify = () => {
      if (!linkData?.patientCpf) return;

      setIsVerifying(true);
      
      // Limpa CPF do banco (remove pontos/traços) e pega os 4 primeiros
      const cleanTarget = linkData.patientCpf.replace(/\D/g, '').slice(0, 4);
      const cleanInput = accessCode.replace(/\D/g, '');

      if (cleanInput === cleanTarget) {
          toast.success("Acesso autorizado!");
          downloadContent(linkData); // Baixa o arquivo
      } else {
          toast.error("Código incorreto.");
          setIsVerifying(false);
          setAccessCode(""); // Limpa para tentar de novo
      }
  };

  // 3. BAIXA O CONTEÚDO REAL (Só roda se autorizado)
  async function downloadContent(data: any) {
      try {
          // Registra visualização no banco
          supabase.from('document_links').update({ viewed_at: new Date().toISOString() }).eq('id', data.id).then();

          const { data: storageData } = supabase.storage.from('documents').getPublicUrl(data.file_path);
          
          if (!storageData.publicUrl) throw new Error("Arquivo indisponível.");

          const response = await fetch(storageData.publicUrl);
          if (!response.ok) throw new Error("Falha ao baixar conteúdo.");
          
          const textContent = await response.text();
          setHtmlContent(textContent);
          setStep('view');

      } catch (err) {
          setError("Erro ao baixar o documento seguro.");
      } finally {
          setIsVerifying(false);
      }
  }

  const handlePrint = () => {
      const iframe = document.getElementById('doc-frame') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) iframe.contentWindow.print();
  };

  // --- RENDERIZAÇÃO: ESTADO DE CARREGAMENTO ---
  if (step === 'loading') return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-gray-400 font-medium animate-pulse text-sm uppercase tracking-widest">Validando Link...</p>
    </div>
  );

  // --- RENDERIZAÇÃO: ESTADO DE ERRO ---
  if (error) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm"><FileX size={40}/></div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Link Inválido</h1>
        <p className="text-gray-500 max-w-md">{error}</p>
    </div>
  );

  // --- RENDERIZAÇÃO: TELA DE SENHA (AUTH) ---
  if (step === 'auth') return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
            </div>
            
            <div>
                <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight">Área Segura do Paciente</h1>
                <p className="text-sm text-gray-500 mt-2">Para visualizar o documento de <br/><span className="font-bold text-gray-800">{patientName}</span>, confirme sua identidade.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Digite os 4 primeiros números do CPF
                </label>
                
                <div className="flex justify-center gap-2 mb-4">
                     {/* Input Mascarado Simples */}
                    <input 
                        type="tel" 
                        maxLength={4}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="0000"
                        className="w-40 h-14 text-center text-3xl font-black tracking-[0.5em] text-emerald-600 bg-white border-2 border-emerald-100 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-emerald-100"
                        autoFocus
                    />
                </div>

                <Button 
                    onClick={handleVerify} 
                    disabled={accessCode.length < 4 || isVerifying}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30"
                >
                    {isVerifying ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Unlock size={18}/> Desbloquear Documento</span>}
                </Button>
            </div>
            
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Protegido por Criptografia VILAGI</p>
        </div>
    </div>
  );

  // --- RENDERIZAÇÃO: DOCUMENTO (VIEW) ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 md:py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in slide-in-from-bottom-4 duration-700">
        
        <div className="bg-emerald-600 p-4 md:p-6 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ShieldCheck size={24}/></div>
                <div>
                    <h1 className="font-bold text-sm md:text-lg uppercase tracking-wider">Documento Autenticado</h1>
                    <p className="text-xs md:text-sm text-emerald-100 opacity-90">{patientName}</p>
                </div>
            </div>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-sm font-bold backdrop-blur-sm cursor-pointer">
                <Printer size={18} /> <span className="hidden md:inline">Imprimir / PDF</span>
            </button>
        </div>

        <div className="flex-1 bg-white relative">
            <iframe 
                id="doc-frame"
                srcDoc={htmlContent || ""} 
                className="w-full h-full border-none" 
                title="Documento Médico"
            ></iframe>
        </div>
        
        <div className="bg-gray-50 p-3 text-center border-t border-gray-200 shrink-0">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Acesso registrado em {new Date().toLocaleString('pt-BR')} • IP Monitorado
            </p>
        </div>
      </div>
    </div>
  );
}