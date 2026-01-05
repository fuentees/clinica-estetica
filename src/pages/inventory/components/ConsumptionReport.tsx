import { useState } from 'react';
import { useProductConsumption } from '../../../hooks/useProductConsumption';
import { useProfessionals } from '../../../hooks/useProfessionals';
import { Button } from '../../../components/ui/button';
import { Download, User, Calendar as CalendarIcon, PackageOpen, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function ConsumptionReport() {
  const { data: consumption } = useProductConsumption();
  const { data: professionals } = useProfessionals();
  
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: format(new Date().setDate(1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  // Filtragem Lógica
  const filteredConsumption = consumption?.filter(record => {
    const recordDate = new Date(record.created_at); 
    const startDate = new Date(dateRange.start + 'T00:00:00');
    const endDate = new Date(dateRange.end + 'T23:59:59');
    
    return (!selectedProfessional || record.professional_id === selectedProfessional) &&
           recordDate >= startDate &&
           recordDate <= endDate;
  });

  // Agrupamento para exibição por Profissional
  const consumptionByProfessional = filteredConsumption?.reduce((acc, record) => {
    const key = record.professional_id;
    if (!acc[key]) {
      // Aqui usamos o que vem do useProductConsumption (Profiles)
      const firstName = record.profiles?.first_name || '';
      const lastName = record.profiles?.last_name || '';
      
      acc[key] = {
        professional: `${firstName} ${lastName}`.trim() || 'Profissional',
        items: {} as Record<string, number>,
        total: 0,
      };
    }
    
    const itemKey = record.inventory?.name || 'Item desconhecido';
    if (!acc[key].items[itemKey]) {
      acc[key].items[itemKey] = 0;
    }
    
    acc[key].items[itemKey] += record.quantity;
    acc[key].total += record.quantity;
    
    return acc;
  }, {} as Record<string, any>);

  const downloadReport = () => {
    if (!filteredConsumption || filteredConsumption.length === 0) return;

    const headers = ['Data', 'Profissional', 'Produto', 'Quantidade'];
    const rows = filteredConsumption.map(record => [
      format(new Date(record.created_at), 'dd/MM/yyyy HH:mm'),
      `${record.profiles?.first_name || ''} ${record.profiles?.last_name || ''}`,
      record.inventory?.name,
      record.quantity
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-consumo-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <User size={14} className="text-pink-600"/> Filtrar Profissional
            </label>
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm"
            >
              <option value="">Todos os profissionais</option>
              {professionals?.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {/* CORREÇÃO AQUI: Usando firstName e lastName do seu tipo User */}
                  {prof.firstName} {prof.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <CalendarIcon size={14} className="text-pink-600"/> Período de Consumo
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
              />
            </div>
          </div>

        </div>

        <Button 
          onClick={downloadReport} 
          disabled={!filteredConsumption?.length}
          className="bg-gray-900 hover:bg-black text-white h-11 px-6 rounded-xl shadow-lg transition-all hover:scale-105"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de Consumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(consumptionByProfessional || {}).length > 0 ? (
          Object.entries(consumptionByProfessional || {}).map(([id, data]) => (
            <div key={id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group hover:border-pink-200 transition-colors">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold uppercase">
                    {data.professional.charAt(0)}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{data.professional}</h3>
                </div>
                <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500 border border-gray-100 shadow-sm">
                  {data.total} itens total
                </span>
              </div>
              
              <div className="p-6 space-y-3">
                {Object.entries(data.items).map(([item, quantity]) => (
                  <div key={item} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                      <PackageOpen size={16} className="text-gray-400"/>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                    </div>
                    <span className="text-sm font-black text-pink-600 bg-pink-50 dark:bg-pink-900/20 px-3 py-1 rounded-lg">
                      {quantity as number} un
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200">
             <FileText size={48} className="mx-auto text-gray-200 mb-4"/>
             <p className="text-gray-500 font-medium">Nenhum registro de consumo no período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}