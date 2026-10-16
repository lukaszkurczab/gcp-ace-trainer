/** Read-only UI fixture: never opens regular profiles, storage or SDKs. */
export { useAppPreferences, useThemedStyles } from '../../../src/preferences/appPreferencesContext';
export { presentTargetDateGuidance } from '../../../src/application/learningPlan/targetDateGuidancePresentation';
export const getApplicationCurrentTime = () => '2026-10-15T10:00:00Z';
export const isPatternlyBackendE2eConfigured = () => false;
export const isPatternlyPremiumTestingRuntime = () => false;
const unavailable = () => { throw Error('solo_home_fixture_write_unavailable'); };
export const hasPremiumTestingAccess = unavailable;
export const setPremiumTestingAccess = unavailable;
export const selectSingleCase = unavailable;
