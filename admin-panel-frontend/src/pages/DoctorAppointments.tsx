import { useEffect, useMemo, useState } from 'react';
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
  MailCheck,
  ClipboardList,
  HeartPulse,
  MessageSquareText,
  Stethoscope,
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import type { AppointmentTimelineItem, ClinicalAppointment, PaginatedResponse, VitalSign } from '@/types';

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
  emailConsentAccepted: boolean;
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
  emailConsentAccepted: false,
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
  emailConsentAccepted: boolean;
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
  emailConsentAccepted: false,
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
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [evolutionNote, setEvolutionNote] = useState('');
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishForm, setFinishForm] = useState<FinishFormState>(emptyFinishForm);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<VitalsFormState>(emptyVitalsForm);
  const [showEmailRecordModal, setShowEmailRecordModal] = useState(false);
  const [sendingDocumentsId, setSendingDocumentsId] = useState<string | null>(null);
  const [documentSendCandidate, setDocumentSendCandidate] = useState<ClinicalAppointment | null>(null);
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
  const activeAppointment = useMemo(() => {
    if (!appointments.length) {
      return null;
    }

    return (
      appointments.find((appointment) => appointment.id === activeAppointmentId) ??
      appointments.find((appointment) => appointment.status === 'IN_PROGRESS') ??
      appointments[0]
    );
  }, [activeAppointmentId, appointments]);

  const { data: timelineData, isFetching: isFetchingTimeline } = useQuery({
    queryKey: ['appointment-timeline', activeAppointment?.id],
    queryFn: () => clinicalService.getAppointmentTimeline(activeAppointment!.id),
    enabled: Boolean(activeAppointment?.id),
    staleTime: 10_000,
  });

  const timeline = timelineData?.data?.data?.items ?? [];
  const latestVitals = activeAppointment?.encounter?.vitals?.[0];
  const vitalsAlerts = latestVitals ? buildVitalsAlerts(latestVitals) : [];
  const clinicalChecklist = buildClinicalChecklist(activeAppointment, user?.role);

  useEffect(() => {
    if (!appointments.length) {
      if (activeAppointmentId) {
        setActiveAppointmentId(null);
      }
      return;
    }

    if (!activeAppointmentId || !appointments.some((appointment) => appointment.id === activeAppointmentId)) {
      const nextAppointment =
        appointments.find((appointment) => appointment.status === 'IN_PROGRESS') ?? appointments[0];
      setActiveAppointmentId(nextAppointment.id);
    }
  }, [activeAppointmentId, appointments]);

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

  const addEncounterNoteMutation = useMutation({
    mutationFn: ({ encounterId, summary }: { encounterId: string; summary: string }) =>
      clinicalService.addEncounterNotes(encounterId, {
        summary,
        payload: {
          evolutionNote: summary,
          source: 'clinical-workbench',
          savedAt: new Date().toISOString(),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      if (activeAppointment?.id) {
        queryClient.invalidateQueries({ queryKey: ['appointment-timeline', activeAppointment.id] });
      }
      setEvolutionNote('');
      toast.success('Nota clinica guardada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo guardar la nota clinica');
    },
  });

  const finishEncounterMutation = useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: FinishEncounterPayload }) =>
      clinicalService.finishEncounter(appointmentId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      clearFinishDraft(variables.appointmentId);
      toast.success('Cita finalizada y registros generados');
      handleCloseFinishModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo finalizar la cita');
    },
  });

  const sendDocumentsMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      clinicalService.sendAppointmentDocuments(appointmentId, { emailConsentAccepted: true }),
    onSuccess: (response, appointmentId) => {
      const result = response.data.data;
      queryClient.invalidateQueries({ queryKey: ['clinical-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-timeline', appointmentId] });

      if (!result?.documentDelivery) {
        toast.success('Documentos disponibles. El paciente no tiene correo registrado.');
        return;
      }

      if (result?.documentDelivery?.status === 'SKIPPED') {
        toast.success('Documentos disponibles. El correo no se encolo por autorizacion o cola no disponible.');
        return;
      }

      toast.success(result?.emailQueued ? 'Documentos enviados a cola de correo' : 'Entrega de documentos registrada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudieron reenviar los documentos');
    },
    onSettled: () => {
      setSendingDocumentsId(null);
      setDocumentSendCandidate(null);
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

  useEffect(() => {
    if (!showFinishModal || !selectedAppointment) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveFinishDraft(selectedAppointment.id, finishForm);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [finishForm, selectedAppointment, showFinishModal]);

  const handleFilterChange = (key: keyof typeof filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleOpenFinishModal = (appointment: ClinicalAppointment) => {
    setSelectedAppointment(appointment);
    setActiveAppointmentId(appointment.id);
    setFinishForm(loadFinishDraft(appointment.id));
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
    setActiveAppointmentId(appointment.id);
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

  const handleSaveEvolutionNote = () => {
    if (!navigator.onLine) {
      toast.error('Sin conexion. Conserva la nota y guardala cuando vuelva la red.');
      return;
    }

    const note = evolutionNote.trim();
    if (!note || note.length < 2) {
      toast.error('Escribe una nota clinica antes de guardar');
      return;
    }

    if (!activeAppointment?.encounter?.id) {
      toast.error('Primero inicia la atencion para guardar evolucion');
      return;
    }

    addEncounterNoteMutation.mutate({
      encounterId: activeAppointment.encounter.id,
      summary: note,
    });
  };

  const handleOpenEmailRecordModal = () => {
    setEmailRecordForm(emptyEmailRecordForm);
    setShowEmailRecordModal(true);
  };

  const handleCloseEmailRecordModal = () => {
    setShowEmailRecordModal(false);
  };

  const handleStartEncounter = (appointment: ClinicalAppointment) => {
    if (!navigator.onLine) {
      toast.error('Sin conexion. No se puede iniciar una atencion sin confirmar con el servidor.');
      return;
    }

    setActiveAppointmentId(appointment.id);
    startEncounterMutation.mutate(appointment.id);
  };

  const handleSendDocuments = (appointment: ClinicalAppointment) => {
    if (!navigator.onLine) {
      toast.error('Sin conexion. No se pueden reenviar documentos en este momento.');
      return;
    }

    if (appointment.status !== 'COMPLETED') {
      toast.error('Solo se pueden reenviar documentos de citas completadas');
      return;
    }

    setDocumentSendCandidate(appointment);
  };

  const handleConfirmSendDocuments = () => {
    if (!documentSendCandidate) {
      return;
    }

    setSendingDocumentsId(documentSendCandidate.id);
    sendDocumentsMutation.mutate(documentSendCandidate.id);
  };

  const handleVitalsSubmit = () => {
    if (!navigator.onLine) {
      toast.error('Sin conexion. No se pueden guardar signos vitales en este momento.');
      return;
    }

    if (!selectedAppointment?.encounter?.id) {
      toast.error('No se encontro un encuentro activo');
      return;
    }

    const { payload, errors } = buildVitalsPayload(vitalsForm);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const hasValue = Object.values(payload).some((value) => value !== undefined && value !== '');
    if (!hasValue) {
      toast.error('Ingresa al menos un signo vital');
      return;
    }

    recordVitalsMutation.mutate({ encounterId: selectedAppointment.encounter.id, payload });
  };

  const handleFinishSubmit = () => {
    if (!navigator.onLine) {
      toast.error('Sin conexion. El borrador queda guardado localmente hasta que vuelva la red.');
      return;
    }

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
      emailConsentAccepted: finishForm.emailConsentAccepted,
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
    if (!navigator.onLine) {
      toast.error('Sin conexion. No se puede crear la historia clinica hasta recuperar la red.');
      return;
    }

    if (!emailRecordForm.patientEmail.trim()) {
      toast.error('Ingresa el correo del paciente');
      return;
    }

    if (!emailRecordForm.recordTitle.trim() || !emailRecordForm.recordDescription.trim()) {
      toast.error('Completa el titulo y la descripcion del registro clinico');
      return;
    }

    if (emailRecordForm.sendEmail && !emailRecordForm.emailConsentAccepted) {
      toast.error('Confirma la autorizacion del paciente para enviar documentos por correo');
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

    const { payload: vitals, errors: vitalsErrors } = buildVitalsPayload(emailRecordForm);
    if (vitalsErrors.length > 0) {
      toast.error(vitalsErrors[0]);
      return;
    }

    const hasVitals = Object.values(vitals).some((v) => v !== undefined);

    const payload: CreateRecordByEmailPayload = {
      patientEmail: emailRecordForm.patientEmail.trim(),
      patientFirstName: emailRecordForm.patientFirstName.trim() || undefined,
      patientLastName: emailRecordForm.patientLastName.trim() || undefined,
      patientDateOfBirth: emailRecordForm.patientDateOfBirth.trim() || undefined,
      patientGender: emailRecordForm.patientGender.trim() || undefined,
      serviceName: emailRecordForm.serviceName.trim() || undefined,
      sendEmail: emailRecordForm.sendEmail,
      emailConsentAccepted: emailRecordForm.emailConsentAccepted,
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
        <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Puesto de atencion clinica
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sigue la atencion activa, registra evolucion y revisa trazabilidad clinica.
            </p>
          </div>
          {activeAppointment && (
            <span
              className={cn(
                'inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                statusColors[activeAppointment.status] || 'bg-gray-50 text-gray-700 border-gray-100'
              )}
            >
              {statusLabels[activeAppointment.status] || activeAppointment.status}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {!activeAppointment ? (
            <div className="rounded-md border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No hay citas asignadas para seguimiento clinico.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        Paciente seleccionado
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {activeAppointment.patient?.user?.firstName} {activeAppointment.patient?.user?.lastName}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {activeAppointment.service?.name || 'Servicio no definido'} - {formatDateTime(activeAppointment.scheduledAt)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {activeAppointment.address}, {activeAppointment.city}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(activeAppointment.status === 'PENDING' || activeAppointment.status === 'CONFIRMED') && (
                        <Button
                          size="sm"
                          onClick={() => handleStartEncounter(activeAppointment)}
                          disabled={startEncounterMutation.isPending}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Iniciar
                        </Button>
                      )}
                      {activeAppointment.status === 'IN_PROGRESS' && user?.role === 'NURSE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenVitalsModal(activeAppointment)}
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <HeartPulse className="h-4 w-4" />
                          Signos
                        </Button>
                      )}
                      {activeAppointment.status === 'IN_PROGRESS' &&
                        (user?.role === 'DOCTOR' ||
                          (user?.role === 'NURSE' && activeAppointment.service?.category === 'NURSING')) && (
                          <Button size="sm" onClick={() => handleOpenFinishModal(activeAppointment)}>
                            <FileCheck2 className="h-4 w-4" />
                            Finalizar
                          </Button>
                        )}
                      {activeAppointment.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendDocuments(activeAppointment)}
                          isLoading={sendingDocumentsId === activeAppointment.id}
                          className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <MailCheck className="h-4 w-4" />
                          Reenviar docs
                        </Button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <ClipboardList className="h-4 w-4 text-indigo-600" />
                    Checklist de calidad clinica
                  </h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {clinicalChecklist.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'rounded-md border p-3 text-sm',
                          item.done
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
                          <div>
                            <p className="font-semibold">{item.label}</p>
                            <p className="mt-1 text-xs opacity-80">{item.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <HeartPulse className="h-4 w-4 text-red-600" />
                      Signos vitales recientes
                    </h3>
                    {activeAppointment.status === 'IN_PROGRESS' && user?.role === 'NURSE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenVitalsModal(activeAppointment)}
                        className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Registrar
                      </Button>
                    )}
                  </div>

                  {latestVitals ? (
                    <div className="mt-3 space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {buildVitalsChips(latestVitals).map((vital) => (
                          <div key={vital.label} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{vital.label}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{vital.value}</p>
                          </div>
                        ))}
                      </div>
                      {vitalsAlerts.length > 0 && (
                        <div className="space-y-2">
                          {vitalsAlerts.map((alert) => (
                            <div key={alert} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                              {alert}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-md border border-gray-200 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No hay signos vitales registrados para esta atencion.
                    </p>
                  )}
                </section>

                {user?.role === 'DOCTOR' && (
                  <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <MessageSquareText className="h-4 w-4 text-blue-600" />
                      Nota de evolucion
                    </h3>
                    {activeAppointment.encounter?.summary && (
                      <p className="mt-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        Ultima nota: {activeAppointment.encounter.summary}
                      </p>
                    )}
                    <textarea
                      value={evolutionNote}
                      onChange={(event) => setEvolutionNote(event.target.value)}
                      className="mt-3 min-h-[90px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Evolucion, hallazgos, decisiones clinicas o cambios durante la atencion."
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleSaveEvolutionNote}
                        isLoading={addEncounterNoteMutation.isPending}
                        disabled={activeAppointment.status !== 'IN_PROGRESS'}
                      >
                        Guardar nota
                      </Button>
                    </div>
                  </section>
                )}
              </div>

              <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Trazabilidad clinica
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Eventos registrados por el equipo en tiempo real.
                    </p>
                  </div>
                  {isFetchingTimeline && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                </div>

                <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {timeline.length === 0 ? (
                    <p className="rounded-md border border-gray-200 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Aun no hay eventos para esta cita.
                    </p>
                  ) : (
                    timeline.slice(0, 8).map((item: AppointmentTimelineItem) => (
                      <div key={`${item.source}-${item.id}`} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {getTimelineActionLabel(item.action)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {getTimelineActor(item)} - {formatDateTime(item.createdAt)}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {item.actorRole}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </CardContent>
      </Card>

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
                  className={cn(
                    'flex flex-col gap-4 p-6 transition sm:flex-row sm:items-center sm:justify-between',
                    activeAppointment?.id === appointment.id
                      ? 'bg-blue-50/70 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40'
                  )}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveAppointmentId(appointment.id)}
                      className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Seguimiento
                    </Button>
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
                        onClick={() => handleStartEncounter(appointment)}
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
                    {appointment.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendDocuments(appointment)}
                        isLoading={sendingDocumentsId === appointment.id}
                        className="dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        <MailCheck className="h-4 w-4" />
                        Reenviar docs
                      </Button>
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
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                El borrador se guarda en este dispositivo hasta finalizar la cita.
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

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <div>
                <p className="font-medium">Autorizacion para envio por correo</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirma que el paciente autorizo recibir historia clinica y formula en su correo.
                </p>
              </div>
              <Switch
                checked={finishForm.emailConsentAccepted}
                onCheckedChange={(checked) =>
                  setFinishForm((prev) => ({ ...prev, emailConsentAccepted: checked }))
                }
              />
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
                    setEmailRecordForm((prev) => ({
                      ...prev,
                      sendEmail: checked,
                      emailConsentAccepted: checked ? prev.emailConsentAccepted : false,
                    }))
                  }
                />
              </div>
              {emailRecordForm.sendEmail && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <div>
                    <p className="font-medium">Autorizacion del paciente</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      El paciente autorizo el tratamiento de datos y el envio de documentos clinicos por correo.
                    </p>
                  </div>
                  <Switch
                    checked={emailRecordForm.emailConsentAccepted}
                    onCheckedChange={(checked) =>
                      setEmailRecordForm((prev) => ({ ...prev, emailConsentAccepted: checked }))
                    }
                  />
                </div>
              )}
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

      <ConfirmDialog
        isOpen={Boolean(documentSendCandidate)}
        title="Confirmar autorizacion"
        message="Confirma que el paciente autorizo el tratamiento de datos y el envio de documentos clinicos por correo."
        confirmLabel="Enviar documentos"
        cancelLabel="Cancelar"
        isLoading={Boolean(sendingDocumentsId)}
        onConfirm={handleConfirmSendDocuments}
        onCancel={() => setDocumentSendCandidate(null)}
      />
    </div>
  );
}

type VitalsFormLike = Partial<Record<
  'bpSys' | 'bpDia' | 'heartRate' | 'respiratoryRate' | 'temperature' | 'spo2' | 'weight' | 'height' | 'notes',
  string
>>;

const FINISH_DRAFT_PREFIX = 'smd-vital:clinical-finish-draft:';

const VITAL_LIMITS = {
  bpSys: { label: 'PA sistolica', min: 40, max: 260, integer: true },
  bpDia: { label: 'PA diastolica', min: 30, max: 160, integer: true },
  heartRate: { label: 'Frecuencia cardiaca', min: 20, max: 250, integer: true },
  respiratoryRate: { label: 'Frecuencia respiratoria', min: 5, max: 80, integer: true },
  temperature: { label: 'Temperatura', min: 30, max: 45, integer: false },
  spo2: { label: 'SpO2', min: 50, max: 100, integer: true },
  weight: { label: 'Peso', min: 1, max: 350, integer: false },
  height: { label: 'Talla', min: 30, max: 250, integer: false },
} as const;

function buildVitalsPayload(form: VitalsFormLike) {
  const payload: VitalSignInput = {};
  const errors: string[] = [];

  (Object.keys(VITAL_LIMITS) as Array<keyof typeof VITAL_LIMITS>).forEach((key) => {
    const rawValue = form[key]?.trim();
    if (!rawValue) {
      return;
    }

    const parsed = Number(rawValue);
    const limits = VITAL_LIMITS[key];
    if (!Number.isFinite(parsed)) {
      errors.push(`${limits.label} debe ser numerico`);
      return;
    }

    if (parsed < limits.min || parsed > limits.max) {
      errors.push(`${limits.label} esta fuera del rango permitido (${limits.min}-${limits.max})`);
      return;
    }

    (payload as Record<string, number | string | undefined>)[key] = limits.integer
      ? Math.round(parsed)
      : parsed;
  });

  if (form.notes?.trim()) {
    payload.notes = form.notes.trim();
  }

  return { payload, errors };
}

function buildClinicalChecklist(appointment: ClinicalAppointment | null, role?: string) {
  if (!appointment) {
    return [];
  }

  const hasEncounter = Boolean(appointment.encounter?.id);
  const hasVitals = Boolean(appointment.encounter?.vitals?.length);
  const hasSummary = Boolean(appointment.encounter?.summary);
  const isCompleted = appointment.status === 'COMPLETED';

  return [
    {
      id: 'started',
      label: 'Atencion iniciada',
      done: hasEncounter || isCompleted,
      detail: hasEncounter || isCompleted ? 'Existe encuentro clinico asociado.' : 'Inicia la atencion antes de registrar datos.',
    },
    {
      id: 'vitals',
      label: role === 'NURSE' ? 'Signos registrados' : 'Signos disponibles',
      done: hasVitals || isCompleted,
      detail: hasVitals ? 'Hay signos vitales recientes.' : 'Registra o solicita signos vitales antes de cerrar.',
    },
    {
      id: 'evolution',
      label: 'Evolucion documentada',
      done: hasSummary || isCompleted,
      detail: hasSummary ? 'Existe nota de evolucion en el encuentro.' : 'Guarda una nota clinica durante la atencion.',
    },
    {
      id: 'closed',
      label: 'Cierre clinico',
      done: isCompleted,
      detail: isCompleted ? 'Historia y documentos generados.' : 'Finaliza para crear historia clinica y documentos.',
    },
  ];
}

function buildVitalsChips(vitals: VitalSign) {
  return [
    {
      label: 'Presion arterial',
      value: vitals.bpSys || vitals.bpDia ? `${vitals.bpSys ?? '-'} / ${vitals.bpDia ?? '-'} mmHg` : '-',
    },
    { label: 'Frecuencia cardiaca', value: vitals.heartRate ? `${vitals.heartRate} lpm` : '-' },
    { label: 'Respiracion', value: vitals.respiratoryRate ? `${vitals.respiratoryRate} rpm` : '-' },
    { label: 'Temperatura', value: vitals.temperature ? `${vitals.temperature} C` : '-' },
    { label: 'SpO2', value: vitals.spo2 ? `${vitals.spo2}%` : '-' },
    { label: 'Peso', value: vitals.weight ? `${vitals.weight} kg` : '-' },
    { label: 'Talla', value: vitals.height ? `${vitals.height} cm` : '-' },
  ];
}

function buildVitalsAlerts(vitals: VitalSign) {
  const alerts: string[] = [];

  if ((vitals.bpSys && vitals.bpSys >= 180) || (vitals.bpDia && vitals.bpDia >= 120)) {
    alerts.push('Alerta: presion arterial en rango critico.');
  } else if ((vitals.bpSys && vitals.bpSys < 90) || (vitals.bpDia && vitals.bpDia < 60)) {
    alerts.push('Alerta: presion arterial baja.');
  }

  if (vitals.spo2 && vitals.spo2 < 92) {
    alerts.push('Alerta: saturacion de oxigeno baja.');
  }

  if (vitals.temperature && (vitals.temperature >= 38 || vitals.temperature < 35)) {
    alerts.push('Alerta: temperatura fuera de rango normal.');
  }

  if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 120)) {
    alerts.push('Alerta: frecuencia cardiaca fuera de rango normal.');
  }

  if (vitals.respiratoryRate && (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 24)) {
    alerts.push('Alerta: frecuencia respiratoria fuera de rango normal.');
  }

  return alerts;
}

function getTimelineActionLabel(action: string) {
  const labels: Record<string, string> = {
    STARTED: 'Atencion iniciada',
    VITALS_RECORDED: 'Signos vitales registrados',
    NOTE_ADDED: 'Nota clinica agregada',
    COMPLETED: 'Atencion finalizada',
    DOCUMENT_SENT: 'Documentos enviados',
    STATUS_CHANGED: 'Estado actualizado',
    appointment_created: 'Cita creada',
    appointment_updated: 'Cita actualizada',
    appointment_status_changed: 'Estado actualizado',
    encounter_started: 'Atencion iniciada',
    vitals_recorded: 'Signos vitales registrados',
    note_added: 'Nota clinica agregada',
    encounter_finished: 'Atencion finalizada',
    documents_sent: 'Documentos enviados',
  };

  return labels[action] ?? action.replace(/_/g, ' ');
}

function getTimelineActor(item: AppointmentTimelineItem) {
  if (!item.actor) {
    return 'Sistema';
  }

  return `${item.actor.firstName} ${item.actor.lastName}`.trim() || item.actor.email || 'Usuario';
}

function getFinishDraftKey(appointmentId: string) {
  return `${FINISH_DRAFT_PREFIX}${appointmentId}`;
}

function loadFinishDraft(appointmentId: string): FinishFormState {
  try {
    const rawDraft = window.localStorage.getItem(getFinishDraftKey(appointmentId));
    if (!rawDraft) {
      return emptyFinishForm;
    }

    return {
      ...emptyFinishForm,
      ...JSON.parse(rawDraft),
    };
  } catch (_error) {
    return emptyFinishForm;
  }
}

function saveFinishDraft(appointmentId: string, draft: FinishFormState) {
  try {
    window.localStorage.setItem(getFinishDraftKey(appointmentId), JSON.stringify(draft));
  } catch (_error) {
    // Local drafts are best effort; clinical writes still go through the API.
  }
}

function clearFinishDraft(appointmentId: string) {
  try {
    window.localStorage.removeItem(getFinishDraftKey(appointmentId));
  } catch (_error) {
    // Ignore storage cleanup failures.
  }
}

