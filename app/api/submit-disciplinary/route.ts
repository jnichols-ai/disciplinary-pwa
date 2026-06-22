import { NextRequest, NextResponse } from "next/server";
import { mondayGraphQL, findMondayUserIdByName, uploadFileToColumn } from "@/lib/mondayClient";
import { MONDAY_BOARD_ID, MONDAY_GROUP_ID, MONDAY_COLUMN_ID } from "@/lib/mondayConfig";
import { findManagerOffice } from "@/lib/managerLookup";
import { DisciplinaryFormData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const dataRaw = formData.get("data") as string | null;

    if (!pdfFile || !dataRaw) {
      return NextResponse.json(
        { error: "Missing pdf or data in submission." },
        { status: 400 }
      );
    }

    const data: DisciplinaryFormData = JSON.parse(dataRaw);
    const office = findManagerOffice(data.submittingManager);

    const columnValues: Record<string, unknown> = {
      [MONDAY_COLUMN_ID.status]: { label: "Pending Signature" },
      [MONDAY_COLUMN_ID.actionType]: data.actionType ? { label: data.actionType } : null,
      [MONDAY_COLUMN_ID.violationCategory]: data.violationCategory
        ? { labels: [data.violationCategory] }
        : null,
      [MONDAY_COLUMN_ID.managerRole]: data.managerRole
        ? { labels: [data.managerRole] }
        : null,
      [MONDAY_COLUMN_ID.branchOffice]: office?.office ?? "",
      [MONDAY_COLUMN_ID.region]: office?.state ?? "",
      [MONDAY_COLUMN_ID.employeeId]: data.employeeId ?? "",
      [MONDAY_COLUMN_ID.incidentDate]: data.incidentDate
        ? { date: data.incidentDate }
        : null,
      [MONDAY_COLUMN_ID.writeUpDate]: data.writeUpDate
        ? { date: data.writeUpDate }
        : null,
      [MONDAY_COLUMN_ID.repeatOffense]: data.isRepeatOffense
        ? { checked: "true" }
        : null,
      [MONDAY_COLUMN_ID.incidentDescription]: data.incidentDescription ?? "",
    };

    // Best-effort: only set the people column if the manager's name matches
    // an existing monday.com account. Otherwise the name still appears in
    // the item title and is preserved in the PDF/description.
    const managerUserId = await findMondayUserIdByName(data.submittingManager).catch(
      () => null
    );
    if (managerUserId) {
      columnValues[MONDAY_COLUMN_ID.submittingManager] = {
        personsAndTeams: [{ id: Number(managerUserId), kind: "person" }],
      };
    }

    // Strip null values — monday's API rejects nulls for some column types.
    for (const key of Object.keys(columnValues)) {
      if (columnValues[key] === null) delete columnValues[key];
    }

    const itemName = `${data.employeeName} — ${data.actionType} (${data.submittingManager})`;

    const mutation = `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item (
        board_id: $boardId,
        group_id: $groupId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
      }
    }`;

    const result = await mondayGraphQL<{ create_item: { id: string } }>(mutation, {
      boardId: MONDAY_BOARD_ID,
      groupId: MONDAY_GROUP_ID.pendingSignature,
      itemName,
      columnValues: JSON.stringify(columnValues),
    });

    const itemId = result.create_item.id;

    await uploadFileToColumn(
      itemId,
      MONDAY_COLUMN_ID.pdfAttachment,
      pdfFile,
      pdfFile.name || "disciplinary-action.pdf"
    );

    return NextResponse.json({ success: true, itemId });
  } catch (err) {
    console.error("submit-disciplinary error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
