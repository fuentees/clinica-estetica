import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Printer, Save, CheckSquare, Loader2, ScrollText } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import * as Components from "../../components/anamnesis/AnamnesisFormComponents";
import * as Constants from "../../data/anamnesisOptions";
import generateAnamnesisPdf from "../../utils/generateAnamnesisPdf";

export function PatientTermsPage() {
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [signatureData, setSignatureData] = useState("");
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [fullData, setFullData] = useState<any>(null);

  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    async function load() {
        try {
            // Busca dados completos para poder gerar o PDF depois
            const { data } = await supabase.from("patients").select("*, profiles:profile_id(*)").eq("id", id).single();
            
            if(data) {
                setFullData(data);
                setValue("termo_aceito", data.termo_aceito);
                setValue("autoriza_foto", data.autoriza_foto);
                setValue("autoriza_midia", data.autoriza_midia);
                
                const json = data.procedimentos_detalhes_json || {};
                if(json.assinatura_base64) {
                    setSavedSignature(json.assinatura_base64);
                    setSignatureData(json.assinatura_base64);
                }
            }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [id, setValue]);

  const handlePrint = () => {
    if (!fullData) return toast.error("Aguarde o carregamento dos dados.");
    
    // Mescla dados atuais da tela com dados do banco para garantir que o PDF esteja atualizado
    const currentTerms = { 
        ...fullData,
        // Força valores true/false para o PDF caso o usuário tenha acabado de clicar
        termo_aceito: true, 
    }; 
    
    generateAnamnesisPdf(fullData, currentTerms, savedSignature || signatureData);
    toast.success("PDF gerado!");
  }

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
        // 1. Atualiza campos de termo na tabela patients
        await supabase.from("patients").update({
            termo_aceito: data.termo_aceito,
            autoriza_foto: data.autoriza_foto,
            autoriza_midia: data.autoriza_midia
        }).eq("id", id);
        
        // 2. Atualiza assinatura no JSON (sem sobrescrever o resto do JSON)
        if(signatureData) {
            const { data: curr } = await supabase.from("patients").select("procedimentos_detalhes_json").eq("id", id).single();
            const json = curr?.procedimentos_detalhes_json || {};
            
            await supabase.from("patients").update({
                procedimentos_detalhes_json: { ...json, assinatura_base64: signatureData }
            }).eq("id", id);
            
            setSavedSignature(signatureData);
        }
        toast.success("Termos e assinatura salvos!");
    } catch(e) { 
        toast.error("Erro ao salvar"); 
    } finally { 
        setSaving(false); 
    }
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ScrollText className="text-pink-600" /> Consentimento e Jurídico
            </h2>
            <Button type="button" onClick={handlePrint} variant="outline" className="gap-2 w-full md:w-auto">
              <Printer size={18} /> Gerar PDF do Prontuário
            </Button>
         </div>

         <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-8 max-h-80 overflow-y-auto text-sm text-justify leading-relaxed text-gray-700 dark:text-gray-300">
             {Constants.TERMO_LGPD_COMPLETO.split('\n').map((p, i) => (
                 p.trim() && <p key={i} className="mb-3">{p}</p>
             ))}
         </div>

         <form onSubmit={handleSubmit(onSubmit)}>
             <div className="space-y-4 mb-8 bg-pink-50 dark:bg-pink-900/10 p-6 rounded-xl border border-pink-100 dark:border-pink-900/30">
                <h3 className="font-bold text-pink-800 dark:text-pink-300 mb-2 flex items-center gap-2"><CheckSquare size={18}/> Declarações do Paciente</h3>
                <Components.CheckboxItem name="termo_aceito" label="Li, compreendi e ACEITO integralmente os termos acima." register={register} />
                <Components.CheckboxItem name="autoriza_foto" label="Autorizo a captura de fotos para composição do meu prontuário." register={register} />
                <Components.CheckboxItem name="autoriza_midia" label="Autorizo o uso da minha imagem em redes sociais (Marketing)." register={register} />
             </div>

             <div className="mb-8">
                 <label className="block font-bold mb-3 text-gray-700 dark:text-gray-300">Assinatura Digital</label>
                 <Components.SignaturePad 
                    onEnd={setSignatureData} 
                    existingSignature={savedSignature} 
                    isLoading={saving} 
                 />
             </div>

             <div className="flex justify-end border-t pt-6">
                <Button type="submit" disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white px-8">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} 
                    Salvar e Assinar
                </Button>
             </div>
         </form>
    </div>
  );
}