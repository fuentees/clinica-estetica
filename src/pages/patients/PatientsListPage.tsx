import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
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
  MoreHorizontal, // Ícone mais moderno que o vertical
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";

import { Button } from "../../components/ui/button"; 

// --- TIPAGEM ---
interface Patient {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export function PatientsListPage() {
  const navigate = useNavigate();
  
  // --- STATES ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- EFEITOS ---
  useEffect(() => {
    fetchPatients();
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // --- FETCH DATA ---
  async function fetchPatients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista.");
    } finally {
      setLoading(false);
    }
  }

  // --- AÇÕES ---
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir permanentemente: ${name}?`)) return;
    
    try {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      
      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast.success("Paciente removido.");
    } catch (error) {
      toast.error("Erro ao excluir. Verifique vínculos.");
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/patients/${id}/details`);
  }

  // --- FILTROS ---
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const cpf = (p.cpf || "").replace(/\D/g, "");
      return name.includes(term) || cpf.includes(term);
    });
  }, [patients, searchTerm]);

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50 dark:bg-gray-900 font-sans">
      
      {/* --- HEADER SUPERIOR --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Pacientes
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestão unificada de prontuários e cadastros.
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/patients/new")}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 h-10 rounded-full flex items-center gap-2 font-medium shadow-lg shadow-rose-600/20 transition-all hover:scale-105"
        >
          <UserPlus size={18} /> Novo Cadastro
        </Button>
      </div>

      {/* --- BARRA DE FERRAMENTAS (BUSCA) --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou CPF..."
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
           <Filter size={16} />
           <span>{filteredPatients.length} registros encontrados</span>
        </div>
      </div>

      {/* --- TABELA MODERNA --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="animate-spin text-rose-600 w-10 h-10" />
          <p className="text-gray-400 text-sm">Carregando base de dados...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* HEADER CLEAN (SEM VERMELHÃO) */}
              <thead className="bg-gray-50/80 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paciente</th>
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contatos</th>
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">Ações</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {currentPatients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                         <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-full">
                           <Users size={32} className="text-gray-300 dark:text-gray-500" />
                         </div>
                         <span className="font-medium">Nenhum paciente encontrado</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPatients.map((patient) => {
                    // DADOS
                    const fullName = patient.name || "Nome não informado";
                    const phone = patient.phone || "";
                    const email = patient.email || "";
                    const cpf = patient.cpf || "";

                    const cleanPhone = phone.replace(/\D/g, "");
                    const whatsappLink = `https://wa.me/55${cleanPhone}`;
                    const emailLink = `mailto:${email}`;

                    return (
                      <tr 
                        key={patient.id} 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      >
                        
                        {/* COLUNA 1: NOME E IDENTIFICAÇÃO */}
                        <td className="p-5 align-middle">
                          <div className="flex items-center gap-4">
                            {/* Avatar Placeholder com Iniciais */}
                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm shadow-sm border border-rose-100 dark:border-rose-900/50">
                                {fullName.substring(0,2).toUpperCase()}
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">
                                  {fullName}
                              </span>
                              {cpf && (
                                <span className="text-xs text-gray-400 mt-0.5 font-mono bg-gray-100 dark:bg-gray-700 w-fit px-1.5 rounded-[4px]">
                                  {cpf}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* COLUNA 2: CONTATO */}
                        <td className="p-5 align-middle">
                          <div className="flex flex-col gap-2">
                             {phone ? (
                               <div className="flex items-center gap-2">
                                  <a 
                                    href={whatsappLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded-md hover:border-green-400 hover:text-green-600 transition-all shadow-sm"
                                  >
                                     <MessageCircle size={12} className="text-green-500" />
                                     {phone}
                                  </a>
                               </div>
                             ) : <span className="text-gray-300 text-xs italic">--</span>}
                             
                             {email && (
                               <div className="flex items-center gap-2">
                                  <a 
                                    href={emailLink}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-rose-600 transition-colors truncate max-w-[220px]"
                                  >
                                     <Mail size={12} />
                                     {email}
                                  </a>
                               </div>
                             )}
                          </div>
                        </td>
                        
                        {/* COLUNA 3: AÇÕES */}
                        <td className="p-5 align-middle text-center">
                          <div className="flex items-center justify-center gap-2 relative">
                            {/* Botão Prontuário (Desktop) */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors text-xs font-bold border border-rose-100"
                            >
                              <Eye size={14} /> 
                              Prontuário
                            </button>

                            {/* Menu Dropdown */}
                            <div className="relative">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setOpenMenuId(openMenuId === patient.id ? null : patient.id); 
                                }}
                                className={`p-2 rounded-lg transition-all ${openMenuId === patient.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {/* Dropdown Content */}
                              {openMenuId === patient.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                                  
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                                    className="sm:hidden w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Eye size={14} className="text-rose-500"/> Abrir Prontuário
                                  </button>

                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(patient.id); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Pencil size={14} className="text-gray-500" /> Editar Cadastro
                                  </button>

                                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>

                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(patient.id, fullName); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 size={14} /> Excluir
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

          {/* --- RODAPÉ --- */}
          {filteredPatients.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 gap-4">
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium">{filteredPatients.length}</span> resultados no total
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-rose-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="text-sm font-medium text-gray-700 dark:text-white px-2 min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-rose-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}