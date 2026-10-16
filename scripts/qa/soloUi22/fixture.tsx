/** Render actual changed screens in the existing dev client, using read-only fixture ports. */
import '../../../src/i18n';
import i18n from '../../../src/i18n';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation } from '../../../src/preferences/appPreferencesContext';
import { HomeTab } from '../../../src/features/home/tabs/HomeTab';
import { MistakesReviewScreen } from '../../../src/features/review/MistakesReviewScreen';
import { GoalCadenceScreen } from '../../../src/features/home/GoalCadenceScreen';
import { Screen } from '../../../src/components/Screen';
import { buildNavigationTheme } from '../../../src/theme/navigationTheme';
import { getTrackDisplay } from '../../../src/domain';
import { fixture, trackId } from './ports';
const Stack = createNativeStackNavigator();
const noop = () => {};
const guidance = {
  state: 'on_track', reason: 'on_track', tone: 'positive', messageKey: 'targetDateGuidance.onTrack',
  home: { primary: { kind: 'start_next_session', destination: 'Practice' } },
  progress: { primary: { kind: 'start_next_session', destination: 'Practice' }, secondary: null },
  facts: { requiredPace: { kind: 'numeric', value: 4, unit: 'questions_per_week' }, actualPace: { kind: 'numeric', value: 5, unit: 'questions_per_week' }, forecast: { kind: 'date', value: '2026-11-10' }, target: { kind: 'date', value: '2026-11-15' } },
};
function App() {
  const [panel, setPanel] = useState('primary');
  const [locale, setLocale] = useState<'en' | 'de'>('en');
  const preferences = { ...deriveAppPreferencesPresentation('dark', locale, 'dark', locale), ready: true, setLanguage: async () => {}, setAppearance: async () => {} };
  fixture.secondary = panel === 'secondary';
  return <SafeAreaProvider><AppPreferencesPresentationProvider value={preferences}>
    <View style={{ flex: 1, backgroundColor: '#0d1520', paddingTop: 64 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 8 }}>
        {['primary', 'secondary', 'review', 'cadence'].map(value => <Pressable key={value} accessibilityRole="button" onPress={() => setPanel(value)}><Text style={{ color: '#fff', padding: 6 }}>{value}</Text></Pressable>)}
        <Pressable accessibilityRole="button" onPress={() => { const next = locale === 'en' ? 'de' : 'en'; void i18n.changeLanguage(next); setLocale(next); }}><Text style={{ color: '#fff', padding: 6 }}>Locale {locale}</Text></Pressable>
      </View>
      <NavigationContainer theme={buildNavigationTheme(preferences.colors, preferences.colorMode)}><Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="Smoke22">{props => panel === 'review' ? <MistakesReviewScreen /> : panel === 'cadence' ? <GoalCadenceScreen {...props as any} /> : <Screen><HomeTab {...{
        activeTrack: getTrackDisplay(trackId), activeSession: null, algorithmsDashboard: null, dashboardError: null,
        homePlan: { kind: 'ready', guidance, plan: { timezone: 'Europe/Warsaw' }, chapterAccess: [], session: { sessionLength: 10 }, day: { status: 'scheduled' }, dueReviewCount: 0 },
        trainingAttempts: [], reviewQueueItems: [], showGoalInvitation: false, goalInvitationAudience: 'guest',
        onChangeTrack: noop, onChooseTopic: noop, onDismissGoalOnboarding: async () => {}, onOpenActivity: noop, onOpenSettings: noop, onSetGoal: noop, onRecommendationAction: noop, onHomePlanAction: noop, onRetryHomePlan: noop, onStartLearning: noop,
      } as any} /></Screen>}</Stack.Screen></Stack.Navigator></NavigationContainer>
    </View>
  </AppPreferencesPresentationProvider></SafeAreaProvider>;
}
registerRootComponent(App);
