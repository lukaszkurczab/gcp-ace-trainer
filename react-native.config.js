// Local Android uses Firebase's JS Auth emulator and the local App Check token.
// The native App Check package eagerly requires a registered default Firebase app.
// Keep that cloud-native graph out of this explicitly separate local application.
const localAndroid = Boolean(process.env.PATTERNLY_ANDROID_LOCAL_APP);
if (localAndroid) {
  // Reuse the build configuration's closed local-mode gate before changing linking.
  require("./app.config.js").createExpoConfig(process.env);
}

module.exports = {
  dependencies: localAndroid ? {
    "@react-native-firebase/app": { platforms: { android: null } },
    "@react-native-firebase/app-check": { platforms: { android: null } },
  } : {},
};
