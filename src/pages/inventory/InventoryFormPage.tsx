import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, Save, Package } from "lucide-react"; 
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Mínimo 0"),
  minimum_quantity: z.coerce.number().min(1, "Mínimo 1"),
  unit_price: z.coerce.number().min(0, "Valor inválido"),
});

type FormData = z.infer<typeof schema>;

export function InventoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0, minimum_quantity: 5, unit_price: 0 }
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('clinicId')
          .eq('id', user.id)
          .single();

        if (profile?.clinicId) {
          setClinicId(profile.clinicId);

          if (isEditing && id) {
            const { data: item, error } = await supabase
              .from('inventory')
              .select('*')
              .eq('id', id)
              .eq('clinicId', profile.clinicId) 
              .single();

            if (!error && item) {
              setValue('name', item.name);
              setValue('description', item.description || '');
              setValue('quantity', item.quantity);
              setValue('minimum_quantity', item.minimum_quantity);
              setValue('unit_price', item.unit_price);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    loadData();
  }, [id, isEditing, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!clinicId) {
      toast.error("Erro de identificação da clínica.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { 
        ...data, 
        clinicId: clinicId 
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from('inventory')
          .update(payload)
          .eq('id', id)
          .eq('clinicId', clinicId);
        
        if (error) throw error;
        toast.success("Estoque atualizado!");
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert(payload);
        
        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }
      navigate('/inventory');
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/inventory')}
              className="rounded-full h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <ArrowLeft size={20} />
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-pink-600" size={24} />
                    {isEditing ? "Editar Insumo" : "Novo Insumo"}
                </h1>
                <p className="text-sm text-gray-500">Controle rigoroso de materiais da clínica.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-pink-500"></div>
            
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome do Produto</label>
                <Input 
                  {...register("name")} 
                  placeholder="Ex: Toxina Botulínica (Frasco 100U)" 
                  className="rounded-xl h-11 focus:ring-2 focus:ring-pink-500 transition-all font-medium"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Descrição / Detalhes</label>
                <Input 
                  {...register("description")} 
                  placeholder="Marca, Fornecedor, Lote ou observações..." 
                  className="rounded-xl h-11 focus:ring-2 focus:ring-pink-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantidade</label>
                    <Input 
                      type="number" 
                      {...register("quantity")} 
                      className="font-bold rounded-xl h-11 border-blue-100 bg-blue-50/30 dark:bg-blue-900/10" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Aviso Crítico</label>
                    <Input 
                      type="number" 
                      {...register("minimum_quantity")} 
                      className="rounded-xl h-11 border-orange-100 bg-orange-50/30 dark:bg-orange-900/10"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">Alerta de estoque baixo</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Preço Custo (R$)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...register("unit_price")} 
                      className="rounded-xl h-11 border-green-100 bg-green-50/30 dark:bg-green-900/10"
                    />
                </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-pink-600 hover:bg-pink-700 text-white w-full h-12 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none transition-transform hover:scale-[1.01] font-bold"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    {isEditing ? "Salvar Alterações" : "Cadastrar no Estoque"}
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/inventory')}
                  className="w-full h-12 rounded-xl text-gray-500 font-medium"
                >
                  Cancelar
                </Button>
            </div>
        </form>
    </div>
  );
}