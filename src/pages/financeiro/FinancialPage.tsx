import { DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { PageContainer } from "../../components/ui/PageContainer"; // O Passo 2
import { StatCard } from "../../components/ui/StatCard"; // O Passo 3

export default function FinancialPage() {
  return (
    // 1. Usa o Container Padrão (Fundo cinza, espaçamento, animação)
    <PageContainer>
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100">
         <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Financeiro</h1>
            <p className="text-gray-500">Gestão de fluxo de caixa</p>
         </div>
         <button className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors">
            Nova Transação
         </button>
      </div>

      {/* Grid de Cards Iguais ao do Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard 
            title="Saldo Total" 
            value="R$ 45.200" 
            sub="+12% vs mês anterior" 
            icon={<DollarSign size={24} />} 
            color="green" 
         />
         <StatCard 
            title="A Receber" 
            value="R$ 12.850" 
            sub="Próximos 7 dias" 
            icon={<TrendingUp size={24} />} 
            color="blue" 
         />
         <StatCard 
            title="Despesas" 
            value="R$ 8.400" 
            sub="Fixas + Variáveis" 
            icon={<CreditCard size={24} />} 
            color="pink" 
         />
      </div>

      {/* Área de Conteúdo (Tabelas, Gráficos) */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 min-h-[400px]">
         <h2 className="font-bold text-xl mb-6">Histórico de Transações</h2>
         <p className="text-gray-400 italic">O conteúdo da tabela entra aqui...</p>
      </div>

    </PageContainer>
  );
}