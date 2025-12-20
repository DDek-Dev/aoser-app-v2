const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);



// Add server port configuration
config.server = {
  port: 8081,
};


module.exports = withNativeWind(config, { input: './global.css' });



// const { getDefaultConfig } = require('expo/metro-config');
// const { withNativeWind } = require('nativewind/metro');

// const config = getDefaultConfig(__dirname);

// // Add server port configuration
// config.server = {
//   port: 8081,
// };


// config.transformer = {
//   ...config.transformer,
//   babelTransformerPath: require.resolve('react-native-css-interop/metro'),
// };

// module.exports = withNativeWind(config, { input: './global.css' });