import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  Search, 
  Plus, 
  Users, 
  Loader2, 
  MessageCircle, 
  Mail,          
  Pencil,        
  Trash2,        
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText
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
      toast.error("Erro ao carregar lista de pacientes.");
    } finally {
      setLoading(false);
    }
  }

  // --- AÇÕES ---
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${name}?`)) return;
    
    try {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      
      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast.success("Paciente removido com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir. Verifique se há agendamentos vinculados.");
    }
  };

  // --- FILTROS ---
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const cpf = (p.cpf || "").replace(/\D/g, "");
      const phone = (p.phone || "").replace(/\D/g, "");
      return name.includes(term) || cpf.includes(term) || phone.includes(term);
    });
  }, [patients, searchTerm]);

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="font-sans">
      
      {/* --- HEADER SUPERIOR --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="text-pink-600" size={24} /> Pacientes
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie prontuários, cadastros e histórico clínico.
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/patients/new")}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 h-10 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-pink-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} /> Novo Paciente
        </Button>
      </div>

      {/* --- BARRA DE FERRAMENTAS --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
           <Filter size={14} />
           <span className="font-medium">{filteredPatients.length}</span> registros
        </div>
      </div>

      {/* --- TABELA --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
          <p className="text-gray-400 text-sm">Carregando base de pacientes...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500">Paciente</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500">Contatos</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Ações</th>
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
                    const fullName = patient.name || "Sem Nome";
                    const firstName = fullName.split(' ')[0];
                    const initials = fullName.substring(0, 2).toUpperCase();
                    
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
                        className="group hover:bg-pink-50/30 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      >
                        
                        {/* NOME E IDENTIFICAÇÃO */}
                        <td className="p-5 align-middle">
                          <div className="flex items-center gap-4">
                            {/* Avatar com Gradiente */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold text-sm shadow-sm border border-white dark:border-gray-600 group-hover:scale-110 transition-transform">
                                {initials}
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-pink-600 transition-colors">
                                  {fullName}
                              </span>
                              {cpf && (
                                <span className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                                  <FileText size={10} /> {cpf}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* CONTATOS (Badges) */}
                        <td className="p-5 align-middle">
                          <div className="flex flex-col gap-2 items-start">
                             {phone ? (
                                <a 
                                  href={whatsappLink} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 rounded-lg hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all shadow-sm group/btn"
                                >
                                   <MessageCircle size={12} className="text-green-500 group-hover/btn:scale-110 transition-transform" />
                                   {phone}
                                </a>
                             ) : <span className="text-gray-300 text-xs italic pl-1">--</span>}
                             
                             {email && (
                                <a 
                                  href={emailLink}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-pink-600 transition-colors max-w-[200px] truncate"
                                >
                                   <Mail size={12} />
                                   {email}
                                </a>
                             )}
                          </div>
                        </td>
                        
                        {/* AÇÕES */}
                        <td className="p-5 align-middle text-center">
                          <div className="flex items-center justify-center gap-2 relative">
                            {/* Botão Prontuário (Desktop) */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 hover:border-pink-200 border border-gray-200 dark:border-gray-600 rounded-lg transition-all text-xs font-bold shadow-sm"
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
                                className={`p-2 rounded-lg transition-all ${openMenuId === patient.id ? 'bg-pink-50 text-pink-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {openMenuId === patient.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                                  
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
                                    className="sm:hidden w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                                  >
                                    <Eye size={16} className="text-pink-500"/> Abrir Prontuário
                                  </button>

                                  <button 
                                    onClick={(e) => { e.stopPropagation(); navigate(`/patients/new?id=${patient.id}`); }} // Assumindo rota de edição
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                                  >
                                    <Pencil size={16} className="text-gray-400" /> Editar Dados
                                  </button>

                                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>

                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(patient.id, fullName); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                                  >
                                    <Trash2 size={16} /> Excluir
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

          {/* --- RODAPÉ DA TABELA --- */}
          {filteredPatients.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 gap-4">
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Exibindo <strong>{itemsPerPage}</strong> por página</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="text-sm font-medium text-gray-700 dark:text-white px-2 min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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