"""
manual_styles.py
Módulo compartido: paleta, estilos, header/footer y helpers de contenido.
Usado por build_manual_agent.py y build_manual_professional.py.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

# ============================================================
# PALETA SMD VITAL
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

# ============================================================
# ESTILOS (todos Paragraph, ninguno string crudo en tablas)
# ============================================================
_base = getSampleStyleSheet()

S = {
    'cover_title': ParagraphStyle(
        'CoverTitle', parent=_base['Title'],
        fontSize=28, leading=34, textColor=COLOR_PRIMARY,
        alignment=TA_CENTER, spaceAfter=8, fontName='Helvetica-Bold'
    ),
    'cover_sub': ParagraphStyle(
        'CoverSub', parent=_base['Normal'],
        fontSize=14, leading=20, textColor=COLOR_MUTED,
        alignment=TA_CENTER, spaceAfter=4
    ),
    'h1': ParagraphStyle(
        'H1', parent=_base['Heading1'],
        fontSize=20, leading=26, textColor=COLOR_PRIMARY,
        spaceBefore=12, spaceAfter=14, fontName='Helvetica-Bold',
        keepWithNext=True
    ),
    'h2': ParagraphStyle(
        'H2', parent=_base['Heading2'],
        fontSize=14, leading=18, textColor=COLOR_SECONDARY,
        spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold',
        keepWithNext=True
    ),
    'h3': ParagraphStyle(
        'H3', parent=_base['Heading3'],
        fontSize=12, leading=16, textColor=COLOR_TEXT,
        spaceBefore=10, spaceAfter=6, fontName='Helvetica-Bold',
        keepWithNext=True
    ),
    'body': ParagraphStyle(
        'Body', parent=_base['Normal'],
        fontSize=10.5, leading=15, textColor=COLOR_TEXT,
        alignment=TA_JUSTIFY, spaceAfter=8, fontName='Helvetica'
    ),
    'body_left': ParagraphStyle(
        'BodyL', parent=S['body'] if False else _base['Normal'],
        fontSize=10.5, leading=15, textColor=COLOR_TEXT,
        alignment=TA_LEFT, spaceAfter=6, fontName='Helvetica'
    ),
    'body_bold': ParagraphStyle(
        'BodyBold', parent=_base['Normal'],
        fontSize=10.5, leading=15, textColor=COLOR_TEXT,
        alignment=TA_LEFT, spaceAfter=6, fontName='Helvetica-Bold'
    ),
    'bullet': ParagraphStyle(
        'Bullet', parent=_base['Normal'],
        fontSize=10.5, leading=15, textColor=COLOR_TEXT,
        leftIndent=18, bulletIndent=4, spaceAfter=5, fontName='Helvetica',
        alignment=TA_LEFT
    ),
    'callout': ParagraphStyle(
        'Callout', parent=_base['Normal'],
        fontSize=10.5, leading=15, textColor=COLOR_TEXT,
        leftIndent=4, rightIndent=4, spaceAfter=2, spaceBefore=2,
        fontName='Helvetica', alignment=TA_LEFT
    ),
    'toc_title': ParagraphStyle(
        'TocTitle', parent=_base['Title'],
        fontSize=24, leading=30, textColor=COLOR_PRIMARY,
        alignment=TA_CENTER, spaceAfter=24, fontName='Helvetica-Bold'
    ),
    'toc_section': ParagraphStyle(
        'TocSection', parent=_base['Normal'],
        fontSize=13, leading=20, textColor=COLOR_PRIMARY,
        fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=10, alignment=TA_LEFT
    ),
    'toc_item': ParagraphStyle(
        'TocItem', parent=_base['Normal'],
        fontSize=10.5, leading=16, textColor=COLOR_TEXT,
        fontName='Helvetica', spaceAfter=2, alignment=TA_LEFT
    ),
    'table_header': ParagraphStyle(
        'TblH', parent=_base['Normal'],
        fontSize=10, leading=14, textColor=HexColor('#1E3A8A'),
        fontName='Helvetica-Bold', alignment=TA_LEFT
    ),
    'table_cell': ParagraphStyle(
        'TblC', parent=_base['Normal'],
        fontSize=10, leading=14, textColor=COLOR_TEXT,
        fontName='Helvetica', alignment=TA_LEFT
    ),
    'table_cell_bold': ParagraphStyle(
        'TblCB', parent=_base['Normal'],
        fontSize=10, leading=14, textColor=COLOR_PRIMARY,
        fontName='Helvetica-Bold', alignment=TA_LEFT
    ),
    'part_banner': ParagraphStyle(
        'PartBanner', parent=_base['Normal'],
        fontSize=11, leading=15, textColor=COLOR_MUTED,
        alignment=TA_CENTER, spaceAfter=4, fontName='Helvetica-Bold'
    ),
    'part_title': ParagraphStyle(
        'PartTitle', parent=_base['Title'],
        fontSize=24, leading=30, textColor=COLOR_PRIMARY,
        alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold'
    ),
}


# ============================================================
# HEADER / FOOTER (solo en páginas de contenido, NO en portada)
# ============================================================
def make_header_footer(role_label: str):
    """Devuelve un callback que dibuja header + footer."""
    def draw(canv, doc):
        canv.saveState()
        # Header
        canv.setFont('Helvetica-Bold', 9)
        canv.setFillColor(COLOR_PRIMARY)
        canv.drawString(2*cm, A4[1] - 1.2*cm, "SMD VITAL")
        canv.setFont('Helvetica', 8)
        canv.setFillColor(COLOR_MUTED)
        canv.drawRightString(A4[0] - 2*cm, A4[1] - 1.2*cm, f"Manual de Operaciones · {role_label}")
        canv.setStrokeColor(COLOR_PRIMARY)
        canv.setLineWidth(0.5)
        canv.line(2*cm, A4[1] - 1.4*cm, A4[0] - 2*cm, A4[1] - 1.4*cm)
        # Footer
        canv.setFont('Helvetica', 8)
        canv.setFillColor(COLOR_MUTED)
        canv.drawString(2*cm, 1.2*cm, "SMD Vital · Bogotá · Atención coordinada por MedicExpress")
        canv.drawRightString(A4[0] - 2*cm, 1.2*cm, f"Página {doc.page}")
        canv.setStrokeColor(HexColor('#E2E8F0'))
        canv.setLineWidth(0.3)
        canv.line(2*cm, 1.5*cm, A4[0] - 2*cm, 1.5*cm)
        canv.restoreState()
    return draw


def make_cover(role_label: str, role_subtitle: str):
    """Devuelve un callback que dibuja SOLO la portada (sin header/footer)."""
    from reportlab.pdfgen import canvas as _cv

    def draw(canv: '_cv.Canvas', doc):
        canv.saveState()
        W, H = A4
        # Banda superior azul
        canv.setFillColor(COLOR_PRIMARY)
        canv.rect(0, H - 9*cm, W, 9*cm, fill=1, stroke=0)
        # Banda inferior verde
        canv.setFillColor(COLOR_SECONDARY)
        canv.rect(0, 0, W, 1.5*cm, fill=1, stroke=0)
        # Logo texto
        canv.setFillColor(white)
        canv.setFont('Helvetica-Bold', 40)
        canv.drawCentredString(W/2, H - 4.5*cm, "SMD VITAL")
        canv.setFont('Helvetica', 14)
        canv.drawCentredString(W/2, H - 5.7*cm, "Atención coordinada por MedicExpress")
        # Símbolo médico
        canv.setFont('Helvetica-Bold', 70)
        canv.drawCentredString(W/2, H - 8*cm, "+")
        # Título del documento
        canv.setFillColor(COLOR_TEXT)
        canv.setFont('Helvetica-Bold', 28)
        canv.drawCentredString(W/2, H - 12*cm, "Manual de Operaciones")
        # Subtítulo del rol
        canv.setFillColor(COLOR_PRIMARY)
        canv.setFont('Helvetica-Bold', 18)
        canv.drawCentredString(W/2, H - 13.5*cm, role_label)
        canv.setFillColor(COLOR_MUTED)
        canv.setFont('Helvetica-Oblique', 12)
        canv.drawCentredString(W/2, H - 14.7*cm, role_subtitle)
        # Caja de información
        canv.setFillColor(COLOR_LIGHT_BG)
        canv.roundRect(3*cm, H - 19*cm, W - 6*cm, 3.5*cm, 8, fill=1, stroke=0)
        canv.setFillColor(COLOR_PRIMARY)
        canv.setFont('Helvetica-Bold', 12)
        canv.drawCentredString(W/2, H - 16.5*cm, "¿Para quién es este manual?")
        canv.setFillColor(COLOR_TEXT)
        canv.setFont('Helvetica', 10.5)
        # Texto de la caja — sin solapamientos: cada línea separada por 0.55cm
        lines = [
            ("Asesores de call center que agendan servicios por WhatsApp", H - 17.5*cm),
        ]
        if "Profesional" in role_label or "Doctor" in role_label or "Enfermera" in role_label:
            lines = [
                ("Médicos y enfermeras que atienden servicios a domicilio", H - 17.5*cm),
            ]
        for txt, y in lines:
            canv.drawCentredString(W/2, y, txt)
        canv.setFont('Helvetica', 9)
        canv.setFillColor(COLOR_MUTED)
        canv.drawCentredString(W/2, H - 18.2*cm, "Versión 1.0 · Julio 2026")
        # Footer portada
        canv.setFillColor(white)
        canv.setFont('Helvetica', 9)
        canv.drawCentredString(W/2, 0.5*cm, "smdvitalbogota.com · WhatsApp 304 291 2564")
        canv.restoreState()
        canv.showPage()  # forzar fin de página para que story empiece en página 2
    return draw


# ============================================================
# HELPERS DE CONTENIDO
# ============================================================
def callout_box(text: str, bg=None, border=None, icon: str = "ℹ️"):
    """Caja de aviso destacada — SIEMPRE Paragraph dentro."""
    if bg is None: bg = COLOR_BLUE_BG
    if border is None: border = COLOR_PRIMARY
    p = Paragraph(f"<b>{icon} {text}</b>", S['callout'])
    t = Table([[p]], colWidths=[16.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('BOX', (0, 0), (-1, -1), 1.2, border),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return t


def step_block(num: str, title: str, body: str):
    """Paso numerado. number=celda azul, title+body=Paragraphs con wrap correcto."""
    num_p = Paragraph(f"<font color='white'><b>{num}</b></font>",
                      ParagraphStyle('Num', fontSize=20, alignment=TA_CENTER,
                                     fontName='Helvetica-Bold'))
    title_p = Paragraph(title, S['body_bold'])
    body_p = Paragraph(body, S['body'])

    inner = Table([[title_p], [body_p]], colWidths=[13.5*cm])
    inner.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (0, 0), 6),
        ('BOTTOMPADDING', (0, 1), (0, 1), 4),
    ]))

    num_table = Table([[num_p]], colWidths=[1.3*cm], rowHeights=[1.3*cm])
    num_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    outer = Table([[num_table, inner]], colWidths=[1.8*cm, 13.5*cm])
    outer.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return outer


def info_table(rows, col_widths=(5.5*cm, 11*cm), header_color=None):
    """
    Tabla de 2 columnas clave:valor.
    TODAS las celdas son Paragraph (sin strings crudos) para evitar sobreposición.
    """
    if header_color is None: header_color = COLOR_LIGHT_BG
    data = []
    for key, val in rows:
        # SIEMPRE Paragraph
        k = Paragraph(str(key), S['table_cell_bold'])
        v = Paragraph(str(val), S['table_cell'])
        data.append([k, v])

    t = Table(data, colWidths=list(col_widths))
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), header_color),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


def data_table(headers, rows, col_widths):
    """
    Tabla con header y filas. TODAS las celdas son Paragraph.
    """
    data = [[Paragraph(str(h), S['table_header']) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), S['table_cell']) for c in row])

    t = Table(data, colWidths=list(col_widths), repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#EFF6FF')),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, COLOR_LIGHT_BG]),
    ]))
    return t


def bullets(items, marker='•', marker_color=None):
    """Lista de bullets como Paragraphs."""
    from reportlab.platypus import ListFlowable, ListItem
    if marker_color is None: marker_color = COLOR_PRIMARY
    flow = ListFlowable(
        [ListItem(Paragraph(item, S['bullet']), leftIndent=12) for item in items],
        bulletType='bullet', start=marker, bulletFontName='Helvetica-Bold',
        bulletFontSize=11
    )
    return flow
