import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react"; // Removido 'Package'
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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0, minimum_quantity: 5, unit_price: 0 }
  });

  useEffect(() => {
    if (isEditing && id) {
        supabase.from('inventory').select('*').eq('id', id).single()
            .then(({ data, error }) => {
                if (!error && data) {
                    setValue('name', data.name);
                    setValue('description', data.description);
                    setValue('quantity', data.quantity);
                    setValue('minimum_quantity', data.minimum_quantity);
                    setValue('unit_price', data.unit_price);
                }
            });
    }
  }, [id, isEditing, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
        const payload = { ...data };
        
        if (isEditing) {
            await supabase.from('inventory').update(payload).eq('id', id);
            toast.success("Produto atualizado!");
        } else {
            await supabase.from('inventory').insert(payload);
            toast.success("Produto cadastrado!");
        }
        navigate('/inventory');
    } catch (error) {
        toast.error("Erro ao salvar.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/inventory')}>
                <ArrowLeft />
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {isEditing ? "Editar Produto" : "Novo Produto"}
                </h1>
                <p className="text-sm text-gray-500">Controle de insumos.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
            
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
                <Input {...register("name")} placeholder="Ex: Toxina Botulínica (Frasco 100U)" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
                <Input {...register("description")} placeholder="Marca, Fornecedor, Lote..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantidade Atual</label>
                    <Input type="number" {...register("quantity")} className="font-bold" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estoque Mínimo</label>
                    <Input type="number" {...register("minimum_quantity")} />
                    <p className="text-[10px] text-gray-400">Alerta se baixar disso</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor Unitário (R$)</label>
                    <Input type="number" step="0.01" {...register("unit_price")} />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    Salvar Produto
                </Button>
            </div>
        </form>
    </div>
  );
}