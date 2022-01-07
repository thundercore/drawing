import { DrawingState } from "./DrawingStates";

export const DrawingStateNames = {
  [DrawingState.Open]: "Open",
  [DrawingState.EnrollmentStarted]: "Enrollment Started",
  [DrawingState.EnrollmentEnded]: "Enrollment Ended",
  [DrawingState.WinnersCalculated]: "Winners Calculated"
};
