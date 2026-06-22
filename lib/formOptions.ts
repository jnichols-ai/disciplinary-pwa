export const ACTION_TYPES = [
  "Verbal Warning",
  "Written Warning",
  "Final Written Warning",
  "Suspension",
  "Termination",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export const VIOLATION_CATEGORIES = [
  "Attendance/Tardiness",
  "Policy Violation",
  "Performance",
  "Safety",
  "Insubordination",
  "Conduct",
  "Other",
] as const;

export type ViolationCategory = (typeof VIOLATION_CATEGORIES)[number];

export const MANAGER_ROLES = ["Branch Manager", "Regional Manager"] as const;
export type ManagerRole = (typeof MANAGER_ROLES)[number];

// Boilerplate consequence language shown based on escalation step.
export const CONSEQUENCE_LANGUAGE: Record<ActionType, string> = {
  "Verbal Warning":
    "This is a verbal warning. Continued failure to correct this behavior may result in a written warning, suspension, or termination of employment.",
  "Written Warning":
    "This is a formal written warning. Continued failure to correct this behavior may result in a final written warning, suspension, or termination of employment.",
  "Final Written Warning":
    "This is a final written warning. Any further violation of company policy, regardless of severity, may result in immediate suspension or termination of employment.",
  Suspension:
    "Continued failure to correct this behavior, or any further policy violation upon return from suspension, will result in termination of employment.",
  Termination:
    "This action results in the immediate termination of employment, effective as of the date listed above.",
};
