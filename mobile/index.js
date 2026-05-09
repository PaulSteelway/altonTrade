/**
 * @format
 * Must run before @tonconnect/sdk / uuid (crypto.getRandomValues in Hermes/RN).
 */
import 'react-native-get-random-values';
/** Hermes: без TextDecoder падает расшифровка bridge-сообщений @tonconnect/sdk (gatewayListener / decrypt). */
import 'fast-text-encoding';
/** Hermes: Ton Connect / зависимости ожидают Node Buffer. */
import {Buffer} from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
/** Часть библиотек (в т.ч. события) ожидает объект `window` как в браузере. */
if (typeof global.window === 'undefined') {
  global.window = global;
}
/**
 * Hermes: @tonconnect/sdk диспатчит внутренние события через CustomEvent (даже при analytics off).
 */
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.detail = eventInitDict.detail ?? null;
      this.bubbles = !!eventInitDict.bubbles;
      this.cancelable = !!eventInitDict.cancelable;
      this.defaultPrevented = false;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
}
/**
 * Hermes/RN: у `global` нет DOM EventTarget; @tonconnect/sdk (BrowserEventDispatcher)
 * вызывает window.dispatchEvent / addEventListener при восстановлении сессии.
 * `global.window` указывает на этот же объект — полифиллим его явно.
 */
if (typeof global.dispatchEvent !== 'function') {
  const listenersByType = new Map();
  function listenersFor(type) {
    let set = listenersByType.get(type);
    if (!set) {
      set = new Set();
      listenersByType.set(type, set);
    }
    return set;
  }
  global.addEventListener = function (type, listener) {
    if (typeof listener === 'function') {
      listenersFor(type).add(listener);
    }
  };
  global.removeEventListener = function (type, listener) {
    listenersByType.get(type)?.delete(listener);
  };
  global.dispatchEvent = function (event) {
    const type = event && event.type;
    if (!type) {
      return false;
    }
    const set = listenersByType.get(type);
    if (!set || set.size === 0) {
      return true;
    }
    for (const fn of [...set]) {
      try {
        fn.call(global, event);
      } catch {
        // ignore
      }
    }
    return !event.defaultPrevented;
  };
}
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
