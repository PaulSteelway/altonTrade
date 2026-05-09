const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const FABRIC_PROXY = path.resolve(__dirname, 'FabricOnlyRendererProxy.js');
const RENDERER_PROXY_SUFFIX = path.join(
  'Libraries',
  'ReactNative',
  'RendererProxy.js',
);
const RN_EVENT_SOURCE = path.resolve(
  __dirname,
  'src/shims/rn-eventsource.js',
);
const TONCONNECT_ISOMORPHIC_EVENTSOURCE = path.resolve(
  __dirname,
  'src/shims/tonconnect-isomorphic-eventsource.js',
);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      // Node `eventsource` uses `url`/`http`; alias to RN XHR implementation.
      eventsource: RN_EVENT_SOURCE,
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === '@tonconnect/isomorphic-eventsource') {
        return {filePath: TONCONNECT_ISOMORPHIC_EVENTSOURCE, type: 'sourceFile'};
      }

      const defaultResult = context.resolveRequest(
        context,
        moduleName,
        platform,
      );

      // In bridgeless / Fabric-only mode the default RendererProxy loads the
      // Paper renderer for findNodeHandle & friends, which crashes.  Redirect
      // to a Fabric-only fork (pattern documented in RendererProxy.js).
      if (
        defaultResult?.type === 'sourceFile' &&
        defaultResult.filePath?.endsWith(RENDERER_PROXY_SUFFIX)
      ) {
        return {filePath: FABRIC_PROXY, type: 'sourceFile'};
      }

      return defaultResult;
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
