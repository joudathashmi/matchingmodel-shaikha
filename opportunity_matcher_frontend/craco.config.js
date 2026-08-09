const webpack = require("webpack");

/**
 * pptxgenjs dynamically imports `node:fs` / `node:https` for Node builds.
 * CRA Webpack 5 cannot resolve the `node:` scheme in the browser bundle.
 * Strip the scheme and stub Node builtins so Analytics Office export can ship.
 */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        fs: false,
        path: false,
        https: false,
        http: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        zlib: false,
        url: false,
        net: false,
        tls: false,
        child_process: false,
      };

      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      ];

      return webpackConfig;
    },
  },
};
