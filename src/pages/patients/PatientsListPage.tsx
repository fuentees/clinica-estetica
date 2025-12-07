import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  Search, 
  UserPlus, 
  Users, 
  Loader2, 
  MessageCircle, 
  Mail,          
  Pencil,        
  Trash2,        
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Button } from "../../components/ui/button"; 

export function PatientsListPage() {
  const navigate = useNavigate();
  
  // Dados
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Padrão: 10 por página
  
  // Menu Dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
    
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Reseta para a página 1 sempre que pesquisar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  async function fetchPatients() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*, profiles:profile_id(first_name, last_name, phone, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Erro ao buscar pacientes", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o paciente ${name}?`)) return;
    try {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      setPatients(patients.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir.");
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/patients/${id}/details`);
  }

  // 1. Filtragem
  const filteredPatients = patients.filter((p) => {
    const firstName = p.profiles?.first_name || "";
    const lastName = p.profiles?.last_name || "";
    const fullNameProfile = `${firstName} ${lastName}`.toLowerCase();
    const nameDirect = (p.name || p.nome || "").toLowerCase();
    const finalName = fullNameProfile.trim() ? fullNameProfile : nameDirect;
    const cpf = (p.cpf || "").replace(/\D/g, "");
    const term = searchTerm.toLowerCase();
    return finalName.includes(term) || cpf.includes(term);
  });

  // 2. Lógica de Paginação
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-red-600" /> Pacientes
          </h1>
          <p className="text-gray-500">Gerencie seus cadastros e atendimentos</p>
        </div>
        <Button 
          onClick={() => navigate("/patients/new")}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"
        >
          <UserPlus size={20} /> Novo Paciente
        </Button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-red-600 w-10 h-10" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
          
          {/* TABELA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider rounded-tl-xl">Nome / CPF</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Contato</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-center rounded-tr-xl">Ações</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {currentPatients.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">Nenhum paciente encontrado.</td></tr>
                ) : (
                  currentPatients.map((patient) => {
                    const firstName = patient.profiles?.first_name || "";
                    const lastName = patient.profiles?.last_name || "";
                    const fullName = `${firstName} ${lastName}`.trim() || patient.name || "Sem Nome";
                    const phone = patient.profiles?.phone || patient.phone || patient.telefone || "";
                    const email = patient.profiles?.email || patient.email || "";
                    const cpf = patient.cpf || "CPF n/d";

                    const cleanPhone = phone.replace(/\D/g, "");
                    const whatsappLink = `https://wa.me/55${cleanPhone}`;
                    const emailLink = `mailto:${email}`;

                    return (
                      <tr key={patient.id} className="group hover:bg-red-50 dark:hover:bg-gray-700/50 transition-colors relative">
                        
                        {/* Nome */}
                        <td className="p-4 cursor-pointer align-top" onClick={() => navigate(`/patients/${patient.id}`)}>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-base">{fullName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-700 w-fit px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                              {cpf}
                            </span>
                          </div>
                        </td>
                        
                        {/* Contato */}
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-3">
                             {phone ? (
                               <a 
                                 href={whatsappLink} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 onClick={(e) => e.stopPropagation()}
                                 className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors w-fit"
                               >
                                  <div className="bg-green-100 p-1.5 rounded-full text-green-600"><MessageCircle size={16} /></div>
                                  <span className="font-medium hover:underline">{phone}</span>
                               </a>
                             ) : <span className="text-gray-400 text-sm italic">Sem telefone</span>}
                             
                             {email && (
                               <a 
                                 href={emailLink}
                                 onClick={(e) => e.stopPropagation()}
                                 className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit"
                               >
                                  <div className="bg-blue-100 p-1.5 rounded-full text-blue-600"><Mail size={16} /></div>
                                  <span className="truncate max-w-[200px] hover:underline">{email}</span>
                               </a>
                             )}
                          </div>
                        </td>
                        
                        {/* Ações */}
                        <td className="p-4 align-middle text-center">
                          <div className="flex items-center justify-center gap-2 relative">
                            {/* Botão Prontuário */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-semibold shadow-sm"
                            >
                              <Eye size={16} className="text-blue-600" /> 
                              Prontuário
                            </button>

                            {/* Menu 3 Pontinhos */}
                            <div className="relative">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setOpenMenuId(openMenuId === patient.id ? null : patient.id); 
                                }}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <MoreVertical size={20} />
                              </button>

                              {openMenuId === patient.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(patient.id); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Pencil size={16} /> Editar Cadastro
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(patient.id, fullName); }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                                  >
                                    <Trash2 size={16} /> Excluir Paciente
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ COM PAGINAÇÃO */}
          {filteredPatients.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 gap-4">
              
              {/* Seletor de Quantidade */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Mostrar</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>por página</span>
              </div>

              {/* Navegação de Páginas */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className="text-sm font-medium text-gray-700 dark:text-white">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="text-xs text-gray-400">
                Total: {filteredPatients.length} pacientes
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}