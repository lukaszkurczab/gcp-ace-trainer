import { projectProgressEvidence } from "../../../src/application/learningPlan/progressReadProjection";
import '../../../src/i18n';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation } from '../../../src/preferences/appPreferencesContext';
import { HomeTab } from '../../../src/features/home/tabs/HomeTab';
import { ProgressTab } from '../../../src/features/home/tabs/ProgressTab';
import { SettingsTab } from '../../../src/features/home/tabs/SettingsTab';
import { contentPackageRuntimeOwner } from '../../../src/application/contentPackageRuntimeOwner';
import { getTrackDisplay } from '../../../src/domain';
import { Screen } from '../../../src/components/Screen';
import { getSettingsAccountPresentation } from '../../../src/features/home/tabs/settingsAccountPresentation';

const noop = () => {};
const unavailable = () => { throw Error('solo_home_fixture_action_unavailable'); };
const preferences = { ...deriveAppPreferencesPresentation('dark', 'en', 'dark', 'en'), ready: true, setLanguage: async () => unavailable(), setAppearance: async () => unavailable() };
const activeTrack = getTrackDisplay('aws-certified-solutions-architect-associate');

function App() {
  const [panel, setPanel] = useState('Home');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    // Actual models use the actual verified bundled catalog, no persisted reads.
    void contentPackageRuntimeOwner.verifyBundledPackages().then(() => setReady(true), () => setFailed(true));
  }, []);
  return <SafeAreaProvider><AppPreferencesPresentationProvider value={preferences}>
    <View style={{ flex: 1, backgroundColor: preferences.colors.background, paddingTop: 64 }}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 8 }}>
        {['Home', 'Progress', 'Settings'].map(value => <Pressable key={value} testID={`solo23-${value}`} accessibilityRole="button" onPress={() => setPanel(value)}><Text style={{ color: '#fff', padding: 6 }}>{value}</Text></Pressable>)}
      </View>
      {failed ? <Text>Fixture catalog unavailable</Text> : !ready ? <Text>Preparing fixture catalog</Text> : <Screen>
        {panel === 'Home' ? <HomeTab activeTrack={activeTrack} activeSession={null} homePractice={{ kind: "none" }} capturedAt="2026-10-15T12:00:00.000Z" reviewQueueItems={[]} algorithmsDashboard={null} dashboardError={null}
          homePlan={null} trainingAttempts={[]} showGoalInvitation={false} goalInvitationAudience="guest"
          onChangeTrack={noop} onChooseTopic={noop} onDismissGoalOnboarding={async () => unavailable()} onOpenActivity={noop} onOpenSettings={() => setPanel('Settings')}
          onSetGoal={noop} onRecommendationAction={noop} onHomePlanAction={noop} onRetryHomePlan={noop} onStartLearning={noop} />
          : panel === 'Progress' ? <ProgressTab activeTrack={activeTrack} activityRecords={[]} evidence={projectProgressEvidence({ activeTrackId: activeTrack.id, trainingAttempts: [], reviewQueueItems: [], now: "2026-10-15T12:00:00.000Z" })}
            onChangeTrack={noop} onOpenActivity={noop} onOpenPractice={noop} onOpenGoal={noop} />
          : <SettingsTab account={getSettingsAccountPresentation({ kind: 'guest' })} onOpenSecurity={noop} onOpenAppearance={noop} onOpenAccount={noop}
            onOpenBackendDiagnostics={noop} onOpenGoal={noop} onOpenLanguage={noop} onOpenLegalInformation={noop} onOpenNotifications={noop}
            onOpenPremium={noop} onOpenYourData={noop} onSignOut={async () => unavailable()} />}
      </Screen>}
    </View>
  </AppPreferencesPresentationProvider></SafeAreaProvider>;
}
registerRootComponent(App);
