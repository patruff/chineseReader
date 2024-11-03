// const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

// module.exports = function override(config, env) {
//   if (env === 'production') {
//     // Find and remove the existing WorkboxWebpackPlugin
//     config.plugins = config.plugins.filter(
//       plugin => !(plugin instanceof WorkboxWebpackPlugin.InjectManifest)
//     );

//     // Add our custom WorkboxWebpackPlugin configuration
//     config.plugins.push(
//       new WorkboxWebpackPlugin.InjectManifest({
//         swSrc: './src/service-worker.js',
//         maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
//         dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
//       })
//     );
//   }

//   return config;
// } 