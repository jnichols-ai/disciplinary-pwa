import { jsPDF } from "jspdf";
import { DisciplinaryFormData } from "./types";
import { findManagerOffice } from "./managerLookup";

const PAGE_WIDTH = 612; // 8.5in * 72pt
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

/**
 * Draws the company letterhead: logo top-left, office address top-right.
 * logoDataUrl is optional — if not supplied, falls back to text wordmark
 * so the document is still usable before the logo asset is wired in.
 */
function drawLetterhead(
  doc: jsPDF,
  y: number,
  officeAddress: string | undefined,
  officePhone: string | undefined,
  logoDataUrl?: string
): number {
  // Tracks how far down the logo (or fallback wordmark) actually extends,
  // so the title below it always clears the artwork with a fixed gap —
  // regardless of the logo's real aspect ratio.
  let logoBottom = y;

  if (logoDataUrl) {
    // Fit the logo into a max 150x55pt box while preserving its real aspect
    // ratio, so the spider mark isn't stretched/squished.
    const maxW = 150;
    const maxH = 55;
    let drawW = maxW;
    let drawH = maxH;
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const ratio = props.width / props.height;
      if (maxW / ratio <= maxH) {
        drawW = maxW;
        drawH = maxW / ratio;
      } else {
        drawH = maxH;
        drawW = maxH * ratio;
      }
    } catch {
      // fall back to default box if dimensions can't be read
    }
    doc.addImage(logoDataUrl, "JPEG", MARGIN, y, drawW, drawH);
    logoBottom = y + drawH;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Frontline", MARGIN, y + 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("[logo pending]", MARGIN, y + 32);
    logoBottom = y + 36;
  }

  if (officeAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(officeAddress, 220);
    let ay = y + 4;
    for (const line of lines) {
      doc.text(line, PAGE_WIDTH - MARGIN, ay, { align: "right" });
      ay += 11;
    }
    if (officePhone) {
      doc.text(officePhone, PAGE_WIDTH - MARGIN, ay, { align: "right" });
    }
  }

  // Guarantee at least a 20pt gap between the bottom of the logo/wordmark
  // and whatever gets drawn next (the document title), so the title never
  // overlaps the artwork even if the logo's aspect ratio runs tall.
  return Math.max(y + 68, logoBottom + 20);
}

function drawSectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(text.toUpperCase(), MARGIN, y);
  doc.setDrawColor(180, 30, 30); // red accent line, echoes spider-web red in logo
  doc.setLineWidth(0.75);
  doc.line(MARGIN, y + 3, PAGE_WIDTH - MARGIN, y + 3);
  return y + 16;
}

function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(value || "—", x, y + 12, { maxWidth: width });
}

function drawWrappedParagraph(
  doc: jsPDF,
  text: string,
  y: number,
  width: number = CONTENT_WIDTH
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text || "—", width);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 13 + 6;
}

export function generateDisciplinaryPdf(
  data: DisciplinaryFormData,
  logoDataUrl?: string
): jsPDF {
  const office = findManagerOffice(data.submittingManager);
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  let y = MARGIN;
  y = drawLetterhead(doc, y, office?.address, office?.phone, logoDataUrl);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("DISCIPLINARY ACTION NOTICE", MARGIN, y);
  y += 22;

  // Employee / incident info grid (2 columns)
  y = drawSectionHeading(doc, "Employee & Incident Information", y);
  const colWidth = CONTENT_WIDTH / 2 - 10;
  const col2X = MARGIN + CONTENT_WIDTH / 2 + 10;
  const rowStartY = y + 4;

  drawField(doc, "Employee Name", data.employeeName, MARGIN, rowStartY, colWidth);
  drawField(doc, "Position", data.employeePosition, col2X, rowStartY, colWidth);

  drawField(doc, "Employee ID", data.employeeId, MARGIN, rowStartY + 32, colWidth);
  drawField(doc, "Branch / Office", office?.office ?? "", col2X, rowStartY + 32, colWidth);

  drawField(doc, "Incident Date", formatDate(data.incidentDate), MARGIN, rowStartY + 64, colWidth);
  drawField(doc, "Write-Up Date", formatDate(data.writeUpDate), col2X, rowStartY + 64, colWidth);

  drawField(doc, "Submitting Manager", data.submittingManager, MARGIN, rowStartY + 96, colWidth);
  drawField(doc, "Manager Role", data.managerRole, col2X, rowStartY + 96, colWidth);

  y = rowStartY + 96 + 28;

  // Action type + violation category
  y = drawSectionHeading(doc, "Action Taken", y);
  drawField(doc, "Action Type", data.actionType, MARGIN, y + 4, colWidth);
  drawField(doc, "Violation Category", data.violationCategory, col2X, y + 4, colWidth);
  y += 4 + 28;

  if (data.isRepeatOffense) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.text(
      `Repeat offense. Prior write-up reference: ${data.priorWriteUpReference || "—"}`,
      MARGIN,
      y
    );
    y += 18;
  }

  // Incident description
  y = drawSectionHeading(doc, "Description of Incident", y + 4);
  y = drawWrappedParagraph(doc, data.incidentDescription, y);

  // Corrective action plan
  y = drawSectionHeading(doc, "Corrective Action Plan", y + 6);
  y = drawWrappedParagraph(doc, data.correctiveActionPlan, y);

  // Consequences — the form prefills this field with the standard
  // escalation-step boilerplate (see CONSEQUENCE_LANGUAGE in formOptions.ts)
  // when Action Type is selected, and the manager can edit/append before
  // submitting. The PDF just prints whatever ended up in the field, so
  // there's a single source of truth instead of duplicating the text.
  y = drawSectionHeading(doc, "Consequences of Further Violations", y + 6);
  if (data.additionalConsequenceNotes) {
    y = drawWrappedParagraph(doc, data.additionalConsequenceNotes, y);
  }

  // Push signatures toward the bottom of the page, but keep on one page
  // when content runs long by adding a page break if needed.
  const signatureBlockHeight = 110;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + signatureBlockHeight > pageHeight - MARGIN) {
    doc.addPage();
    y = MARGIN;
  } else {
    y = Math.max(y + 20, pageHeight - MARGIN - signatureBlockHeight);
  }

  y = drawSectionHeading(doc, "Acknowledgment & Signatures", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Employee signature below acknowledges receipt of this notice. It does not necessarily indicate agreement with its contents.",
    MARGIN,
    y,
    { maxWidth: CONTENT_WIDTH }
  );
  y += 28;

  const sigLineWidth = colWidth;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);

  doc.line(MARGIN, y, MARGIN + sigLineWidth, y);
  doc.line(col2X, y, col2X + sigLineWidth, y);
  doc.setFontSize(9);
  doc.text("Employee Signature", MARGIN, y + 12);
  doc.text("Date", MARGIN + sigLineWidth - 60, y + 12);
  doc.text("Manager Signature", col2X, y + 12);
  doc.text("Date", col2X + sigLineWidth - 60, y + 12);

  return doc;
}

export function pdfFileName(data: DisciplinaryFormData): string {
  const safeName = (data.employeeName || "employee").replace(/[^a-z0-9]+/gi, "_");
  return `Disciplinary_Action_${safeName}_${data.writeUpDate || "draft"}.pdf`;
}
