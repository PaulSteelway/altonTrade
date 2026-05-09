module.exports = {
  assets: ['./assets/fonts/'],
  dependencies: {
    // Appodeal v4.1 uses bridge-based RCTEventEmitter which crashes in
    // RN 0.85 Bridgeless/Fabric mode. Disable native autolinking until
    // Appodeal releases a Fabric-compatible version.
    'react-native-appodeal': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
