'use strict';

/**
 * Minimal EventSource (SSE) for React Native using XMLHttpRequest.
 * Replaces the Node `eventsource` package which pulls in `url`/`http`/`https`.
 *
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html
 */
class RnEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  /**
   * @param {string} url
   */
  constructor(url) {
    this.url = url;
    this.readyState = RnEventSource.CONNECTING;
    /** @type {XMLHttpRequest | null} */
    this._xhr = null;
    this._opened = false;
    /** @type {string[]} */
    this._eventData = [];
    /** @type {string | undefined} */
    this._eventId;
    /** @type {string} */
    this._lineBuf = '';
    /** @type {number} */
    this._lastResponseLen = 0;

    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;

    this._connect();
  }

  _connect() {
    const xhr = new XMLHttpRequest();
    this._xhr = xhr;
    xhr.open('GET', this.url);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        const status = xhr.status;
        if (status < 200 || status >= 300) {
          this.readyState = RnEventSource.CLOSED;
          if (typeof this.onerror === 'function') {
            this.onerror({message: `HTTP ${status}`});
          }
          xhr.abort();
          return;
        }
        if (!this._opened) {
          this._opened = true;
          this.readyState = RnEventSource.OPEN;
          if (typeof this.onopen === 'function') {
            this.onopen();
          }
        }
      }
    };

    xhr.onprogress = () => {
      const text = xhr.responseText || '';
      const chunk = text.slice(this._lastResponseLen);
      this._lastResponseLen = text.length;
      if (chunk) {
        this._appendChunk(chunk);
      }
    };

    xhr.onerror = () => {
      if (this.readyState === RnEventSource.CLOSED) {
        return;
      }
      this.readyState = RnEventSource.CLOSED;
      if (typeof this.onerror === 'function') {
        this.onerror({});
      }
    };

    xhr.onloadend = () => {
      if (this.readyState === RnEventSource.CLOSED) {
        return;
      }
      this.readyState = RnEventSource.CLOSED;
      if (typeof this.onerror === 'function') {
        this.onerror({});
      }
    };

    try {
      xhr.send();
    } catch (e) {
      this.readyState = RnEventSource.CLOSED;
      if (typeof this.onerror === 'function') {
        this.onerror(e);
      }
    }
  }

  /**
   * @param {string} chunk
   */
  _appendChunk(chunk) {
    this._lineBuf += chunk;
    const parts = this._lineBuf.split(/\r?\n/);
    this._lineBuf = parts.pop() ?? '';

    for (const raw of parts) {
      const line = raw;
      if (line === '') {
        this._flushEvent();
        continue;
      }
      if (line.startsWith('data:')) {
        this._eventData.push(line.slice(5).replace(/^\s/, ''));
        continue;
      }
      if (line.startsWith('id:')) {
        this._eventId = line.slice(3).replace(/^\s/, '');
        continue;
      }
      // ignore: event:, retry:, comments (:)
    }
  }

  _flushEvent() {
    if (!this._eventData.length) {
      this._eventId = undefined;
      return;
    }
    const data = this._eventData.join('\n');
    const lastEventId = this._eventId ?? '';
    this._eventData = [];
    this._eventId = undefined;
    if (typeof this.onmessage === 'function') {
      this.onmessage({data, lastEventId});
    }
  }

  close() {
    this.readyState = RnEventSource.CLOSED;
    if (this._xhr) {
      this._xhr.abort();
      this._xhr = null;
    }
  }
}

module.exports = RnEventSource;
