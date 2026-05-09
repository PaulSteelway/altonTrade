'use strict';

/**
 * Drop-in for `@tonconnect/isomorphic-eventsource` that avoids the Node
 * `eventsource` package (and therefore `url`/`http`) in Metro.
 */
const RnEventSource = require('./rn-eventsource');

if (!global.EventSource) {
  global.EventSource = RnEventSource;
}

module.exports = {};
