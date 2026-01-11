import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, Save, Package, Calendar, Tag, AlertTriangle } from "lucide-react"; 
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// --- SCHEMA DE VALIDAÇÃO (ATUALIZADO) ---
const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"), // Importante para a IA
  quantity: z.coerce.number().min(0, "Mínimo 0"),
  minimum_quantity: z.coerce.number().min(1, "Mínimo 1"),
  unit_price: z.coerce.number().min(0, "Valor inválido"),
  
  // Novos Campos Sanitários
  batch: z.string().min(1, "Lote é obrigatório (ANVISA)"),
  expiration_date: z.string().refine((val) => val !== '', "Validade obrigatória"),
});

type FormData = z.infer<typeof schema>;

export function InventoryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
        quantity: 0, 
        minimum_quantity: 5, 
        unit_price: 0,
        category: "Injetaveis" // Valor padrão inteligente
    }
  });

  // Monitora a data para avisar se está vencido na hora do cadastro
  const expiryDate = watch("expiration_date");
  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id:clinic_id')
          .eq('id', user.id)
          .single();

        if (profile?.clinic_id) {
          setClinicId(profile.clinic_id);

          if (isEditing && id) {
            const { data: item, error } = await supabase
              .from('inventory')
              .select('*')
              .eq('id', id)
              .eq('clinic_id', profile.clinic_id) 
              .single();

            if (!error && item) {
              setValue('name', item.name);
              setValue('description', item.description || '');
              setValue('quantity', item.quantity);
              setValue('minimum_quantity', item.minimum_quantity);
              setValue('unit_price', item.unit_price);
              
              // Setando novos campos
              setValue('batch', item.batch || '');
              setValue('expiration_date', item.expiration_date || '');
              setValue('category', item.category || 'Outros');
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
        clinic_id: clinicId 
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from('inventory')
          .update(payload)
          .eq('id', id)
          .eq('clinic_id', clinicId);
        
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
    <div className="p-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">
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
                    {isEditing ? "Editar Item" : "Entrada de Nota"}
                </h1>
                <p className="text-sm text-gray-500">Cadastro completo para rastreabilidade ANVISA.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-600"></div>
            
            {/* GRUPO 1: IDENTIFICAÇÃO */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Tag size={12}/> Dados do Produto
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome Comercial</label>
                        <Input 
                          {...register("name")} 
                          placeholder="Ex: Botox 100U Allergan" 
                          className="rounded-xl h-11 focus:ring-2 focus:ring-pink-500 font-medium"
                        />
                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Categoria</label>
                        <select 
                            {...register("category")}
                            className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-pink-500 dark:bg-gray-950 dark:border-gray-800"
                        >
                            <option value="Injetaveis">💉 Injetáveis (Toxina/Preench.)</option>
                            <option value="Acidos">🧪 Ácidos e Peelings</option>
                            <option value="Tecnologias">⚡ Tecnologias (Ponteiras)</option>
                            <option value="Descartaveis">🧤 Descartáveis</option>
                            <option value="HomeCare">🏠 Home Care (Venda)</option>
                            <option value="Outros">📦 Outros</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Descrição / Fornecedor</label>
                    <Input {...register("description")} placeholder="Detalhes técnicos ou nome do fornecedor..." className="rounded-xl h-11" />
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700"/>

            {/* GRUPO 2: SEGURANÇA SANITÁRIA (IMPORTANTE) */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <AlertTriangle size={12}/> Controle Sanitário (Obrigatório)
                </h3>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Lote (Batch)</label>
                        <Input 
                            {...register("batch")} 
                            placeholder="Ex: L883920" 
                            className="bg-white dark:bg-gray-900 border-orange-200 focus:ring-orange-500"
                        />
                         {errors.batch && <p className="text-red-500 text-xs">{errors.batch.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Data de Validade</label>
                        <div className="relative">
                            <Input 
                                type="date" 
                                {...register("expiration_date")} 
                                className={`bg-white dark:bg-gray-900 border-orange-200 focus:ring-orange-500 ${isExpired ? 'text-red-600 font-bold border-red-500' : ''}`}
                            />
                            <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16}/>
                        </div>
                        {isExpired && (
                            <p className="text-red-600 text-xs font-bold flex items-center gap-1 mt-1">
                                <AlertTriangle size={10}/> Produto Vencido!
                            </p>
                        )}
                        {errors.expiration_date && <p className="text-red-500 text-xs">{errors.expiration_date.message}</p>}
                    </div>
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700"/>

            {/* GRUPO 3: QUANTIDADES E VALORES */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Estoque e Custos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantidade Atual</label>
                        <Input 
                          type="number" 
                          {...register("quantity")} 
                          className="font-bold rounded-xl h-11 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Estoque Mínimo</label>
                        <Input 
                          type="number" 
                          {...register("minimum_quantity")} 
                          className="rounded-xl h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Custo Unitário (R$)</label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...register("unit_price")} 
                          className="rounded-xl h-11 bg-green-50/50 dark:bg-green-900/10 border-green-100"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row gap-3">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-pink-600 hover:bg-pink-700 text-white w-full h-12 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none font-bold"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                    {isEditing ? "Salvar Alterações" : "Registrar Entrada"}
                </Button>
            </div>
        </form>
    </div>
  );
}