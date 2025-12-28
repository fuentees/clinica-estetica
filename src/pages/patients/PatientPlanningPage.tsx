import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Save, Loader2, PenTool } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import * as Components from "../../components/anamnesis/AnamnesisFormComponents";

// Helper simples para converter string numérica
const toNumOrNull = (val: any) => {
  if (!val) return null;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
};

export function PatientPlanningPage() {
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    async function load() {
        try {
            const { data } = await supabase.from("patients").select("*").eq("id", id).single();
            if(data) {
                setValue("satisfacao_imagem_corporal", data.satisfacao_imagem_corporal);
                setValue("preferencia_plano", data.preferencia_plano);
                setValue("plano_inicial", data.plano_inicial);
                setValue("numero_sessoes_estimado", data.numero_sessoes_estimado);
                setValue("intervalo_sessoes", data.intervalo_sessoes);
                setValue("prioridade_regioes", data.prioridade_regioes);
                setValue("red_flags_profissional", data.red_flags_profissional);
            }
        } catch(e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [id, setValue]);

  const onSubmit = async (data: any) => {
      setSaving(true);
      try {
          await supabase.from("patients").update({
              satisfacao_imagem_corporal: data.satisfacao_imagem_corporal,
              preferencia_plano: data.preferencia_plano,
              plano_inicial: data.plano_inicial,
              numero_sessoes_estimado: toNumOrNull(data.numero_sessoes_estimado),
              intervalo_sessoes: data.intervalo_sessoes,
              prioridade_regioes: data.prioridade_regioes,
              red_flags_profissional: data.red_flags_profissional
          }).eq("id", id);
          toast.success("Planejamento salvo!");
      } catch (e) { toast.error("Erro ao salvar"); } finally { setSaving(false); }
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
            <PenTool className="text-pink-600" /> Diagnóstico e Planejamento
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
             <div className="grid md:grid-cols-2 gap-6 mb-6">
                 <Components.LabelSlider label="Satisfação com Imagem Corporal (0-10)" name="satisfacao_imagem_corporal" register={register} min="0" max="10" low="Péssima" high="Ótima" />
                 <Components.SelectField label="Preferência de Plano" name="preferencia_plano" register={register} options={["Rápido/Intensivo", "Gradual/Suave", "A critério profissional"]} />
             </div>
             
             <div className="space-y-6">
                <Components.Field label="Plano Terapêutico Proposto">
                    <textarea 
                        {...register("plano_inicial")} 
                        className="w-full p-3 border rounded-md dark:bg-gray-900 dark:border-gray-600 dark:text-white h-32 focus:ring-2 focus:ring-pink-500 outline-none" 
                        placeholder="Descreva os protocolos, tecnologias e cosméticos sugeridos..." 
                    />
                </Components.Field>

                <div className="grid md:grid-cols-3 gap-4">
                    <Components.InputWithLabel label="Nº Sessões (Estimado)" {...register("numero_sessoes_estimado")} type="number" />
                    <Components.InputWithLabel label="Intervalo entre sessões" {...register("intervalo_sessoes")} placeholder="Ex: 15 dias" />
                    <Components.InputWithLabel label="Regiões Prioritárias" {...register("prioridade_regioes")} />
                </div>

                <Components.Field label="Alertas / Contraindicações (Red Flags)">
                    <textarea 
                        {...register("red_flags_profissional")} 
                        className="w-full p-3 border rounded-md bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900 text-red-800 dark:text-red-200 h-24 focus:ring-2 focus:ring-red-500 outline-none" 
                        placeholder="Anotações críticas de segurança..." 
                    />
                </Components.Field>
             </div>
           
           <div className="flex justify-end pt-6 border-t mt-6">
                <Button type="submit" disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} 
                    Salvar Planejamento
                </Button>
           </div>
        </form>
    </div>
  );
}