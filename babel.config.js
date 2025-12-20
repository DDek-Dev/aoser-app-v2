// module.exports = function (api) {
//   api.cache(true);
//   let plugins = [];

//   return {
//     presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
//     plugins: [
//      'nativewind/babel', // Must be inside plugins, not presets
//       // 'react-native-reanimated/plugin',
//     ]
//   };
// };


module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
          blacklist: null,
          whitelist: null,
          blocklist: null,
          allowlist: null,
        }
      ]
    ]
  };
};