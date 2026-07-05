# Manual QA — Camino Feliz Clínico SMD Vital

**Objetivo:** Verificar que los 3 roles (DOCTOR, NURSE, AGENT) y el rol PATIENT pueden ejecutar su flujo clínico end-to-end sin errores confusos, sin estados rotos y sin resultados inesperados.

**Track:** B+C del Ciclo 4 — Plan en `.mavis/plans/smd-vital-cycle4.yaml`

---

## 0. Pre-requisitos (5 min)

1. **Backend + Postgres + Redis levantados**
   ```bash
   cd smd-vital-backend
   docker-compose up -d          # o: npm run dev si tienes postgres/redis locales
   ```
2. **Migraciones aplicadas + seed cargado**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   Tras el seed deberías ver:
   ```
   📊 Resumen:
      👥 Usuarios: 6 (superadmin, admin, doctor, enfermera, agente, paciente)
      🏥 Servicios: 21   (11 médicos + 10 enfermería)
      💰 Reglas de margen: 21
   ```

3. **Resend configurado** (solo si vas a probar emails)
   ```bash
   # Backend .env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   FROM_EMAIL=SMD Vital <noreply@smdvital.com>
   APP_BASE_URL=http://localhost:3000
   ```

4. **Admin panel corriendo**
   ```bash
   cd admin-panel-frontend
   npm run dev                   # http://localhost:5173 (o el puerto que Vite indique)
   ```

5. **Login con cada credencial y verifica que carga el dashboard**
   - `doctor@smdvital.com` → /doctor
   - `enfermera@smdvital.com` → /doctor o /nurse
   - `agente@smdvital.com` → /agent
   - `paciente@smdvital.com` → /patient

---

## 1. Camino feliz — DOCTOR 👨‍⚕️

**Login como `doctor@smdvital.com` / `Password123!`**

| # | Acción | Resultado esperado | ¿Pasa? |
|---|---|---|---|
| 1.1 | Abrir DoctorDashboard | Carga con citas asignadas + disponibilidad del día. Sin spinner infinito. | ☐ |
| 1.2 | Abrir DoctorAppointments | Lista paginada de citas del doctor. Filtros por estado visibles. | ☐ |
| 1.3 | Sin citas: empty state claro | Mensaje entendible tipo "No tienes citas asignadas hoy" | ☐ |
| 1.4 | Click en cita PENDING → "Iniciar Encuentro" | Status cambia a IN_PROGRESS, toast éxito "Atencion iniciada" | ☐ |
| 1.5 | Tabla "Signos vitales" carga (puede estar vacía) | Empty state en español si no hay | ☐ |
| 1.6 | Click "Registrar vitales" → llenar BP/HR/SpO2/Temp → Guardar | VitalSign creado, tabla refresca, toast éxito | ☐ |
| 1.7 | Escribir nota clínica (mín: chiefComplaint + diagnosis) | Persiste en Encounter.payload | ☐ |
| 1.8 | Agregar prescripción (medication + dosage + frequency + duration, sin items vacíos) | Items creados en PrescriptionItem | ☐ |
| 1.9 | Check "Acepto envio por email" sin confirmar | Toast claro: "Confirma la autorizacion del paciente para enviar documentos por email" | ☐ |
| 1.10 | Marcar check + click "Guardar y finalizar" | Status → COMPLETED. Toast: "Historia clinica enviada a <email>" (o "en cola" si Resend no llega) | ☐ |
| 1.11 | Volver a DoctorAppointments — la cita aparece con badge verde "Completada" | UI confirma estado | ☐ |
| 1.12 | Refrescar página (F5) — la cita sigue COMPLETED, los documentos siguen descargables | Persistencia OK | ☐ |

**Verificación backend (opcional pero recomendada):**
```bash
# PostgreSQL
docker exec -it smd-vital-postgres psql -U postgres -d smd_vital -c \
  "SELECT id, status, \"finishedAt\", \"finishedById\" FROM appointments WHERE doctorId IN (SELECT id FROM doctors WHERE \"userId\" = (SELECT id FROM users WHERE email = 'doctor@smdvital.com')) ORDER BY \"scheduledAt\" DESC LIMIT 1;"

# PDFs generados
ls -la smd-vital-backend/uploads/documents/   # debe haber 2 archivos .pdf
```

---

## 2. Camino feliz — NURSE 👩‍⚕️

**Login como `enfermera@smdvital.com` / `Password123!`**

| # | Acción | Resultado esperado | ¿Pasa? |
|---|---|---|---|
| 2.1 | Abrir DoctorAppointments (las citas NURSING deben aparecer) | Filtra solo citas con `category === 'NURSING'` | ☐ |
| 2.2 | Click en cita NURSING → "Iniciar Encuentro" | Status → IN_PROGRESS, enfermera asignada automáticamente | ☐ |
| 2.3 | Registrar signos vitales completos | VitalSign con `recordedById = enfermera.userId` | ☐ |
| 2.4 | Logout + Login como doctor@smdvital.com → abrir la misma cita | Ver los vitales que registró la enfermera | ☐ |
| 2.5 | (Edge) Enfermera intenta finalizar cita de DOCTOR (servicio SPECIALIST) | Backend 403, toast claro: "No tienes permiso para finalizar esta cita" | ☐ |

---

## 3. Camino feliz — AGENT 📞

**Login como `agente@smdvital.com` / `Password123!`**

| # | Acción | Resultado esperado | ¿Pasa? |
|---|---|---|---|
| 3.1 | Abrir MyCommissions o ruta `/agent` | Carga la vista del agente | ☐ |
| 3.2 | Abrir formulario "Crear nueva cita" | Form se abre, valida email del paciente (debe existir o permitir crear paciente placeholder) | ☐ |
| 3.3 | Submit sin fecha/servicio | Mensajes inline en español "Selecciona fecha" "Selecciona servicio" | ☐ |
| 3.4 | Submit completo con cita válida | Toast "Cita creada correctamente" | ☐ |
| 3.5 | Aparece en lista del agente + visible para doctor asignado | Trazabilidad OK | ☐ |
| 3.6 | (Edge) Agente intenta iniciar encuentro (no es DOCTOR/NURSE) | Backend 403, UI no muestra el botón o muestra "Accion no permitida" | ☐ |
| 3.7 | (Edge) Agente crea cita pero paciente no existe | Validacion clara: "Paciente no encontrado" o crear paciente placeholder | ☐ |

---

## 4. Camino feliz — PATIENT 🧑‍⚕️

**Login como `paciente@smdvital.com` / `Password123!`**

| # | Acción | Resultado esperado | ¿Pasa? |
|---|---|---|---|
| 4.1 | Abrir PatientDashboard | Carga ultimas 3 citas + metricas (total records, prescriptions) | ☐ |
| 4.2 | Abrir PatientHistory | Lista completa de medical records + prescriptions + appointments | ☐ |
| 4.3 | Click en una historia → Descargar PDF | Archivo PDF baja, nombre legible (`historia-clinica-<id>.pdf`) | ☐ |
| 4.4 | Click en una prescripcion → Descargar PDF | Archivo PDF baja con la formula medica | ☐ |
| 4.5 | Verificar email (si Resend OK) | Llego el email con ambos PDFs adjuntos | ☐ |

---

## 5. Edge cases transversales (todos los roles)

| # | Caso | Resultado esperado | ¿Pasa? |
|---|---|---|---|
| 5.1 | Login con password incorrecto 3 veces | Mensaje "Credenciales invalidas" SIN revelar si email existe | ☐ |
| 5.2 | Esperar 16+ minutos logueado sin tocar nada | El siguiente request debe reintentar con refresh token automaticamente, sin sacarte al login | ☐ |
| 5.3 | Cortar internet durante 30 segundos → restaurar | UI muestra "Sin conexion" y al restaurar los cambios pendientes se guardan | ☐ |
| 5.4 | Submit form con un campo muy largo (>10k chars) | Backend 400 + mensaje claro (no crashea) | ☐ |
| 5.5 | Backend caido (matar proceso) → intentar login | Toast claro: "No se puede conectar al servidor" | ☐ |
| 5.6 | Reload de página en /doctor | Sesion persiste (Zustand persist + refreshToken) | ☐ |
| 5.7 | Abrir 2 tabs como mismo doctor → finalizar cita en tab A | Tab B recibe evento socket.io o al re-fetch ve estado actualizado | ☐ |
| 5.8 | Click rapido doble en "Finalizar" | Solo se ejecuta una vez (debounce/boton disabled durante mutation) | ☐ |

---

## 6. Plantilla de reporte

Cuando termines, pega el resultado en este formato:

```markdown
## QA Report SMD Vital — Ciclo 4 (Track C)

**Fecha:** YYYY-MM-DD
**Backend:** [OK | errores]
**Admin Panel:** [OK | errores]
**Resend:** [OK | no probado]

### Resumen por rol

**DOCTOR — X/12 pasos OK, P0 gaps: 0, P1 gaps: 1**
- 1.10: Finalizar Encuentro — PDF se genero pero el email no llego (Resend 401)

**NURSE — X/5 pasos OK**
- ...

**AGENT — X/7 pasos OK**
- ...

**PATIENT — X/5 pasos OK**
- ...

### Edge cases transversales — X/8 OK
- 5.2: Refresh token — VERIFIED, no saco al login tras esperar 16min

### Screenshots (pegar adjuntos o paths)
- doctor/dashboard.png
- doctor/finish_encounter.png
- ...

### Backend verifications
- MedicalRecord.pdfPath existe: [SI/NO]
- DocumentDelivery.status: [SENT/QUEUED/SKIPPED]
- ServiceTrace populate: [SI/NO]

### Gaps P0 (bloquean demo / paciente real)
- ...

### Gaps P1 (UX confusa pero no bloquea)
- ...

### Gaps P2 (cosmético, no urgente)
- ...
```

---

## 7. Notas para el siguiente ciclo

- **Track D (opcional):** Smoke E2E con Docker + Playwright para automatizar este checklist.
- **Tests automatizados:** Jest + supertest para el backend (integration), Playwright/Vitest para frontend.
- **Mejoras detectadas durante QA** se priorizan para Ciclo 5.

---

**Si encuentras un P0, avísame de inmediato y pausamos el ciclo.** Los P1 van al backlog, los P2 a "cuando podamos".
