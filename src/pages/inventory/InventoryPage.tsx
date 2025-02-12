import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Search, FileBarChart, Truck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useInventory } from '../../hooks/useInventory';
import { InventoryForm } from './components/InventoryForm';
import { ConsumptionForm } from './components/ConsumptionForm';
import { ConsumptionReport } from './components/ConsumptionReport';
import { SupplierForm } from './components/SupplierForm';
import { toast } from 'react-hot-toast';

export function InventoryPage() {
  const { data: inventory, isLoading } = useInventory();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showConsumptionForm, setShowConsumptionForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filteredItems = inventory?.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventory?.filter(item =>
    item.quantity <= item.minimum_quantity
  );

  // Check for low stock items and show alerts
  useEffect(() => {
    if (lowStockItems?.length) {
      lowStockItems.forEach(item => {
        if (item.quantity === 0) {
          toast.error(`${item.name} está em falta no estoque!`);
        } else {
          toast.warning(`${item.name} está com estoque baixo (${item.quantity} unidades)`);
        }
      });
    }
  }, [lowStockItems]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          {lowStockItems?.length > 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center text-yellow-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span>{lowStockItems.length} produtos com estoque baixo</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSupplierForm(true)}>
            <Truck className="w-4 h-4 mr-2" />
            Fornecedores
          </Button>
          <Button variant="outline" onClick={() => setShowReport(!showReport)}>
            <FileBarChart className="w-4 h-4 mr-2" />
            {showReport ? 'Ocultar Relatório' : 'Ver Relatório'}
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Rest of the component remains the same */}
    </div>
  );
}
