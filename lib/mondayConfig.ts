// Disciplinary Action Tracker board (Service workspace)
export const MONDAY_BOARD_ID = "18418855689";

export const MONDAY_GROUP_ID = {
  draft: "group_mm4jv8d0",
  pendingSignature: "group_mm4jvj4z",
  acknowledged: "group_mm4j1s04",
  escalated: "group_mm4jvwc1",
  closed: "group_mm4jxpk0",
} as const;

// Employee Directory board (Human Resources workspace) — source of truth for
// the Employee Name autocomplete on the disciplinary action form.
export const EMPLOYEE_DIRECTORY_BOARD_ID = "18003250999";
export const EMPLOYEE_DIRECTORY_COLUMN_ID = {
  status: "status",
} as const;
export const EMPLOYEE_DIRECTORY_ACTIVE_STATUS_LABEL = "Active";

export const MONDAY_COLUMN_ID = {
  status: "color_mm4jy3a1",
  actionType: "color_mm4jfxxr",
  violationCategory: "dropdown_mm4j3cpq",
  managerRole: "dropdown_mm4j3vra",
  submittingManager: "multiple_person_mm4j6qhp",
  branchOffice: "text_mm4jkfm4",
  region: "text_mm4jy96z",
  employeeId: "text_mm4jsvkz",
  incidentDate: "date_mm4j13zv",
  writeUpDate: "date_mm4jf655",
  repeatOffense: "boolean_mm4j9ade",
  linkedPriorWriteUp: "board_relation_mm4j13ea",
  pdfAttachment: "file_mm4j9vyx",
  incidentDescription: "long_text_mm4j986c",
} as const;
