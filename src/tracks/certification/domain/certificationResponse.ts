export type CertificationResponse = Readonly<{
  kind: "option_selection";
  selectedOptionIds: readonly string[];
}>;
