import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
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
      // Invalidate and refetch
      trpc.useUtils().patients.list.invalidate();
    },
  });

  const filteredPatients = patients?.filter((patient) =>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meus Pacientes</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo, {user?.name || "Médico"}
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                <DialogDescription>
                  Preencha as informações básicas do paciente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nome do Paciente *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob">Data de Nascimento</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as "M" | "F" | "Other",
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="history">Histórico Médico</Label>
                    <Textarea
                      id="history"
                      value={formData.medicalHistory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicalHistory: e.target.value,
                        })
                      }
                      placeholder="Condições prévias, alergias, cirurgias, etc."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="medications">Medicações Atuais</Label>
                    <Textarea
                      id="medications"
                      value={formData.currentMedications}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentMedications: e.target.value,
                        })
                      }
                      placeholder="Medicações em uso atualmente"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                  >
                    {createPatientMutation.isPending
                      ? "Criando..."
                      : "Criar Paciente"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patients Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {patients?.length === 0
                  ? "Nenhum paciente cadastrado. Comece criando um novo paciente."
                  : "Nenhum paciente encontrado com esse nome."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLocation(`/patient/${patient.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <CardDescription>
                    {patient.dateOfBirth && `Nascimento: ${patient.dateOfBirth}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {patient.email && (
                    <p>
                      <span className="font-semibold">Email:</span> {patient.email}
                    </p>
                  )}
                  {patient.phone && (
                    <p>
                      <span className="font-semibold">Telefone:</span>{" "}
                      {patient.phone}
                    </p>
                  )}
                  {patient.medicalHistory && (
                    <p>
                      <span className="font-semibold">Histórico:</span>{" "}
                      {patient.medicalHistory.substring(0, 50)}...
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
