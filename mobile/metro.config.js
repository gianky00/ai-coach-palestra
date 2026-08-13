const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    blockList: [
      /[\/\\]android[\/\\]build[\/\\].*/,
      /[\/\\]android[\/\\]app[\/\\]build[\/\\].*/,
      /[\/\\]android[\/\\]app[\/\\]\.cxx[\/\\].*/,
      /[\/\\]node_modules[\/\\]@react-native[\/\\]gradle-plugin[\/\\].*/,
      /[\/\\]node_modules[\/\\][^\/\\]+[\/\\]android[\/\\]build[\/\\].*/,
      /[\/\\]node_modules[\/\\]@[^\/\\]+[\/\\][^\/\\]+[\/\\]android[\/\\]build[\/\\].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
