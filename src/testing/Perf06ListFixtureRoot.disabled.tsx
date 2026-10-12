import { Text, View } from "react-native";
import type { Perf06Entry } from "./perf06Entry";

export default function Perf06ListFixtureRoot({ entry: _entry }: Readonly<{ entry: Perf06Entry }>) {
  return <View><Text>List measurement unavailable in this runtime.</Text></View>;
}
