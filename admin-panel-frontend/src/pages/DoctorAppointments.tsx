import { useMemo, useState } from 'react';
import { formatDateTime } from '@/utils/dateFormat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Activity,
  AlertCircle,
  RefreshCw,
  PlayCircle,
  FileCheck2,
  MailPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  clinicalService,
  CreateRecordByEmailPayload,
  FinishEncounterPayload,
  VitalSignInput,
} from '@/services/clinical.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { GlassModal } from '@/components/ui/GlassModal';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import type { ClinicalAppointment, PaginatedResponse } from '@/types';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistio',
  RESCHEDULED: 'Reprogramada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  NO_SHOW: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
};

type FinishFormState = {
  encounterSummary: string;
  recordTitle: string;
  recordDescription: string;
  recordType: string;
  doctorNotes: string;
  chiefComplaint: string;
  history: string;
  diagnosis: string;
  plan: string;
  observations: string;
  procedures: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const emptyFinishForm: FinishFormState = {
  encounterSummary: '',
  recordTitle: '',
  recordDescription: '',
  recordType: 'DIAGNOSIS',
  doctorNotes: '',
  chiefComplaint: '',
  history: '',
  diagnosis: '',
  plan: '',
  observations: '',
  procedures: '',
  medication: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

type EmailRecordFormState = {
  patientEmail: string;
  patientFirstName: string;
  patientLastName: string;
  patientDateOfBirth: string;
  patientGender: string;
  serviceName: string;
  recordTitle: string;
  recordDescription: string;
  recordType: string;
  doctorNotes: string;
  chiefComplaint: string;
  history: string;
  diagnosis: string;
  plan: string;
  observations: string;
  procedures: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  sendEmail: boolean;
  // Vitals
  bpSys: string;
  bpDia: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
  weight: string;
  height: string;
};

const emptyEmailRecordForm: EmailRecordFormState = {
  patientEmail: '',
  patientFirstName: '',
  patientLastName: '',
  patientDateOfBirth: '',
  patientGender: '',
  serviceName: '',
  recordTitle: '',
  recordDescription: '',
  recordType: 'DIAGNOSIS',
  doctorNotes: '',
  chiefComplaint: '',
  history: '',
  diagnosis: '',
  plan: '',
  observations: '',
  procedures: '',
  medication: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
  sendEmail: true,
  // Vitals
  bpSys: '',
  bpDia: '',
  heartRate: '',
  respiratoryRate: '',
  temperature: '',
  spo2: '',
  weight: '',
  height: '',
};

type VitalsFormState = {
  bpSys: string;
  bpDia: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  spo2: string;
  weight: string;
  height: string;
  notes: string;
};

const emptyVitalsForm: VitalsFormState = {
  bpSys: '',
  bpDia: '',
  heartRate: '',
  respiratoryRate: '',
  temperature: '',
  spo2: '',
  weight: '',
  height: '',
  notes: '',
};

export default function DoctorAppointments() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: '' });
  const [selectedAppointment, setSelectedAppointment] = useState<ClinicalAppointment | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishForm, setFinishForm] = useState<FinishFormState>(emptyFinishForm);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<VitalsFormState>(emptyVitalsForm);
  const [showEmailRecordModal, setShowEmailRecordModal] = useState(false);
  const [emailRecordForm, setEmailRecordForm] =
    useState<EmailRecordFormState>(emptyEmailRecordForm);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['clinical-appointments', filters],
    queryFn: () =>
      clinicalService.getAssignedAppointments({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
      }),
    staleTime: 20_000,
  });

  const payload = data?.data?.data as PaginatedResponse<ClinicalAppointment> | undefined;
  const appointments = payload?.data ?? [];
  const pagination = payload?.pagination;

  const startEncounterMutation = useMutation({
    mutationFn: (appointmentId: string) => clinicalService.startEncounter(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      toast.success('Atencion iniciada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo iniciar la atencion');
    },
  });

  const recordVitalsMutation = useMutation({
    mutationFn: ({ encounterId, payload }: { encounterId: string; payload: VitalSignInput }) =>
      clinicalService.recordVitals(encounterId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      toast.success('Signos vitales registrados');
      handleCloseVitalsModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudieron guardar los signos vitales');
    },
  });

  const finishEncounterMutation = useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: FinishEncounterPayload }) =>
      clinicalService.finishEncounter(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      toast.success('Cita finalizada y registros generados');
      handleCloseFinishModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo finalizar la cita');
    },
  });

  const createRecordByEmailMutation = useMutation({
    mutationFn: (payload: CreateRecordByEmailPayload) => clinicalService.createRecordByEmail(payload),
    onSuccess: (response) => {
      const emailQueued = response?.data?.data?.emailQueued;
      toast.success(
        emailQueued ? 'Historia clinica creada y enviada' : 'Historia clinica creada'
      );
      handleCloseEmailRecordModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear la historia clinica');
    },
  });

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((appointment) =>
        appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
      ).length,
      inProgress: appointments.filter((appointment) => appointment.status === 'IN_PROGRESS').length,
      completed: appointments.filter((appointment) => appointment.status === 'COMPLETED').length,
    };
  }, [appointments]);

  const handleFilterChange = (key: keyof typeof filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleOpenFinishModal = (appointment: ClinicalAppointment) => {
    setSelectedAppointment(appointment);
    setFinishForm(emptyFinishForm);
    setShowFinishModal(true);
  };

  const handleCloseFinishModal = () => {
    setShowFinishModal(false);
    setSelectedAppointment(null);
  };

  const handleOpenVitalsModal = (appointment: ClinicalAppointment) => {
    if (!appointment.encounter?.id) {
      toast.error('Primero inicia la atencion para registrar signos vitales');
      return;
    }
    setSelectedAppointment(appointment);
    const latestVitals = appointment.encounter.vitals?.[0];
    const asText = (value?: number | null) => (value === null || value === undefined ? '' : String(value));
    setVitalsForm(
      latestVitals
        ? {
            bpSys: asText(latestVitals.bpSys),
            bpDia: asText(latestVitals.bpDia),
            heartRate: asText(latestVitals.heartRate),
            respiratoryRate: asText(latestVitals.respiratoryRate),
            temperature: asText(latestVitals.temperature),
            spo2: asText(latestVitals.spo2),
            weight: asText(latestVitals.weight),
            height: asText(latestVitals.height),
            notes: latestVitals.notes ?? '',
          }
        : emptyVitalsForm
    );
    setShowVitalsModal(true);
  };

  const handleCloseVitalsModal = () => {
    setShowVitalsModal(false);
    setSelectedAppointment(null);
  };

  const handleOpenEmailRecordModal = () => {
    setEmailRecordForm(emptyEmailRecordForm);
    setShowEmailRecordModal(true);
  };

  const handleCloseEmailRecordModal = () => {
    setShowEmailRecordModal(false);
  };

  const handleVitalsSubmit = () => {
    if (!selectedAppointment?.encounter?.id) {
      toast.error('No se encontro un encuentro activo');
      return;
    }

    const toNumber = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const payload: VitalSignInput = {
      bpSys: toNumber(vitalsForm.bpSys),
      bpDia: toNumber(vitalsForm.bpDia),
      heartRate: toNumber(vitalsForm.heartRate),
      respiratoryRate: toNumber(vitalsForm.respiratoryRate),
      temperature: toNumber(vitalsForm.temperature),
      spo2: toNumber(vitalsForm.spo2),
      weight: toNumber(vitalsForm.weight),
      height: toNumber(vitalsForm.height),
      notes: vitalsForm.notes.trim() || undefined,
    };

    const hasValue = Object.values(payload).some((value) => value !== undefined && value !== '');
    if (!hasValue) {
      toast.error('Ingresa al menos un signo vital');
      return;
    }

    recordVitalsMutation.mutate({ encounterId: selectedAppointment.encounter.id, payload });
  };

  const handleFinishSubmit = () => {
    if (!selectedAppointment) {
      return;
    }

    if (!finishForm.recordTitle.trim() || !finishForm.recordDescription.trim()) {
      toast.error('Completa el titulo y la descripcion del registro clinico');
      return;
    }

    const payloadData: Record<string, string> = {};
    if (finishForm.chiefComplaint.trim()) {
      payloadData.chiefComplaint = finishForm.chiefComplaint.trim();
    }
    if (finishForm.history.trim()) {
      payloadData.history = finishForm.history.trim();
    }
    if (finishForm.diagnosis.trim()) {
      payloadData.diagnosis = finishForm.diagnosis.trim();
    }
    if (finishForm.plan.trim()) {
      payloadData.plan = finishForm.plan.trim();
    }
    if (finishForm.observations.trim()) {
      payloadData.observations = finishForm.observations.trim();
    }
    if (finishForm.procedures.trim()) {
      payloadData.procedures = finishForm.procedures.trim();
    }

    const medicalRecordPayload =
      Object.keys(payloadData).length > 0 ? payloadData : undefined;

    const payload: FinishEncounterPayload = {
      encounterSummary: finishForm.encounterSummary.trim() || undefined,
      medicalRecord: {
        title: finishForm.recordTitle.trim(),
        description: finishForm.recordDescription.trim(),
        type: finishForm.recordType || undefined,
        doctorNotes: finishForm.doctorNotes.trim() || undefined,
        payload: medicalRecordPayload,
      },
    };

    const hasPrescription =
      finishForm.medication.trim() &&
      finishForm.dosage.trim() &&
      finishForm.frequency.trim() &&
      finishForm.duration.trim();

    if (hasPrescription) {
      payload.prescription = {
        items: [
          {
            medication: finishForm.medication.trim(),
            dosage: finishForm.dosage.trim(),
            frequency: finishForm.frequency.trim(),
            duration: finishForm.duration.trim(),
            instructions: finishForm.instructions.trim() || undefined,
          },
        ],
      };
    }

    finishEncounterMutation.mutate({ appointmentId: selectedAppointment.id, payload });
  };

  const handleEmailRecordSubmit = () => {
    if (!emailRecordForm.patientEmail.trim()) {
      toast.error('Ingresa el correo del paciente');
      return;
    }

    if (!emailRecordForm.recordTitle.trim() || !emailRecordForm.recordDescription.trim()) {
      toast.error('Completa el titulo y la descripcion del registro clinico');
      return;
    }

    const payloadData: Record<string, string> = {};
    if (emailRecordForm.chiefComplaint.trim()) {
      payloadData.chiefComplaint = emailRecordForm.chiefComplaint.trim();
    }
    if (emailRecordForm.history.trim()) {
      payloadData.history = emailRecordForm.history.trim();
    }
    if (emailRecordForm.diagnosis.trim()) {
      payloadData.diagnosis = emailRecordForm.diagnosis.trim();
    }
    if (emailRecordForm.plan.trim()) {
      payloadData.plan = emailRecordForm.plan.trim();
    }
    if (emailRecordForm.observations.trim()) {
      payloadData.observations = emailRecordForm.observations.trim();
    }
    if (emailRecordForm.procedures.trim()) {
      payloadData.procedures = emailRecordForm.procedures.trim();
    }

    const medicalRecordPayload =
      Object.keys(payloadData).length > 0 ? payloadData : undefined;

    const toNumber = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const vitals = {
      bpSys: toNumber(emailRecordForm.bpSys),
      bpDia: toNumber(emailRecordForm.bpDia),
      heartRate: toNumber(emailRecordForm.heartRate),
      respiratoryRate: toNumber(emailRecordForm.respiratoryRate),
      temperature: toNumber(emailRecordForm.temperature),
      spo2: toNumber(emailRecordForm.spo2),
      weight: toNumber(emailRecordForm.weight),
      height: toNumber(emailRecordForm.height),
    };

    const hasVitals = Object.values(vitals).some((v) => v !== undefined);

    const payload: CreateRecordByEmailPayload = {
      patientEmail: emailRecordForm.patientEmail.trim(),
      patientFirstName: emailRecordForm.patientFirstName.trim() || undefined,
      patientLastName: emailRecordForm.patientLastName.trim() || undefined,
      patientDateOfBirth: emailRecordForm.patientDateOfBirth.trim() || undefined,
      patientGender: emailRecordForm.patientGender.trim() || undefined,
      serviceName: emailRecordForm.serviceName.trim() || undefined,
      sendEmail: emailRecordForm.sendEmail,
      vitals: hasVitals ? vitals : undefined,
      medicalRecord: {
        title: emailRecordForm.recordTitle.trim(),
        description: emailRecordForm.recordDescription.trim(),
        type: emailRecordForm.recordType || undefined,
        doctorNotes: emailRecordForm.doctorNotes.trim() || undefined,
        payload: medicalRecordPayload,
      },
    };

    const hasPrescription =
      emailRecordForm.medication.trim() &&
      emailRecordForm.dosage.trim() &&
      emailRecordForm.frequency.trim() &&
      emailRecordForm.duration.trim();

    if (hasPrescription && user?.role !== 'DOCTOR') {
      toast.error('Solo los doctores pueden emitir formulas');
      return;
    }

    if (hasPrescription) {
      payload.prescription = {
        items: [
          {
            medication: emailRecordForm.medication.trim(),
            dosage: emailRecordForm.dosage.trim(),
            frequency: emailRecordForm.frequency.trim(),
            duration: emailRecordForm.duration.trim(),
            instructions: emailRecordForm.instructions.trim() || undefined,
          },
        ],
      };
    }

    createRecordByEmailMutation.mutate(payload);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Citas asignadas</h1>
        </div>
        <Card className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex flex-col gap-4 p-6 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                  No se pudo cargar la agenda
                </h2>
                <p className="text-red-600 dark:text-red-400">
                  Verifica tu conexion o vuelve a intentarlo.
                </p>
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Citas asignadas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Gestiona tus citas y finaliza historias clinicas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(user?.role === 'DOCTOR' || user?.role === 'NURSE') && (
            <Button onClick={handleOpenEmailRecordModal}>
              <MailPlus className="h-4 w-4" />
              Historia por correo
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Citas totales</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En progreso</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.inProgress}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.completed}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-700">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de citas
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? 'Cargando...' : `${pagination?.total ?? appointments.length} citas registradas`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[200px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={filters.status}
                onChange={(event) => handleFilterChange('status', event.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="NO_SHOW">No asistio</option>
                <option value="RESCHEDULED">Reprogramada</option>
              </select>
            </div>
            <div className="min-w-[120px]">
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={filters.limit}
                onChange={(event) => handleFilterChange('limit', Number(event.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando citas...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay citas asignadas.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appointment.service?.name || 'Servicio no definido'} ·{' '}
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appointment.address}, {appointment.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        statusColors[appointment.status] || 'bg-gray-50 text-gray-700 border-gray-100'
                      )}
                    >
                      {statusLabels[appointment.status] || appointment.status}
                    </span>
                    {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                      <Button
                        size="sm"
                        onClick={() => startEncounterMutation.mutate(appointment.id)}
                        disabled={startEncounterMutation.isPending}
                      >
                        <PlayCircle className="h-4 w-4" />
                        Iniciar
                      </Button>
                    )}
                    {appointment.status === 'IN_PROGRESS' && (
                      <>
                        {user?.role === 'NURSE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenVitalsModal(appointment)}
                            className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                          >
                            Signos
                          </Button>
                        )}
                        {(user?.role === 'DOCTOR' ||
                          (user?.role === 'NURSE' && appointment.service?.category === 'NURSING')) && (
                          <Button size="sm" onClick={() => handleOpenFinishModal(appointment)}>
                            <FileCheck2 className="h-4 w-4" />
                            Finalizar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pagina {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <GlassModal isOpen={showFinishModal} onClose={handleCloseFinishModal} size="lg">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Finalizar cita
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Completa la historia clinica para cerrar la atencion.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Resumen clinico
              </label>
              <textarea
                value={finishForm.encounterSummary}
                onChange={(event) =>
                  setFinishForm((prev) => ({ ...prev, encounterSummary: event.target.value }))
                }
                className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                placeholder="Resumen de la atencion y hallazgos relevantes."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Datos clinicos
              </h3>
              <div className="mt-4 grid gap-4">
                <Input
                  value={finishForm.chiefComplaint}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))
                  }
                  placeholder="Motivo de consulta"
                />
                <textarea
                  value={finishForm.history}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, history: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Historia actual"
                />
                <textarea
                  value={finishForm.diagnosis}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, diagnosis: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Diagnostico"
                />
                <textarea
                  value={finishForm.plan}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, plan: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Plan de manejo"
                />
                <textarea
                  value={finishForm.observations}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, observations: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Observaciones"
                />
                <textarea
                  value={finishForm.procedures}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, procedures: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Procedimientos"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Titulo del registro
                </label>
                <Input
                  value={finishForm.recordTitle}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, recordTitle: event.target.value }))
                  }
                  placeholder="Historia medica"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tipo de registro
                </label>
                <select
                  value={finishForm.recordType}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, recordType: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="DIAGNOSIS">Diagnostico</option>
                  <option value="PRESCRIPTION">Prescripcion</option>
                  <option value="LAB_RESULT">Laboratorio</option>
                  <option value="IMAGING">Imagenologia</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Descripcion del registro
              </label>
              <textarea
                value={finishForm.recordDescription}
                onChange={(event) =>
                  setFinishForm((prev) => ({ ...prev, recordDescription: event.target.value }))
                }
                className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                placeholder="Detalle de la historia clinica."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Notas del doctor
              </label>
              <textarea
                value={finishForm.doctorNotes}
                onChange={(event) =>
                  setFinishForm((prev) => ({ ...prev, doctorNotes: event.target.value }))
                }
                className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                placeholder="Indicaciones adicionales."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Formula medica (opcional)
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  value={finishForm.medication}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, medication: event.target.value }))
                  }
                  placeholder="Medicamento"
                />
                <Input
                  value={finishForm.dosage}
                  onChange={(event) => setFinishForm((prev) => ({ ...prev, dosage: event.target.value }))}
                  placeholder="Dosis"
                />
                <Input
                  value={finishForm.frequency}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, frequency: event.target.value }))
                  }
                  placeholder="Frecuencia"
                />
                <Input
                  value={finishForm.duration}
                  onChange={(event) =>
                    setFinishForm((prev) => ({ ...prev, duration: event.target.value }))
                  }
                  placeholder="Duracion"
                />
                <div className="sm:col-span-2">
                  <Input
                    value={finishForm.instructions}
                    onChange={(event) =>
                      setFinishForm((prev) => ({ ...prev, instructions: event.target.value }))
                    }
                    placeholder="Instrucciones adicionales"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleCloseFinishModal}>
              Cancelar
            </Button>
            <Button onClick={handleFinishSubmit} isLoading={finishEncounterMutation.isPending}>
              Guardar y finalizar
            </Button>
          </div>
        </div>
      </GlassModal>

      <GlassModal isOpen={showEmailRecordModal} onClose={handleCloseEmailRecordModal} size="lg">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Historia por correo
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Crea historias clinicas para pacientes aun sin registro.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Datos del paciente
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  value={emailRecordForm.patientEmail}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, patientEmail: event.target.value }))
                  }
                  placeholder="Correo del paciente"
                />
                <Input
                  value={emailRecordForm.serviceName}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, serviceName: event.target.value }))
                  }
                  placeholder="Servicio (opcional)"
                />
                <Input
                  value={emailRecordForm.patientFirstName}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, patientFirstName: event.target.value }))
                  }
                  placeholder="Nombre"
                />
                <Input
                  value={emailRecordForm.patientLastName}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, patientLastName: event.target.value }))
                  }
                  placeholder="Apellido"
                />
                <Input
                  type="date"
                  value={emailRecordForm.patientDateOfBirth}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, patientDateOfBirth: event.target.value }))
                  }
                  placeholder="Fecha de nacimiento"
                />
                <select
                  value={emailRecordForm.patientGender}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, patientGender: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">Género (opcional)</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Femenino</option>
                  <option value="OTHER">Otro</option>
                  <option value="PREFER_NOT_TO_SAY">Prefiero no decir</option>
                </select>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <div>
                  <p className="font-medium">Enviar documentos por correo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Envia la historia clinica al paciente.
                  </p>
                </div>
                <Switch
                  checked={emailRecordForm.sendEmail}
                  onCheckedChange={(checked) =>
                    setEmailRecordForm((prev) => ({ ...prev, sendEmail: checked }))
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Signos vitales (opcional)
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  value={emailRecordForm.bpSys}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, bpSys: event.target.value }))
                  }
                  placeholder="PA sistólica (mmHg)"
                  type="number"
                />
                <Input
                  value={emailRecordForm.bpDia}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, bpDia: event.target.value }))
                  }
                  placeholder="PA diastólica (mmHg)"
                  type="number"
                />
                <Input
                  value={emailRecordForm.heartRate}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, heartRate: event.target.value }))
                  }
                  placeholder="Frecuencia cardíaca (lpm)"
                  type="number"
                />
                <Input
                  value={emailRecordForm.respiratoryRate}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, respiratoryRate: event.target.value }))
                  }
                  placeholder="Frecuencia respiratoria (rpm)"
                  type="number"
                />
                <Input
                  value={emailRecordForm.temperature}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, temperature: event.target.value }))
                  }
                  placeholder="Temperatura (°C)"
                  type="number"
                  step="0.1"
                />
                <Input
                  value={emailRecordForm.spo2}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, spo2: event.target.value }))
                  }
                  placeholder="SpO2 (%)"
                  type="number"
                />
                <Input
                  value={emailRecordForm.weight}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, weight: event.target.value }))
                  }
                  placeholder="Peso (kg)"
                  type="number"
                  step="0.1"
                />
                <Input
                  value={emailRecordForm.height}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, height: event.target.value }))
                  }
                  placeholder="Talla (cm)"
                  type="number"
                  step="0.1"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Datos clinicos
              </h3>
              <div className="mt-4 grid gap-4">
                <Input
                  value={emailRecordForm.chiefComplaint}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))
                  }
                  placeholder="Motivo de consulta"
                />
                <textarea
                  value={emailRecordForm.history}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, history: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Historia actual"
                />
                <textarea
                  value={emailRecordForm.diagnosis}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, diagnosis: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Diagnostico"
                />
                <textarea
                  value={emailRecordForm.plan}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, plan: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Plan de manejo"
                />
                <textarea
                  value={emailRecordForm.observations}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, observations: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Observaciones"
                />
                <textarea
                  value={emailRecordForm.procedures}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, procedures: event.target.value }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Procedimientos"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Titulo del registro
                </label>
                <Input
                  value={emailRecordForm.recordTitle}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, recordTitle: event.target.value }))
                  }
                  placeholder="Historia medica"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tipo de registro
                </label>
                <select
                  value={emailRecordForm.recordType}
                  onChange={(event) =>
                    setEmailRecordForm((prev) => ({ ...prev, recordType: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="DIAGNOSIS">Diagnostico</option>
                  <option value="PRESCRIPTION">Prescripcion</option>
                  <option value="LAB_RESULT">Laboratorio</option>
                  <option value="IMAGING">Imagenologia</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Descripcion del registro
              </label>
              <textarea
                value={emailRecordForm.recordDescription}
                onChange={(event) =>
                  setEmailRecordForm((prev) => ({ ...prev, recordDescription: event.target.value }))
                }
                className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                placeholder="Detalle de la historia clinica."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Notas del doctor
              </label>
              <textarea
                value={emailRecordForm.doctorNotes}
                onChange={(event) =>
                  setEmailRecordForm((prev) => ({ ...prev, doctorNotes: event.target.value }))
                }
                className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                placeholder="Indicaciones adicionales."
              />
            </div>

            {user?.role === 'DOCTOR' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Formula medica (opcional)
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    value={emailRecordForm.medication}
                    onChange={(event) =>
                      setEmailRecordForm((prev) => ({ ...prev, medication: event.target.value }))
                    }
                    placeholder="Medicamento"
                  />
                  <Input
                    value={emailRecordForm.dosage}
                    onChange={(event) =>
                      setEmailRecordForm((prev) => ({ ...prev, dosage: event.target.value }))
                    }
                    placeholder="Dosis"
                  />
                  <Input
                    value={emailRecordForm.frequency}
                    onChange={(event) =>
                      setEmailRecordForm((prev) => ({ ...prev, frequency: event.target.value }))
                    }
                    placeholder="Frecuencia"
                  />
                  <Input
                    value={emailRecordForm.duration}
                    onChange={(event) =>
                      setEmailRecordForm((prev) => ({ ...prev, duration: event.target.value }))
                    }
                    placeholder="Duracion"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      value={emailRecordForm.instructions}
                      onChange={(event) =>
                        setEmailRecordForm((prev) => ({ ...prev, instructions: event.target.value }))
                      }
                      placeholder="Instrucciones adicionales"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleCloseEmailRecordModal}>
              Cancelar
            </Button>
            <Button onClick={handleEmailRecordSubmit} isLoading={createRecordByEmailMutation.isPending}>
              Guardar historia
            </Button>
          </div>
        </div>
      </GlassModal>

      <GlassModal isOpen={showVitalsModal} onClose={handleCloseVitalsModal} size="md">
        <div className="p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Registrar signos vitales
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Registra los valores tomados durante la atencion.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              value={vitalsForm.bpSys}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, bpSys: event.target.value }))}
              placeholder="PA sistolica"
            />
            <Input
              value={vitalsForm.bpDia}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, bpDia: event.target.value }))}
              placeholder="PA diastolica"
            />
            <Input
              value={vitalsForm.heartRate}
              onChange={(event) =>
                setVitalsForm((prev) => ({ ...prev, heartRate: event.target.value }))
              }
              placeholder="Frecuencia cardiaca"
            />
            <Input
              value={vitalsForm.respiratoryRate}
              onChange={(event) =>
                setVitalsForm((prev) => ({ ...prev, respiratoryRate: event.target.value }))
              }
              placeholder="Frecuencia respiratoria"
            />
            <Input
              value={vitalsForm.temperature}
              onChange={(event) =>
                setVitalsForm((prev) => ({ ...prev, temperature: event.target.value }))
              }
              placeholder="Temperatura"
            />
            <Input
              value={vitalsForm.spo2}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, spo2: event.target.value }))}
              placeholder="SpO2"
            />
            <Input
              value={vitalsForm.weight}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, weight: event.target.value }))}
              placeholder="Peso"
            />
            <Input
              value={vitalsForm.height}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, height: event.target.value }))}
              placeholder="Talla"
            />
            <div className="sm:col-span-2">
              <textarea
                value={vitalsForm.notes}
                onChange={(event) => setVitalsForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                placeholder="Notas adicionales"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleCloseVitalsModal}>
              Cancelar
            </Button>
            <Button onClick={handleVitalsSubmit} isLoading={recordVitalsMutation.isPending}>
              Guardar signos
            </Button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

