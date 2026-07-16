import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
export type Settings = Record<string, never>;
const isSettings = (value: unknown): value is Settings => typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;
export async function getSettings(): Promise<Settings | null> { return readCanonicalJson(STORAGE_KEYS.SETTINGS, isSettings); }
export async function saveSettings(settings: Settings): Promise<void> { writeCanonicalJson(STORAGE_KEYS.SETTINGS, settings); }
export async function clearSettings(): Promise<void> { removeCanonicalValue(STORAGE_KEYS.SETTINGS); }
