import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "../../components/ui/card"; // Se estiver dentro de dashboard
import { Button } from "../../components/ui/button"; // Caminho relativo correto
import { PlusCircle, Calendar, Users, Package, DollarSign } from "lucide-react";

const mockData = {
  overview: {
    appointments: 120,
    revenue: 45000,
    patients: 320,
    stockLow: 5,
  },
  revenueTrend: [
    { month: "Jan", revenue: 10000 },
    { month: "Feb", revenue: 15000 },
    { month: "Mar", revenue: 20000 },
    { month: "Apr", revenue: 18000 },
    { month: "May", revenue: 22000 },
  ],
  patientGrowth: [
    { month: "Jan", patients: 200 },
    { month: "Feb", patients: 250 },
    { month: "Mar", patients: 270 },
    { month: "Apr", patients: 290 },
    { month: "May", patients: 320 },
  ],
  stockStatus: [
    { name: "Ácido Hialurônico", quantity: 3 },
    { name: "Botox", quantity: 8 },
    { name: "Fios de PDO", quantity: 6 },
  ],
};

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards de visão geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Consultas</p>
                <h2 className="text-xl font-bold">{mockData.overview.appointments}</h2>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Faturamento</p>
                <h2 className="text-xl font-bold">R$ {mockData.overview.revenue.toLocaleString()}</h2>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Pacientes</p>
                <h2 className="text-xl font-bold">{mockData.overview.patients}</h2>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Estoque Baixo</p>
                <h2 className="text-xl font-bold">{mockData.overview.stockLow}</h2>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold">Faturamento Mensal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.revenueTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4CAF50" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold">Crescimento de Pacientes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.patientGrowth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estoque */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold">Status do Estoque</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie dataKey="quantity" data={mockData.stockStatus} cx="50%" cy="50%" outerRadius={80} fill="#FF9800" label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div className="flex space-x-4 mt-6">
        <Button variant="primary">
          <PlusCircle className="mr-2 w-5 h-5" /> Novo Paciente
        </Button>
        <Button variant="secondary">
          <PlusCircle className="mr-2 w-5 h-5" /> Nova Consulta
        </Button>
      </div>
    </div>
  );
}
