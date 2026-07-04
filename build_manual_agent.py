"""
build_manual_agent.py
Genera Manual_SMD_Vital_Agente.pdf — solo contenido del AGENTE.
"""

from pathlib import Path
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

from manual_styles import (
    S, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_ACCENT, COLOR_DANGER, COLOR_GREEN_BG,
    COLOR_BLUE_BG, COLOR_AMBER_BG, COLOR_MUTED, COLOR_TEXT, COLOR_LIGHT_BG, HexColor,
    callout_box, step_block, info_table, data_table, bullets,
    make_cover, make_header_footer, white
)
from reportlab.lib.enums import TA_CENTER

OUTPUT_PATH = Path("docs/manuales/Manual_SMD_Vital_Agente.pdf")
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)


def build_story():
    s = []

    # ==================== TOC ====================
    s.append(Paragraph("Tabla de contenidos", S['toc_title']))
    s.append(Spacer(1, 0.3*cm))

    toc_items = [
        ("1. ¿Cuál es tu rol?", "3"),
        ("2. Tu primer día: acceso y dashboard", "4"),
        ("3. El flujo del día a día", "5"),
        ("4. Paso a paso: agendar una cita por WhatsApp", "6"),
        ("       4.1. Antes de agendar: los 5 datos clave", "6"),
        ("       4.2. Agendar en el sistema (8 pasos)", "7"),
        ("       4.3. La cita recién creada", "8"),
        ("       4.4. Si te equivocaste: cómo cancelar", "8"),
        ("5. Cómo confirmar una cita", "9"),
        ("6. Tus comisiones: cómo verlas y cobrarlas", "10"),
        ("7. Confirmar recepción de pago", "11"),
        ("8. Errores comunes y soluciones", "12"),
        ("9. Reglas importantes", "13"),
    ]
    s.append(Paragraph("Para el AGENTE (Call Center / Asesor)", S['toc_section']))
    for title, page in toc_items:
        row = data_table([title, page], [], [14*cm, 1.5*cm])
        # Override style for a thin TOC row
        from reportlab.platypus import Table, TableStyle
        t = Table([[Paragraph(title, S['toc_item']), Paragraph(f"<b>{page}</b>", S['toc_item'])]],
                  colWidths=[14*cm, 1.5*cm])
        t.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, -1), 0.3, HexColor('#E2E8F0')),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        s.append(t)

    s.append(PageBreak())

    # ==================== 1. ROL ====================
    s.append(Paragraph("1. ¿Cuál es tu rol?", S['h1']))
    s.append(Paragraph(
        "Tú eres el <b>primer contacto</b> con el paciente. Cuando alguien escribe por WhatsApp "
        "pidiendo un servicio a domicilio, tú lo recibes, agendas el profesional correcto y te "
        "aseguras de que la cita quede bien registrada en el sistema.",
        S['body']
    ))
    s.append(Paragraph("Tus responsabilidades principales son:", S['body']))
    s.append(bullets([
        "<b>Recibir</b> el WhatsApp del paciente y entender qué necesita.",
        "<b>Verificar</b> disponibilidad real del profesional (médico o enfermera) en la fecha y hora que pide el paciente.",
        "<b>Agendar</b> la cita en el sistema con todos los datos correctos: dirección, teléfono, servicio.",
        "<b>Confirmar</b> la cita una vez que el profesional acepte.",
        "<b>Hacer seguimiento</b> a tus comisiones y confirmar cuando recibas el pago.",
    ]))
    s.append(Spacer(1, 0.2*cm))
    s.append(callout_box(
        "Cada cita que agendas te genera una comisión. El sistema la calcula automáticamente. "
        "Si no agendas en el sistema, no cobras. Así de simple.",
        bg=COLOR_GREEN_BG, border=COLOR_SECONDARY, icon="💰"
    ))
    s.append(PageBreak())

    # ==================== 2. PRIMER DÍA ====================
    s.append(Paragraph("2. Tu primer día: acceso y dashboard", S['h1']))
    s.append(Paragraph(
        "Cuando te contratamos, el administrador te crea un usuario con tus credenciales. Vas a "
        "recibir un correo con tu email y una contraseña temporal.",
        S['body']
    ))

    s.append(Paragraph("2.1. Primer ingreso (cambiar contraseña)", S['h2']))
    s.append(step_block("1", "Abre la app de SMD Vital",
        "En tu computador o celular. La dirección te la pasa el administrador."))
    s.append(step_block("2", "Ingresa con tu email y contraseña temporal",
        "Te va a pedir inmediatamente cambiarla por una nueva. Pon una que puedas recordar."))
    s.append(step_block("3", "Confirma tu número de WhatsApp",
        "Es el mismo número donde recibes los mensajes de los pacientes. Si no es el correcto, avísale al admin."))

    s.append(Paragraph("2.2. Tu pantalla principal (Dashboard)", S['h2']))
    s.append(Paragraph("Al entrar, ves <b>3 secciones</b> en la parte de arriba:", S['body']))
    s.append(info_table([
        ("Por pagar", "Comisiones que ya se cobraron del paciente pero SMD Vital aún no te ha transferido."),
        ("Ganado (total)", "Todo lo que ya está pagado o recibido. Es tu acumulado real."),
        ("Confirmado", "Lo que está en tu bolsillo. Ya marcaste que recibiste la transferencia."),
    ]))
    s.append(Spacer(1, 0.2*cm))
    s.append(Paragraph(
        "Más abajo tienes <b>Citas que agendé hoy</b>: la lista de servicios que agendaste para el día de "
        "hoy. Y debajo, <b>Mis comisiones</b>: el detalle de cada servicio, cuánto te corresponde, y en qué "
        "estado está el pago.",
        S['body']
    ))
    s.append(PageBreak())

    # ==================== 3. FLUJO ====================
    s.append(Paragraph("3. El flujo del día a día", S['h1']))
    s.append(Paragraph("Tu día se repite. Una y otra vez. Domina este ciclo y no te vas a perder:",
                       S['body']))

    s.append(data_table(
        ["#", "Qué pasa", "Qué haces tú"],
        [
            ["1", "Suena WhatsApp", "Paciente nuevo pide un servicio"],
            ["2", "Entiendes qué necesita", "Signos vitales, inyección, suero, etc."],
            ["3", "Revisas disponibilidad", "Botón 'Agendar cita' → ves huecos reales"],
            ["4", "Creas la cita", "Llenas los datos y envías"],
            ["5", "Confirmas la cita", "Cuando el profesional acepte"],
            ["6", "Haces seguimiento", "Si cancela, edita; si cambia, reagenda"],
            ["7", "Cobras tu comisión", "Aparece en 'Por pagar' cuando SMD Vital procesa"],
            ["8", "Confirmas que recibiste", "1 tap → pasa a 'Confirmado'"],
        ],
        [1*cm, 5*cm, 10*cm]
    ))
    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "<b>Regla de oro:</b> nunca agendes por WhatsApp directamente. Siempre usa el sistema. "
        "Lo que no está en el sistema, no existe. Lo que no existe, no se cobra.",
        bg=COLOR_AMBER_BG, border=COLOR_ACCENT, icon="⚠️"
    ))
    s.append(PageBreak())

    # ==================== 4. AGENDAR ====================
    s.append(Paragraph("4. Paso a paso: agendar una cita por WhatsApp", S['h1']))
    s.append(Paragraph("Este es el momento crítico de tu día. Lo haces muchas veces. Hazlo bien.",
                       S['body']))

    s.append(Paragraph("4.1. Antes de agendar: los 5 datos clave", S['h2']))
    s.append(Paragraph(
        "Por WhatsApp necesitas confirmar <b>5 datos</b> con el paciente antes de abrir la app:",
        S['body']
    ))
    s.append(bullets([
        "<b>¿Qué servicio necesita?</b> Signos vitales, inyección, sutura, suero, etc.",
        "<b>¿Cuándo?</b> Fecha y hora aproximada. No agendes para hoy si ya son más de las 5pm.",
        "<b>¿Dónde?</b> Dirección completa con barrio y referencia.",
        "<b>¿Quién es?</b> Nombre completo del paciente y número de cédula.",
        "<b>¿Quién paga?</b> Si es el paciente o un familiar: nombre y teléfono de contacto.",
    ]))
    s.append(Spacer(1, 0.2*cm))
    s.append(callout_box(
        "Tómate 2 minutos en WhatsApp para confirmar estos datos. <b>5 minutos ahorrados en la "
        "agenda evita 30 minutos de lío después.</b>",
        bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="💡"
    ))
    s.append(PageBreak())

    s.append(Paragraph("4.2. Agendar en el sistema (8 pasos)", S['h2']))
    s.append(step_block("1", "Click en '+ Agendar cita'",
        "Lo encuentras arriba a la derecha en tu dashboard. Es verde/azul."))
    s.append(step_block("2", "Selecciona el servicio",
        "Aparece una lista. Si no lo encuentras, búscalo por nombre. <b>Confirma con el paciente</b> antes de elegir."))
    s.append(step_block("3", "Selecciona el profesional",
        "El sistema filtra automáticamente: si el servicio requiere médico, solo aparecen médicos. "
        "Si requiere enfermera, solo enfermeras. No te deja equivocarte."))
    s.append(step_block("4", "Selecciona la fecha",
        "Aparece un calendario. Los días en gris no tienen disponibilidad. Los días en azul sí."))
    s.append(step_block("5", "Elige el horario",
        "El sistema te muestra los <b>huecos reales</b> considerando la duración del servicio y las "
        "citas ya agendadas. Si el paciente quiere una hora que no aparece, no está disponible. Punto."))
    s.append(step_block("6", "Confirma paciente y dirección",
        "Si el paciente ya existe, selecciónalo. Si es nuevo, créalo con todos los datos. La "
        "dirección <b>debe incluir barrio y referencia</b> (ej: 'Calle 100 #15-20, Chapinero, frente al Éxito')."))
    s.append(step_block("7", "Agrega notas si hace falta",
        "Si el paciente tiene alguna condición especial, alergias, o indicaciones, ponlo aquí. "
        "El profesional lo ve antes de llegar."))
    s.append(step_block("8", "Click en 'Crear cita'",
        "Te aparece un mensaje de éxito. La cita queda en estado <b>PENDIENTE</b>."))
    s.append(PageBreak())

    s.append(Paragraph("4.3. La cita recién creada", S['h2']))
    s.append(Paragraph("Después de crear, te aparece en tu lista con los siguientes datos:", S['body']))
    s.append(info_table([
        ("Hora", "Hora de inicio del servicio"),
        ("Servicio", "Lo que va a recibir el paciente"),
        ("Paciente", "Nombre del paciente"),
        ("Dirección", "Con barrio y referencia"),
        ("Teléfono", "Para que el profesional pueda llamar si se pierde"),
        ("PVP", "Precio total que paga el paciente"),
        ("Tu comisión", "Lo que te corresponde a ti"),
        ("Estado", "PENDIENTE hasta que confirmes"),
    ]))
    s.append(Spacer(1, 0.2*cm))
    s.append(callout_box(
        "Si necesitas <b>editar la cita</b> (cambiar hora, dirección, profesional) hazlo solo "
        "mientras esté en PENDIENTE. Después de confirmar, no se puede modificar — hay que "
        "cancelar y crear una nueva.",
        bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="✏️"
    ))

    s.append(Paragraph("4.4. Si te equivocaste: cómo cancelar", S['h2']))
    s.append(Paragraph(
        "Si el paciente cancela por WhatsApp antes de la cita, o si metiste datos mal: "
        "abre la cita → click en 'Cancelar' → confirma. <b>Solo funciona si la cita está "
        "PENDIENTE o CONFIRMADA.</b> Si ya está EN CURSO o COMPLETADA, avísale al admin.",
        S['body']
    ))
    s.append(PageBreak())

    # ==================== 5. CONFIRMAR ====================
    s.append(Paragraph("5. Cómo confirmar una cita", S['h1']))
    s.append(Paragraph(
        "Cuando el profesional te confirma por WhatsApp que puede hacer el servicio en la hora "
        "que agendaste, es el momento de confirmar la cita en el sistema.",
        S['body']
    ))
    s.append(Paragraph("¿Por qué es importante confirmar?", S['h2']))
    s.append(Paragraph(
        "Al confirmar, el sistema <b>congela el reparto de pago</b>. Es decir, queda registrado "
        "de manera inmutable cuánto le corresponde al profesional, cuánto a ti, y cuánto a SMD Vital. "
        "Si después cambian precios o reglas, esa cita no se ve afectada. Es tu seguridad.",
        S['body']
    ))
    s.append(Paragraph("El procedimiento", S['h2']))
    s.append(step_block("1", "Abre la cita",
        "Desde tu lista, click en la cita que quieres confirmar."))
    s.append(step_block("2", "Verifica los datos",
        "Revisa una última vez: paciente, dirección, hora, servicio. Si todo está bien..."))
    s.append(step_block("3", "Click en 'Confirmar cita'",
        "Te aparece un mensaje de confirmación. La cita pasa a estado <b>CONFIRMADA</b>."))
    s.append(step_block("4", "Avisa al paciente por WhatsApp",
        "Manda un mensaje confirmando: 'Su cita de [servicio] quedó agendada para [fecha] a las [hora]. "
        "El profesional [nombre] lo visitará en [dirección]. Le enviaremos un recordatorio 2 horas antes.'"))
    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "<b>Importante:</b> no confirmes si el profesional no te confirmó a ti primero. "
        "Si confirmas y luego el profesional no puede, tienes que cancelar y empezar de nuevo.",
        bg=COLOR_AMBER_BG, border=COLOR_ACCENT, icon="⚠️"
    ))
    s.append(PageBreak())

    # ==================== 6. COMISIONES ====================
    s.append(Paragraph("6. Tus comisiones: cómo verlas y cobrarlas", S['h1']))
    s.append(Paragraph(
        "Esta es la parte que más te importa. El sistema te muestra exactamente cuánto has ganado, "
        "cuánto te deben, y cuánto ya tienes.",
        S['body']
    ))

    s.append(Paragraph("6.1. Los 3 estados de tu comisión", S['h2']))
    s.append(info_table([
        ("Por pagar (PENDING)", "El servicio ya se hizo, pero SMD Vital aún no te transfiere. Es lo que te deben."),
        ("Pagado · falta confirmar (PAID)", "SMD Vital ya te transfirió. Está esperando que confirmes que recibiste."),
        ("Recibido ✓ (ACKNOWLEDGED)", "Ya marcaste que recibiste. Es tuyo, en tu bolsillo."),
    ]))

    s.append(Paragraph("6.2. ¿Cuándo me pagan?", S['h2']))
    s.append(Paragraph(
        "SMD Vital procesa los pagos cada <b>[día de la semana que te indique el admin]</b>. "
        "El admin revisa la lista de 'Pagado · falta confirmar' y agrupa las transferencias por persona. "
        "Te llega la transferencia y un comprobante. Luego confirmas en el sistema.",
        S['body']
    ))

    s.append(Paragraph("6.3. Ejemplo real", S['h2']))
    s.append(Paragraph(
        "<b>Lunes 5 de julio</b>: agendaste una cita de Signos Vitales. El sistema la congeló así:",
        S['body']
    ))
    s.append(info_table([
        ("Lo que paga el paciente (PVP)", "$100.000"),
        ("Comisión tuya (Asesor)", "$10.000"),
        ("Lo que gana la enfermera", "$55.000"),
        ("Lo que gana SMD Vital", "$35.000"),
    ], col_widths=(8*cm, 4*cm)))
    s.append(Spacer(1, 0.2*cm))
    s.append(Paragraph(
        "Tus <b>$10.000</b> de comisión aparecen en 'Por pagar'. Cuando SMD Vital te transfiera, "
        "pasa a 'Pagado · falta confirmar'. Y cuando tú confirmes, pasa a 'Recibido ✓'.",
        S['body']
    ))
    s.append(PageBreak())

    # ==================== 7. CONFIRMAR RECEPCIÓN ====================
    s.append(Paragraph("7. Confirmar recepción de pago", S['h1']))
    s.append(Paragraph(
        "SMD Vital te transfiere tu comisión. Te llega al número de cuenta que registraste. "
        "Una vez que verificas que el dinero está, lo confirmas en el sistema.",
        S['body']
    ))

    s.append(Paragraph("¿Por qué tengo que confirmar?", S['h2']))
    s.append(Paragraph(
        "Porque el sistema necesita saber que <b>realmente recibiste</b> el dinero. Esto protege a "
        "ambas partes: a ti te queda registro de que cobraste, y a SMD Vital le queda registro de "
        "que pagó. Si hay algún problema (transferencia rechazada, monto incorrecto), no confirmas "
        "y avisas al admin.",
        S['body']
    ))

    s.append(Paragraph("Procedimiento", S['h2']))
    s.append(step_block("1", "Revisa tu cuenta bancaria o Nequi/Daviplata",
        "Verifica que la transferencia llegó por el monto correcto."))
    s.append(step_block("2", "Abre la app de SMD Vital",
        "Ve a la sección 'Mis comisiones'. La comisión debe aparecer en 'Pagado · falta confirmar'."))
    s.append(step_block("3", "Click en 'Confirmar'",
        "El sistema te pregunta '¿Recibiste el pago?' → click en 'Sí, lo recibí'. Listo. Pasa a 'Recibido ✓'."))

    s.append(Paragraph("Si NO recibiste el pago", S['h2']))
    s.append(Paragraph(
        "Si esperaste más de 3 días hábiles y no te llegó, o si te llegó un monto diferente, "
        "no confirmes. Click en 'No recibí' → escribe el motivo (ej: 'No ha llegado la transferencia', "
        "'Llegó monto incorrecto, me depositaron $5.000 en vez de $10.000') → el sistema marca la "
        "comisión como <b>EN DISPUTA</b> y el admin la revisa.",
        S['body']
    ))
    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "Nunca confirmes un pago que no recibiste. Es tu protección y la de SMD Vital.",
        bg=COLOR_DANGER, border=COLOR_DANGER, icon="🛑"
    ))
    s.append(PageBreak())

    # ==================== 8. ERRORES ====================
    s.append(Paragraph("8. Errores comunes y soluciones", S['h1']))

    s.append(Paragraph("8.1. No aparece disponibilidad para un profesional", S['h2']))
    s.append(Paragraph(
        "<b>Por qué pasa:</b> el profesional no marcó su disponibilidad para ese día, o ya tiene la "
        "agenda llena.<br/>"
        "<b>Qué hacer:</b> busca otro profesional que cubra el mismo servicio, o pídele al paciente "
        "otra fecha/hora. Nunca agendes en un horario que el sistema no muestra.",
        S['body']
    ))

    s.append(Paragraph("8.2. El paciente cancela a último momento", S['h2']))
    s.append(Paragraph(
        "<b>Si la cita aún no se hizo:</b> ábrela en el sistema y márcala como cancelada. Si la "
        "cita ya está CONFIRMADA, el sistema libera la comisión automáticamente.<br/>"
        "<b>Si ya se hizo el servicio pero el paciente cancela el pago:</b> avísale al admin "
        "inmediatamente, es un tema de cobro, no de agendamiento.",
        S['body']
    ))

    s.append(Paragraph("8.3. Agendé mal la cita (datos incorrectos)", S['h2']))
    s.append(Paragraph(
        "<b>Si está PENDIENTE:</b> edita directamente (cambiar hora, dirección, profesional).<br/>"
        "<b>Si está CONFIRMADA o superior:</b> no se puede editar. Cancélala y crea una nueva. "
        "Avisa al admin para que registre la razón.",
        S['body']
    ))

    s.append(Paragraph("8.4. El profesional no se presenta", S['h2']))
    s.append(Paragraph(
        "Es un tema del profesional, no tuyo. Pero documenta: anota la hora, lo que el paciente te "
        "dijo por WhatsApp, y avísale al admin. La cita queda como NO_SHOW en el sistema.",
        S['body']
    ))

    s.append(Paragraph("8.5. El paciente pregunta por algo fuera de tu alcance", S['h2']))
    s.append(Paragraph(
        "Quejas, emergencias médicas, recetas, resultados de laboratorio → <b>pásale al profesional</b> "
        "o al admin. Tú no diagnosticas, tú agendas. Si es una emergencia real, dile al paciente que "
        "llame a la línea 123.",
        S['body']
    ))
    s.append(PageBreak())

    # ==================== 9. REGLAS ====================
    s.append(Paragraph("9. Reglas importantes", S['h1']))

    s.append(Paragraph("9.1. Lo que SÍ debes hacer", S['h2']))
    s.append(bullets([
        "Llegar <b>puntual</b> a tus turnos de call center.",
        "Revisar <b>tus comisiones</b> al menos una vez al día.",
        "Tratar al paciente con <b>respeto y empatía</b>. Eres la cara de SMD Vital.",
        "<b>Confirmar citas</b> solo cuando el profesional te confirmó a ti primero.",
        "<b>Documentar</b> cualquier anomalía en las notas de la cita.",
        "Si algo te queda grande, <b>escalar al admin</b>. No improvises.",
    ], marker='✓', marker_color=COLOR_SECONDARY))

    s.append(Spacer(1, 0.3*cm))
    s.append(Paragraph("9.2. Lo que NO debes hacer", S['h2']))
    s.append(bullets([
        "<b>No agendar</b> por WhatsApp sin usar el sistema. Lo que no está en el sistema no existe.",
        "<b>No compartir</b> tus credenciales con nadie. Son tuyas, personales e intransferibles.",
        "<b>No aceptar pagos</b> del paciente. Todo va por SMD Vital.",
        "<b>No diagnosticar</b> ni dar consejos médicos. Eso es trabajo del profesional.",
        "<b>No modificar</b> el reparto de pago. El sistema lo calcula automáticamente.",
        "<b>No confirmar</b> pagos que no has recibido. Marca como 'No recibí' y avisa al admin.",
    ], marker='✗', marker_color=COLOR_DANGER))

    s.append(PageBreak())
    s.append(Paragraph("Soporte y contacto", S['h1']))
    s.append(info_table([
        ("Soporte del sistema", "WhatsApp: 304 291 2564"),
        ("Email", "soporte@smdvitalbogota.com"),
        ("Sitio web", "smdvitalbogota.com"),
        ("Alianza", "medicexpress.com.co"),
        ("Emergencias médicas", "Línea 123 (no es SMD Vital)"),
        ("Tu administrador", "El que te creó el usuario. Tenlo siempre en tus contactos."),
    ]))
    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "Este manual es un documento vivo. Si tienes una sugerencia para mejorarlo, o encontraste "
        "algo que no se entiende, avísale al administrador. Tu experiencia nos ayuda a todos.",
        bg=COLOR_GREEN_BG, border=COLOR_SECONDARY, icon="💡"
    ))

    return s


# ============================================================
# CONSTRUIR
# ============================================================
def build():
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2.2*cm,
        bottomMargin=2*cm,
        title="Manual del Agente — SMD Vital",
        author="SMD Vital",
    )
    story = build_story()
    cover = make_cover("Para el AGENTE", "Call center · Asesor de servicios")
    body = make_header_footer("Agente")
    doc.build(story, onFirstPage=cover, onLaterPages=body)
    print(f"✅ {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    build()
