import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";

interface Treatment {
  id: string;
  name: string;
  description: string;
  price: number;
}

export function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTreatments() {
      setLoading(true);
      const { data, error } = await supabase.from("treatments").select("*");
      if (error) {
        console.error("Erro ao buscar tratamentos:", error);
      } else {
        setTreatments(data || []);
      }
      setLoading(false);
    }

    fetchTreatments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📋 Lista de Tratamentos</h1>

      <div className="flex justify-end mb-4">
        <Link to="/treatments/new">
          <Button variant="primary">➕ Adicionar Tratamento</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando tratamentos...</p>
      ) : treatments.length === 0 ? (
        <p className="text-gray-500">Nenhum tratamento cadastrado.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Nome</th>
              <th className="border p-2">Descrição</th>
              <th className="border p-2">Preço</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map((treatment) => (
              <tr key={treatment.id} className="hover:bg-gray-50">
                <td className="border p-2">{treatment.name}</td>
                <td className="border p-2">{treatment.description || "Sem descrição"}</td>
                <td className="border p-2">R$ {treatment.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TreatmentsPage;
