"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');
    console.log('🗑️  Limpiando datos existentes...');
    await prisma.notification.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.doctorService.deleteMany();
    await prisma.doctorSchedule.deleteMany();
    await prisma.service.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();
    await prisma.setting.deleteMany();
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    console.log('👥 Creando usuarios...');
    await prisma.user.create({
        data: {
            email: 'superadmin@smdvital.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Administrador',
            phone: '+573001234567',
            role: 'SUPER_ADMIN',
            isActive: true,
            isVerified: true,
            admin: {
                create: {
                    level: 'SUPER_ADMIN',
                },
            },
        },
    });
    await prisma.user.create({
        data: {
            email: 'admin@smdvital.com',
            password: hashedPassword,
            firstName: 'Carlos',
            lastName: 'Rodríguez',
            phone: '+573009876543',
            role: 'ADMIN',
            isActive: true,
            isVerified: true,
            admin: {
                create: {
                    level: 'ADMIN',
                },
            },
        },
    });
    const doctorsData = [
        {
            email: 'maria.garcia@smdvital.com',
            firstName: 'María',
            lastName: 'García',
            phone: '+573101234567',
            specialty: 'Medicina General',
            license: 'MED-001-2020',
            experience: 8,
            consultationFee: 80000,
            bio: 'Médica general con amplia experiencia en atención domiciliaria y medicina preventiva.',
        },
        {
            email: 'juan.martinez@smdvital.com',
            firstName: 'Juan',
            lastName: 'Martínez',
            phone: '+573102345678',
            specialty: 'Cardiología',
            license: 'MED-002-2018',
            experience: 12,
            consultationFee: 150000,
            bio: 'Cardiólogo especialista en enfermedades cardiovasculares y medicina preventiva.',
        },
        {
            email: 'ana.lopez@smdvital.com',
            firstName: 'Ana',
            lastName: 'López',
            phone: '+573103456789',
            specialty: 'Pediatría',
            license: 'MED-003-2019',
            experience: 10,
            consultationFee: 100000,
            bio: 'Pediatra dedicada al cuidado integral de niños y adolescentes.',
        },
        {
            email: 'carlos.hernandez@smdvital.com',
            firstName: 'Carlos',
            lastName: 'Hernández',
            phone: '+573104567890',
            specialty: 'Dermatología',
            license: 'MED-004-2017',
            experience: 15,
            consultationFee: 120000,
            bio: 'Dermatólogo con especialización en enfermedades de la piel y tratamientos estéticos.',
        },
        {
            email: 'laura.jimenez@smdvital.com',
            firstName: 'Laura',
            lastName: 'Jiménez',
            phone: '+573105678901',
            specialty: 'Medicina Interna',
            license: 'MED-005-2016',
            experience: 14,
            consultationFee: 130000,
            bio: 'Internista especializada en el diagnóstico y tratamiento de enfermedades complejas.',
        },
    ];
    const doctors = [];
    for (const doctorData of doctorsData) {
        const doctor = await prisma.user.create({
            data: {
                email: doctorData.email,
                password: hashedPassword,
                firstName: doctorData.firstName,
                lastName: doctorData.lastName,
                phone: doctorData.phone,
                role: 'DOCTOR',
                isActive: true,
                isVerified: true,
                doctor: {
                    create: {
                        licenseNumber: doctorData.license,
                        specialty: doctorData.specialty,
                        experience: doctorData.experience,
                        rating: 4.5 + Math.random() * 0.5,
                        totalReviews: 0,
                        isAvailable: true,
                        consultationFee: doctorData.consultationFee,
                        bio: doctorData.bio,
                        education: 'Universidad Nacional de Colombia',
                        certifications: 'Certificado en atención domiciliaria, RCP avanzado',
                        languages: ['Español', 'Inglés'],
                        serviceAreas: ['Bogotá', 'Suba', 'Usaquén', 'Chapinero'],
                    },
                },
            },
            include: {
                doctor: true,
            },
        });
        doctors.push(doctor.doctor);
    }
    const patientsData = [
        {
            email: 'santiago.gomez@email.com',
            firstName: 'Santiago',
            lastName: 'Gómez',
            phone: '+573201234567',
            dateOfBirth: new Date('1990-05-15'),
            gender: 'MALE',
            address: 'Calle 127 #45-23',
            city: 'Bogotá',
        },
        {
            email: 'valentina.rojas@email.com',
            firstName: 'Valentina',
            lastName: 'Rojas',
            phone: '+573202345678',
            dateOfBirth: new Date('1985-08-22'),
            gender: 'FEMALE',
            address: 'Carrera 15 #93-45',
            city: 'Bogotá',
        },
        {
            email: 'andres.castro@email.com',
            firstName: 'Andrés',
            lastName: 'Castro',
            phone: '+573203456789',
            dateOfBirth: new Date('1995-11-30'),
            gender: 'MALE',
            address: 'Avenida 68 #24-56',
            city: 'Bogotá',
        },
    ];
    const patients = [];
    for (const patientData of patientsData) {
        const patient = await prisma.user.create({
            data: {
                email: patientData.email,
                password: hashedPassword,
                firstName: patientData.firstName,
                lastName: patientData.lastName,
                phone: patientData.phone,
                role: 'PATIENT',
                isActive: true,
                isVerified: true,
                patient: {
                    create: {
                        dateOfBirth: patientData.dateOfBirth,
                        gender: patientData.gender,
                        address: patientData.address,
                        city: patientData.city,
                        state: 'Cundinamarca',
                        emergencyContact: 'Familiar ' + patientData.lastName,
                        emergencyPhone: '+573209999999',
                        allergies: 'Ninguna conocida',
                        insuranceProvider: 'Sanitas EPS',
                    },
                },
            },
            include: {
                patient: true,
            },
        });
        patients.push(patient.patient);
    }
    console.log(`✅ Creados ${doctors.length + patients.length + 2} usuarios`);
    console.log('🏥 Creando servicios...');
    const servicesData = [
        {
            name: 'Consulta Médica Domiciliaria',
            description: 'Atención médica general en la comodidad de tu hogar',
            category: 'CONSULTATION',
            basePrice: 80000,
            duration: 60,
        },
        {
            name: 'Toma de Muestras de Laboratorio',
            description: 'Recolección de muestras para análisis clínicos',
            category: 'LABORATORY',
            basePrice: 50000,
            duration: 30,
        },
        {
            name: 'Aplicación de Inyecciones',
            description: 'Administración de medicamentos inyectables',
            category: 'NURSING',
            basePrice: 30000,
            duration: 20,
        },
        {
            name: 'Curación de Heridas',
            description: 'Limpieza y curación profesional de heridas',
            category: 'NURSING',
            basePrice: 40000,
            duration: 30,
        },
        {
            name: 'Control de Signos Vitales',
            description: 'Medición de presión arterial, temperatura, pulso y saturación',
            category: 'NURSING',
            basePrice: 25000,
            duration: 20,
        },
        {
            name: 'Vacunación a Domicilio',
            description: 'Aplicación de vacunas en casa',
            category: 'VACCINATION',
            basePrice: 60000,
            duration: 30,
        },
        {
            name: 'Terapia Respiratoria',
            description: 'Tratamiento para afecciones respiratorias',
            category: 'THERAPY',
            basePrice: 70000,
            duration: 45,
        },
        {
            name: 'Electrocardiograma a Domicilio',
            description: 'Realización de ECG en casa',
            category: 'SPECIALIST',
            basePrice: 100000,
            duration: 45,
        },
        {
            name: 'Atención de Emergencias',
            description: 'Servicio de urgencias médicas a domicilio',
            category: 'EMERGENCY',
            basePrice: 150000,
            duration: 90,
        },
        {
            name: 'Consulta Pediátrica',
            description: 'Atención médica especializada para niños',
            category: 'SPECIALIST',
            basePrice: 100000,
            duration: 60,
        },
    ];
    const services = [];
    for (const serviceData of servicesData) {
        const service = await prisma.service.create({
            data: {
                ...serviceData,
                category: serviceData.category,
            },
        });
        services.push(service);
    }
    console.log(`✅ Creados ${services.length} servicios`);
    console.log('📅 Creando horarios médicos...');
    let scheduleCount = 0;
    for (const doctor of doctors) {
        for (let day = 1; day <= 5; day++) {
            await prisma.doctorSchedule.create({
                data: {
                    doctorId: doctor.id,
                    dayOfWeek: day,
                    startTime: '08:00',
                    endTime: '18:00',
                    isActive: true,
                },
            });
            scheduleCount++;
        }
        await prisma.doctorSchedule.create({
            data: {
                doctorId: doctor.id,
                dayOfWeek: 6,
                startTime: '09:00',
                endTime: '13:00',
                isActive: true,
            },
        });
        scheduleCount++;
    }
    console.log(`✅ Creados ${scheduleCount} horarios médicos`);
    console.log('🔗 Vinculando servicios con doctores...');
    let doctorServiceCount = 0;
    for (const doctor of doctors) {
        const numServices = 3 + Math.floor(Math.random() * 3);
        const shuffledServices = [...services].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numServices && i < shuffledServices.length; i++) {
            const service = shuffledServices[i];
            if (service) {
                await prisma.doctorService.create({
                    data: {
                        doctorId: doctor.id,
                        serviceId: service.id,
                        price: service.basePrice + Math.floor(Math.random() * 20000),
                        isActive: true,
                    },
                });
                doctorServiceCount++;
            }
        }
    }
    console.log(`✅ Creados ${doctorServiceCount} servicios médicos`);
    console.log('📋 Creando citas...');
    const appointmentStatuses = ['COMPLETED', 'CONFIRMED', 'PENDING', 'IN_PROGRESS', 'CANCELLED'];
    const addresses = [
        { address: 'Calle 127 #45-23, Apto 501', city: 'Bogotá' },
        { address: 'Carrera 15 #93-45, Casa 12', city: 'Bogotá' },
        { address: 'Avenida 68 #24-56', city: 'Bogotá' },
        { address: 'Calle 100 #19-23', city: 'Bogotá' },
        { address: 'Carrera 7 #32-45', city: 'Bogotá' },
    ];
    const appointments = [];
    for (let i = 0; i < 5; i++) {
        const patient = patients[i % patients.length];
        const doctor = doctors[i % doctors.length];
        const service = services[i % services.length];
        const location = addresses[i % addresses.length];
        if (patient && doctor && service && location) {
            const daysAgo = Math.floor(Math.random() * 30);
            const appointment = await prisma.appointment.create({
                data: {
                    patientId: patient.id,
                    doctorId: doctor.id,
                    serviceId: service.id,
                    status: appointmentStatuses[i % appointmentStatuses.length],
                    scheduledAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
                    duration: service.duration,
                    notes: 'Paciente solicita atención domiciliaria',
                    totalPrice: service.basePrice,
                    address: location.address,
                    city: location.city,
                    coordinates: {
                        lat: 4.6097 + (Math.random() - 0.5) * 0.1,
                        lng: -74.0817 + (Math.random() - 0.5) * 0.1,
                    },
                },
            });
            appointments.push(appointment);
        }
    }
    console.log(`✅ Creadas ${appointments.length} citas`);
    console.log('💳 Creando pagos...');
    const paymentMethods = ['CASH', 'CARD', 'NEQUI', 'PSE', 'DAVIPLATA'];
    const paymentStatuses = ['COMPLETED', 'COMPLETED', 'PENDING', 'COMPLETED', 'FAILED'];
    for (let i = 0; i < appointments.length; i++) {
        const appointment = appointments[i];
        if (appointment) {
            await prisma.payment.create({
                data: {
                    appointmentId: appointment.id,
                    amount: appointment.totalPrice,
                    currency: 'COP',
                    status: paymentStatuses[i % paymentStatuses.length],
                    method: paymentMethods[i % paymentMethods.length],
                    transactionId: `TXN-${Date.now()}-${i}`,
                },
            });
        }
    }
    console.log(`✅ Creados 5 pagos`);
    console.log('⭐ Creando reseñas...');
    const reviewComments = [
        'Excelente atención, muy profesional y puntual. Totalmente recomendado.',
        'Muy buena experiencia, el doctor fue muy amable y explicó todo detalladamente.',
        'Servicio rápido y efectivo. Me sentí muy bien atendido.',
        'Buen servicio, aunque llegó un poco tarde. En general satisfecho.',
        'Atención de primera calidad. Volveré a solicitar el servicio.',
    ];
    let reviewCount = 0;
    for (let i = 0; i < Math.min(appointments.length, 5); i++) {
        const appointment = appointments[i];
        if (appointment && appointment.status === 'COMPLETED') {
            await prisma.review.create({
                data: {
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    appointmentId: appointment.id,
                    rating: 4 + Math.floor(Math.random() * 2),
                    comment: reviewComments[i % reviewComments.length] || null,
                    isVerified: Math.random() > 0.3,
                },
            });
            const doctorReviews = await prisma.review.findMany({
                where: { doctorId: appointment.doctorId },
            });
            const avgRating = doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length;
            await prisma.doctor.update({
                where: { id: appointment.doctorId },
                data: {
                    rating: avgRating,
                    totalReviews: doctorReviews.length,
                },
            });
            reviewCount++;
        }
    }
    console.log(`✅ Creadas ${reviewCount} reseñas`);
    console.log('📄 Creando historias médicas...');
    const recordTypes = ['LAB_RESULT', 'DIAGNOSIS', 'PRESCRIPTION', 'VACCINATION', 'OTHER'];
    const recordTitles = [
        'Resultados de laboratorio - Hemograma completo',
        'Diagnóstico - Hipertensión arterial',
        'Receta médica - Tratamiento antibiótico',
        'Vacuna - COVID-19 (Dosis de refuerzo)',
        'Control - Presión arterial',
    ];
    let recordCount = 0;
    for (const patient of patients) {
        if (patient) {
            const numRecords = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numRecords; i++) {
                await prisma.medicalRecord.create({
                    data: {
                        patientId: patient.id,
                        title: recordTitles[i % recordTitles.length] || 'Registro médico',
                        description: 'Registro médico generado durante la atención domiciliaria.',
                        type: recordTypes[i % recordTypes.length],
                        doctorNotes: 'Paciente en buen estado general. Se recomienda seguimiento.',
                    },
                });
                recordCount++;
            }
        }
    }
    console.log(`✅ Creadas ${recordCount} historias médicas`);
    console.log('💊 Creando prescripciones...');
    const medications = [
        { name: 'Acetaminofén', dosage: '500mg', frequency: 'Cada 8 horas', duration: '5 días' },
        { name: 'Ibuprofeno', dosage: '400mg', frequency: 'Cada 6 horas', duration: '3 días' },
        { name: 'Amoxicilina', dosage: '500mg', frequency: 'Cada 12 horas', duration: '7 días' },
        { name: 'Losartán', dosage: '50mg', frequency: 'Una vez al día', duration: '30 días' },
        { name: 'Omeprazol', dosage: '20mg', frequency: 'En ayunas', duration: '14 días' },
    ];
    let prescriptionCount = 0;
    for (const patient of patients) {
        if (patient) {
            const numPrescriptions = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numPrescriptions; i++) {
                const med = medications[i % medications.length];
                const doctor = doctors[i % doctors.length];
                if (med && doctor) {
                    await prisma.prescription.create({
                        data: {
                            patientId: patient.id,
                            doctorId: doctor.id,
                            medication: med.name,
                            dosage: med.dosage,
                            frequency: med.frequency,
                            duration: med.duration,
                            instructions: 'Tomar con alimentos. No suspender el tratamiento sin consultar al médico.',
                            isActive: true,
                        },
                    });
                    prescriptionCount++;
                }
            }
        }
    }
    console.log(`✅ Creadas ${prescriptionCount} prescripciones`);
    console.log('🔔 Creando notificaciones...');
    const notificationTypes = [
        'APPOINTMENT_REMINDER',
        'APPOINTMENT_CONFIRMED',
        'PAYMENT_SUCCESS',
        'NEW_MESSAGE',
        'SYSTEM_UPDATE',
    ];
    const notificationMessages = [
        { title: 'Recordatorio de cita', message: 'Tu cita es mañana a las 10:00 AM' },
        { title: 'Cita confirmada', message: 'Tu cita ha sido confirmada exitosamente' },
        { title: 'Pago exitoso', message: 'Tu pago ha sido procesado correctamente' },
        { title: 'Nuevo mensaje', message: 'Tienes un nuevo mensaje del doctor' },
        { title: 'Actualización del sistema', message: 'Nueva versión disponible con mejoras' },
    ];
    let notificationCount = 0;
    for (const patient of patients) {
        if (patient) {
            const user = await prisma.user.findUnique({ where: { id: patient.userId } });
            if (user) {
                for (let i = 0; i < 3; i++) {
                    const notif = notificationMessages[i % notificationMessages.length];
                    if (notif) {
                        await prisma.notification.create({
                            data: {
                                userId: user.id,
                                title: notif.title,
                                message: notif.message,
                                type: notificationTypes[i % notificationTypes.length],
                                isRead: Math.random() > 0.5,
                            },
                        });
                        notificationCount++;
                    }
                }
            }
        }
    }
    console.log(`✅ Creadas ${notificationCount} notificaciones`);
    console.log('⚙️  Creando configuraciones del sistema...');
    const settings = [
        { key: 'PLATFORM_NAME', value: 'SMD Vital Bogotá', type: 'STRING' },
        { key: 'SUPPORT_EMAIL', value: 'soporte@smdvital.com', type: 'STRING' },
        { key: 'SUPPORT_PHONE', value: '+573001234567', type: 'STRING' },
        { key: 'MIN_APPOINTMENT_PRICE', value: '25000', type: 'NUMBER' },
        { key: 'MAX_APPOINTMENTS_PER_DAY', value: '20', type: 'NUMBER' },
        { key: 'ALLOW_SAME_DAY_BOOKING', value: 'true', type: 'BOOLEAN' },
        { key: 'SERVICE_AREA_RADIUS_KM', value: '15', type: 'NUMBER' },
        { key: 'EMERGENCY_SURCHARGE_PERCENT', value: '50', type: 'NUMBER' },
    ];
    for (const setting of settings) {
        await prisma.setting.create({
            data: setting,
        });
    }
    console.log(`✅ Creadas ${settings.length} configuraciones`);
    console.log('\n✨ ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   👥 Usuarios: 12 (2 admins, 5 doctores, 3 pacientes + usuarios previos)`);
    console.log(`   🏥 Servicios: ${services.length}`);
    console.log(`   📅 Horarios médicos: ${scheduleCount}`);
    console.log(`   🔗 Servicios médicos: ${doctorServiceCount}`);
    console.log(`   📋 Citas: 5`);
    console.log(`   💳 Pagos: 5`);
    console.log(`   ⭐ Reseñas: ${reviewCount}`);
    console.log(`   📄 Historias médicas: ${recordCount}`);
    console.log(`   💊 Prescripciones: ${prescriptionCount}`);
    console.log(`   🔔 Notificaciones: ${notificationCount}`);
    console.log(`   ⚙️  Configuraciones: ${settings.length}\n`);
}
main()
    .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map