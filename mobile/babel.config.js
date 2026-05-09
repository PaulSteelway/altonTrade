module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4.3+ re-exports the worklets plugin — list only one or Babel reports duplicates.
  plugins: ['react-native-reanimated/plugin'],
};
