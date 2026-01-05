import { PDFDocument, StandardFonts, PDFFont, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

export interface DocumentFile {
  fileName: string;
  filePath: string;
  buffer: Buffer;
  templateVersion: string;
}

export interface ClinicalDocumentContext {
  appointment: {
    id: string;
    scheduledAt: Date;
    address?: string | null;
    city?: string | null;
    serviceName?: string | null;
    serviceCategory?: string | null;
  };
  patient: {
    name: string;
    email?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
  };
  doctor?: {
    name: string;
    specialty?: string | null;
    licenseNumber?: string | null;
    logoPath?: string | null;
    signaturePath?: string | null;
  } | null;
  nurse?: {
    name: string;
  } | null;
  encounter?: {
    summary?: string | null;
    payload?: Record<string, unknown> | null;
    finishedAt?: Date | null;
  } | null;
  vitals?: {
    bpSys?: number | null;
    bpDia?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    temperature?: number | null;
    spo2?: number | null;
    weight?: number | null;
    height?: number | null;
    recordedAt?: Date | null;
  } | null;
  medicalRecord: {
    title: string;
    description: string;
    doctorNotes?: string | null;
    payload?: Record<string, unknown> | null;
  };
  prescription?: {
    notes?: string | null;
    items: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string | null | undefined;
    }>;
  } | null;
  generatedBy: {
    role: UserRole;
    name: string;
  };
}

type LoadedImage = {
  image: any;
  width: number;
  height: number;
};

type Palette = {
  primary: ReturnType<typeof rgb>;
  primaryLight: ReturnType<typeof rgb>;
  text: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  border: ReturnType<typeof rgb>;
  card: ReturnType<typeof rgb>;
  white: ReturnType<typeof rgb>;
  waveBlue: ReturnType<typeof rgb>;
  waveGreen: ReturnType<typeof rgb>;
};

type PrescriptionItems = NonNullable<ClinicalDocumentContext['prescription']>['items'];

export class DocumentService {
  private readonly templateVersion = 'v3';
  private readonly assetsDir = path.join(process.cwd(), 'assets', 'branding');
  private readonly documentsDir = path.resolve(process.cwd(), config.upload.uploadPath, 'documents');

  public async generateMedicalRecord(context: ClinicalDocumentContext): Promise<DocumentFile> {
    await this.ensureDocumentsDir();

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const headingFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const palette = this.buildPalette();

    // Configuración de página horizontal (landscape)
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 50;
    const footerHeight = 100; // Espacio reservado para footer y firmas
    const minY = footerHeight; // No dibujar contenido debajo de esta línea

    // Helper para crear nueva página
    const createPage = async () => {
      const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
      await this.drawWatermark(newPage, pdfDoc, pageWidth, pageHeight);
      return newPage;
    };

    // Primera página
    let currentPage = await createPage();
    let y = await this.drawHeader(currentPage, pdfDoc, font, headingFont, context, palette, margin);

    const infoItems = [
      { label: 'Nombre del paciente', value: context.patient.name },
      { label: 'Edad', value: this.formatAge(context.patient.dateOfBirth) },
      { label: 'Fecha', value: this.formatDateOnly(context.appointment.scheduledAt) },
      { label: 'Peso', value: this.formatWeight(context.vitals?.weight) },
      { label: 'ID', value: this.shortId(context.appointment.id) },
      { label: 'Otro', value: this.formatGender(context.patient.gender) },
    ];

    y = this.drawInfoCard(currentPage, font, boldFont, margin, y, pageWidth - margin * 2, infoItems, palette);
    y = this.drawDocumentTitle(currentPage, headingFont, margin, y, 'Historia Clinica', palette);

    // Helper para verificar si necesitamos nueva página
    const checkNewPage = async (requiredSpace: number): Promise<void> => {
      if (y - requiredSpace < minY) {
        // Dibujar footer en página actual
        this.drawFooter(currentPage, font, boldFont, pageWidth, pageHeight, margin, palette);
        // Crear nueva página
        currentPage = await createPage();
        y = pageHeight - margin - 20; // Empezar desde arriba con un pequeño margen
      }
    };

    // Signos vitales
    await checkNewPage(120);
    y = this.drawSectionHeader(currentPage, boldFont, y, 'Signos vitales', pageWidth, margin, palette);
    y = this.drawVitalsGrid(currentPage, font, boldFont, margin, y, pageWidth - margin * 2, context.vitals, palette);

    // Resumen clínico
    const recordSummary = context.medicalRecord.description || context.encounter?.summary || 'Sin resumen registrado.';
    const summaryLines = this.wrapText(font, recordSummary, 10.5, pageWidth - margin * 2 - 28);
    const summaryHeight = Math.max(summaryLines.length * 15 + 28, 50) + 40;
    await checkNewPage(summaryHeight);
    y = this.drawSectionHeader(currentPage, boldFont, y, 'Resumen clinico', pageWidth, margin, palette);
    y = this.drawBoxedText(currentPage, font, recordSummary, margin, y, pageWidth - margin * 2, palette);

    // Payload sections (motivo consulta, diagnóstico, plan, etc.)
    const payload = context.medicalRecord.payload || context.encounter?.payload || {};
    const payloadResult = await this.drawPayloadSectionMultiPage(
      pdfDoc,
      currentPage,
      font,
      boldFont,
      y,
      payload,
      pageWidth,
      margin,
      palette,
      minY,
      createPage
    );
    currentPage = payloadResult.page;
    y = payloadResult.y;

    // Notas del doctor
    if (context.medicalRecord.doctorNotes) {
      const notesLines = this.wrapText(font, context.medicalRecord.doctorNotes, 10, pageWidth - margin * 2 - 20);
      const notesHeight = Math.max(notesLines.length * 13 + 20, 50) + 40;
      await checkNewPage(notesHeight);
      y = this.drawSectionHeader(currentPage, boldFont, y, 'Notas', pageWidth, margin, palette);
      y = this.drawBoxedText(
        currentPage,
        font,
        context.medicalRecord.doctorNotes,
        margin,
        y,
        pageWidth - margin * 2,
        palette,
        { fontSize: 10, lineHeight: 13, padding: 10 }
      );
    }

    // Footer y firmas en la última página
    this.drawFooter(currentPage, font, boldFont, pageWidth, pageHeight, margin, palette);
    await this.drawSignatures(currentPage, pdfDoc, boldFont, margin, 130, pageWidth, context, palette);

    const fileName = `medical-record-${context.appointment.id}.pdf`;
    const relativePath = path.join('documents', fileName).replace(/\\/g, '/');
    const absolutePath = path.join(this.documentsDir, fileName);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(absolutePath, pdfBytes);

    return {
      fileName,
      filePath: relativePath,
      buffer: Buffer.from(pdfBytes),
      templateVersion: this.templateVersion,
    };
  }

  private async drawPayloadSectionMultiPage(
    _pdfDoc: PDFDocument,
    page: any,
    font: PDFFont,
    boldFont: PDFFont,
    y: number,
    payload: Record<string, unknown>,
    width: number,
    margin: number,
    palette: Palette,
    minY: number,
    createPage: () => Promise<any>
  ): Promise<{ page: any; y: number }> {
    const sections: Array<{ label: string; key: string }> = [
      { label: 'Motivo de consulta', key: 'chiefComplaint' },
      { label: 'Historia', key: 'history' },
      { label: 'Diagnostico', key: 'diagnosis' },
      { label: 'Plan', key: 'plan' },
      { label: 'Observaciones', key: 'observations' },
      { label: 'Procedimientos', key: 'procedures' },
    ];

    const available = sections.filter((section) => payload[section.key]);
    if (!available.length) {
      return { page, y };
    }

    let currentPage = page;
    let currentY = y;

    // Header "Detalle clínico"
    if (currentY - 40 < minY) {
      this.drawFooter(currentPage, font, boldFont, width, 595.28, margin, palette);
      currentPage = await createPage();
      currentY = 595.28 - margin - 20;
    }
    currentY = this.drawSectionHeader(currentPage, boldFont, currentY, 'Detalle clinico', width, margin, palette);

    for (const section of available) {
      const value = payload[section.key];
      if (!value) continue;

      const text = this.formatPayloadValue(value);
      const lines = this.wrapText(font, text, 10, width - margin * 2 - 20);
      const sectionHeight = Math.max(lines.length * 13 + 20, 50) + 30;

      // Verificar si necesitamos nueva página
      if (currentY - sectionHeight < minY) {
        this.drawFooter(currentPage, font, boldFont, width, 595.28, margin, palette);
        currentPage = await createPage();
        currentY = 595.28 - margin - 20;
      }

      currentY = this.drawSubsectionTitle(currentPage, boldFont, currentY, section.label, margin, palette);
      currentY = this.drawBoxedText(
        currentPage,
        font,
        text,
        margin,
        currentY,
        width - margin * 2,
        palette,
        { fontSize: 10, lineHeight: 13, padding: 10 }
      );
    }

    return { page: currentPage, y: currentY };
  }

  public async generatePrescription(context: ClinicalDocumentContext): Promise<DocumentFile> {
    if (!context.prescription) {
      throw new Error('Prescription data is required');
    }

    await this.ensureDocumentsDir();

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const headingFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const palette = this.buildPalette();

    // Configuración de página horizontal (landscape)
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 50;
    const footerHeight = 100; // Espacio reservado para footer y firmas
    const minY = footerHeight; // No dibujar contenido debajo de esta línea

    // Helper para crear nueva página
    const createPage = async () => {
      const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
      await this.drawWatermark(newPage, pdfDoc, pageWidth, pageHeight);
      return newPage;
    };

    // Primera página
    let currentPage = await createPage();
    let y = await this.drawHeader(currentPage, pdfDoc, font, headingFont, context, palette, margin);

    const infoItems = [
      { label: 'Nombre del paciente', value: context.patient.name },
      { label: 'Edad', value: this.formatAge(context.patient.dateOfBirth) },
      { label: 'Fecha', value: this.formatDateOnly(context.appointment.scheduledAt) },
      { label: 'Peso', value: this.formatWeight(context.vitals?.weight) },
      { label: 'ID', value: this.shortId(context.appointment.id) },
      { label: 'Otro', value: this.formatGender(context.patient.gender) },
    ];

    y = this.drawInfoCard(currentPage, font, boldFont, margin, y, pageWidth - margin * 2, infoItems, palette);
    y = this.drawDocumentTitle(currentPage, headingFont, margin, y, 'Formula Medica', palette);

    // Helper para verificar si necesitamos nueva página
    const checkNewPage = async (requiredSpace: number): Promise<void> => {
      if (y - requiredSpace < minY) {
        // Dibujar footer en página actual
        this.drawFooter(currentPage, font, boldFont, pageWidth, pageHeight, margin, palette);
        // Crear nueva página
        currentPage = await createPage();
        y = pageHeight - margin - 20;
      }
    };

    // Dibujar medicamentos con soporte multi-página
    if (context.prescription.items.length) {
      const result = await this.drawPrescriptionTableMultiPage(
        currentPage,
        font,
        boldFont,
        margin,
        y,
        pageWidth - margin * 2,
        context.prescription.items,
        palette,
        minY,
        pageWidth,
        pageHeight,
        createPage
      );
      currentPage = result.page;
      y = result.y;
    } else {
      await checkNewPage(70);
      y = this.drawBoxedText(
        currentPage,
        font,
        'No se registraron medicamentos.',
        margin,
        y,
        pageWidth - margin * 2,
        palette
      );
    }

    // Notas de la prescripción
    if (context.prescription.notes) {
      const notesLines = this.wrapText(font, context.prescription.notes, 10.5, pageWidth - margin * 2 - 28);
      const notesHeight = Math.max(notesLines.length * 15 + 28, 50) + 40;
      await checkNewPage(notesHeight);
      y = this.drawSectionHeader(currentPage, boldFont, y, 'Notas', pageWidth, margin, palette);
      y = this.drawBoxedText(
        currentPage,
        font,
        context.prescription.notes,
        margin,
        y,
        pageWidth - margin * 2,
        palette
      );
    }

    // Footer y firmas en la última página
    this.drawFooter(currentPage, font, boldFont, pageWidth, pageHeight, margin, palette);
    await this.drawSignatures(currentPage, pdfDoc, boldFont, margin, 130, pageWidth, context, palette);

    const fileName = `prescription-${context.appointment.id}.pdf`;
    const relativePath = path.join('documents', fileName).replace(/\\/g, '/');
    const absolutePath = path.join(this.documentsDir, fileName);
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(absolutePath, pdfBytes);

    return {
      fileName,
      filePath: relativePath,
      buffer: Buffer.from(pdfBytes),
      templateVersion: this.templateVersion,
    };
  }

  private async ensureDocumentsDir(): Promise<void> {
    await fs.mkdir(this.documentsDir, { recursive: true });
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async resolveAssetPath(baseName: string): Promise<string | null> {
    const extensions = ['png', 'jpg', 'jpeg'];
    for (const ext of extensions) {
      const candidate = path.join(this.assetsDir, `${baseName}.${ext}`);
      if (await this.exists(candidate)) {
        return candidate;
      }
    }

    const svgCandidate = path.join(this.assetsDir, `${baseName}.svg`);
    if (await this.exists(svgCandidate)) {
      logger.warn('SVG assets are not supported for PDF. Provide PNG/JPG instead.', { svgCandidate });
    }

    return null;
  }

  private async loadImage(pdfDoc: PDFDocument, baseName: string): Promise<LoadedImage | null> {
    const assetPath = await this.resolveAssetPath(baseName);
    if (!assetPath) {
      return null;
    }

    const bytes = await fs.readFile(assetPath);
    if (assetPath.endsWith('.png')) {
      const image = await pdfDoc.embedPng(bytes);
      return { image, width: image.width, height: image.height };
    }

    const image = await pdfDoc.embedJpg(bytes);
    return { image, width: image.width, height: image.height };
  }

  private async loadImageWithFallback(
    pdfDoc: PDFDocument,
    baseNames: string[]
  ): Promise<LoadedImage | null> {
    for (const baseName of baseNames) {
      const image = await this.loadImage(pdfDoc, baseName);
      if (image) {
        return image;
      }
    }
    return null;
  }

  private async loadImageFromPath(pdfDoc: PDFDocument, imagePath: string): Promise<LoadedImage | null> {
    try {
      const fullPath = path.resolve(process.cwd(), config.upload.uploadPath, imagePath);
      if (!(await this.exists(fullPath))) {
        return null;
      }

      const bytes = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();

      if (ext === '.png') {
        const image = await pdfDoc.embedPng(bytes);
        return { image, width: image.width, height: image.height };
      } else if (ext === '.jpg' || ext === '.jpeg') {
        const image = await pdfDoc.embedJpg(bytes);
        return { image, width: image.width, height: image.height };
      }

      return null;
    } catch (error) {
      logger.warn('Failed to load image from path', { imagePath, error });
      return null;
    }
  }

  private async drawWatermark(page: any, pdfDoc: PDFDocument, width: number, height: number): Promise<void> {
    const watermarkLogo = await this.loadImage(pdfDoc, 'logo');
    if (!watermarkLogo) {
      return;
    }

    const maxSize = Math.min(width, height) * 0.4;
    const scale = Math.min(maxSize / watermarkLogo.width, maxSize / watermarkLogo.height);
    const logoWidth = watermarkLogo.width * scale;
    const logoHeight = watermarkLogo.height * scale;

    const centerX = (width - logoWidth) / 2;
    const centerY = (height - logoHeight) / 2;

    page.drawImage(watermarkLogo.image, {
      x: centerX,
      y: centerY,
      width: logoWidth,
      height: logoHeight,
      opacity: 0.08,
    });
  }

  private wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
    const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length === 0) {
      return [''];
    }

    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      lines.push(line);
    }

    return lines;
  }

  private truncateText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string {
    if (!text) {
      return '';
    }

    if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
      return text;
    }

    const ellipsis = '...';
    let trimmed = text;
    while (trimmed.length > 0 && font.widthOfTextAtSize(`${trimmed}${ellipsis}`, fontSize) > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }

    return trimmed ? `${trimmed}${ellipsis}` : '';
  }

  private drawDocumentTitle(
    page: any,
    headingFont: PDFFont,
    margin: number,
    y: number,
    title: string,
    palette: Palette
  ): number {
    const titleHeight = 32;
    const titlePadding = 10;

    // Fondo del título con borde inferior
    page.drawRectangle({
      x: margin,
      y: y - titleHeight,
      width: 300,
      height: titleHeight,
      color: palette.primary,
    });

    // Texto del título en blanco
    page.drawText(title.toUpperCase(), {
      x: margin + titlePadding,
      y: y - titleHeight + titlePadding,
      size: 13,
      font: headingFont,
      color: palette.white,
    });

    return y - titleHeight - 16;
  }

  private buildDoctorLine(context: ClinicalDocumentContext): string {
    const roleLabel =
      context.doctor?.specialty ||
      (context.generatedBy.role === 'NURSE'
        ? 'Enfermeria'
        : context.generatedBy.role === 'DOCTOR'
        ? 'Medico general'
        : 'Profesional');
    const license = context.doctor?.licenseNumber;

    if (license && roleLabel) {
      return `${roleLabel} - Cedula profesional: ${license}`;
    }
    if (license) {
      return `Cedula profesional: ${license}`;
    }
    return roleLabel;
  }

  private drawLinedField(
    page: any,
    font: PDFFont,
    boldFont: PDFFont,
    item: { label: string; value: string },
    x: number,
    y: number,
    width: number,
    palette: Palette
  ): number {
    const labelSize = 9;
    const valueSize = 10;
    const label = item.label ? `${item.label}:` : '';
    const labelWidth = label ? font.widthOfTextAtSize(label, labelSize) : 0;
    const lineStart = x + labelWidth + 6;
    const lineEnd = x + width;

    if (label) {
      page.drawText(label, {
        x,
        y,
        size: labelSize,
        font,
        color: palette.primary,
      });
    }

    page.drawLine({
      start: { x: lineStart, y: y - 2 },
      end: { x: lineEnd, y: y - 2 },
      thickness: 1,
      color: palette.border,
    });

    const availableWidth = lineEnd - lineStart - 4;
    const value = this.truncateText(boldFont, item.value, valueSize, availableWidth);
    if (value) {
      page.drawText(value, {
        x: lineStart + 2,
        y,
        size: valueSize,
        font: boldFont,
        color: palette.primary,
      });
    }

    return x + width;
  }

  private async drawHeader(
    page: any,
    pdfDoc: PDFDocument,
    font: PDFFont,
    headingFont: PDFFont,
    context: ClinicalDocumentContext,
    palette: Palette,
    margin: number
  ): Promise<number> {
    const { height, width } = page.getSize();
    const topY = height - margin;
    const doctorName = (context.doctor?.name || context.generatedBy.name || 'SMD Vital').toUpperCase();
    const doctorLine = this.buildDoctorLine(context);

    let doctorLogo: LoadedImage | null = null;
    if (context.doctor?.logoPath) {
      doctorLogo = await this.loadImageFromPath(pdfDoc, context.doctor.logoPath);
    }

    if (doctorLogo) {
      // Logo del médico más grande y prominente
      const maxLogoHeight = 60;
      const maxLogoWidth = 100;
      const scale = Math.min(maxLogoWidth / doctorLogo.width, maxLogoHeight / doctorLogo.height);
      const logoWidth = doctorLogo.width * scale;
      const logoHeight = doctorLogo.height * scale;

      // Calcular altura total del bloque de texto (nombre + especialidad)
      const nameSize = 20;
      const lineSize = 11;
      const textGap = 8;
      const totalTextHeight = nameSize + (doctorLine ? lineSize + textGap : 0);

      // Centrar verticalmente el logo con el texto
      const blockCenterY = topY - totalTextHeight / 2;
      const logoY = blockCenterY - logoHeight / 2 + 5;

      page.drawImage(doctorLogo.image, {
        x: margin,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });

      const textStartX = margin + logoWidth + 20;

      // Nombre del doctor - alineado con el centro superior del logo
      page.drawText(doctorName, {
        x: textStartX,
        y: logoY + logoHeight - nameSize + 5,
        size: nameSize,
        font: headingFont,
        color: palette.primary,
      });

      // Especialidad - debajo del nombre
      if (doctorLine) {
        page.drawText(doctorLine, {
          x: textStartX,
          y: logoY + logoHeight - nameSize - textGap - 5,
          size: lineSize,
          font,
          color: palette.primary,
        });
      }
    } else {
      page.drawText(doctorName, {
        x: margin,
        y: topY,
        size: 20,
        font: headingFont,
        color: palette.primary,
      });

      if (doctorLine) {
        page.drawText(doctorLine, {
          x: margin,
          y: topY - 18,
          size: 11,
          font,
          color: palette.primary,
        });
      }
    }

    const logo = await this.loadImage(pdfDoc, 'logo');
    if (logo) {
      const maxLogoHeight = 70;
      const maxLogoWidth = 120;
      const scale = Math.min(maxLogoWidth / logo.width, maxLogoHeight / logo.height);
      const logoWidth = logo.width * scale;
      const logoHeight = logo.height * scale;
      const logoX = width - margin - logoWidth;
      const logoY = height - margin - logoHeight + 6;
      page.drawImage(logo.image, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });
    } else {
      const fallback = 'SMD VITAL';
      const textWidth = font.widthOfTextAtSize(fallback, 12);
      page.drawText(fallback, {
        x: width - margin - textWidth,
        y: topY - 6,
        size: 12,
        font: headingFont,
        color: palette.primary,
      });
    }

    return topY - 60;
  }

  private drawInfoCard(
    page: any,
    font: PDFFont,
    boldFont: PDFFont,
    x: number,
    y: number,
    width: number,
    items: Array<{ label: string; value: string }>,
    palette: Palette
  ): number {
    const getItem = (index: number) => items[index] ?? { label: '', value: '' };
    const nameItem = getItem(0);
    const ageItem = getItem(1);
    const dateItem = getItem(2);
    const weightItem = getItem(3);
    const idItem = getItem(4);
    const otherItem = getItem(5);

    const cardPadding = 15;
    const gap = 18;
    const lineHeight = 32;

    // Calcular altura de la tarjeta (2 filas)
    const cardHeight = lineHeight * 2 + cardPadding * 2 + gap;

    // Dibujar fondo de la tarjeta
    page.drawRectangle({
      x: x,
      y: y - cardHeight,
      width: width,
      height: cardHeight,
      color: palette.card,
      borderColor: palette.border,
      borderWidth: 1.5,
    });

    // Primera fila - dividida en 3 columnas equilibradas
    const firstRowY = y - cardPadding - 8;
    const col1Width = width * 0.48; // Nombre (más ancho)
    const col2Width = width * 0.18; // Edad
    const col3Width = width * 0.28; // Fecha

    let currentX = x + cardPadding;
    currentX = this.drawLinedField(page, font, boldFont, nameItem, currentX, firstRowY, col1Width, palette);
    currentX += gap;
    currentX = this.drawLinedField(page, font, boldFont, ageItem, currentX, firstRowY, col2Width, palette);
    currentX += gap;
    this.drawLinedField(page, font, boldFont, dateItem, currentX, firstRowY, col3Width, palette);

    // Segunda fila - dividida en 3 columnas equilibradas
    const secondRowY = firstRowY - lineHeight - gap;
    const col4Width = width * 0.28; // Peso
    const col5Width = width * 0.28; // ID
    const col6Width = width * 0.38; // Género

    currentX = x + cardPadding;
    currentX = this.drawLinedField(page, font, boldFont, weightItem, currentX, secondRowY, col4Width, palette);
    currentX += gap;
    currentX = this.drawLinedField(page, font, boldFont, idItem, currentX, secondRowY, col5Width, palette);
    currentX += gap;
    this.drawLinedField(page, font, boldFont, otherItem, currentX, secondRowY, col6Width, palette);

    return y - cardHeight - 16;
  }

  private drawSectionHeader(
    page: any,
    font: PDFFont,
    y: number,
    title: string,
    width: number,
    margin: number,
    palette: Palette
  ): number {
    const headerHeight = 24;
    const headerPadding = 8;

    // Fondo de la sección con degradado visual
    page.drawRectangle({
      x: margin,
      y: y - headerHeight,
      width: width - margin * 2,
      height: headerHeight,
      color: rgb(0.95, 0.97, 0.99),
      borderColor: palette.primary,
      borderWidth: 1,
    });

    // Barra de acento a la izquierda
    page.drawRectangle({
      x: margin,
      y: y - headerHeight,
      width: 4,
      height: headerHeight,
      color: palette.primary,
    });

    // Título de la sección
    page.drawText(title.toUpperCase(), {
      x: margin + 12,
      y: y - headerHeight + headerPadding,
      size: 10.5,
      font,
      color: palette.primary,
    });

    return y - headerHeight - 12;
  }

  private drawSubsectionTitle(
    page: any,
    font: PDFFont,
    y: number,
    title: string,
    margin: number,
    palette: Palette
  ): number {
    page.drawText(title, {
      x: margin,
      y,
      size: 10,
      font,
      color: palette.text,
    });
    return y - 14;
  }

  private drawBoxedText(
    page: any,
    font: PDFFont,
    text: string,
    x: number,
    y: number,
    width: number,
    palette: Palette,
    options: { fontSize?: number; lineHeight?: number; padding?: number } = {}
  ): number {
    const fontSize = options.fontSize ?? 10.5;
    const lineHeight = options.lineHeight ?? 15;
    const padding = options.padding ?? 14;
    const lines = this.wrapText(font, text, fontSize, width - padding * 2);
    const boxHeight = Math.max(lines.length * lineHeight + padding * 2, 50); // Altura mínima

    // Caja con estilo mejorado
    page.drawRectangle({
      x,
      y: y - boxHeight,
      width,
      height: boxHeight,
      color: palette.white,
      borderColor: rgb(0.86, 0.88, 0.92),
      borderWidth: 1.5,
    });

    // Borde superior con color de acento
    page.drawLine({
      start: { x, y },
      end: { x: x + width, y },
      thickness: 2,
      color: palette.primary,
      opacity: 0.3,
    });

    this.drawWrappedText(
      page,
      font,
      text,
      x + padding,
      y - padding - fontSize + 2,
      width - padding * 2,
      fontSize,
      lineHeight,
      palette.text
    );

    return y - boxHeight - 16;
  }

  private drawVitalsGrid(
    page: any,
    font: PDFFont,
    boldFont: PDFFont,
    x: number,
    y: number,
    width: number,
    vitals: ClinicalDocumentContext['vitals'] | null | undefined,
    palette: Palette
  ): number {
    const items = this.buildVitalsItems(vitals);
    const columns = 4; // 4 columnas para mejor distribución horizontal
    const gap = 10;
    const padding = 15;
    const cellHeight = 45; // Más alto para mejor legibilidad
    const rows = Math.ceil(items.length / columns);
    const boxHeight = rows * cellHeight + gap * (rows - 1) + padding * 2;

    // Fondo principal con borde más marcado
    page.drawRectangle({
      x,
      y: y - boxHeight,
      width,
      height: boxHeight,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: palette.primary,
      borderWidth: 1.5,
    });

    const cellWidth = (width - padding * 2 - gap * (columns - 1)) / columns;

    for (const [index, item] of items.entries()) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellX = x + padding + column * (cellWidth + gap);
      const cellY = y - padding - row * (cellHeight + gap) - cellHeight;

      // Celda individual con sombra sutil
      page.drawRectangle({
        x: cellX,
        y: cellY,
        width: cellWidth,
        height: cellHeight,
        color: palette.white,
        borderColor: rgb(0.88, 0.90, 0.93),
        borderWidth: 1,
      });

      // Etiqueta del vital
      page.drawText(item.label.toUpperCase(), {
        x: cellX + 10,
        y: cellY + cellHeight - 16,
        size: 7.5,
        font,
        color: palette.primary,
      });

      // Separador visual
      page.drawLine({
        start: { x: cellX + 10, y: cellY + cellHeight - 20 },
        end: { x: cellX + cellWidth - 10, y: cellY + cellHeight - 20 },
        thickness: 0.5,
        color: rgb(0.88, 0.90, 0.93),
      });

      // Valor del vital - más prominente
      const valueText = this.truncateText(boldFont, item.value, 11, cellWidth - 20);
      page.drawText(valueText, {
        x: cellX + 10,
        y: cellY + 12,
        size: 11,
        font: boldFont,
        color: palette.text,
      });
    }

    return y - boxHeight - 18;
  }

  private async drawPrescriptionTableMultiPage(
    page: any,
    font: PDFFont,
    boldFont: PDFFont,
    x: number,
    y: number,
    width: number,
    items: PrescriptionItems,
    palette: Palette,
    minY: number,
    pageWidth: number,
    pageHeight: number,
    createPage: () => Promise<any>
  ): Promise<{ page: any; y: number }> {
    const itemPadding = 12;
    const itemGap = 10;
    let currentY = y;
    let currentPage = page;

    for (const [index, item] of items.entries()) {
      const medication = item.medication || '-';
      const dosage = item.dosage || '';
      const frequency = item.frequency || '';
      const duration = item.duration || '';
      const instructions = item.instructions || '';

      // Calcular altura del item
      const detailParts = [frequency, duration, instructions].filter(Boolean);
      const detailText = detailParts.join(' • ').trim();
      const detailLines = detailText ? this.wrapText(font, detailText, 9.5, width - itemPadding * 2) : [];
      const itemHeight = 55 + (detailLines.length > 1 ? (detailLines.length - 1) * 13 : 0);

      // Verificar si necesitamos nueva página
      if (currentY - itemHeight - itemGap < minY) {
        this.drawFooter(currentPage, font, boldFont, pageWidth, pageHeight, x, palette);
        currentPage = await createPage();
        currentY = pageHeight - 50 - 20; // Margen superior
      }

      // Fondo del item con numeración
      currentPage.drawRectangle({
        x,
        y: currentY - itemHeight,
        width,
        height: itemHeight,
        color: palette.white,
        borderColor: rgb(0.86, 0.88, 0.92),
        borderWidth: 1.5,
      });

      // Número del medicamento
      currentPage.drawRectangle({
        x,
        y: currentY - itemHeight,
        width: 35,
        height: itemHeight,
        color: rgb(0.95, 0.97, 0.99),
      });

      currentPage.drawText(`${index + 1}`, {
        x: x + 15,
        y: currentY - itemHeight / 2 - 5,
        size: 16,
        font: boldFont,
        color: palette.primary,
      });

      // Línea vertical separadora
      currentPage.drawLine({
        start: { x: x + 35, y: currentY - itemHeight },
        end: { x: x + 35, y: currentY },
        thickness: 1.5,
        color: rgb(0.86, 0.88, 0.92),
      });

      // Nombre del medicamento y dosificación
      const medText = dosage ? `${medication} - ${dosage}` : medication;
      const medTruncated = this.truncateText(boldFont, medText, 11, width - 50);
      currentPage.drawText(medTruncated, {
        x: x + 45,
        y: currentY - 18,
        size: 11,
        font: boldFont,
        color: palette.text,
      });

      // Detalles (frecuencia, duración, instrucciones)
      if (detailText) {
        let detailY = currentY - 35;
        for (const line of detailLines) {
          currentPage.drawText(line, {
            x: x + 45,
            y: detailY,
            size: 9.5,
            font,
            color: rgb(0.35, 0.37, 0.42),
          });
          detailY -= 13;
        }
      }

      currentY -= itemHeight + itemGap;
    }

    return { page: currentPage, y: currentY };
  }

  private buildWavePath(width: number, baseY: number, amplitude: number): string {
    const f = (value: number) => value.toFixed(2);
    const c1x = width * 0.25;
    const c2x = width * 0.5;
    const c3x = width * 0.75;
    const c4x = width * 0.92;
    const c1y = baseY + amplitude;
    const c2y = baseY - amplitude;
    const c3y = baseY + amplitude * 0.6;
    const c4y = baseY + amplitude * 0.9;
    const endY = baseY - amplitude * 0.4;

    return [
      `M 0 ${f(baseY)}`,
      `C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(c3x)} ${f(c3y)}`,
      `C ${f(c4x)} ${f(c4y)}, ${f(width)} ${f(endY)}, ${f(width)} ${f(baseY)}`,
      `L ${f(width)} 0 L 0 0 Z`,
    ].join(' ');
  }

  private drawFooter(
    page: any,
    font: PDFFont,
    _boldFont: PDFFont,
    width: number,
    _height: number,
    margin: number,
    palette: Palette
  ): void {
    // Ondas decorativas pequeñas en la parte inferior (Y=0 es el borde inferior)
    const waveBlue = this.buildWavePath(width, 18, 8);
    const waveGreen = this.buildWavePath(width, 12, 5);
    page.drawSvgPath(waveBlue, { x: 0, y: 0, color: palette.waveBlue });
    page.drawSvgPath(waveGreen, { x: 0, y: 0, color: palette.waveGreen });

    // Información de contacto en una sola línea, justo encima de las ondas
    const contactY = 25;
    const contactText = 'Lunes a Domingo 10:00 AM - 5:00 PM  |  (304) 291-2564  |  salud@smdvitalbogota.com  |  www.smdvitalbogota.com';

    page.drawText(contactText, {
      x: margin,
      y: contactY,
      size: 7,
      font,
      color: palette.muted,
    });
  }

  private drawWrappedText(
    page: any,
    font: PDFFont,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    lineHeight: number,
    color: ReturnType<typeof rgb> = rgb(0.12, 0.12, 0.12)
  ): number {
    const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && line) {
        page.drawText(line, { x, y: currentY, size: fontSize, font, color });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font, color });
      currentY -= lineHeight;
    }

    return currentY;
  }

  private formatPayloadValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private buildVitalsItems(vitals?: ClinicalDocumentContext['vitals'] | null) {
    if (!vitals) {
      return [{ label: 'Estado', value: 'Sin registros' }];
    }

    const items: Array<{ label: string; value: string }> = [];
    if (vitals.bpSys && vitals.bpDia) {
      items.push({ label: 'PA', value: `${vitals.bpSys}/${vitals.bpDia} mmHg` });
    }
    if (vitals.heartRate) {
      items.push({ label: 'FC', value: `${vitals.heartRate} lpm` });
    }
    if (vitals.respiratoryRate) {
      items.push({ label: 'FR', value: `${vitals.respiratoryRate} rpm` });
    }
    if (vitals.temperature) {
      items.push({ label: 'Temp', value: `${vitals.temperature} C` });
    }
    if (vitals.spo2) {
      items.push({ label: 'SpO2', value: `${vitals.spo2}%` });
    }
    if (vitals.weight) {
      items.push({ label: 'Peso', value: `${vitals.weight} kg` });
    }
    if (vitals.height) {
      items.push({ label: 'Talla', value: `${vitals.height} cm` });
    }
    if (vitals.recordedAt) {
      items.push({ label: 'Registro', value: this.formatDate(vitals.recordedAt) });
    }

    if (!items.length) {
      return [{ label: 'Estado', value: 'Sin registros' }];
    }

    return items;
  }

  private formatAge(dateOfBirth?: Date | null): string {
    if (!dateOfBirth) {
      return '';
    }

    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age -= 1;
    }

    return age >= 0 ? String(age) : '';
  }

  private formatWeight(weight?: number | null): string {
    if (weight === null || weight === undefined) {
      return '';
    }
    return `${weight} kg`;
  }

  private formatGender(gender?: string | null): string {
    if (!gender) {
      return '';
    }
    const normalized = gender.toLowerCase();
    if (normalized === 'male' || normalized === 'm') {
      return 'Masculino';
    }
    if (normalized === 'female' || normalized === 'f') {
      return 'Femenino';
    }
    if (normalized === 'other') {
      return 'Otro';
    }
    if (normalized === 'prefer_not_to_say' || normalized === 'prefer not to say') {
      return 'Prefiere no decir';
    }
    return gender;
  }

  private shortId(id: string): string {
    if (!id) {
      return '';
    }
    const normalized = id.replace(/[^a-zA-Z0-9]/g, '');
    if (normalized.length <= 6) {
      return normalized;
    }
    return normalized.slice(-6).toUpperCase();
  }

  private formatDateOnly(date: Date): string {
    return date.toLocaleDateString('es-CO', { dateStyle: 'short' });
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private buildPalette(): Palette {
    return {
      primary: rgb(0.12, 0.32, 0.58),
      primaryLight: rgb(0.92, 0.95, 0.99),
      text: rgb(0.13, 0.14, 0.16),
      muted: rgb(0.45, 0.47, 0.52),
      border: rgb(0.86, 0.88, 0.92),
      card: rgb(0.98, 0.98, 0.99),
      white: rgb(1, 1, 1),
      waveBlue: rgb(0.15, 0.55, 0.9),
      waveGreen: rgb(0.0, 0.7, 0.35),
    };
  }

  private async drawSignatures(
    page: any,
    pdfDoc: PDFDocument,
    boldFont: PDFFont,
    margin: number,
    y: number,
    width: number,
    context: ClinicalDocumentContext,
    palette: Palette
  ): Promise<void> {
    // Área de firmas: bien separada del contenido y del footer
    // El footer está en Y=25, así que las firmas deben empezar mucho más arriba
    const signatureLineY = y;
    const signatureImageY = signatureLineY + 8;
    const signatureWidth = 190;
    const signatureHeight = 55;
    const gap = 26;

    // Posiciones X: dos firmas en la parte derecha
    const totalWidth = signatureWidth * 2 + gap;
    const startX = width - margin - totalWidth;
    const smdX = startX;
    const doctorX = startX + signatureWidth + gap;

    const clinicianName =
      context.doctor?.name || context.nurse?.name || context.generatedBy.name || 'Profesional';
    const fallbackRole =
      context.generatedBy.role === 'NURSE'
        ? 'Enfermeria'
        : context.generatedBy.role === 'DOCTOR'
        ? 'Medico general'
        : 'Profesional';
    const clinicianRole = context.doctor?.specialty || (context.nurse ? 'Enfermeria' : fallbackRole);
    const license = context.doctor?.licenseNumber;

    // ============ FIRMA SMD VITAL (izquierda) ============
    // Cargar imagen de firma SMD Vital directamente
    const smdSignaturePath = path.join(this.assetsDir, 'firma smd vital.png');
    try {
      const smdBytes = await fs.readFile(smdSignaturePath);
      const smdImage = await pdfDoc.embedPng(smdBytes);
      const smdScale = Math.min(signatureWidth / smdImage.width, signatureHeight / smdImage.height);
      page.drawImage(smdImage, {
        x: smdX,
        y: signatureImageY,
        width: smdImage.width * smdScale,
        height: smdImage.height * smdScale,
      });
    } catch (error) {
      logger.warn('Could not load SMD Vital signature', { error });
      // Dibujar línea si no hay imagen
      page.drawLine({
        start: { x: smdX, y: signatureImageY + 15 },
        end: { x: smdX + signatureWidth, y: signatureImageY + 15 },
        thickness: 1,
        color: palette.border,
      });
    }

    // Línea de firma SMD Vital
    page.drawLine({
      start: { x: smdX, y: signatureLineY },
      end: { x: smdX + signatureWidth, y: signatureLineY },
      thickness: 1,
      color: palette.text,
    });

    // Texto SMD Vital
    page.drawText('SMD Vital', {
      x: smdX,
      y: signatureLineY - 12,
      size: 9,
      font: boldFont,
      color: palette.primary,
    });
    page.drawText('Bogota', {
      x: smdX,
      y: signatureLineY - 23,
      size: 8,
      font: boldFont,
      color: palette.muted,
    });

    // ============ FIRMA DOCTOR (derecha) ============
    // Imagen de firma del doctor
    let doctorSignature: LoadedImage | null = null;
    if (context.doctor?.signaturePath) {
      doctorSignature = await this.loadImageFromPath(pdfDoc, context.doctor.signaturePath);
    }

    if (doctorSignature) {
      const scale = Math.min(signatureWidth / doctorSignature.width, signatureHeight / doctorSignature.height);
      page.drawImage(doctorSignature.image, {
        x: doctorX,
        y: signatureImageY,
        width: doctorSignature.width * scale,
        height: doctorSignature.height * scale,
      });
    } else {
      // Fallback: cargar firma médico genérica
      await this.drawSignatureImage(
        page,
        pdfDoc,
        ['firma medico', 'signature-doctor'],
        doctorX,
        signatureImageY,
        signatureWidth,
        signatureHeight
      );
    }

    // Línea de firma doctor
    page.drawLine({
      start: { x: doctorX, y: signatureLineY },
      end: { x: doctorX + signatureWidth, y: signatureLineY },
      thickness: 1,
      color: palette.text,
    });

    // Texto del doctor - Nombre
    const nameText = this.truncateText(boldFont, clinicianName, 9, signatureWidth);
    page.drawText(nameText, {
      x: doctorX,
      y: signatureLineY - 12,
      size: 9,
      font: boldFont,
      color: palette.primary,
    });

    // Especialidad
    const roleText = this.truncateText(boldFont, clinicianRole, 8, signatureWidth);
    page.drawText(roleText, {
      x: doctorX,
      y: signatureLineY - 23,
      size: 8,
      font: boldFont,
      color: palette.muted,
    });

    // Cédula profesional
    if (license) {
      const licenseText = this.truncateText(boldFont, `Cedula ${license}`, 8, signatureWidth);
      page.drawText(licenseText, {
        x: doctorX,
        y: signatureLineY - 34,
        size: 8,
        font: boldFont,
        color: palette.muted,
      });
    }
  }

  private async drawSignatureImage(
    page: any,
    pdfDoc: PDFDocument,
    assetBases: string[],
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const signature = await this.loadImageWithFallback(pdfDoc, assetBases);
    if (!signature) {
      page.drawLine({
        start: { x, y: y + 10 },
        end: { x: x + width, y: y + 10 },
        thickness: 1,
        color: rgb(0.2, 0.2, 0.2),
      });
      return;
    }

    const scale = Math.min(width / signature.width, height / signature.height);
    page.drawImage(signature.image, {
      x,
      y,
      width: signature.width * scale,
      height: signature.height * scale,
    });
  }
}
