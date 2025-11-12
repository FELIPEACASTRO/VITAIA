import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Search,
  Users,
  Calendar,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "M" as "M" | "F" | "Other",
    email: "",
    phone: "",
    medicalHistory: "",
    currentMedications: "",
  });

  const { data: patients, isLoading } = trpc.patients.list.useQuery();
  const createPatientMutation = trpc.patients.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false);
      setFormData({
        name: "",
        dateOfBirth: "",
        gender: "M",
        email: "",
        phone: "",
        medicalHistory: "",
        currentMedications: "",
      });
      trpc.useUtils().patients.list.invalidate();
    },
  });

  const filteredPatients =
    patients?.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPatientMutation.mutateAsync(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#00FF88] to-[#9D00FF]">
                Meus Pacientes
              </span>
            </h1>
            <p className="text-[#A9B1BD] mt-2">
              Gerenciar informações e histórico médico
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="relative overflow-hidden group h-12 px-6"
                style={{
                  background:
                    "linear-gradient(135deg, #00D9FF 0%, #9D00FF 100%)",
                  boxShadow: "0 10px 30px rgba(0, 217, 255, 0.3)",
                }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative flex items-center gap-2 font-semibold">
                  <Plus className="w-5 h-5" />
                  Novo Paciente
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[rgba(15,23,42,0.95)] backdrop-blur-2xl border border-[rgba(255,255,255,0.1)]">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl font-bold flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] flex items-center justify-center"
                    style={{ boxShadow: "0 0 20px rgba(0, 217, 255, 0.4)" }}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                  Adicionar Novo Paciente
                </DialogTitle>
                <DialogDescription className="text-[#A9B1BD]">
                  Preencha as informações básicas do paciente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name" className="text-white">
                      Nome do Paciente *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white focus:border-[#00D9FF]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob" className="text-white">
                      Data de Nascimento
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white focus:border-[#00D9FF]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-white">
                      Gênero
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as "M" | "F" | "Other",
                        })
                      }
                      className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-md text-white"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white focus:border-[#00D9FF]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={e =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white focus:border-[#00D9FF]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="medicalHistory" className="text-white">
                      Histórico Médico
                    </Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          medicalHistory: e.target.value,
                        })
                      }
                      rows={3}
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white focus:border-[#00D9FF]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="currentMedications" className="text-white">
                      Medicações Atuais
                    </Label>
                    <Textarea
                      id="currentMedications"
                      value={formData.currentMedications}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          currentMedications: e.target.value,
                        })
                      }
                      rows={2}
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-white focus:border-[#00D9FF]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                    className="flex-1"
                    style={{
                      background:
                        "linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)",
                      boxShadow: "0 10px 30px rgba(0, 255, 136, 0.3)",
                    }}
                  >
                    {createPatientMutation.isPending
                      ? "Criando..."
                      : "Criar Paciente"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-4 border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#00D9FF]" />
              <Input
                placeholder="Buscar pacientes por nome..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent text-white placeholder:text-[#717E91] focus-visible:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] rounded-2xl blur-xl opacity-50 animate-pulse" />
                <div
                  className="relative w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] rounded-2xl flex items-center justify-center"
                  style={{ boxShadow: "0 0 30px rgba(0, 217, 255, 0.4)" }}
                >
                  <Users className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <p className="text-[#A9B1BD]">Carregando pacientes...</p>
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-12 border border-[rgba(255,255,255,0.08)] text-center">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D9FF]/20 to-[#9D00FF]/20 mb-4"
              style={{ boxShadow: "0 0 30px rgba(0, 217, 255, 0.2)" }}
            >
              <Users className="w-10 h-10 text-[#00D9FF]" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">
              Nenhum paciente encontrado
            </h3>
            <p className="text-[#A9B1BD] mb-6">
              {searchTerm
                ? "Tente buscar com outro termo"
                : "Comece adicionando seu primeiro paciente"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                style={{
                  background:
                    "linear-gradient(135deg, #00D9FF 0%, #9D00FF 100%)",
                  boxShadow: "0 10px 30px rgba(0, 217, 255, 0.3)",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => setLocation(`/paciente/${patient.id}`)}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00D9FF] via-[#9D00FF] to-[#00FF88] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] flex items-center justify-center font-bold text-white text-lg"
                        style={{ boxShadow: "0 0 20px rgba(0, 217, 255, 0.4)" }}
                      >
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {patient.name}
                        </h3>
                        <p className="text-[#A9B1BD] text-sm">
                          ID: #{patient.id}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#717E91] group-hover:text-[#00D9FF] group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-2">
                    {patient.email && (
                      <div className="flex items-center gap-2 text-[#A9B1BD] text-sm">
                        <Mail className="w-4 h-4 text-[#00D9FF]" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-[#A9B1BD] text-sm">
                        <Phone className="w-4 h-4 text-[#00FF88]" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div className="flex items-center gap-2 text-[#A9B1BD] text-sm">
                        <Calendar className="w-4 h-4 text-[#9D00FF]" />
                        <span>
                          {new Date(patient.dateOfBirth).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {patient.medicalHistory && (
                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-[#FF0099]" />
                        <span className="text-[#A9B1BD] text-xs font-medium">
                          Histórico Médico
                        </span>
                      </div>
                      <p className="text-[#717E91] text-sm line-clamp-2">
                        {patient.medicalHistory}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {filteredPatients.length > 0 && (
          <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                <span className="text-white font-semibold">
                  Total: {filteredPatients.length} paciente
                  {filteredPatients.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
                <span className="text-[#A9B1BD] text-sm">Sistema ativo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
