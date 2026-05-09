/**
 * Fabric-only RendererProxy fork.
 *
 * In RN 0.85 bridgeless mode the Paper renderer (ReactNativeRenderer) may not
 * initialise, which breaks findNodeHandle and friends that
 * RendererImplementation.js hard-codes to getPaperMethod().
 *
 * The Fabric renderer exports the same core API surface, so we delegate
 * everything to ReactFabric.  RendererProxy.js documents this fork pattern.
 *
 * @format
 */

'use strict';

let _fabric;
function fabric() {
  if (_fabric == null) {
    _fabric =
      require('react-native/Libraries/Renderer/shims/ReactFabric').default;
  }
  return _fabric;
}

exports.renderElement = function renderElement({
  element,
  rootTag,
  useFabric,
  useConcurrentRoot,
}) {
  const {onCaughtError, onRecoverableError, onUncaughtError} =
    require('react-native/src/private/renderer/errorhandling/ErrorHandlers');

  fabric().render(element, rootTag, null, useConcurrentRoot, {
    onCaughtError,
    onUncaughtError,
    onRecoverableError,
  });
};

exports.dispatchCommand = function dispatchCommand(handle, command, args) {
  return fabric().dispatchCommand(handle, command, args);
};

exports.findHostInstance_DEPRECATED = function findHostInstance_DEPRECATED() {
  return fabric().findHostInstance_DEPRECATED.apply(null, arguments);
};

exports.findNodeHandle = function findNodeHandle() {
  return fabric().findNodeHandle.apply(null, arguments);
};

exports.sendAccessibilityEvent = function sendAccessibilityEvent() {
  return fabric().sendAccessibilityEvent.apply(null, arguments);
};

exports.unmountComponentAtNodeAndRemoveContainer =
  function unmountComponentAtNodeAndRemoveContainer(containerTag) {
    var f = fabric();
    if (typeof f.unmountComponentAtNodeAndRemoveContainer === 'function') {
      return f.unmountComponentAtNodeAndRemoveContainer(containerTag);
    }
    if (typeof f.stopSurface === 'function') {
      return f.stopSurface(containerTag);
    }
  };

exports.unstable_batchedUpdates = function unstable_batchedUpdates(fn, a) {
  var f = fabric();
  if (typeof f.unstable_batchedUpdates === 'function') {
    return f.unstable_batchedUpdates(fn, a);
  }
  return fn(a);
};

exports.isChildPublicInstance = function isChildPublicInstance() {
  return fabric().isChildPublicInstance.apply(null, arguments);
};

exports.getNodeFromInternalInstanceHandle =
  function getNodeFromInternalInstanceHandle() {
    return fabric().getNodeFromInternalInstanceHandle.apply(null, arguments);
  };

exports.getPublicInstanceFromInternalInstanceHandle =
  function getPublicInstanceFromInternalInstanceHandle() {
    return fabric().getPublicInstanceFromInternalInstanceHandle.apply(
      null,
      arguments,
    );
  };

exports.getPublicInstanceFromRootTag = function getPublicInstanceFromRootTag() {
  return fabric().getPublicInstanceFromRootTag.apply(null, arguments);
};

exports.isProfilingRenderer = function isProfilingRenderer() {
  return Boolean(__DEV__);
};
