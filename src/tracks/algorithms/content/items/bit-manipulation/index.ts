import { recognizeBitManipulationSignalQuestions } from "./recognize-bit-manipulation-signal";
import { binaryRepresentationAndShiftsQuestions } from "./binary-representation-and-shifts";
import { bitCheckSetClearToggleQuestions } from "./bit-check-set-clear-toggle";
import { masksAndCompositionQuestions } from "./masks-and-composition";
import { xorPatternsAndParityQuestions } from "./xor-patterns-and-parity";
import { powersOfTwoAndLowbitQuestions } from "./powers-of-two-and-lowbit";
import { bitCountingAndIterationQuestions } from "./bit-counting-and-iteration";
import { subsetMasksAndStateCompressionQuestions } from "./subset-masks-and-state-compression";

export const bitManipulationQuestions = [
  ...recognizeBitManipulationSignalQuestions,
  ...binaryRepresentationAndShiftsQuestions,
  ...bitCheckSetClearToggleQuestions,
  ...masksAndCompositionQuestions,
  ...xorPatternsAndParityQuestions,
  ...powersOfTwoAndLowbitQuestions,
  ...bitCountingAndIterationQuestions,
  ...subsetMasksAndStateCompressionQuestions,
];
