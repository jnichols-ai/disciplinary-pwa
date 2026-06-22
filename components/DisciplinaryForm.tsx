"use client";

import { useMemo, useState } from "react";
import { DisciplinaryFormData, emptyFormData } from "@/lib/types";
import { MANAGER_OFFICES, findManagerOffice } from "@/lib/managerLookup";
import {
  ACTION_TYPES,
  VIOLATION_CATEGORIES,
  MANAGER_ROLES,
} from "@/lib/formOptions";
import { generateDisciplinaryPdf, pdfFileName } from "@/lib/generatePdf";

type SubmitState = "idle" | "submitting" | "success" | "error";

// Loads /public/logo.png, flattens it onto a white background, and
// re-encodes it as a JPEG data URL via canvas. jsPDF embeds JPEGs as a raw
// DCT stream (no internal PNG re-decoding/inflate step), which sidesteps
// transparency/large-PNG edge cases in jsPDF's image pipeline. Resolves to
// undefined if the logo hasn't been added yet, so the PDF falls back to the
// text wordmark instead of failing.
async function loadLogoDataUrl(): Promise<string | undefined> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    // Cap the working resolution — plenty for a ~150x60pt letterhead box
    // at print resolution, keeps the data URL small.
    const maxDim = 700;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return undefined;
  }
}

export default function DisciplinaryForm() {
  const [data, setData] = useState<DisciplinaryFormData>(emptyFormData);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const officePreview = useMemo(
    () => findManagerOffice(data.submittingManager),
    [data.submittingManager]
  );

  function update<K extends keyof DisciplinaryFormData>(
    key: K,
    value: DisciplinaryFormData[K]
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function buildPdfBlob(): Promise<Blob> {
    const logoDataUrl = await loadLogoDataUrl();
    const doc = generateDisciplinaryPdf(data, logoDataUrl);
    return doc.output("blob");
  }

  async function handleDownload() {
    const logoDataUrl = await loadLogoDataUrl();
    const doc = generateDisciplinaryPdf(data, logoDataUrl);
    doc.save(pdfFileName(data));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");
    try {
      const blob = await buildPdfBlob();
      const formPayload = new FormData();
      formPayload.append("pdf", blob, pdfFileName(data));
      formPayload.append("data", JSON.stringify(data));

      const res = await fetch("/api/submit-disciplinary", {
        method: "POST",
        body: formPayload,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Submission failed (${res.status})`);
      }

      setSubmitState("success");
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  const isRequiredFilled =
    data.employeeName &&
    data.employeePosition &&
    data.submittingManager &&
    data.managerRole &&
    data.incidentDate &&
    data.actionType &&
    data.violationCategory &&
    data.incidentDescription &&
    data.employeeAcknowledged;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="flex items-center gap-4 border-b border-neutral-200 pb-4">
        <img
          src="/logo.png"
          alt="Frontline"
          className="h-10 w-auto"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Disciplinary Action Form
          </h1>
          <p className="text-sm text-neutral-500">
            Complete all fields, then generate the PDF and submit to the
            Disciplinary Action Tracker board.
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase text-neutral-500">
          Employee
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Employee Name" required>
            <input
              className="input"
              value={data.employeeName}
              onChange={(e) => update("employeeName", e.target.value)}
              required
            />
          </Field>
          <Field label="Position" required>
            <input
              className="input"
              value={data.employeePosition}
              onChange={(e) => update("employeePosition", e.target.value)}
              required
            />
          </Field>
          <Field label="Employee ID">
            <input
              className="input"
              value={data.employeeId}
              onChange={(e) => update("employeeId", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase text-neutral-500">
          Submitting Manager
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Manager" required>
            <select
              className="input"
              value={data.submittingManager}
              onChange={(e) => update("submittingManager", e.target.value)}
              required
            >
              <option value="">Select manager…</option>
              {MANAGER_OFFICES.map((m) => (
                <option key={m.manager} value={m.manager}>
                  {m.manager} — {m.office}, {m.state}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Manager Role" required>
            <select
              className="input"
              value={data.managerRole}
              onChange={(e) =>
                update("managerRole", e.target.value as DisciplinaryFormData["managerRole"])
              }
              required
            >
              <option value="">Select role…</option>
              {MANAGER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {officePreview && (
          <p className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">
            Office on PDF: <strong>{officePreview.office}, {officePreview.state}</strong>
            <br />
            {officePreview.address} · {officePreview.phone}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase text-neutral-500">
          Incident
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Incident Date" required>
            <input
              type="date"
              className="input"
              value={data.incidentDate}
              onChange={(e) => update("incidentDate", e.target.value)}
              required
            />
          </Field>
          <Field label="Write-Up Date" required>
            <input
              type="date"
              className="input"
              value={data.writeUpDate}
              onChange={(e) => update("writeUpDate", e.target.value)}
              required
            />
          </Field>
          <Field label="Action Type" required>
            <select
              className="input"
              value={data.actionType}
              onChange={(e) =>
                update("actionType", e.target.value as DisciplinaryFormData["actionType"])
              }
              required
            >
              <option value="">Select…</option>
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Violation Category" required>
            <select
              className="input"
              value={data.violationCategory}
              onChange={(e) =>
                update(
                  "violationCategory",
                  e.target.value as DisciplinaryFormData["violationCategory"]
                )
              }
              required
            >
              <option value="">Select…</option>
              {VIOLATION_CATEGORIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={data.isRepeatOffense}
            onChange={(e) => update("isRepeatOffense", e.target.checked)}
          />
          This is a repeat offense
        </label>
        {data.isRepeatOffense && (
          <Field label="Prior Write-Up Reference">
            <input
              className="input"
              placeholder="e.g. date or Monday item link of prior write-up"
              value={data.priorWriteUpReference}
              onChange={(e) => update("priorWriteUpReference", e.target.value)}
            />
          </Field>
        )}

        <Field label="Description of Incident" required>
          <textarea
            className="input min-h-[120px]"
            value={data.incidentDescription}
            onChange={(e) => update("incidentDescription", e.target.value)}
            required
          />
        </Field>

        <Field label="Corrective Action Plan">
          <textarea
            className="input min-h-[100px]"
            value={data.correctiveActionPlan}
            onChange={(e) => update("correctiveActionPlan", e.target.value)}
          />
        </Field>

        <Field label="Additional Consequence Notes (optional)">
          <textarea
            className="input min-h-[80px]"
            value={data.additionalConsequenceNotes}
            onChange={(e) => update("additionalConsequenceNotes", e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-2 border-t border-neutral-200 pt-4">
        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={data.employeeAcknowledged}
            onChange={(e) => update("employeeAcknowledged", e.target.checked)}
            required
          />
          I confirm the employee has been given the opportunity to review and
          sign this notice (signature collected on the printed/PDF copy).
        </label>
      </section>

      {errorMessage && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      {submitState === "success" && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Submitted. The PDF has been attached to a new item on the
          Disciplinary Action Tracker board.
        </p>
      )}

      <div className="flex flex-wrap gap-3 pb-10">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!isRequiredFilled}
          className="btn-secondary"
        >
          Download PDF
        </button>
        <button
          type="submit"
          disabled={!isRequiredFilled || submitState === "submitting"}
          className="btn-primary"
        >
          {submitState === "submitting" ? "Submitting…" : "Submit to Monday Board"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
