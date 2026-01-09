// components/modals/ModalAgendarSessao.tsx
"use client" // <--- Adicionei isso para garantir que funcione no Next.js App Router
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  clienteSelecionado: { id: string; nome: string };
  planoSelecionado: { id: string; nome_plano: string };
  onClose: () => void;
}

export default function ModalAgendarSessao({ clienteSelecionado, planoSelecionado, onClose }: Props) {
  // Removi a linha "createClientComponentClient" pois já importamos o supabase lá em cima

  const [dataEscolhida, setDataEscolhida] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [loading, setLoading] = useState(false)

  const agendarSessao = async () => {
    if (!dataEscolhida || !profissionalId) {
        alert("Preencha data e profissional!");
        return;
    }

    setLoading(true)

    const { data, error } = await supabase
      .rpc('agendar_sessao_plano', {
        p_cliente_id: clienteSelecionado.id,
        p_plano_cliente_id: planoSelecionado.id, 
        p_data_horario: new Date(dataEscolhida).toISOString(), // <--- Garante formato correto pro banco
        p_profissional_id: profissionalId,
        p_observacoes: `Agendamento via Sistema - Plano: ${planoSelecionado.nome_plano}`
      })

    setLoading(false)

    if (error) {
      console.error("Erro na requisição:", error)
      alert("Erro ao conectar com o servidor.")
      return
    }

    // Convertendo data para 'any' rapidinho só para o TypeScript não reclamar se não tiver tipagem gerada
    const resposta = data as any;

    if (resposta && resposta.sucesso) {
      alert(`Agendado com sucesso! Saldo restante: ${resposta.novo_saldo} sessões.`)
      onClose()
    } else {
      alert(`Não foi possível agendar: ${resposta?.erro || 'Erro desconhecido'}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Agendar Sessão</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
            Plano: <span className="font-semibold">{planoSelecionado.nome_plano}</span><br/>
            Cliente: {clienteSelecionado.nome}
        </p>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
                <input 
                  type="datetime-local" 
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onChange={(e) => setDataEscolhida(e.target.value)} 
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
                <select 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onChange={(e) => setProfissionalId(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {/* Substitua pelos IDs reais dos seus usuários no banco */}
                    <option value="ID_DO_VICTOR_AQUI">Dr. Victor</option>
                    <option value="ID_DA_LARISSA_AQUI">Dra. Larissa</option>
                </select>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
            <button 
                onClick={onClose} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
                Cancelar
            </button>
            
            <button 
                onClick={agendarSessao} 
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
            >
                {loading ? 'Processando...' : 'Confirmar Agendamento'}
            </button>
        </div>
      </div>
    </div>
  )
}