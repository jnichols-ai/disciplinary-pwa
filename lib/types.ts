import { ActionType, ViolationCategory, ManagerRole } from "./formOptions";

export interface DisciplinaryFormData {
  employeeName: string;
  employeePosition: string;
  employeeId: string;
  submittingManager: string;
  managerRole: ManagerRole | "";
  incidentDate: string;
  writeUpDate: string;
  actionType: ActionType | "";
  violationCategory: ViolationCategory | "";
  incidentDescription: string;
  isRepeatOffense: boolean;
  priorWriteUpReference: string;
  correctiveActionPlan: string;
  additionalConsequenceNotes: string;
  employeeAcknowledged: boolean;
}

export const emptyFormData: DisciplinaryFormData = {
  employeeName: "",
  employeePosition: "",
  employeeId: "",
  submittingManager: "",
  managerRole: "",
  incidentDate: "",
  writeUpDate: new Date().toISOString().slice(0, 10),
  actionType: "",
  violationCategory: "",
  incidentDescription: "",
  isRepeatOffense: false,
  priorWriteUpReference: "",
  correctiveActionPlan: "",
  additionalConsequenceNotes: "",
  employeeAcknowledged: false,
};
