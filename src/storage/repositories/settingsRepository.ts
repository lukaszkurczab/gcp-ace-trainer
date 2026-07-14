import { STORAGE_KEYS } from "../keys";
import { readStoredJson, removeStoredValue, writeStoredJson } from "../storageCodec";
export type Settings = Record<string, never>;
const isSettings = (value: unknown): value is Settings => typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0;
export async function getSettings(): Promise<Settings | null> { return readStoredJson(STORAGE_KEYS.SETTINGS, isSettings); }
export async function saveSettings(settings: Settings): Promise<void> { writeStoredJson(STORAGE_KEYS.SETTINGS, settings); }
export async function clearSettings(): Promise<void> { removeStoredValue(STORAGE_KEYS.SETTINGS); }
