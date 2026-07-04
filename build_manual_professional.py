"""
build_manual_professional.py
Genera Manual_SMD_Vital_Profesional.pdf — solo contenido del PROFESIONAL.
"""

from pathlib import Path
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle

from manual_styles import (
    S, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_ACCENT, COLOR_DANGER, COLOR_GREEN_BG,
    COLOR_BLUE_BG, COLOR_AMBER_BG, COLOR_MUTED, COLOR_TEXT, COLOR_LIGHT_BG, HexColor,
    callout_box, step_block, info_table, data_table, bullets,
    make_cover, make_header_footer, white
)

OUTPUT_PATH = Path("docs/manuales/Manual_SMD_Vital_Profesional.pdf")
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)


def build_story():
    s = []

    # ==================== TOC ====================
    s.append(Paragraph("Tabla de contenidos", S['toc_title']))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Para el PROFESIONAL (Doctor / Enfermera)", S['toc_section']))
    toc_items = [
        ("1. ¿Cuál es tu rol?", "3"),
        ("2. Tu primer día: acceso y dashboard", "4"),
        ("3. El flujo del día a día", "5"),
        ("4. Antes de salir: revisa tu agenda del día", "6"),
        ("5. En casa del paciente: iniciar el servicio", "7"),
        ("6. Al terminar: cómo cerrar y cobrar (paso crítico)", "8"),
        ("7. Tus ganancias: cómo verlas y cobrarlas", "9"),
        ("8. Confirmar recepción de pago", "10"),
        ("9. Reglas importantes (qué SÍ y qué NO)", "11"),
        ("10. Soporte y contacto", "12"),
    ]
    for title, page in toc_items:
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
        "Tú eres el profesional que <b>atiende al paciente en su casa</b>. Recibes el servicio "
        "agendado, lo realizas, registras lo que hiciste y cobras tu parte.",
        S['body']
    ))
    s.append(Paragraph("Tus responsabilidades principales son:", S['body']))
    s.append(bullets([
        "<b>Revisar tu agenda</b> cada mañana para saber qué servicios tienes y dónde.",
        "<b>Llegar a tiempo</b> a cada domicilio.",
        "<b>Realizar el servicio</b> con calidad profesional y calidez humana.",
        "<b>Registrar inicio y fin</b> en el sistema desde tu celular.",
        "<b>Cobrar tu parte</b>: el sistema calcula automáticamente cuánto te corresponde.",
    ]))
    s.append(Spacer(1, 0.2*cm))
    s.append(callout_box(
        "Tu pago depende de que el sistema tenga el servicio marcado como COMPLETADO. "
        "Si terminaste el servicio y no lo cerraste en el sistema, no se genera el pago. "
        "<b>Punto. Por eso este paso es crítico.</b>",
        bg=COLOR_GREEN_BG, border=COLOR_SECONDARY, icon="💰"
    ))
    s.append(PageBreak())

    # ==================== 2. PRIMER DÍA ====================
    s.append(Paragraph("2. Tu primer día: acceso y dashboard", S['h1']))
    s.append(Paragraph(
        "El administrador te crea un usuario con tu email profesional. La primera vez que entres, "
        "te va a pedir cambiar la contraseña.",
        S['body']
    ))

    s.append(Paragraph("2.1. Tu pantalla principal", S['h2']))
    s.append(Paragraph("Al entrar, lo primero que ves es tu <b>resumen financiero</b>:", S['body']))
    s.append(info_table([
        ("Por pagar", "Servicios que ya completaste pero SMD Vital aún no te transfiere."),
        ("Pagado · por confirmar", "SMD Vital ya te transfirió. Falta que confirmes que recibiste."),
        ("Recibido total", "Todo lo que ya está en tu bolsillo."),
        ("En disputa", "Algún pago que reportaste como no recibido."),
    ]))

    s.append(Paragraph("2.2. Tus servicios de hoy", S['h2']))
    s.append(Paragraph(
        "Es la sección más importante de tu día. Aquí ves, <b>en orden cronológico</b>, los servicios "
        "que tienes agendados hoy: hora, paciente, dirección, servicio, y al lado cuánto te "
        "corresponde a ti.",
        S['body']
    ))
    s.append(Spacer(1, 0.2*cm))
    s.append(callout_box(
        "<b>Tip senior:</b> revisa tu agenda la noche anterior y planifica la ruta. "
        "Bogotá tiene tráfico feroz, no te confíes.",
        bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="🗺️"
    ))
    s.append(PageBreak())

    # ==================== 3. FLUJO ====================
    s.append(Paragraph("3. El flujo del día a día", S['h1']))
    s.append(Paragraph(
        "Tu día se repite. Cinco pasos. Cinco minutos cada uno. No te saltas ninguno:",
        S['body']
    ))

    s.append(data_table(
        ["#", "Qué pasa", "Qué haces tú"],
        [
            ["1", "Revisas tu agenda", "Mañana o noche anterior: ves qué tienes hoy"],
            ["2", "Vas al domicilio", "Con todos los materiales necesarios"],
            ["3", "Abres la app al llegar", "Click en 'Iniciar' cuando estés con el paciente"],
            ["4", "Haces el servicio", "Con profesionalismo y calidez"],
            ["5", "Cierras la app al terminar", "Click en 'Completar' + diagnóstico + notas"],
            ["6", "Recibes tu pago", "Aparece en 'Pagado · por confirmar'"],
            ["7", "Confirmas recepción", "1 tap → pasa a 'Recibido total'"],
        ],
        [1*cm, 5*cm, 10*cm]
    ))
    s.append(PageBreak())

    # ==================== 4. AGENDA ====================
    s.append(Paragraph("4. Antes de salir: revisa tu agenda del día", S['h1']))
    s.append(Paragraph(
        "Esta es la única manera de saber qué vas a hacer hoy, en qué orden, y a dónde ir.",
        S['body']
    ))

    s.append(Paragraph("4.1. Qué información tienes disponible", S['h2']))
    s.append(Paragraph("Por cada cita de hoy, el sistema te muestra:", S['body']))
    s.append(info_table([
        ("Hora de inicio", "A qué hora exacta empieza el servicio"),
        ("Servicio", "Qué tienes que hacer (sueroterapia, signos vitales, etc.)"),
        ("Paciente", "Nombre completo"),
        ("Dirección", "Con barrio y referencia"),
        ("Tu pago", "Cuánto vas a ganar por ese servicio"),
        ("Notas del agente", "Alergias, condiciones especiales, indicaciones"),
    ]))

    s.append(Paragraph("4.2. Llamar al paciente antes de salir", S['h2']))
    s.append(Paragraph(
        "El sistema te muestra el teléfono del paciente. <b>Recomendado:</b> 30 minutos antes de "
        "llegar, llámalo para confirmar que está, que tiene los materiales necesarios, y preguntarle "
        "la mejor ruta. Esto evita viajes en vano.",
        S['body']
    ))
    s.append(PageBreak())

    # ==================== 5. INICIAR ====================
    s.append(Paragraph("5. En casa del paciente: iniciar el servicio", S['h1']))
    s.append(Paragraph(
        "Cuando llegas al domicilio y estás con el paciente, es momento de iniciar el servicio en "
        "el sistema. Esto es importante porque marca el inicio formal de tu turno.",
        S['body']
    ))

    s.append(Paragraph("Procedimiento", S['h2']))
    s.append(step_block("1", "Verifica que estás en el domicilio correcto",
        "Confirma con el paciente su nombre y cédula."))
    s.append(step_block("2", "Abre la cita en la app",
        "Click en la cita correspondiente. Verás el botón 'Iniciar servicio'."))
    s.append(step_block("3", "Click en 'Iniciar'",
        "La cita pasa a estado <b>EN CURSO</b>. El reloj empieza a correr."))
    s.append(step_block("4", "Realiza el servicio",
        "Ahora sí, con toda tu profesionalismo. El paciente ve que el servicio está 'oficial'."))

    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "Si olvidaste marcar el inicio, no es grave. Puedes iniciar y completar en el mismo paso. "
        "Pero la próxima vez intenta hacerlo apenas llegues. Es tu respaldo si hay alguna queja.",
        bg=COLOR_BLUE_BG, border=COLOR_PRIMARY, icon="⏱️"
    ))
    s.append(PageBreak())

    # ==================== 6. COMPLETAR ====================
    s.append(Paragraph("6. Al terminar: cómo cerrar y cobrar", S['h1']))
    s.append(Paragraph(
        "Este es <b>el paso más importante de tu día</b>. Es el que dispara tu pago. Si no lo haces, no cobras.",
        S['body']
    ))

    s.append(Paragraph("Procedimiento paso a paso", S['h2']))
    s.append(step_block("1", "Una vez terminado el servicio, abre la cita",
        "En tu app, click en la cita que acabas de hacer."))
    s.append(step_block("2", "Click en 'Completar servicio'",
        "Te aparece un formulario con 3 campos para llenar."))
    s.append(step_block("3", "Llena el diagnóstico (opcional pero recomendado)",
        "Una nota breve de lo que hiciste, lo que encontraste, cualquier observación. "
        "Es tu registro clínico y también tu respaldo."))
    s.append(step_block("4", "Llena la prescripción si aplica",
        "Si diste alguna indicación médica, medicación recomendada, o cuidados, ponlo aquí. "
        "El paciente lo ve después."))
    s.append(step_block("5", "Agrega notas internas si quieres",
        "Esto lo ve SMD Vital, no el paciente. Pon cualquier cosa relevante: 'Paciente nervioso', "
        "'Familiar ausente', 'Tuve que esperar 20 min'."))
    s.append(step_block("6", "Click en 'Confirmar y completar'",
        "<b>¡Listo!</b> La cita pasa a estado <b>COMPLETADA</b>. El sistema genera automáticamente tu pago pendiente."))

    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "Si te equivocas al completar (datos mal, era otra cita), avísale al admin <b>el mismo día</b>. "
        "Después de 24 horas es muy difícil reversarlo porque ya se generaron los pagos.",
        bg=COLOR_AMBER_BG, border=COLOR_ACCENT, icon="⚠️"
    ))
    s.append(PageBreak())

    # ==================== 7. GANANCIAS ====================
    s.append(Paragraph("7. Tus ganancias: cómo verlas y cobrarlas", S['h1']))

    s.append(Paragraph("7.1. Anatomía de tu pago", S['h2']))
    s.append(Paragraph(
        "El sistema desglosa automáticamente cuánto gana cada parte. Veamos un ejemplo real:",
        S['body']
    ))
    s.append(Paragraph(
        "<b>Servicio:</b> Sueroterapia a domicilio · <b>PVP:</b> $185.000",
        S['body']
    ))
    s.append(info_table([
        ("Lo que paga el paciente", "$185.000"),
        ("Lo que gana la enfermera (tú)", "$127.500"),
        ("Lo que gana el asesor (call center)", "$12.500"),
        ("Lo que gana SMD Vital", "$45.000"),
    ], col_widths=(8*cm, 4*cm)))

    s.append(Paragraph("7.2. ¿Cuándo llega tu dinero?", S['h2']))
    s.append(Paragraph(
        "SMD Vital procesa pagos <b>[frecuencia que indique el admin: semanal/quincenal/mensual]</b>. "
        "El admin revisa los servicios completados, te transfiere, y la app te avisa que tienes un "
        "pago pendiente de confirmar.",
        S['body']
    ))
    s.append(PageBreak())

    # ==================== 8. CONFIRMAR ====================
    s.append(Paragraph("8. Confirmar recepción de pago", S['h1']))
    s.append(Paragraph(
        "SMD Vital te transfiere tu pago. Te llega al número de cuenta que registraste. Una vez que "
        "verificas que el dinero está, lo confirmas en el sistema.",
        S['body']
    ))

    s.append(Paragraph("Procedimiento", S['h2']))
    s.append(step_block("1", "Te llega una notificación",
        "La app te avisa: 'Tienes un pago nuevo por $XXX.XXX'"))
    s.append(step_block("2", "Revisa tu cuenta",
        "Verifica que la transferencia esté en tu banco o Nequi/Daviplata"))
    s.append(step_block("3", "Click en 'Confirmar recepción'",
        "En la sección 'Pagado · por confirmar'. Un tap y se mueve a 'Recibido total'."))

    s.append(Paragraph("Si NO recibiste el pago", S['h2']))
    s.append(Paragraph(
        "Click en 'No recibí' → explica qué pasó (transferencia no llegó, monto incorrecto, "
        "cuenta bloqueada, etc.) → el sistema marca como <b>EN DISPUTA</b> y el admin lo resuelve. "
        "Esto protege a las dos partes: tú no confirmas algo que no recibiste, y SMD Vital tiene un "
        "registro del problema.",
        S['body']
    ))
    s.append(Spacer(1, 0.3*cm))
    s.append(callout_box(
        "Nunca confirmes un pago que no recibiste. Si te equivocas, se puede reversar pero es más "
        "trabajo para todos.",
        bg=COLOR_DANGER, border=COLOR_DANGER, icon="🛑"
    ))
    s.append(PageBreak())

    # ==================== 9. REGLAS ====================
    s.append(Paragraph("9. Reglas importantes", S['h1']))

    s.append(Paragraph("9.1. Lo que SÍ debes hacer", S['h2']))
    s.append(bullets([
        "Llegar <b>puntual</b> a cada servicio. La puntualidad es la base de la confianza.",
        "Revisar la <b>dirección y referencias</b> antes de salir. Bogotá es grande.",
        "Llevar <b>todos los materiales</b> necesarios para el servicio.",
        "Tratar al paciente y a su familia con <b>respeto y calidez</b>. Eres la cara de SMD Vital.",
        "<b>Completar la cita en el sistema</b> el mismo día. Sin esto, no hay pago.",
        "<b>Confirmar pagos</b> que recibes. Si no confirmas, se acumulan como pendientes.",
        "Si algo sale mal (paciente agresivo, accidente, material faltante), "
        "<b>documentar en notas</b> y avisar al admin.",
    ], marker='✓', marker_color=COLOR_SECONDARY))

    s.append(Spacer(1, 0.3*cm))
    s.append(Paragraph("9.2. Lo que NO debes hacer", S['h2']))
    s.append(bullets([
        "<b>No aceptar pagos directos</b> del paciente. Todo va por SMD Vital. Si el paciente "
        "te paga en mano, devuélvelo y dile que pague por los canales oficiales.",
        "<b>No agendar</b> servicios por tu cuenta. Eso es trabajo del agente. "
        "Si un paciente te pide algo extra, dile que llame al call center.",
        "<b>No compartir tus credenciales</b> con nadie. Son tuyas, personales e intransferibles.",
        "<b>No modificar</b> el reparto de pago. El sistema lo calcula automáticamente. "
        "Si crees que hay un error, avísale al admin.",
        "<b>No dar diagnósticos</b> por WhatsApp. El paciente te llama, pero las decisiones "
        "clínicas son en persona.",
    ], marker='✗', marker_color=COLOR_DANGER))
    s.append(PageBreak())

    # ==================== 10. SOPORTE ====================
    s.append(Paragraph("10. Soporte y contacto", S['h1']))
    s.append(Paragraph(
        "Si tienes una duda, un problema con el sistema, o una situación que no sabes cómo "
        "resolver, estos son tus canales de ayuda:",
        S['body']
    ))
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
        title="Manual del Profesional — SMD Vital",
        author="SMD Vital",
    )
    story = build_story()
    cover = make_cover("Para el PROFESIONAL", "Médicos y enfermeras a domicilio")
    body = make_header_footer("Profesional")
    doc.build(story, onFirstPage=cover, onLaterPages=body)
    print(f"✅ {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    build()
