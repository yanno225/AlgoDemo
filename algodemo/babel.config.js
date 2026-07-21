module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 délègue la compilation des worklets à react-native-worklets.
    // Sans ce plugin, aucun useAnimatedStyle/withSpring ne s'exécute sur le UI thread.
    // Doit rester le dernier plugin de la liste.
    plugins: ['react-native-worklets/plugin'],
  };
};
