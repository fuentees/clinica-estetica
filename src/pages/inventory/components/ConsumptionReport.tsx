import { useState } from 'react';
import { useProductConsumption } from '../../../hooks/useProductConsumption';
import { useProfessionals } from '../../../hooks/useProfessionals';
import { Button } from '../../../components/ui/button';
import { Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

export function ConsumptionReport() {
  const { data: consumption } = useProductConsumption();
  const { data: professionals } = useProfessionals();
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: format(new Date().setDate(1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredConsumption = consumption?.filter(record => {
    const recordDate = new Date(record.created_at);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    return (!selectedProfessional || record.professional_id === selectedProfessional) &&
           recordDate >= startDate &&
           recordDate <= endDate;
  });

  const consumptionByProfessional = filteredConsumption?.reduce((acc, record) => {
    const key = record.professional_id;
    if (!acc[key]) {
      acc[key] = {
        professional: \`\${record.profiles.first_name} \${record.profiles.last_name}\`,
        items: {},
        total: 0,
      };
    }
    
    const itemKey = record.inventory.name;
    if (!acc[key].items[itemKey]) {
      acc[key].items[itemKey] = 0;
    }
    
    acc[key].items[itemKey] += record.quantity;
    acc[key].total += record.quantity;
    
    return acc;
  }, {} as Record<string, any>);

  const downloadReport = () => {
    if (!filteredConsumption) return;

    const csv = [
      ['Data', 'Profissional', 'Produto', 'Quantidade'].join(','),
      ...filteredConsumption.map(record => [
        format(new Date(record.created_at), 'dd/MM/yyyy'),
        \`\${record.profiles.first_name} \${record.profiles.last_name}\`,
        record.inventory.name,
        record.quantity,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`consumption-report-\${format(new Date(), 'yyyy-MM-dd')}.csv\`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Profissional</label>
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Todos</option>
              {professionals?.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.first_name} {prof.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Período</label>
            <div className="flex gap-2 mt-1">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>
        <Button onClick={downloadReport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {Object.entries(consumptionByProfessional || {}).map(([id, data]) => (
          <div key={id} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{data.professional}</h3>
              <span className="text-sm text-gray-500">
                Total: {data.total} itens
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(data.items).map(([item, quantity]) => (
                <div key={item} className="flex justify-between items-center">
                  <span>{item}</span>
                  <span className="text-sm font-medium">{quantity} unidades</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}