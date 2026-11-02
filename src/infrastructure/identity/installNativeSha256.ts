import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { installSha256Accelerator } from "./sha256";

type SynchronousCrypto = Readonly<{ digestString?: (algorithm: string, value: string, options: Readonly<{ encoding: string }>) => unknown }>;

// The pinned Expo Crypto native module exposes this synchronous capability on iOS/Android.
// Other builds keep the reference implementation; no digest cache or profile data is retained.
if (Platform.OS === "ios" || Platform.OS === "android") {
  try {
    const crypto = requireOptionalNativeModule<SynchronousCrypto>("ExpoCrypto");
    if (typeof crypto?.digestString === "function") installSha256Accelerator(value => crypto.digestString!("SHA-256", value, { encoding: "hex" }));
  } catch { /* Native capability is optional; the reference implementation is already active. */ }
}
