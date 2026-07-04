"""
build_manual.py
Genera el manual de operaciones SMD Vital para AGENTES y PROFESIONALES (Doctores/Enfermeras).
Salida: docs/manuales/Manual_SMD_Vital_Agentes_y_Profesionales.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Image, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas
from pathlib import Path
from datetime import date

# ============================================================
# PALETA SMD VITAL (basada en el logo: azul + verde salud)
# ============================================================
COLOR_PRIMARY   = HexColor('#0F76E6')   # azul corporativo
COLOR_SECONDARY = HexColor('#10B981')   # verde salud
COLOR_ACCENT    = HexColor('#F59E0B')   # ámbar para destacados
COLOR_DANGER    = HexColor('#EF4444')   # rojo para alertas
COLOR_TEXT      = HexColor('#1E293B')   # slate-900
COLOR_MUTED     = HexColor('#64748B')   # slate-500
COLOR_LIGHT_BG  = HexColor('#F1F5F9')   # slate-100
COLOR_BLUE_BG   = HexColor('#EFF6FF')   # blue-50
COLOR_GREEN_BG  = HexColor('#ECFDF5')   # emerald-50
COLOR_AMBER_BG  = HexColor('#FFFBEB')   # amber-50

OUTPUT_PATH = Path("docs/manuales/Manual_SMD_Vital_Agentes_y_Profesionales.pdf")
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# ============================================================
# ESTILOS
# ============================================================
styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle(
    'CoverTitle', parent=styles['Title'],
    fontSize=28, leading=34, textColor=COLOR_PRIMARY,
    alignment=TA_CENTER, spaceAfter=8, fontName='Helvetica-Bold'
)
style_cover_sub = ParagraphStyle(
    'CoverSub', parent=styles['Normal'],
    fontSize=14, leading=20, textColor=COLOR_MUTED,
    alignment=TA_CENTER, spaceAfter=4
)
style_h1 = ParagraphStyle(
    'H1', parent=styles['Heading1'],
    fontSize=20, leading=24, textColor=COLOR_PRIMARY,
    spaceBefore=18, spaceAfter=12, fontName='Helvetica-Bold',
    borderPadding=8, borderWidth=0, leftIndent=0
)
style_h2 = ParagraphStyle(
    'H2', parent=styles['Heading2'],
    fontSize=14, leading=18, textColor=COLOR_SECONDARY,
    spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold'
)
style_h3 = ParagraphStyle(
    'H3', parent=styles['Heading3'],
    fontSize=12, leading=16, textColor=COLOR_TEXT,
    spaceBefore=10, spaceAfter=6, fontName='Helvetica-Bold'
)
style_body = ParagraphStyle(
    'Body', parent=styles['Normal'],
    fontSize=10.5, leading=15, textColor=COLOR_TEXT,
    alignment=TA_JUSTIFY, spaceAfter=8, fontName='Helvetica'
)
style_body_bold = ParagraphStyle(
    'BodyBold', parent=style_body, fontName='Helvetica-Bold'
)
style_bullet = ParagraphStyle(
    'Bullet', parent=style_body,
    leftIndent=18, bulletIndent=6, spaceAfter=4
)
style_step = ParagraphStyle(
    'Step', parent=style_body,
    leftIndent=0, spaceAfter=6, fontName='Helvetica'
)
style_callout = ParagraphStyle(
    'Callout', parent=style_body,
    fontSize=10, leading=14, textColor=COLOR_TEXT,
    leftIndent=8, rightIndent=8, spaceAfter=4
)
style_toc_title = ParagraphStyle(
    'TocTitle', parent=styles['Title'],
    fontSize=22, leading=28, textColor=COLOR_PRIMARY,
    alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold'
)
style_toc_section = ParagraphStyle(
    'TocSection', parent=styles['Normal'],
    fontSize=12, leading=18, textColor=COLOR_PRIMARY,
    fontName='Helvetica-Bold', spaceAfter=4, leftIndent=0
)
style_toc_sub = ParagraphStyle(
    'TocSub', parent=styles['Normal'],
    fontSize=10.5, leading=15, textColor=COLOR_TEXT,
    leftIndent=14, spaceAfter=2
)

# ============================================================
# HEADER / FOOTER
# ============================================================
def header_footer(canv, doc):
    canv.saveState()
    # Header
    canv.setFont('Helvetica-Bold', 9)
    canv.setFillColor(COLOR_PRIMARY)
    canv.drawString(2*cm, A4[1] - 1.2*cm, "SMD VITAL")
    canv.setFont('Helvetica', 8)
    canv.setFillColor(COLOR_MUTED)
    canv.drawRightString(A4[0] - 2*cm, A4[1] - 1.2*cm, "Manual de Operaciones")
    canv.setStrokeColor(COLOR_PRIMARY)
    canv.setLineWidth(0.5)
    canv.line(2*cm, A4[1] - 1.4*cm, A4[0] - 2*cm, A4[1] - 1.4*cm)
    # Footer
    canv.setFont('Helvetica', 8)
    canv.setFillColor(COLOR_MUTED)
    canv.drawString(2*cm, 1.2*cm, "SMD Vital · Bogotá · Atención coordinada por MedicExpress")
    canv.drawRightString(A4[0] - 2*cm, 1.2*cm, f"Página {doc.page}")
    canv.setStrokeColor(COLOR_LIGHT_BG)
    canv.setLineWidth(0.3)
    canv.line(2*cm, 1.5*cm, A4[0] - 2*cm, 1.5*cm)
    canv.restoreState()

def cover_page(canv, doc):
    """Página de portada con branding"""
    canv.saveState()
    # Fondo superior azul
    canv.setFillColor(COLOR_PRIMARY)
    canv.rect(0, A4[1] - 8*cm, A4[0], 8*cm, fill=1, stroke=0)
    # Banda inferior verde
    canv.setFillColor(COLOR_SECONDARY)
    canv.rect(0, 0, A4[0], 1.5*cm, fill=1, stroke=0)
    # Logo texto
    canv.setFillColor(white)
    canv.setFont('Helvetica-Bold', 36)
    canv.drawCentredString(A4[0]/2, A4[1] - 4*cm, "SMD VITAL")
    canv.setFont('Helvetica', 14)
    canv.drawCentredString(A4[0]/2, A4[1] - 5*cm, "Atención coordinada por MedicExpress")
    # Símbolo médico
    canv.setFont('Helvetica-Bold', 60)
    canv.setFillColor(white)
    canv.drawCentredString(A4[0]/2, A4[1] - 7*cm, "+")
    # Título
    canv.setFillColor(COLOR_TEXT)
    canv.setFont('Helvetica-Bold', 26)
    canv.drawCentredString(A4[0]/2, A4[1] - 11*cm, "Manual de Operaciones")
    canv.setFont('Helvetica', 16)
    canv.setFillColor(COLOR_MUTED)
    canv.drawCentredString(A4[0]/2, A4[1] - 12*cm, "Agentes y Profesionales")
    # Subtítulo
    canv.setFont('Helvetica-Oblique', 12)
    canv.setFillColor(COLOR_PRIMARY)
    canv.drawCentredString(A4[0]/2, A4[1] - 14*cm, "Cómo usar el sistema, paso a paso")
    # Caja de color con info
    canv.setFillColor(COLOR_LIGHT_BG)
    canv.rect(3*cm, A4[1] - 19*cm, A4[0] - 6*cm, 4*cm, fill=1, stroke=0)
    canv.setFillColor(COLOR_PRIMARY)
    canv.setFont('Helvetica-Bold', 12)
    canv.drawCentredString(A4[0]/2, A4[1] - 16.5*cm, "¿Para quién es este manual?")
    canv.setFillColor(COLOR_TEXT)
    canv.setFont('Helvetica', 10.5)
    canv.drawCentredString(A4[0]/2, A4[1] - 17.5*cm, "Asesores de call center que agendan servicios por WhatsApp,")
    canv.drawCentredString(A4[0]/2, A4[1] - 18*cm, "y profesionales de la salud (médicos y enfermeras) que atienden a domicilio.")
    # Footer portada
    canv.setFillColor(white)
    canv.setFont('Helvetica', 9)
    canv.drawCentredString(A4[0]/2, 0.5*cm, f"Versión 1.0 · {date.today().strftime('%B %Y')}")
    canv.restoreState()

# ============================================================
# HELPERS DE CONTENIDO
# ============================================================
def callout_box(text, bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="ℹ️"):
    """Crea una caja de aviso destacada"""
    table = Table([[Paragraph(f"<b>{icon} {text}</b>", style_callout)]], colWidths=[16*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('BOX', (0, 0), (-1, -1), 1.2, border),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return table

def step_block(num, title, body):
    """Bloque de paso numerado con número grande a la izquierda"""
    num_cell = Paragraph(f"<font color='white'><b>{num}</b></font>",
                         ParagraphStyle('Num', fontSize=18, alignment=TA_CENTER,
                                        fontName='Helvetica-Bold'))
    title_cell = Paragraph(f"<b>{title}</b>", style_body_bold)
    body_cell = Paragraph(body, style_body)

    inner = Table([[title_cell], [Spacer(1, 4)], [body_cell]], colWidths=[12*cm])
    inner.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    num_table = Table([[num_cell]], colWidths=[1.2*cm], rowHeights=[1.2*cm])
    num_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))

    outer = Table([[num_table, inner]], colWidths=[1.5*cm, 12*cm])
    outer.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return outer

def info_table(rows, col_widths=(5*cm, 11*cm)):
    """Tabla de información clave:valor"""
    table = Table(rows, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), COLOR_LIGHT_BG),
        ('TEXTCOLOR', (0, 0), (0, -1), COLOR_PRIMARY),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return table

# ============================================================
# CONTENIDO DEL MANUAL
# ============================================================
story = []

# ====== PORTADA ======
# La portada se renderiza con cover_page en onFirstPage
# El story empieza directamente con el contenido (página 2)


# ====== TABLA DE CONTENIDOS ======
story.append(Paragraph("Tabla de contenidos", style_toc_title))
story.append(Spacer(1, 0.5*cm))

toc_data = [
    ("PARTE 1 — PARA EL AGENTE (Call Center / Asesor)", [
        "1. ¿Cuál es tu rol?", "12",
        "2. Tu primer día: acceso y dashboard", "13",
        "3. El flujo del día a día", "14",
        "4. Paso a paso: agendar una cita por WhatsApp", "15",
        "5. Cómo confirmar una cita", "17",
        "6. Tus comisiones: cómo verlas y cobrarlas", "18",
        "7. Confirmar recepción de pago", "19",
        "8. Errores comunes y soluciones", "20",
    ]),
    ("PARTE 2 — PARA EL PROFESIONAL (Doctor / Enfermera)", [
        "9. ¿Cuál es tu rol?", "22",
        "10. Tu primer día: acceso y dashboard", "23",
        "11. El flujo del día a día", "24",
        "12. Antes de salir: revisa tu agenda del día", "25",
        "13. En casa del paciente: iniciar el servicio", "26",
        "14. Al terminar: cómo cerrar y cobrar", "27",
        "15. Tus ganancias: cómo verlas y cobrarlas", "28",
        "16. Reglas importantes", "29",
    ]),
    ("ANEXOS", [
        "Anexo A · Glosario de estados de cita", "30",
        "Anexo B · Contacto y soporte", "30",
    ]),
]
for section, items in toc_data:
    story.append(Paragraph(section, style_toc_section))
    for i in range(0, len(items), 2):
        title = items[i]
        page = items[i + 1]
        row = Table([[Paragraph(title, style_toc_sub), Paragraph(f"<b>{page}</b>", style_toc_sub)]],
                    colWidths=[13*cm, 2*cm])
        row.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (0, 0), 0.3, HexColor('#E2E8F0')),
            ('LINEBELOW', (1, 0), (1, 0), 0.3, HexColor('#E2E8F0')),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(row)
    story.append(Spacer(1, 0.3*cm))

story.append(PageBreak())

# =====================================================================
# PARTE 1 — AGENTE
# =====================================================================
story.append(Paragraph("PARTE 1", ParagraphStyle('Part', fontSize=11, textColor=COLOR_MUTED, alignment=TA_CENTER, spaceAfter=2, fontName='Helvetica-Bold')))
story.append(Paragraph("Para el Agente (Call Center / Asesor)", ParagraphStyle('PartT', fontSize=22, textColor=COLOR_PRIMARY, alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold')))
story.append(Spacer(1, 0.5*cm))

# === 1. ¿CUÁL ES TU ROL? ===
story.append(Paragraph("1. ¿Cuál es tu rol?", style_h1))
story.append(Paragraph(
    "Tú eres el <b>primer contacto</b> con el paciente. Cuando alguien escribe por WhatsApp pidiendo un "
    "servicio a domicilio, tú lo recibes, agendas el profesional correcto y te aseguras de que la cita "
    "quede bien registrada en el sistema. Tu trabajo es 80% comunicación y 20% sistema.",
    style_body
))
story.append(Paragraph("Tus responsabilidades principales son:", style_body))
story.append(ListFlowable([
    ListItem(Paragraph("<b>Recibir</b> el WhatsApp del paciente y entender qué necesita.", style_bullet)),
    ListItem(Paragraph("<b>Verificar</b> disponibilidad real del profesional (médico o enfermera) en la fecha y hora que pide el paciente.", style_bullet)),
    ListItem(Paragraph("<b>Agendar</b> la cita en el sistema con todos los datos correctos: dirección, teléfono, servicio.", style_bullet)),
    ListItem(Paragraph("<b>Confirmar</b> la cita una vez que el profesional acepte.", style_bullet)),
    ListItem(Paragraph("<b>Hacer seguimiento</b> a tus comisiones y confirmar cuando recibas el pago.", style_bullet)),
], bulletType='bullet', start='•'))

story.append(Spacer(1, 0.3*cm))
story.append(callout_box(
    "Cada cita que agendas te genera una comisión. El sistema la calcula automáticamente. "
    "Si no agendas en el sistema, no cobras. Así de simple.",
    bg=COLOR_GREEN_BG, border=COLOR_SECONDARY, icon="💰"
))
story.append(PageBreak())

# === 2. PRIMER DÍA ===
story.append(Paragraph("2. Tu primer día: acceso y dashboard", style_h1))
story.append(Paragraph(
    "Cuando te contratamos, el administrador te crea un usuario con tus credenciales. Vas a recibir "
    "un correo con tu email y una contraseña temporal.",
    style_body
))

story.append(Paragraph("2.1. Primer ingreso (cambiar contraseña)", style_h2))
story.append(step_block("1", "Abre la app de SMD Vital",
    "En tu computador o celular. La dirección te la pasa el administrador."))
story.append(step_block("2", "Ingresa con tu email y contraseña temporal",
    "Te va a pedir inmediatamente cambiarla por una nueva. Pon una que puedas recordar."))
story.append(step_block("3", "Confirma tu número de WhatsApp",
    "Es el mismo número donde recibes los mensajes de los pacientes. Si no es el correcto, avísale al admin."))

story.append(Paragraph("2.2. Tu pantalla principal (Dashboard)", style_h2))
story.append(Paragraph(
    "Al entrar, ves una pantalla con <b>3 secciones</b> en la parte de arriba:",
    style_body
))

story.append(info_table([
    ["Por pagar", "Comisiones que ya se cobraron del paciente pero SMD Vital aún no te ha transferido."],
    ["Ganado (total)", "Todo lo que ya está pagado o recibido. Es tu acumulado real."],
    ["Confirmado", "Lo que está en tu bolsillo. Ya marcaste que recibiste la transferencia."],
]))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "Más abajo tienes <b>Citas que agendé hoy</b>: la lista de servicios que agendaste para el día de hoy. "
    "Y debajo, <b>Mis comisiones</b>: el detalle de cada servicio que agendaste, cuánto te corresponde, "
    "y en qué estado está el pago.",
    style_body
))
story.append(PageBreak())

# === 3. FLUJO DEL DÍA A DÍA ===
story.append(Paragraph("3. El flujo del día a día", style_h1))
story.append(Paragraph(
    "Tu día se repite. Una y otra vez. Domina este ciclo y no te vas a perder:",
    style_body
))

flow_table = Table([
    ["1", "Suena WhatsApp", "Paciente nuevo pide un servicio"],
    ["2", "Entiendes qué necesita", "Signos vitales, inyección, suero, etc."],
    ["3", "Revisas disponibilidad", "Botón 'Agendar cita' → ves huecos reales"],
    ["4", "Creas la cita", "Llenás los datos y envías"],
    ["5", "Confirmas la cita", "Cuando el profesional acepte"],
    ["6", "Haces seguimiento", "Si el paciente cancela, edita; si cambia, reagenda"],
    ["7", "Cobras tu comisión", "Aparece en 'Por pagar' cuando SMD Vital procesa"],
    ["8", "Confirmas que recibiste", "1 tap → pasa a 'Confirmado'"],
], colWidths=[1*cm, 4.5*cm, 10.5*cm])
flow_table.setStyle(TableStyle([
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (0, -1), COLOR_PRIMARY),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#EFF6FF')),
    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, COLOR_LIGHT_BG]),
    ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#CBD5E1')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(flow_table)

story.append(Spacer(1, 0.4*cm))
story.append(callout_box(
    "<b>Regla de oro:</b> nunca agendes por WhatsApp directamente. Siempre usa el sistema. "
    "Lo que no está en el sistema, no existe. Lo que no existe, no se cobra.",
    bg=COLOR_AMBER_BG, border=COLOR_ACCENT, icon="⚠️"
))
story.append(PageBreak())

# === 4. AGENDAR CITA ===
story.append(Paragraph("4. Paso a paso: agendar una cita por WhatsApp", style_h1))

story.append(Paragraph(
    "Este es el momento crítico de tu día. Lo haces muchas veces. Hazlo bien.",
    style_body
))

story.append(Paragraph("4.1. Antes de agendar: recopila los datos del paciente", style_h2))
story.append(Paragraph(
    "Por WhatsApp necesitas confirmar <b>5 datos</b> con el paciente antes de abrir la app:",
    style_body
))
story.append(ListFlowable([
    ListItem(Paragraph("<b>¿Qué servicio necesita?</b> (signos vitales, inyección, sutura, suero, etc.)", style_bullet)),
    ListItem(Paragraph("<b>¿Cuándo?</b> Fecha y hora aproximada. No agendes para hoy si ya son más de las 5pm.", style_bullet)),
    ListItem(Paragraph("<b>¿Dónde?</b> Dirección completa con barrio y referencia.", style_bullet)),
    ListItem(Paragraph("<b>¿Quién es?</b> Nombre completo del paciente y número de cédula.", style_bullet)),
    ListItem(Paragraph("<b>¿Quién paga?</b> Si es el paciente o un familiar, nombre y teléfono de contacto.", style_bullet)),
], bulletType='bullet', start='•'))

story.append(Paragraph("4.2. Agendar en el sistema", style_h2))

story.append(step_block("1", "Click en el botón '+ Agendar cita'",
    "Lo encuentras arriba a la derecha en tu dashboard. Es verde/azul."))
story.append(step_block("2", "Selecciona el servicio",
    "Aparece una lista. Si no lo encuentras, búscalo por nombre. <b>Confirma con el paciente</b> antes de elegir."))
story.append(step_block("3", "Selecciona el profesional",
    "El sistema filtra automáticamente: si el servicio requiere médico, solo aparecen médicos. "
    "Si requiere enfermera, solo enfermeras. No te deja equivocarte."))
story.append(step_block("4", "Selecciona la fecha",
    "Aparece un calendario. Los días en gris no tienen disponibilidad. Los días en azul sí."))
story.append(step_block("5", "Elige el horario",
    "El sistema te muestra los <b>huecos reales</b> considerando la duración del servicio y las citas ya agendadas. "
    "Si el paciente quiere una hora que no aparece, no está disponible. Punto. No inventes."))
story.append(step_block("6", "Confirma paciente y dirección",
    "Si el paciente ya existe en el sistema, selecciónalo. Si es nuevo, créalo con todos los datos. "
    "La dirección <b>debe incluir barrio y referencia</b> (ej: 'Calle 100 #15-20, Chapinero, frente al Éxito')."))
story.append(step_block("7", "Agrega notas si hace falta",
    "Si el paciente tiene alguna condición especial, alergias, o indicaciones, ponlo aquí. "
    "El profesional lo ve antes de llegar."))
story.append(step_block("8", "Click en 'Crear cita'",
    "Te aparece un mensaje de éxito. La cita queda en estado <b>PENDIENTE</b>."))

story.append(PageBreak())

story.append(Paragraph("4.3. Revisa la cita recién creada", style_h2))
story.append(Paragraph(
    "Después de crear, te aparece en tu lista con los siguientes datos:",
    style_body
))

story.append(info_table([
    ["Hora", "Hora de inicio del servicio"],
    ["Servicio", "Lo que va a recibir el paciente"],
    ["Paciente", "Nombre del paciente"],
    ["Dirección", "Con barrio y referencia"],
    ["Teléfono", "Para que el profesional pueda llamar si se pierde"],
    ["PVP", "Precio total que paga el paciente"],
    ["Tu comisión", "Lo que te corresponde a ti"],
    ["Estado", "PENDIENTE hasta que confirmes"],
]))

story.append(Spacer(1, 0.3*cm))
story.append(callout_box(
    "Si necesitas <b>editar la cita</b> (cambiar hora, dirección, profesional) hazlo solo mientras "
    "esté en PENDIENTE. Después de confirmar, no se puede modificar — hay que cancelar y crear una nueva.",
    bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="✏️"
))

story.append(Paragraph("4.4. Si te equivocaste: cancelar la cita", style_h2))
story.append(Paragraph(
    "Si el paciente cancela por WhatsApp antes de la cita, o si metiste datos mal: "
    "abre la cita → click en 'Cancelar' → confirma. <b>Solo funciona si la cita está PENDIENTE o CONFIRMADA.</b> "
    "Si ya está EN CURSO o COMPLETADA, avísale al admin.",
    style_body
))
story.append(PageBreak())

# === 5. CONFIRMAR CITA ===
story.append(Paragraph("5. Cómo confirmar una cita", style_h1))
story.append(Paragraph(
    "Cuando el profesional te confirma por WhatsApp que puede hacer el servicio en la hora que agendaste, "
    "es el momento de confirmar la cita en el sistema.",
    style_body
))

story.append(Paragraph("¿Por qué es importante confirmar?", style_h2))
story.append(Paragraph(
    "Al confirmar, el sistema <b>congela el reparto de pago</b>. Es decir, queda registrado de manera "
    "inmutable cuánto le corresponde al profesional, cuánto a ti, y cuánto a SMD Vital. "
    "Si después cambian precios o reglas, esa cita no se ve afectada. Es tu seguridad.",
    style_body
))

story.append(Paragraph("El procedimiento", style_h2))
story.append(step_block("1", "Abre la cita",
    "Desde tu lista, click en la cita que quieres confirmar."))
story.append(step_block("2", "Verifica los datos",
    "Revisa una última vez: paciente, dirección, hora, servicio. Si todo está bien..."))
story.append(step_block("3", "Click en 'Confirmar cita'",
    "Te aparece un mensaje de confirmación. La cita pasa a estado <b>CONFIRMADA</b>."))
story.append(step_block("4", "Avisa al paciente por WhatsApp",
    "Manda un mensaje al paciente confirmando: 'Su cita de [servicio] quedó agendada para [fecha] a las [hora]. "
    "El profesional [nombre] lo visitará en [dirección]. Le enviaremos un recordatorio 2 horas antes.'"))

story.append(Spacer(1, 0.3*cm))
story.append(callout_box(
    "<b>Importante:</b> no confirmes si el profesional no te confirmó a ti primero. "
    "Si confirmas y luego el profesional no puede, tienes que cancelar y empezar de nuevo.",
    bg=COLOR_AMBER_BG, border=COLOR_ACCENT, icon="⚠️"
))
story.append(PageBreak())

# === 6. COMISIONES ===
story.append(Paragraph("6. Tus comisiones: cómo verlas y cobrarlas", style_h1))
story.append(Paragraph(
    "Esta es la parte que más te importa. El sistema te muestra exactamente cuánto has ganado, "
    "cuánto te deben, y cuánto ya tienes.",
    style_body
))

story.append(Paragraph("6.1. Los 3 estados de tu comisión", style_h2))

story.append(info_table([
    ["Por pagar (PENDING)", "El servicio ya se hizo, pero SMD Vital aún no te transfiere. Es lo que te deben."],
    ["Pagado · falta confirmar (PAID)", "SMD Vital ya te transfirió. Está esperando que confirmes que recibiste."],
    ["Recibido ✓ (ACKNOWLEDGED)", "Ya marcaste que recibiste. Es tuyo, en tu bolsillo."],
]))

story.append(Paragraph("6.2. ¿Cuándo me pagan?", style_h2))
story.append(Paragraph(
    "SMD Vital procesa los pagos cada <b>[día de la semana que te indique el admin]</b>. "
    "El admin revisa la lista de 'Pagado · falta confirmar' y agrupa las transferencias por persona. "
    "Te llega la transferencia y un comprobante. Luego confirmas en el sistema.",
    style_body
))

story.append(Paragraph("6.3. Ejemplo real", style_h2))
story.append(Paragraph(
    "<b>Lunes 5 de julio</b>: agendaste una cita de Signos Vitales. El sistema la congeló así:",
    style_body
))

story.append(info_table([
    ["Lo que paga el paciente (PVP)", "$100.000"],
    ["Comisión tuya (Asesor)", "$10.000"],
    ["Lo que gana la enfermera", "$55.000"],
    ["Lo que gana SMD Vital", "$35.000"],
], col_widths=(7*cm, 4*cm)))

story.append(Paragraph(
    "Tus <b>$10.000</b> de comisión aparecen en 'Por pagar'. Cuando SMD Vital te transfiera, "
    "pasa a 'Pagado · falta confirmar'. Y cuando tú confirmes, pasa a 'Recibido ✓'.",
    style_body
))
story.append(PageBreak())

# === 7. CONFIRMAR RECEPCIÓN ===
story.append(Paragraph("7. Confirmar recepción de pago", style_h1))
story.append(Paragraph(
    "SMD Vital te transfiere tu comisión. Te llega al número de cuenta que registraste. "
    "Una vez que verificas que el dinero está, lo confirmas en el sistema.",
    style_body
))

story.append(Paragraph("¿Por qué tengo que confirmar?", style_h2))
story.append(Paragraph(
    "Porque el sistema necesita saber que <b>realmente recibiste</b> el dinero. Esto protege a ambas partes: "
    "a ti te queda registro de que cobraste, y a SMD Vital le queda registro de que pagó. "
    "Si hay algún problema (transferencia rechazada, monto incorrecto), no confirmas y avisas al admin.",
    style_body
))

story.append(Paragraph("Procedimiento", style_h2))
story.append(step_block("1", "Revisa tu cuenta bancaria o Nequi/Daviplata",
    "Verifica que la transferencia llegó por el monto correcto."))
story.append(step_block("2", "Abre la app de SMD Vital",
    "Ve a la sección 'Mis comisiones'. La comisión debe aparecer en 'Pagado · falta confirmar'."))
story.append(step_block("3", "Click en 'Confirmar'",
    "El sistema te pregunta '¿Recibiste el pago?' → click en 'Sí, lo recibí'. Listo. Pasa a 'Recibido ✓'."))

story.append(Paragraph("Si NO recibiste el pago", style_h2))
story.append(Paragraph(
    "Si esperaste más de 3 días hábiles y no te llegó, o si te llegó un monto diferente, "
    "no confirmes. Click en 'No recibí' → escribe el motivo (ej: 'No ha llegado la transferencia', "
    "'Llegó monto incorrecto, me depositaron $5.000 en vez de $10.000') → el sistema marca la "
    "comisión como <b>EN DISPUTA</b> y el admin la revisa.",
    style_body
))
story.append(callout_box(
    "Nunca confirmes un pago que no recibiste. Es tu protección y la de SMD Vital. "
    "Si te equivocas, se puede reversar pero es más trabajo para todos.",
    bg=COLOR_DANGER, border=COLOR_DANGER, icon="🛑"
))
story.append(PageBreak())

# === 8. ERRORES COMUNES ===
story.append(Paragraph("8. Errores comunes y soluciones", style_h1))

story.append(Paragraph("8.1. No aparece disponibilidad para un profesional", style_h2))
story.append(Paragraph(
    "<b>Por qué pasa:</b> el profesional no marcó su disponibilidad para ese día, o ya tiene la agenda llena.<br/>"
    "<b>Qué hacer:</b> busca otro profesional que cubra el mismo servicio, o pídele al paciente otra fecha/hora. "
    "Nunca agendes en un horario que el sistema no muestra.",
    style_body
))

story.append(Paragraph("8.2. El paciente cancela a último momento", style_h2))
story.append(Paragraph(
    "<b>Si la cita aún no se hizo:</b> ábrela en el sistema y márcala como cancelada. "
    "Si la cita ya está CONFIRMADA, el sistema libera la comisión automáticamente. "
    "<b>Si ya se hizo el servicio pero el paciente cancela el pago:</b> avísale al admin inmediatamente, "
    "es un tema de cobro, no de agendamiento.",
    style_body
))

story.append(Paragraph("8.3. Agendé mal la cita (datos incorrectos)", style_h2))
story.append(Paragraph(
    "<b>Si está PENDIENTE:</b> edita directamente (cambiar hora, dirección, profesional).<br/>"
    "<b>Si está CONFIRMADA o superior:</b> no se puede editar. Cancélala y crea una nueva. "
    "Avisa al admin para que registre la razón.",
    style_body
))

story.append(Paragraph("8.4. El profesional no se presenta", style_h2))
story.append(Paragraph(
    "Es un tema del profesional, no tuyo. Pero documenta: anota la hora, lo que el paciente te dijo por WhatsApp, "
    "y avísale al admin. La cita queda como NO_SHOW en el sistema.",
    style_body
))

story.append(Paragraph("8.5. El paciente pregunta por algo fuera de tu alcance", style_h2))
story.append(Paragraph(
    "Quejas, emergencias médicas, recetas, resultados de laboratorio → <b>pásale al profesional</b> "
    "o al admin. Tú no diagnosticas, tú agendas. Si es una emergencia real, dile al paciente que llame a la línea 123.",
    style_body
))

story.append(PageBreak())

# =====================================================================
# PARTE 2 — PROFESIONAL (Doctor / Enfermera)
# =====================================================================
story.append(Paragraph("PARTE 2", ParagraphStyle('Part', fontSize=11, textColor=COLOR_MUTED, alignment=TA_CENTER, spaceAfter=2, fontName='Helvetica-Bold')))
story.append(Paragraph("Para el Profesional (Doctor / Enfermera)", ParagraphStyle('PartT', fontSize=22, textColor=COLOR_PRIMARY, alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold')))
story.append(Spacer(1, 0.5*cm))

# === 9. ROL ===
story.append(Paragraph("9. ¿Cuál es tu rol?", style_h1))
story.append(Paragraph(
    "Tú eres el profesional que <b>atiende al paciente en su casa</b>. Recibes el servicio agendado, "
    "lo realizas, registras lo que hiciste y cobras tu parte. Tu trabajo es 70% clínico, 30% sistema.",
    style_body
))
story.append(Paragraph("Tus responsabilidades principales son:", style_body))
story.append(ListFlowable([
    ListItem(Paragraph("<b>Revisar tu agenda</b> cada mañana para saber qué servicios tienes y dónde.", style_bullet)),
    ListItem(Paragraph("<b>Llegar a tiempo</b> a cada domicilio.", style_bullet)),
    ListItem(Paragraph("<b>Realizar el servicio</b> con calidad profesional y calidez humana.", style_bullet)),
    ListItem(Paragraph("<b>Registrar inicio y fin</b> en el sistema desde el celular del paciente (o el tuyo).", style_bullet)),
    ListItem(Paragraph("<b>Cobrar tu parte</b>: el sistema calcula automáticamente cuánto te corresponde. "
                       "Confirmas cuando recibes la transferencia de SMD Vital.", style_bullet)),
], bulletType='bullet', start='•'))

story.append(Spacer(1, 0.3*cm))
story.append(callout_box(
    "Tu pago depende de que el sistema tenga el servicio marcado como COMPLETADO. "
    "Si terminaste el servicio y no lo cerraste en el sistema, no se genera el pago. "
    "Punto. Por eso este paso es crítico.",
    bg=COLOR_GREEN_BG, border=COLOR_SECONDARY, icon="💰"
))
story.append(PageBreak())

# === 10. PRIMER DÍA ===
story.append(Paragraph("10. Tu primer día: acceso y dashboard", style_h1))
story.append(Paragraph(
    "El administrador te crea un usuario con tu email profesional. La primera vez que entres, "
    "te va a pedir cambiar la contraseña.",
    style_body
))

story.append(Paragraph("10.1. Tu pantalla principal", style_h2))
story.append(Paragraph(
    "Al entrar, lo primero que ves es tu <b>resumen financiero</b> en la parte de arriba:",
    style_body
))

story.append(info_table([
    ["Por pagar", "Servicios que ya completaste pero SMD Vital aún no te transfiere."],
    ["Pagado · por confirmar", "SMD Vital ya te transfirió. Falta que confirmes que recibiste."],
    ["Recibido total", "Todo lo que ya está en tu bolsillo."],
    ["En disputa", "Algún pago que reportaste como no recibido."],
]))

story.append(Paragraph("10.2. Tus servicios de hoy", style_h2))
story.append(Paragraph(
    "Es la sección más importante de tu día. Aquí ves, <b>en orden cronológico</b>, los servicios "
    "que tienes agendados hoy: hora, paciente, dirección, servicio, y al lado cuánto te corresponde a ti.",
    style_body
))

story.append(callout_box(
    "<b>Tip senior:</b> revisa tu agenda la noche anterior y planifica la ruta. "
    "Bogotá tiene tráfico feroz, no te confíes.",
    bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="🗺️"
))
story.append(PageBreak())

# === 11. FLUJO ===
story.append(Paragraph("11. El flujo del día a día", style_h1))
story.append(Paragraph(
    "Tu día se repite. Cinco pasos. Cinco minutos cada uno. No te saltas ninguno:",
    style_body
))

prof_flow = Table([
    ["1", "Revisas tu agenda", "Mañana o noche anterior: ves qué tienes hoy"],
    ["2", "Vas al domicilio", "Con todos los materiales necesarios"],
    ["3", "Abres la app al llegar", "Click en 'Iniciar' cuando estés con el paciente"],
    ["4", "Haces el servicio", "Con profesionalismo y calidez"],
    ["5", "Cierras la app al terminar", "Click en 'Completar' + diagnóstico + notas"],
    ["6", "Recibes tu pago", "Aparece en 'Pagado · por confirmar'"],
    ["7", "Confirmas recepción", "1 tap → pasa a 'Recibido total'"],
], colWidths=[1*cm, 4.5*cm, 10.5*cm])
prof_flow.setStyle(TableStyle([
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (0, -1), COLOR_SECONDARY),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#ECFDF5')),
    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, COLOR_LIGHT_BG]),
    ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#CBD5E1')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(prof_flow)
story.append(PageBreak())

# === 12. REVISAR AGENDA ===
story.append(Paragraph("12. Antes de salir: revisa tu agenda del día", style_h1))
story.append(Paragraph(
    "Esta es la única manera de saber qué vas a hacer hoy, en qué orden, y a dónde ir.",
    style_body
))

story.append(Paragraph("12.1. Qué información tienes disponible", style_h2))
story.append(Paragraph(
    "Por cada cita de hoy, el sistema te muestra:",
    style_body
))

story.append(info_table([
    ["Hora de inicio", "A qué hora exacta empieza el servicio"],
    ["Servicio", "Qué tienes que hacer (sueroterapia, signos vitales, etc.)"],
    ["Paciente", "Nombre completo"],
    ["Dirección", "Con barrio y referencia"],
    ["Tu pago", "Cuánto vas a ganar por ese servicio"],
    ["Notas del agente", "Alergias, condiciones especiales, indicaciones"],
]))

story.append(Paragraph("12.2. Llamar al paciente antes de salir", style_h2))
story.append(Paragraph(
    "El sistema te muestra el teléfono del paciente. <b>Recomendado:</b> 30 minutos antes de llegar, "
    "llámalo para confirmar que está, que tiene los materiales necesarios, y preguntarle la mejor ruta. "
    "Esto evita viajes en vano.",
    style_body
))
story.append(PageBreak())

# === 13. INICIAR SERVICIO ===
story.append(Paragraph("13. En casa del paciente: iniciar el servicio", style_h1))

story.append(Paragraph(
    "Cuando llegas al domicilio y estás con el paciente, es momento de iniciar el servicio en el sistema. "
    "Esto es importante porque marca el inicio formal de tu turno y dispara la cuenta del tiempo.",
    style_body
))

story.append(Paragraph("Procedimiento", style_h2))
story.append(step_block("1", "Verifica que estás en el domicilio correcto",
    "Confirma con el paciente su nombre y cédula."))
story.append(step_block("2", "Abre la cita en la app",
    "Click en la cita correspondiente. Verás el botón 'Iniciar servicio'."))
story.append(step_block("3", "Click en 'Iniciar'",
    "La cita pasa a estado <b>EN CURSO</b>. El reloj empieza a correr."))
story.append(step_block("4", "Realiza el servicio",
    "Ahora sí, con toda tu profesionalismo. El paciente ve que el servicio está 'oficial'."))

story.append(Spacer(1, 0.3*cm))
story.append(callout_box(
    "Si olvidaste marcar el inicio, no es grave. Puedes iniciar y completar en el mismo paso. "
    "Pero la próxima vez intenta hacerlo apenas llegues. Es tu respaldo si hay alguna queja.",
    bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="⏱️"
))
story.append(PageBreak())

# === 14. COMPLETAR ===
story.append(Paragraph("14. Al terminar: cómo cerrar y cobrar", style_h1))
story.append(Paragraph(
    "Este es <b>el paso más importante de tu día</b>. Es el que dispara tu pago. Si no lo haces, no cobras.",
    style_body
))

story.append(Paragraph("Procedimiento paso a paso", style_h2))
story.append(step_block("1", "Una vez terminado el servicio, abre la cita",
    "En tu app, click en la cita que acabas de hacer."))
story.append(step_block("2", "Click en 'Completar servicio'",
    "Te aparece un formulario con 3 campos para llenar."))
story.append(step_block("3", "Llena el diagnóstico (opcional pero recomendado)",
    "Una nota breve de lo que hiciste, lo que encontraste, cualquier observación. "
    "Es tu registro clínico y también tu respaldo."))
story.append(step_block("4", "Llena la prescripción si aplica",
    "Si diste alguna indicación médica, medicación recomendada, o cuidados, ponlo aquí. "
    "El paciente lo ve después."))
story.append(step_block("5", "Agrega notas internas si quieres",
    "Esto lo ve SMD Vital, no el paciente. Pon cualquier cosa relevante: 'Paciente nervioso', "
    "'Familiar ausente', 'Tuve que esperar 20 min'."))
story.append(step_block("6", "Click en 'Confirmar y completar'",
    "<b>¡Listo!</b> La cita pasa a estado <b>COMPLETADA</b>. "
    "El sistema genera automáticamente tu pago pendiente."))

story.append(Spacer(1, 0.3*cm))
story.append(callout_box(
    "Si te equivocas al completar (datos mal, era otra cita), avísale al admin <b>el mismo día</b>. "
    "Después de 24 horas es muy difícil reversarlo porque ya se generaron los pagos.",
    bg=COLOR_AMBER_BG, border=COLOR_ACCENT, icon="⚠️"
))
story.append(PageBreak())

# === 15. GANANCIAS ===
story.append(Paragraph("15. Tus ganancias: cómo verlas y cobrarlas", style_h1))

story.append(Paragraph("15.1. Anatomía de tu pago", style_h2))
story.append(Paragraph(
    "El sistema desglosa automáticamente cuánto gana cada parte. Veamos un ejemplo real:",
    style_body
))
story.append(Paragraph(
    "<b>Servicio:</b> Sueroterapia a domicilio · <b>PVP:</b> $185.000",
    style_body
))

story.append(info_table([
    ["Lo que paga el paciente", "$185.000"],
    ["Lo que gana la enfermera (tú)", "$127.500"],
    ["Lo que gana el asesor (call center)", "$12.500"],
    ["Lo que gana SMD Vital", "$45.000"],
], col_widths=(7*cm, 4*cm)))

story.append(Paragraph("15.2. ¿Cuándo llega tu dinero?", style_h2))
story.append(Paragraph(
    "SMD Vital procesa pagos <b>[frecuencia que indique el admin: semanal/quincenal/mensual]</b>. "
    "El admin revisa los servicios completados, te transfiere, y la app te avisa que tienes un pago pendiente de confirmar.",
    style_body
))

story.append(Paragraph("15.3. Confirmar que recibiste el pago", style_h2))
story.append(step_block("1", "Te llega una notificación",
    "La app te avisa: 'Tienes un pago nuevo por $XXX.XXX'"))
story.append(step_block("2", "Revisa tu cuenta",
    "Verifica que la transferencia esté en tu banco o Nequi/Daviplata"))
story.append(step_block("3", "Click en 'Confirmar recepción'",
    "En la sección 'Pagado · por confirmar'. Un tap y se mueve a 'Recibido total'."))

story.append(Paragraph("15.4. Si NO recibiste el pago", style_h2))
story.append(Paragraph(
    "Click en 'No recibí' → explica qué pasó (transferencia no llegó, monto incorrecto, "
    "cuenta bloqueada, etc.) → el sistema marca como <b>EN DISPUTA</b> y el admin lo resuelve. "
    "Esto protege a las dos partes: tú no confirmas algo que no recibiste, y SMD Vital tiene un "
    "registro del problema.",
    style_body
))
story.append(PageBreak())

# === 16. REGLAS ===
story.append(Paragraph("16. Reglas importantes", style_h1))

story.append(Paragraph("16.1. Lo que SÍ debes hacer", style_h2))
story.append(ListFlowable([
    ListItem(Paragraph("Llegar <b>puntual</b> a cada servicio. La puntualidad es la base de la confianza.", style_bullet)),
    ListItem(Paragraph("Revisar la <b>dirección y referencias</b> antes de salir. Bogotá es grande.", style_bullet)),
    ListItem(Paragraph("Llevar <b>todos los materiales</b> necesarios para el servicio.", style_bullet)),
    ListItem(Paragraph("Tratar al paciente y a su familia con <b>respeto y calidez</b>. Eres la cara de SMD Vital.", style_bullet)),
    ListItem(Paragraph("<b>Completar la cita en el sistema</b> el mismo día. Sin esto, no hay pago.", style_bullet)),
    ListItem(Paragraph("<b>Confirmar pagos</b> que recibes. Si no confirmas, se acumulan como pendientes.", style_bullet)),
    ListItem(Paragraph("Si algo sale mal (paciente agresivo, accidente, material faltante), "
                       "<b>documentar en notas</b> y avisar al admin.", style_bullet)),
], bulletType='bullet', start='✓', bulletColor=COLOR_SECONDARY))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("16.2. Lo que NO debes hacer", style_h2))
story.append(ListFlowable([
    ListItem(Paragraph("<b>No aceptar pagos directos</b> del paciente. Todo va por SMD Vital. Si el paciente "
                       "te paga en mano, devuélvelo y dile que pague por los canales oficiales.", style_bullet)),
    ListItem(Paragraph("<b>No agendar</b> servicios por tu cuenta. Eso es trabajo del agente. "
                       "Si un paciente te pide algo extra, dile que llame al call center.", style_bullet)),
    ListItem(Paragraph("<b>No compartir tus credenciales</b> con nadie. Son tuyas, personales e intransferibles.", style_bullet)),
    ListItem(Paragraph("<b>No modificar</b> el reparto de pago. El sistema lo calcula automáticamente. "
                       "Si crees que hay un error, avísale al admin.", style_bullet)),
    ListItem(Paragraph("<b>No dar diagnósticos</b> por WhatsApp. El paciente te llama, pero las decisiones "
                       "clínicas son en persona.", style_bullet)),
], bulletType='bullet', start='✗', bulletColor=COLOR_DANGER))

story.append(PageBreak())

# =====================================================================
# ANEXOS
# =====================================================================
story.append(Paragraph("Anexos", ParagraphStyle('Part', fontSize=22, textColor=COLOR_PRIMARY, alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold')))
story.append(Spacer(1, 0.5*cm))

# === ANEXO A ===
story.append(Paragraph("Anexo A · Glosario de estados de cita", style_h1))
story.append(Paragraph(
    "Todas las citas pasan por estos estados en orden. Saber en qué estado está cada cita "
    "te ayuda a saber qué hacer:",
    style_body
))

states_table = Table([
    ["Estado", "Significado", "¿Qué hacer?"],
    ["PENDIENTE", "Acabas de crear la cita. Aún no se confirmó.", "Espera a que el profesional confirme, o edita si hay cambios."],
    ["CONFIRMADA", "El profesional aceptó. El pago ya está congelado.", "Espera el día del servicio. Ya no se puede editar."],
    ["EN CURSO", "El profesional llegó e inició el servicio.", "El profesional está trabajando. No hay acción tuya."],
    ["COMPLETADA", "El servicio terminó. Se generaron los pagos.", "Espera a SMD Vital procese el pago. Si eres profesional, ya puedes ver tu pago."],
    ["RECONCILIADA", "Todos cobraron y confirmaron.", "Cierre contable. Nada más que hacer."],
    ["CANCELADA", "Se canceló antes del servicio.", "No hay pago. Liberar la comisión del agente."],
    ["NO SHOW", "El paciente no se presentó.", "Documentar y avisar al admin. No se paga a nadie."],
], colWidths=[3*cm, 5.5*cm, 7.5*cm])
states_table.setStyle(TableStyle([
    ('FONTSIZE', (0, 0), (-1, -1), 9.5),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('TEXTCOLOR', (0, 0), (0, -1), COLOR_PRIMARY),
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#EFF6FF')),
    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, COLOR_LIGHT_BG]),
    ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#CBD5E1')),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(states_table)

story.append(Spacer(1, 0.5*cm))

# === ANEXO B ===
story.append(Paragraph("Anexo B · Contacto y soporte", style_h1))
story.append(Paragraph(
    "Si tienes una duda, un problema con el sistema, o una situación que no sabes cómo resolver, "
    "estos son tus canales de ayuda:",
    style_body
))

story.append(info_table([
    ["Soporte del sistema", "WhatsApp: 304 291 2564"],
    ["Email", "soporte@smdvitalbogota.com"],
    ["Sitio web", "smdvitalbogota.com"],
    ["Alianza", "medicexpress.com.co"],
    ["Emergencias médicas", "Línea 123 (no es SMD Vital)"],
    ["Tu administrador", "El que te creó el usuario. Tenlo siempre en tus contactos."],
]))

story.append(Spacer(1, 0.5*cm))
story.append(callout_box(
    "Este manual es un documento vivo. Si tienes una sugerencia para mejorarlo, o encontraste "
    "algo que no se entiende, avísale al administrador. Tu experiencia nos ayuda a todos.",
    bg=COLOR_GREEN_BG, border=COLOR_SECONDARY, icon="💡"
))

# ============================================================
# CONSTRUIR PDF
# ============================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        # La portada no tiene número
        pass

doc = SimpleDocTemplate(
    str(OUTPUT_PATH),
    pagesize=A4,
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title="Manual de Operaciones SMD Vital",
    author="SMD Vital",
)

# Aplicar portada + headers/footers para el resto
def first_page(canv, doc):
    """Renderiza la portada. Al terminar, fuerza el fin de página para que
    el story empiece en una página nueva."""
    cover_page(canv, doc)
    canv.showPage()

def later_pages(canv, doc):
    header_footer(canv, doc)

# Construir con páginas diferenciadas
doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)

print(f"✅ PDF generado: {OUTPUT_PATH}")
print(f"   Tamaño: {OUTPUT_PATH.stat().st_size / 1024:.1f} KB")
