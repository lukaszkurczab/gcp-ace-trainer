import type { AlgorithmModeId } from "../../tracks/coding-interview/domain";
import type { CertificationPracticeModeId } from "../../tracks/certification/domain";
import type { DesignInterviewModeId } from "../../tracks/design-interview";

/** Stable mode command identity shared by application use cases and feature surfaces. */
export type CanonicalPracticeModeId = AlgorithmModeId | CertificationPracticeModeId | DesignInterviewModeId;
