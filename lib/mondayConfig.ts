// Disciplinary Action Tracker board (Service workspace)
export const MONDAY_BOARD_ID = "18418855689";

// The board no longer tracks a multi-stage workflow — every submission lands
// in this single group. A submitted form is considered complete once the
// PDF is generated and attached, so there's nothing further to move between.
export const MONDAY_GROUP_ID = {
  submitted: "group_mm4jvj4z",
} as const;

// Employee Directory board (Human Resources workspace) — source of truth for
// the Employee Name autocomplete on the disciplinary action form.
export const EMPLOYEE_DIRECTORY_BOARD_ID = "18003250999";
export const EMPLOYEE_DIRECTORY_COLUMN_ID = {
  status: "status",
} as const;
export const EMPLOYEE_DIRECTORY_ACTIVE_STATUS_LABEL = "Active";

export const MONDAY_COLUMN_ID = {
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
