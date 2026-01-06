import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  Printer, 
  CheckSquare, 
  Loader2, 
  ScrollText, 
  ShieldCheck, 
  FileText, 
  Eraser, 
  ArrowLeft,
  User as UserIcon 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import * as Components from "../../components/anamnesis/AnamnesisFormComponents";
import * as Constants from "../../data/anamnesisOptions";
import { generateAnamnesisPdf } from "../../utils/generateAnamnesisPdf"; 
import SignatureCanvas from "react-signature-canvas";

// --- COMPONENTE INTERNO DE ASSINATURA ---
function LocalSignaturePad({ onEnd, existingSignature, isLoading }: any) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onEnd("");
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      onEnd("");
    } else {
      onEnd(sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-950 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 overflow-hidden shadow-inner">
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={save}
          canvasProps={{
            className: "w-full h-64 cursor-crosshair",
          }}
        />
      </div>
      <div className="flex justify-between items-center px-2">
        {existingSignature && (
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14}/> Assinatura biométrica registrada
          </span>
        )}
        <button
          type="button"
          onClick={clear}
          disabled={isLoading}
          className="text-[10px] font-black text-gray-400 hover:text-rose-500 uppercase tracking-widest flex items-center gap-2 transition-colors ml-auto group"
        >
          <Eraser size={14} className="group-hover:rotate-12 transition-transform" /> Limpar e refazer
        </button>
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export function PatientTermsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [signatureData, setSignatureData] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [fullData, setFullData] = useState<any>(null);

  const { register, handleSubmit, setValue, watch } = useForm();
  const termoAceito = watch("termo_aceito");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Busca paciente e tenta trazer o perfil associado
        const { data, error } = await supabase
          .from("patients")
          .select("*, profiles!profile_id(*)")
          .eq("id", id)
          .single();
        
        if (error) throw error;

        if (data) {
          setFullData(data);
          setValue("termo_aceito", data.termo_aceito || false);
          setValue("autoriza_foto", data.autoriza_foto || false);
          setValue("autoriza_midia", data.autoriza_midia || false);
          
          const json = data.procedimentos_detalhes_json || {};
          if (json.assinatura_base64) {
            setSavedSignature(json.assinatura_base64);
            setSignatureData(json.assinatura_base64);
          }
        }
      } catch (e) { 
        console.error("Erro ao carregar dados dos termos:", e);
        toast.error("Erro ao carregar dados do paciente.");
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, [id, setValue]);

  const handlePrint = () => {
    if (!fullData) return toast.error("Aguarde o carregamento dos dados...");
    const pdfData = { ...fullData, ...watch() };
    generateAnamnesisPdf(fullData, pdfData, signatureData || savedSignature);
    toast.success("PDF gerado com sucesso!");
  }

  const onSubmit = async (data: any) => {
    if (!signatureData && !savedSignature) {
      return toast.error("A assinatura biométrica é obrigatória.");
    }

    setSaving(true);
    try {
      // 1. Atualiza os campos booleanos de consentimento
      const { error: updateError } = await supabase.from("patients").update({
        termo_aceito: data.termo_aceito,
        autoriza_foto: data.autoriza_foto,
        autoriza_midia: data.autoriza_midia,
        updated_at: new Date().toISOString()
      }).eq("id", id);

      if (updateError) throw updateError;
      
      // 2. Se houve nova assinatura, atualiza o JSON de detalhes
      if (signatureData && signatureData !== savedSignature) {
        const { data: curr } = await supabase.from("patients").select("procedimentos_detalhes_json").eq("id", id).single();
        const json = curr?.procedimentos_detalhes_json || {};
        
        await supabase.from("patients").update({
          procedimentos_detalhes_json: { ...json, assinatura_base64: signatureData }
        }).eq("id", id);
        
        setSavedSignature(signatureData);
      }

      toast.success("Documentação jurídica confirmada!");
      navigate(`/patients/${id}`);
    } catch (e: any) { 
      console.error(e);
      toast.error("Erro ao salvar termos: " + e.message); 
    } finally { 
      setSaving(false); 
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
      <Loader2 className="animate-spin text-pink-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando documentação...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-900 p-0 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-pink-600">
              <ScrollText size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Termos Jurídicos</h2>
              <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">Consentimento e LGPD</p>
            </div>
          </div>
        </div>
        <Button type="button" onClick={handlePrint} variant="outline" className="h-12 px-6 rounded-xl border-gray-200 font-black uppercase text-[10px] tracking-widest hover:bg-pink-50 transition-colors">
          <Printer size={18} className="mr-2 text-pink-500" /> Exportar PDF
        </Button>
      </div>

      {/* TEXTO DO TERMO */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute -top-6 -right-6 text-gray-50 dark:text-gray-900/40 opacity-50">
          <ShieldCheck size={180} />
        </div>
        <div className="relative z-10">
          <h3 className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <FileText size={14}/> Cláusulas de Proteção
          </h3>
          <div className="max-h-[300px] overflow-y-auto pr-6 custom-scrollbar text-sm text-justify leading-relaxed text-gray-600 dark:text-gray-400 italic font-medium">
            {Constants.TERMO_LGPD_COMPLETO?.split('\n').map((p, i) => (
              p.trim() && <p key={i} className="mb-4">{p}</p>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-pink-50/30 dark:bg-pink-900/5 p-10 rounded-[3rem] border-2 border-pink-100 dark:border-pink-900/20">
          <h3 className="text-[10px] font-black text-pink-800 dark:text-pink-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
            <CheckSquare size={20}/> Validação do Paciente
          </h3>
          <div className="grid gap-4">
            <Components.CheckboxItem name="termo_aceito" label="Li e aceito os termos de responsabilidade e ciência." register={register} />
            <Components.CheckboxItem name="autoriza_foto" label="Autorizo fotos para fins de prontuário e acompanhamento técnico." register={register} />
            <Components.CheckboxItem name="autoriza_midia" label="Autorizo o uso de imagem em redes sociais e materiais de divulgação." register={register} />
          </div>
        </div>

        {/* PAD DE ASSINATURA */}
        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 ml-1 flex items-center gap-2">
            <UserIcon size={14} className="text-pink-500" /> Assinatura Digital
          </label>
          <LocalSignaturePad 
            onEnd={setSignatureData} 
            existingSignature={savedSignature} 
            isLoading={saving} 
          />
        </div>

        {/* BOTÃO DE AÇÃO */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving || !termoAceito} 
            className={`h-16 px-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${
              termoAceito ? 'bg-gray-900 text-white hover:scale-[1.02] active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} className="text-pink-500" />}
            {saving ? "Processando..." : "Confirmar Assinatura"}
          </Button>
        </div>
      </form>
    </div>
  );
}