import { NextResponse } from "next/server";
import { getActiveEmployeeNames } from "@/lib/mondayClient";

export const runtime = "nodejs";

// Backs the Employee Name autocomplete on the form. Pulls active employees
// live from the monday.com Employee Directory board (cached for a few
// minutes server-side — see getActiveEmployeeNames) so the suggestion list
// stays current as HR updates the directory.
export async function GET() {
  try {
    const employees = await getActiveEmployeeNames();
    return NextResponse.json({ employees });
  } catch (err) {
    console.error("employees route error", err);
    // Fail soft: an empty list just means the field falls back to plain
    // free-text entry instead of breaking the form.
    return NextResponse.json(
      { employees: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
