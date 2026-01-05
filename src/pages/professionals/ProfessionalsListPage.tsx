import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Search,
  Stethoscope,
  User,
  Trash2,
  Loader2,
  Shield,
  Briefcase,
  Percent,
  Mail,
  Phone,
  Filter,
  Award,
  FileBadge,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "react-hot-toast";

// --- TIPAGEM ---

interface FilterButtonProps {
  label: string;
  filter: string;
  icon: React.ElementType;
  total: number;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

interface Professional {
  id: string;
  first_name: string;
  last_name?: string | null;
  formacao?: string | null;
  role: "admin" | "profissional" | "esteticista" | "recepcionista" | "doutor";
  agenda_color?: string | null;
  commission_rate?: number | null;
  registration_number?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean | null;
  avatar_url?: string | null;
}

// Helpers para status
const isArchived = (p: Professional) => p.is_active === false;
const isActive = (p: Professional) => p.is_active !== false;

// --- COMPONENTE PRINCIPAL ---

export default function ProfessionalsListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchProfessionals();
  }, []);

  async function fetchProfessionals() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("role", "paciente")
        .order("first_name");

      if (error) throw error;

      setProfessionals((data || []) as Professional[]);
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
      toast.error("Falha ao carregar lista de profissionais.");
    } finally {
      setLoading(false);
    }
  }

  // Arquivar (soft delete)
  const handleArchive = async (id: string, name: string) => {
    const ok = confirm(
      `Tem certeza que deseja ARQUIVAR ${name}? Ele será removido do agendamento, mas manterá o histórico.`
    );
    if (!ok) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao arquivar.");
    } else {
      toast.success("Profissional arquivado com sucesso!");
      fetchProfessionals();
    }
  };

  // Filtro principal
  const filtered = professionals
    .filter((p) => (activeFilter === "archived" ? isArchived(p) : isActive(p)))
    .filter((p) => {
      const texto =
        (p.first_name || "") +
        " " +
        (p.last_name || "") +
        " " +
        (p.formacao || "") + 
        " " +
        (p.registration_number || "");
      const matchesSearch = texto
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "all" || activeFilter === "archived") return true;
      if (activeFilter === "medical")
        return (
          p.role === "profissional" ||
          p.role === "doutor" ||
          p.role === "esteticista"
        );
      if (activeFilter === "admin") return p.role === "admin";
      if (activeFilter === "reception") return p.role === "recepcionista";

      return false;
    });

  // Info do cargo
  const getRoleInfo = (role: string) => {
    switch (role) {
      case "profissional":
      case "doutor":
        return {
          label: "Especialista",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      case "esteticista":
        return {
          label: "Esteticista",
          bgColor: "bg-pink-100",
          textColor: "text-pink-700",
        };
      case "recepcionista":
        return {
          label: "Recepção",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
        };
      case "admin":
        return {
          label: "Administrador",
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
        };
      default:
        return {
          label: "Outro",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
    }
  };

  const FilterButton: React.FC<FilterButtonProps> = ({
    label,
    filter,
    icon: Icon,
    total,
    activeFilter,
    setActiveFilter,
  }) => (
    <Button
      onClick={() => setActiveFilter(filter)}
      variant={activeFilter === filter ? "primary" : "outline"}
      className={`
        px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm
        ${
          activeFilter === filter
            ? "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-300"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
        }
      `}
    >
      <Icon size={16} className="mr-2" />
      {label} ({total})
    </Button>
  );

  // Contagens
  const activeProfessionals = professionals.filter(isActive);
  const archivedProfessionals = professionals.filter(isArchived);

  const medicalCount = activeProfessionals.filter((p) =>
    ["profissional", "doutor", "esteticista"].includes(p.role)
  ).length;

  const adminCount = activeProfessionals.filter(
    (p) => p.role === "admin"
  ).length;
  const receptionCount = activeProfessionals.filter(
    (p) => p.role === "recepcionista"
  ).length;

  const totalCommission = activeProfessionals.reduce(
    (sum, p) => sum + (p.commission_rate || 0),
    0
  );
  const averageCommission =
    activeProfessionals.length > 0
      ? (totalCommission / activeProfessionals.length).toFixed(1)
      : "0";

  const kpiCards = [
    {
      title: "Ativos na Equipe",
      value: activeProfessionals.length,
      icon: User,
      color: "text-pink-600",
    },
    {
      title: "Atendimento Direto",
      value: medicalCount,
      icon: Stethoscope,
      color: "text-green-600",
    },
    {
      title: "Comissão Média (%)",
      value: averageCommission,
      icon: Percent,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="text-pink-600" /> Gestão de Colaboradores
          </h1>
          <p className="text-sm text-gray-500">
            Gerencie a equipe que aparece no agendamento e repasse de
            comissões.
          </p>
        </div>

        <Button
          onClick={() => navigate("/professionals/new")}
          className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-300/50"
        >
          <Plus size={18} className="mr-2" /> Novo Colaborador
        </Button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {kpi.value}
                </p>
              </div>
              <Icon size={24} className={kpi.color} />
            </div>
          );
        })}
      </div>

      {/* BUSCA E FILTROS */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <Input
            placeholder="Buscar por nome, registro ou especialidade..."
            className="pl-10 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <FilterButton
            label="Todos Ativos"
            filter="all"
            icon={Filter}
            total={activeProfessionals.length}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
          <FilterButton
            label="Atendimento"
            filter="medical"
            icon={Stethoscope}
            total={medicalCount}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
          <FilterButton
            label="Administração"
            filter="admin"
            icon={Shield}
            total={adminCount}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
          <FilterButton
            label="Recepção"
            filter="reception"
            icon={Briefcase}
            total={receptionCount}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
          <FilterButton
            label="Arquivados"
            filter="archived"
            icon={Trash2}
            total={archivedProfessionals.length}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>

        {activeFilter === "archived" && (
          <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-sm flex items-center gap-2">
            <Trash2 size={16} /> Você está visualizando profissionais inativos
            (arquivados).
          </div>
        )}
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-pink-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="md:col-span-3 text-center p-10 text-gray-500 dark:text-gray-400">
              Nenhum profissional encontrado com os filtros e busca atuais.
            </div>
          )}

          {filtered.map((prof) => {
            const roleInfo = getRoleInfo(prof.role);

            const details = [
              { show: !!prof.phone, icon: Phone, label: prof.phone },
              { show: !!prof.email, icon: Mail, label: prof.email },
              { show: !!prof.formacao, icon: Award, label: prof.formacao },
              { show: !!prof.registration_number, icon: FileBadge, label: prof.registration_number },
              {
                show:
                  prof.commission_rate !== null &&
                  prof.commission_rate !== undefined &&
                  isActive(prof),
                icon: Percent,
                label: `${prof.commission_rate}% Comissão`,
              },
            ];

            return (
              <div
                key={prof.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all relative overflow-hidden"
              >
                {/* Tarja lateral da agenda */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl"
                  style={{ backgroundColor: prof.agenda_color || "#ec4899" }}
                />

                {/* Cabeçalho do card */}
                <div className="flex items-start gap-4 pl-2">
                  <Link
                    to={`/professionals/${prof.id}`}
                    className="flex items-center gap-4 cursor-pointer hover:opacity-85 transition-opacity flex-1 min-w-0"
                  >
                    {/* Avatar/Initials */}
                    <div
                      className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg font-bold text-white shadow-md overflow-hidden"
                      style={{
                        backgroundColor: prof.agenda_color || "#ec4899",
                      }}
                    >
                      {prof.avatar_url ? (
                        <img
                          src={prof.avatar_url}
                          alt={prof.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        prof.first_name?.[0]
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {prof.first_name} {prof.last_name}
                      </h3>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          isActive(prof)
                            ? `${roleInfo.bgColor} ${roleInfo.textColor}`
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isActive(prof) ? roleInfo.label : "ARQUIVADO"}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Detalhes */}
                <div className="space-y-2 text-sm text-gray-500 mt-4 pl-2">
                  {details
                    .filter((d) => d.show)
                    .map((d, index) => {
                      const Icon = d.icon;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Icon size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Botão Arquivar (se ativo) */}
                {isActive(prof) && (
                  <div className="mt-4 pl-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleArchive(prof.id, prof.first_name || "profissional")
                      }
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Arquivar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}