import { useState, useEffect } from 'react';
import { 
  X, 
  FileSignature, 
  ShieldCheck, 
  ScrollText, 
  Printer, 
  Smartphone, 
  Copy, 
  Loader2,
  Building // ✅ Adicionado ícone de fallback
} from 'lucide-react';

// ✅ Caminho corrigido: sobe 2 pastas para achar components
import { Button } from '../../components/ui/button'; 
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

// Estilos de impressão para garantir que só o termo saia no papel
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #consent-content, #consent-content * { visibility: visible; }
    #consent-content { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
    .no-print { display: none !important; }
    .modal-overlay { background: white; }
    img { max-width: 220px !important; height: auto !important; }
  }
`;

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSigned: () => void;
  patientId: string;
  professionalId: string;
  clinicId: string;
  procedureName: string;
}

export default function ConsentModal({ isOpen, onClose, onSigned, patientId, professionalId, clinicId, procedureName }: ConsentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingTemplate, setFetchingTemplate] = useState(true);
  const [agreed, setAgreed] = useState(false);
  
  // Estados do Conteúdo
  const [templateTitle, setTemplateTitle] = useState("Termo de Consentimento");
  const [templateContent, setTemplateContent] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [clinicLogo, setClinicLogo] = useState<string | null>(null); // ✅ NOVO: Estado para o logo
  const [clinicName, setClinicName] = useState(""); // ✅ NOVO: Nome dinâmico

  // Estados de UI (Remoto vs Local)
  const [remoteMode, setRemoteMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [signLink, setSignLink] = useState("");

  // Busca o template e o logo ao abrir o modal
  useEffect(() => {
    if (isOpen && procedureName) {
      fetchTemplate();
      fetchClinicData(); // ✅ NOVO: Busca dados da clínica
    }
  }, [isOpen, procedureName]);

  // ✅ Busca o logo e nome na tabela 'clinics'
  const fetchClinicData = async () => {
    try {
      const { data } = await supabase
        .from('clinics')
        .select('name, logo_url')
        .eq('id', clinicId)
        .single();
      if (data) {
        setClinicLogo(data.logo_url);
        setClinicName(data.name);
      }
    } catch (err) {
      console.error("Erro ao buscar dados da clínica:", err);
    }
  };

  const fetchTemplate = async () => {
    setFetchingTemplate(true);
    setRemoteMode(false); // Reseta para modo leitura
    try {
      const { data: templates, error } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('deleted_at', null);

      if (error) throw error;

      const procLower = procedureName.toLowerCase();
      
      // Lógica de Match: Procura palavra-chave do procedimento nos templates
      const match = templates?.find(t => 
        t.procedure_keywords && t.procedure_keywords.some((k: string) => procLower.includes(k.toLowerCase()))
      );

      let contentToUse = "";
      
      if (match) {
        setTemplateTitle(match.title);
        contentToUse = match.content;
        setTemplateId(match.id);
      } else {
        setTemplateTitle(`Termo: ${procedureName}`);
        contentToUse = `TERMO DE CONSENTIMENTO PARA ${procedureName.toUpperCase()}\n\n(Texto padrão gerado automaticamente pois nenhum modelo específico foi encontrado).\n\nDeclaro que fui informado(a) sobre os benefícios, riscos e cuidados do procedimento...`;
        setTemplateId(null);
      }

      // Substituição de Variáveis Básicas (Placeholder)
      contentToUse = contentToUse
        .replace(/{PROCEDIMENTO}/g, procedureName)
        .replace(/{DATA}/g, new Date().toLocaleDateString('pt-BR'));

      setTemplateContent(contentToUse);

      // Gera link simulado para assinatura remota
      const link = `${window.location.origin}/sign?p=${patientId}&proc=${encodeURIComponent(procedureName)}`;
      setSignLink(link);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}`);

    } catch (err) {
      console.error("Erro ao buscar template:", err);
      setTemplateContent("Erro ao carregar o texto do termo. Por favor, utilize o termo físico.");
    } finally {
      setFetchingTemplate(false);
    }
  };

  const handleSign = async () => {
    if (!agreed) return toast.error("Marque a caixa de aceite para assinar.");
    
    setLoading(true);
    try {
      // Grava no banco a "assinatura" com Snapshot jurídico
      const { error } = await supabase.from('patient_consents').insert({
        clinic_id: clinicId,
        patient_id: patientId,
        professional_id: professionalId,
        template_id: templateId,
        procedure_name: procedureName,
        content_snapshot: templateContent, // 🔒 O mais importante: salva o que foi lido
        ip_address: "presencial",
        user_agent: navigator.userAgent,
        signed_at: new Date().toISOString()
      });

      if (error) throw error;

      toast.success("Termo assinado e arquivado com sucesso!");
      onSigned(); // Callback para liberar o pai
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao assinar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(signLink);
    toast.success("Link copiado para a área de transferência!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300 modal-overlay">
      <style>{printStyles}</style>
      
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col h-[90vh] max-h-[800px]">
        
        {/* Header (Não sai na impressão) */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-3xl no-print">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
              <FileSignature size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">{templateTitle}</h2>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Documento Legal Obrigatório</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={handlePrint} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500" title="Imprimir Termo">
               <Printer size={20}/>
             </button>
             <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500">
               <X size={24}/>
             </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 custom-scrollbar relative">
          
          {fetchingTemplate ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 no-print">
                  <ScrollText className="animate-pulse" size={40}/>
                  <p className="text-xs font-bold uppercase tracking-widest">Carregando Termo...</p>
              </div>
          ) : (
              <>
                {remoteMode ? (
                  // --- MODO ASSINATURA REMOTA (QR CODE) ---
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 animate-in zoom-in-95 no-print">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-900">
                        <img src={qrCodeUrl} alt="QR Code Assinatura" className="w-56 h-56 object-contain"/> 
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Escaneie para Assinar</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">
                          Peça para o paciente apontar a câmera do celular para este código. Ele lerá o termo e assinará no próprio dispositivo.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full max-w-sm">
                        <Button variant="outline" onClick={copyToClipboard} className="flex-1 h-12 rounded-xl gap-2 font-bold">
                           <Copy size={16}/> Copiar Link
                        </Button>
                        <Button variant="ghost" onClick={() => setRemoteMode(false)} className="h-12 rounded-xl text-gray-500">
                           Voltar
                        </Button>
                    </div>
                  </div>
                ) : (
                  // --- MODO LEITURA NA TELA ---
                  <div id="consent-content" className="p-8 prose prose-sm max-w-none dark:prose-invert">
                    
                    {/* ✅ CABEÇALHO CORRIGIDO: Foto > Nome > Título em baixo */}
                    <div className="flex flex-col items-center mb-10 border-b pb-8 text-center bg-white dark:bg-gray-950">
                      {clinicLogo ? (
                        <img 
                          src={clinicLogo} 
                          alt="Logo Clínica" 
                          className="max-h-24 w-auto object-contain mb-2 block mx-auto" 
                          style={{ maxWidth: '220px', height: 'auto' }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 border-2 border-dashed border-gray-200 dark:border-gray-700">
                          <Building className="text-gray-300 dark:text-gray-600" size={32} />
                        </div>
                      )}

                      {/* Nome da Unidade Dinâmico */}
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 block">
                        {clinicName || 'VILAGI ESTÉTICA AVANÇADA'}
                      </span>

                      {/* Título do Termo como um Título real abaixo de tudo */}
                      <h1 className="text-2xl font-black uppercase text-gray-900 dark:text-white tracking-tighter border-t pt-6 w-full max-w-[80%] border-gray-100 dark:border-gray-800 leading-tight">
                        {templateTitle}
                      </h1>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium leading-relaxed text-justify whitespace-pre-wrap shadow-inner print:shadow-none print:border-0 print:p-0 print:bg-transparent">
                      {templateContent}
                    </div>

                    {/* Espaço para assinatura física na impressão */}
                    <div className="hidden print:block mt-20 pt-8 border-t border-black break-inside-avoid">
                        <div className="flex justify-between text-xs font-bold uppercase">
                           <div className="text-center w-1/3">
                              <p className="border-t border-black pt-2">Assinatura do Paciente</p>
                           </div>
                           <div className="text-center w-1/3">
                              <p className="border-t border-black pt-2">Assinatura do Profissional</p>
                           </div>
                        </div>
                        <p className="text-center mt-8 text-[10px]">Gerado eletronicamente por VILAGI Estética - {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </>
          )}
        </div>

        {/* Footer (Ações) - Escondido se estiver no modo Remoto ou Impressão */}
        {!remoteMode && !fetchingTemplate && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-3xl no-print">
            
            {/* Checkbox de Aceite */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 mb-6 flex gap-4 items-start">
               <ShieldCheck className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20}/>
               <label className="flex items-start gap-3 cursor-pointer w-full">
                  <input 
                     type="checkbox" 
                     checked={agreed} 
                     onChange={(e) => setAgreed(e.target.checked)}
                     className="mt-1 w-5 h-5 border-2 border-blue-400 rounded focus:ring-blue-500 text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1">
                     <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-0.5">Declaração de Ciência</p>
                     <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight block">
                        Li o documento acima, compreendi todos os riscos e autorizo a realização do procedimento.
                     </span>
                  </div>
               </label>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setRemoteMode(true)} 
                className="flex-1 h-14 rounded-2xl font-bold uppercase text-xs tracking-widest text-gray-500 border-dashed border-2 hover:bg-gray-50 hover:text-gray-900"
              >
                <Smartphone className="mr-2" size={18}/> Assinar no Celular
              </Button>
              
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 self-center hidden md:block"></div>

              <Button 
                onClick={handleSign} 
                disabled={!agreed || loading}
                className={`flex-[2] h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all ${agreed ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {loading ? <Loader2 className="animate-spin mr-2"/> : <FileSignature className="mr-2" size={18}/>}
                {loading ? "Registrando..." : "Assinar na Tela Agora"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}