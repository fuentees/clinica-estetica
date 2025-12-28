import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Plus, Trash2, Calendar, Syringe } from 'lucide-react';
import { BodyMappingComponent } from '../../components/anamnesis/BodyMappingComponent';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface MarkedArea {
  id: string;
  x: number;
  y: number;
  label: string;
  description?: string;
  type: 'facial' | 'corporal';
}

interface InjectableProduct {
  id: string;
  name: string;
  brand: string;
  volume: string;
  dilution?: string;
}

interface InjectablePlan {
  id?: string;
  patient_id: string;
  date: string;
  areas: MarkedArea[];
  products: InjectableProduct[];
  notes: string;
  total_units?: number;
  professional_notes?: string;
  next_session_date?: string;
}

export function InjectablesPlanningPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<InjectablePlan[]>([]);
  
  // Controle de visualização do mapa
  const [viewMode, setViewMode] = useState<'face' | 'body'>('face');

  const [currentPlan, setCurrentPlan] = useState<InjectablePlan>({
    patient_id: patientId || '',
    date: new Date().toISOString().split('T')[0],
    areas: [],
    products: [],
    notes: '',
  });
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState<InjectableProduct>({
    id: '',
    name: '',
    brand: '',
    volume: '',
    dilution: '',
  });

  const commonProducts = [
    { name: 'Toxina Botulínica', brand: 'Botox', volume: '100U' },
    { name: 'Toxina Botulínica', brand: 'Dysport', volume: '300U' },
    { name: 'Ácido Hialurônico', brand: 'Juvederm', volume: '1ml' },
    { name: 'Ácido Hialurônico', brand: 'Restylane', volume: '1ml' },
    { name: 'Sculptra', brand: 'Galderma', volume: '5ml' },
    { name: 'Radiesse', brand: 'Merz', volume: '1.5ml' },
  ];

  useEffect(() => {
    if (patientId) {
      loadPlans();
    }
  }, [patientId]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('injectable_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleSavePlan = async () => {
    if (!currentPlan.areas.length) {
      toast.error('Marque pelo menos uma área para aplicação');
      return;
    }

    if (!currentPlan.products.length) {
      toast.error('Adicione pelo menos um produto');
      return;
    }

    setLoading(true);
    try {
      const planToSave = {
        patient_id: patientId,
        date: currentPlan.date,
        areas: currentPlan.areas,
        products: currentPlan.products,
        notes: currentPlan.notes,
        total_units: currentPlan.total_units,
        professional_notes: currentPlan.professional_notes,
        next_session_date: currentPlan.next_session_date,
      };

      const { error } = await supabase
        .from('injectable_plans')
        .insert([planToSave]);

      if (error) throw error;

      toast.success('Plano salvo com sucesso!');
      loadPlans();
      setCurrentPlan({
        patient_id: patientId || '',
        date: new Date().toISOString().split('T')[0],
        areas: [],
        products: [],
        notes: '',
      });
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.brand) {
      toast.error('Preencha nome e marca do produto');
      return;
    }

    const productWithId = {
      ...newProduct,
      id: `prod-${Date.now()}`,
    };

    setCurrentPlan({
      ...currentPlan,
      products: [...currentPlan.products, productWithId],
    });

    setNewProduct({ id: '', name: '', brand: '', volume: '', dilution: '' });
    setShowProductForm(false);
  };

  const handleQuickAddProduct = (product: { name: string; brand: string; volume: string }) => {
    const productWithId = {
      ...product,
      id: `prod-${Date.now()}`,
      dilution: '',
    };

    setCurrentPlan({
      ...currentPlan,
      products: [...currentPlan.products, productWithId],
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setCurrentPlan({
      ...currentPlan,
      products: currentPlan.products.filter((p) => p.id !== productId),
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Syringe className="w-8 h-8 text-blue-600" />
          Planejamento de Injetáveis
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Mapeie as áreas de aplicação e registre os produtos utilizados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informações da Sessão
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data da Aplicação *
                </label>
                <input
                  type="date"
                  value={currentPlan.date}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Próxima Sessão
                </label>
                <input
                  type="date"
                  value={currentPlan.next_session_date || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, next_session_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Mapeamento
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('face')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'face' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Facial
                </button>
                <button
                  onClick={() => setViewMode('body')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === 'body' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Corporal
                </button>
              </div>
            </div>

            <div className="flex justify-center bg-gray-50 rounded-xl p-4">
              <BodyMappingComponent
                value={currentPlan.areas}
                onChange={(areas) => setCurrentPlan({ ...currentPlan, areas })}
                viewMode={viewMode}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Produtos Utilizados
              </h3>
              <button
                type="button"
                onClick={() => setShowProductForm(!showProductForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Adicionar Produto
              </button>
            </div>

            {!showProductForm && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Produtos comuns:</p>
                <div className="flex flex-wrap gap-2">
                  {commonProducts.map((product, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickAddProduct(product)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                    >
                      {product.brand} - {product.volume}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showProductForm && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Ex: Toxina Botulínica"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      placeholder="Ex: Botox"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Volume/Unidades
                    </label>
                    <input
                      type="text"
                      value={newProduct.volume}
                      onChange={(e) => setNewProduct({ ...newProduct, volume: e.target.value })}
                      placeholder="Ex: 100U ou 1ml"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Diluição
                    </label>
                    <input
                      type="text"
                      value={newProduct.dilution}
                      onChange={(e) => setNewProduct({ ...newProduct, dilution: e.target.value })}
                      placeholder="Ex: 2ml SF 0.9%"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setNewProduct({ id: '', name: '', brand: '', volume: '', dilution: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {currentPlan.products.length > 0 && (
              <div className="space-y-2">
                {currentPlan.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.brand} - {product.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.volume}
                        {product.dilution && ` • Diluição: ${product.dilution}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Observações
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas da Sessão
                </label>
                <textarea
                  value={currentPlan.notes}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, notes: e.target.value })}
                  rows={4}
                  placeholder="Observações gerais sobre a aplicação..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anotações Profissionais
                </label>
                <textarea
                  value={currentPlan.professional_notes || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, professional_notes: e.target.value })}
                  rows={4}
                  placeholder="Técnicas utilizadas, dosagens, etc..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total de Unidades
                </label>
                <input
                  type="number"
                  value={currentPlan.total_units || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, total_units: Number(e.target.value) })}
                  placeholder="Ex: 50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSavePlan}
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Salvando...' : 'Salvar Plano'}
            </button>
          </div>

          {plans.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Histórico de Aplicações
              </h3>
              <div className="space-y-3">
                {plans.slice(0, 5).map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(plan.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plan.areas.length} áreas • {plan.products.length} produtos
                        </p>
                      </div>
                      {plan.total_units && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                          {plan.total_units}U
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}