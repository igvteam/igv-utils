// Emulate the browser XMLHttpRequest object for remote files
// url will be a relative file path
// supports 'GET' only
// support range header, responseType

import {XMLHttpRequestLocal} from './XMLHttpRequestLocal.js';
import {XMLHttpRequest} from './w3XMLHttpRequest.js'

/**
 * Emulation of w3c XMLHttpRequest for local file paths -- useful for unit tests with no server.
 */

class XMLHttpRequestMock {

    constructor() {
        this.local = new XMLHttpRequestLocal();
        this.remote = new XMLHttpRequest();
        this.status = undefined;
        this.onload = undefined;
        this.onerror = undefined;
        this.ontimeout = undefined;
        this.onabort = undefined;
        this.response = undefined;
        this.headers = new Map();
        this.timeout = 0;
        this.timeoutId = undefined;
        this.timedOut = false;
    }

    open(method, url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            this.impl = new XMLHttpRequest();
        } else {
            this.impl = new XMLHttpRequestLocal();
        }
        this.impl.open(method, url);
    }

    setRequestHeader(key, value) {
        this.impl.setRequestHeader(key, value);
    }

    send(data) {
        const self = this;
        this.impl.responseType = this.responseType;
        this.impl.timeout = this.timeout;

        this.impl.onerror = function (event) {
            self.clearTimeoutTimer();
            if (typeof self.onerror === 'function') self.onerror(event);
        }
        this.impl.ontimeout = this.ontimeout;
        this.impl.onabort = function (event) {
            self.clearTimeoutTimer();
            // A timeout aborts the request -- ontimeout has already reported it, don't report it twice
            if (!self.timedOut && typeof self.onabort === 'function') self.onabort(event);
        }
        if (typeof this.onload === 'function') {
            this.impl.onload = function () {
                self.clearTimeoutTimer();
                self.status = self.impl.status;
                self.response = self.impl.response;
                self.onload();
            }
        }

        // The vendored XMLHttpRequest honors the "timeout" property but never enforces it -- no timer is ever
        // started.  Enforce it here so that timeout handling is exercised under test.
        if (this.timeout) {
            this.timeoutId = setTimeout(function () {
                self.timedOut = true;
                // Report before aborting: abort would otherwise settle the request with an abort event first
                if (typeof self.ontimeout === 'function') self.ontimeout();
                self.impl.abort();
            }, this.timeout);
        }

        this.impl.send(data);
    }

    clearTimeoutTimer() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
    }

    abort() {
        this.clearTimeoutTimer();
        this.impl.abort();
    }

    getAllReponseHeaders() {
        return this.impl.getAllResponseHeaders()
    }

    getResponseHeader(name) {
        return this.impl.getResponseHeader(name)
    }
}

export {XMLHttpRequestMock}

