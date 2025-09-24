/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Broad Institute
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import Oauth from "./oauth.js"
import {isFile} from './fileUtils.js'
import {parseUri} from './uriUtils.js'
import {decodeDataURI, isgzipped, ungzip} from './bgzf.js'
import * as GoogleUtils from './google-utils/googleUtils.js'
import * as GoogleAuth from './google-utils/googleAuth.js'
import * as GoogleDrive from './google-utils/googleDrive.js'
import Throttle from "./throttle.js"
import {StringUtils} from "./index.js"

class IGVXhr {

    UCSC_HOST = "hgdownload.soe.ucsc.edu"
    UCSC_BACKUP_HOST = "genome-browser.s3.us-east-1.amazonaws.com"


    constructor() {
        this.apiKey = undefined
        this.googleThrottle = new Throttle({
            requestsPerSecond: 8
        })
        this.RANGE_WARNING_GIVEN = false
        this.oauth = new Oauth()
        this.corsProxy = undefined
    }

    setApiKey(key) {
        this.apiKey = key
    }

    async loadArrayBuffer(url, options) {
        options = options || {}
        if (!options.responseType) {
            options.responseType = "arraybuffer"
        }
        if (isFile(url)) {
            return this._loadFileSlice(url, options)
        } else {
            return this.load(url, options)
        }
    }

    /**
     * A wrapper around loadArrayBuffer that inflates gzipped data
     * @param url
     * @param options
     * @returns {Promise<Uint8Array>}
     */
    async loadByteArray(url, options) {
        const arraybuffer = await this.loadArrayBuffer(url, options)
        let plain
        if (isgzipped(arraybuffer)) {
            plain = ungzip(arraybuffer)
        } else {
            plain = new Uint8Array(arraybuffer)
        }
        return plain
    }


    async loadJson(url, options) {
        options = options || {}
        const method = options.method || (options.sendData ? "POST" : "GET")
        if (method === "POST") {
            options.contentType = "application/json"
        }
        const result = await this.loadString(url, options)
        if (result) {
            return JSON.parse(result)
        } else {
            return result
        }
    }

    async loadString(path, options) {
        options = options || {}
        if (path instanceof File) {
            return this._loadStringFromFile(path, options)
        } else {
            return this._loadStringFromUrl(path, options)
        }
    }

    async load(url, options) {

        options = options || {}
        const urlType = typeof url

        // Resolve functions, promises, and functions that return promises
        url = await (typeof url === 'function' ? url() : url)

        if (isFile(url)) {
            return this._loadFileSlice(url, options)
        } else if (StringUtils.isString(url)) {
            if (url.startsWith("data:")) {
                const buffer = decodeDataURI(url).buffer
                if (options.range) {
                    const rangeEnd = options.range.size ? options.range.start + options.range.size : buffer.byteLength
                    return buffer.slice(options.range.start, rangeEnd)
                } else {
                    return buffer
                }
            } else {
                if (url.startsWith("https://drive.google.com")) {
                    url = GoogleDrive.getDriveDownloadURL(url)
                }
                if (GoogleUtils.isGoogleDriveURL(url) || url.startsWith("https://www.dropbox.com")) {
                    return this.googleThrottle.add(async () => {
                        return this._loadURL(url, options)
                    })
                } else {
                    return this._loadURL(url, options)
                }
            }
        } else {
            throw Error(`url must be either a 'File', 'string', 'function', or 'Promise'.  Actual type: ${urlType}`)
        }
    }

    async _loadURL(url, options) {

        const self = this
        const _url = url   // The unmodified URL, needed in case of an oAuth retry
        const {host} = parseUri(_url)

        url = mapUrl(url)

        options = options || {}

        let oauthToken = options.oauthToken || this.getOauthToken(url)
        if (oauthToken) {
            oauthToken = await (typeof oauthToken === 'function' ? oauthToken() : oauthToken)
        }

        return new Promise(function (resolve, reject) {

            // Various Google tansformations
            if (GoogleUtils.isGoogleURL(url) && !isGoogleStorageSigned(url)) {
                if (GoogleUtils.isGoogleStorageURL(url)) {
                    url = GoogleUtils.translateGoogleCloudURL(url)
                }
                url = addApiKey(url)

                if (GoogleUtils.isGoogleDriveURL(url)) {
                    addTeamDrive(url)
                }

                // If we have an access token try it, but don't force a signIn or request for scopes yet
                if (!oauthToken) {
                    oauthToken = getCurrentGoogleAccessToken()
                }
            }

            const headers = options.headers || {}
            if (oauthToken) {
                addOauthHeaders(headers, oauthToken)
            }
            const range = options.range


            const xhr = new XMLHttpRequest()
            const sendData = options.sendData || options.body
            const method = options.method || (sendData ? "POST" : "GET")
            const responseType = options.responseType
            const contentType = options.contentType
            const mimeType = options.mimeType

            xhr.open(method, url)

            if (options.timeout) {
                xhr.timeout = options.timeout
            }

            if (range) {
                let rangeEnd = ""
                if (range.size) {
                    rangeEnd = range.start + range.size - 1
                }
                xhr.setRequestHeader("Range", "bytes=" + range.start + "-" + rangeEnd)
                //      xhr.setRequestHeader("Cache-Control", "no-cache");    <= This can cause CORS issues, disabled for now
            }
            if (contentType) {
                xhr.setRequestHeader("Content-Type", contentType)
            }
            if (mimeType) {
                xhr.overrideMimeType(mimeType)
            }
            if (responseType) {
                xhr.responseType = responseType
            }
            if (headers) {
                for (let key of Object.keys(headers)) {
                    const value = headers[key]
                    xhr.setRequestHeader(key, value)
                }
            }

            // NOTE: using withCredentials with servers that return "*" for access-allowed-origin will fail
            if (options.withCredentials === true) {
                xhr.withCredentials = true
            }

            xhr.onload = async function (event) {

                const isFileProtocol = url.toLowerCase().startsWith("file:")

                // when the url points to a local file, the status is 0
                if ((xhr.status >= 200 && xhr.status <= 300) || (isFileProtocol && xhr.status === 0)) {
                    if ("HEAD" === options.method) {
                        // Support fetching specific headers.  Attempting to fetch all headers can be problematic with CORS
                        const headers = options.requestedHeaders || ['content-length']
                        const headerMap = {}
                        for (let h of headers) {
                            headerMap[h] = xhr.getResponseHeader(h)
                        }
                        resolve(headerMap)
                    } else {
                        // Assume "GET" or "POST"
                        if (range && xhr.status !== 206 && range.start !== 0) {

                            // For small files a range starting at 0 can return the whole file => 200
                            // Provide just the slice we asked for, throw out the rest quietly
                            // If file is large warn user
                            if (xhr.response.length > 1000000 && !self.RANGE_WARNING_GIVEN) {
                                alert(`Warning: Range header ignored for URL: ${url}.  This can have severe performance impacts.`)
                            }
                            resolve(xhr.response.slice(range.start, range.start + range.size))
                        } else {
                            resolve(xhr.response)
                        }
                    }
                } else if (xhr.status === 416) {
                    handleError(Error(`416 Unsatisfiable Range`))
                } else if (GoogleAuth.isInitialized() &&
                    ((xhr.status === 404 || xhr.status === 401 || xhr.status === 403) &&
                        GoogleUtils.isGoogleURL(url)) &&
                    !options.retries) {
                    tryGoogleAuth()

                } else {
                    const error = new Error(`Error accessing resource: ${url} status: ${xhr.status}`)
                    if (xhr.status === 403) {
                        handleError("Access forbidden: " + url)
                    } else if (host === self.UCSC_HOST) {
                        tryUcscBackup(self.UCSC_HOST, self.UCSC_BACKUP_HOST, error)
                    } else if (xhr.status === 0 && self.corsProxy && !options.corsProxyRetried) {
                        tryCorsProxy(error)
                    } else {
                        handleError(error)
                    }
                }
            }

            xhr.onerror = function (event) {
                const error = new Error(`Error accessing resource: ${url} status: ${xhr.status}`)
                if (GoogleUtils.isGoogleURL(url) && !options.retries) {
                    tryGoogleAuth()
                } else if (host === self.UCSC_HOST) {
                    tryUcscBackup(self.UCSC_HOST, self.UCSC_BACKUP_HOST, error)
                } else if (self.corsProxy && !options.corsProxyRetried) {
                    tryCorsProxy(error)
                } else {
                    handleError(error)
                }
            }

            xhr.ontimeout = function (event) {
                handleError("Timed out")
            }

            xhr.onabort = function (event) {
                console.log("Aborted")
                reject(event)
            }

            try {
                xhr.send(sendData)
            } catch (e) {
                if (GoogleUtils.isGoogleURL(url) && !options.retries) {
                    tryGoogleAuth()
                } else {
                    handleError(e)
                }
            }


            function handleError(error) {
                if (reject) {
                    reject(error)
                } else {
                    throw error
                }
            }

            async function tryCorsProxy(error) {
                options.corsProxyRetried = true
                const proxyUrl = self.corsProxy + (_url.includes("?") ? "&" : "?") + "url=" + encodeURIComponent(_url)
                try {
                    const result = await self._loadURL(proxyUrl, options)
                    resolve(result)
                } catch (e) {
                    handleError(error)
                }
            }

            async function tryUcscBackup(UCSC_HOST, UCSC_BACKUP_HOST, error) {
                const backupUrl = _url.replace(UCSC_HOST, UCSC_BACKUP_HOST)
                try {
                    const result = await self._loadURL(backupUrl, options)
                    resolve(result)
                } catch (e) {
                    handleError(error)
                }
            }

            async function tryGoogleAuth() {
                try {
                    const accessToken = await fetchGoogleAccessToken(_url)
                    options.retries = 1
                    options.oauthToken = accessToken
                    const response = await self.load(_url, options)
                    resolve(response)
                } catch (e) {
                    if (e.error) {
                        const msg = e.error.startsWith("popup_blocked") ?
                            "Google login popup blocked by browser." :
                            e.error
                        alert(msg)
                    } else {
                        handleError(e)
                    }
                }
            }


        })

    }

    async _loadFileSlice(localfile, options) {

        let blob = (options && options.range) ?
            localfile.slice(options.range.start, options.range.start + options.range.size) :
            localfile

        const arrayBuffer = await blob.arrayBuffer()

        if ("arraybuffer" === options.responseType) {
            return arrayBuffer
        } else {
            return arrayBufferToString(arrayBuffer)
        }
    }

    async _loadStringFromFile(localfile, options) {

        const blob = options.range ? localfile.slice(options.range.start, options.range.start + options.range.size) : localfile
        const arrayBuffer = await blob.arrayBuffer()
        return arrayBufferToString(arrayBuffer)
    }

    async _loadStringFromUrl(url, options) {

        options = options || {}
        options.responseType = "arraybuffer"
        const data = await this.load(url, options)
        return arrayBufferToString(data)
    }

    /**
     * Explicity set an oAuth token for use with given host.  If host is undefined token is used for google api access*
     * @param token
     * @param host
     */
    setOauthToken(token, host) {
        this.oauth.setToken(token, host)
    }

    /**
     * Return an oauth token for the URL if we have one.  This method does not force sign-in, and the token may
     * or may not be valid.  Sign-in is triggered on request failure.
     * *
     * @param url
     * @returns {*}
     */
    getOauthToken(url) {

        // Google is the default provider, don't try to parse host for google URLs
        const host = GoogleUtils.isGoogleURL(url) ?
            undefined :
            parseUri(url).host

        // First check the explicit settings (i.e. token set through the API)
        let token = this.oauth.getToken(host)
        if (token) {
            return token
        } else if (host === undefined) {
            // Now try Google oauth tokens previously obtained.  This will return undefined if google oauth is not
            // configured.
            const googleToken = getCurrentGoogleAccessToken()
            if (googleToken && googleToken.expires_at > Date.now()) {
                return googleToken.access_token
            }
        }
    }

    /**
     * Return the content length of the file at the given URL.  This is not guaranteed to succeed, some servers
     * do not support or allow the content-length header.
     *
     * @param url
     * @param options
     * @returns {Promise<unknown>}
     */
    async getContentLength(url, options) {
        if (isFile(url)) {
            return url.size
        } else {
            try {
                options = options || {}
                options.method = 'HEAD'
                options.requestedHeaders = ['content-length']
                const headerMap = await this._loadURL(url, options)
                const contentLengthString = headerMap['content-length']
                return contentLengthString ? Number.parseInt(contentLengthString) : 0
            } catch (e) {
                console.error(e)
                return -1
            }
        }
    }

}

function isGoogleStorageSigned(url) {
    return url.indexOf("X-Goog-Signature") > -1
}


/**
 * Return a Google oAuth token, triggering a sign in if required.   This method should not be called until we know
 * a token is required, that is until we've tried the url and received a 401, 403, or 404.
 *
 * @param url
 * @returns the oauth token
 */
async function fetchGoogleAccessToken(url) {
    if (GoogleAuth.isInitialized()) {
        const scope = GoogleAuth.getScopeForURL(url)
        const access_token = await GoogleAuth.getAccessToken(scope)
        return access_token
    } else {
        throw Error(
            `Authorization is required, but Google oAuth has not been initalized. Contact your site administrator for assistance.`)
    }
}

/**
 * Return the current google access token, if one exists.  Do not triger signOn or request additional scopes.
 * @returns {undefined|access_token}
 */
function getCurrentGoogleAccessToken() {
    if (GoogleAuth.isInitialized()) {
        const access_token = GoogleAuth.getCurrentAccessToken()
        return access_token
    } else {
        return undefined
    }
}

function addOauthHeaders(headers, acToken) {
    if (acToken) {
        headers["Cache-Control"] = "no-cache"
        headers["Authorization"] = "Bearer " + acToken
    }
    return headers
}


function addApiKey(url) {
    let apiKey = igvxhr.apiKey
    if (!apiKey && typeof gapi !== "undefined") {
        apiKey = gapi.apiKey
    }
    if (apiKey !== undefined && !url.includes("key=")) {
        const paramSeparator = url.includes("?") ? "&" : "?"
        url = url + paramSeparator + "key=" + apiKey
    }
    return url
}

function addTeamDrive(url) {
    if (url.includes("supportsTeamDrive")) {
        return url
    } else {
        const paramSeparator = url.includes("?") ? "&" : "?"
        url = url + paramSeparator + "supportsTeamDrive=true"
    }
}

function parseResponseHeaders(headers) {

    // Convert the header string into an array of individual headers
    const arr = headers.trim().split(/[\r\n]+/)

    // Create a map of header names to values
    const headerMap = {}
    for (let line of arr) {
        const parts = line.split(": ")
        const header = parts.shift()
        const value = parts.join(": ")
        headerMap[header] = value
    }

    return headerMap
}

/**
 * Perform some well-known url mappings.
 * @param url
 */
function mapUrl(url) {

    if (url.startsWith("https://www.dropbox.com")) {
        return url.replace("//www.dropbox.com", "//dl.dropboxusercontent.com")
    } else if (url.startsWith("https://drive.google.com")) {
        return GoogleDrive.getDriveDownloadURL(url)
    } else if (url.includes("//www.broadinstitute.org/igvdata")) {
        return url.replace("//www.broadinstitute.org/igvdata", "//data.broadinstitute.org/igvdata")
    } else if (url.includes("//igvdata.broadinstitute.org")) {
        return url.replace("//igvdata.broadinstitute.org", "//s3.amazonaws.com/igv.broadinstitute.org")
    } else if (url.includes("//igv.genepattern.org")) {
        return url.replace("//igv.genepattern.org", "//igv-genepattern-org.s3.amazonaws.com")
    } else if (url.startsWith("ftp://ftp.ncbi.nlm.nih.gov/geo")) {
        return url.replace("ftp://", "https://")
    } else {
        return url
    }
}


function arrayBufferToString(arraybuffer) {

    let plain
    if (isgzipped(arraybuffer)) {
        plain = ungzip(arraybuffer)
    } else {
        plain = new Uint8Array(arraybuffer)
    }

    if ('TextDecoder' in getGlobalObject()) {
        return new TextDecoder().decode(plain)
    } else {
        return decodeUTF8(plain)
    }
}

/**
 * Use when TextDecoder is not available (primarily IE).
 *
 * From: https://gist.github.com/Yaffle/5458286
 *
 * @param octets
 * @returns {string}
 */
function decodeUTF8(octets) {
    var string = ""
    var i = 0
    while (i < octets.length) {
        var octet = octets[i]
        var bytesNeeded = 0
        var codePoint = 0
        if (octet <= 0x7F) {
            bytesNeeded = 0
            codePoint = octet & 0xFF
        } else if (octet <= 0xDF) {
            bytesNeeded = 1
            codePoint = octet & 0x1F
        } else if (octet <= 0xEF) {
            bytesNeeded = 2
            codePoint = octet & 0x0F
        } else if (octet <= 0xF4) {
            bytesNeeded = 3
            codePoint = octet & 0x07
        }
        if (octets.length - i - bytesNeeded > 0) {
            var k = 0
            while (k < bytesNeeded) {
                octet = octets[i + k + 1]
                codePoint = (codePoint << 6) | (octet & 0x3F)
                k += 1
            }
        } else {
            codePoint = 0xFFFD
            bytesNeeded = octets.length - i
        }
        string += String.fromCodePoint(codePoint)
        i += bytesNeeded + 1
    }
    return string
}


function getGlobalObject() {
    if (typeof self !== 'undefined') {
        return self
    }
    if (typeof global !== 'undefined') {
        return global
    } else {
        return window
    }
}

function isAmazonV4Signed(url) {
    return url.indexOf("X-Amz-Signature") > -1
}

let mappings

const mappingURL = "https://raw.githubusercontent.com/igvteam/igv-data/refs/heads/main/data/url_mappings.tsv"

async function convert(url) {

    if (!mappings) {
        mappings = new Map()

        try {
            const data = await igvxhr.loadString(mappingURL)
            const lines = data.split("\n")
            for (line of lines) {
                if (line.startsWith("#")) continue

                const tokens = line.split('\t')
                if (tokens.length === 2) {
                    mappings.set(tokens[0], tokens[1])
                }
            }
        } catch (e) {
            console.error(`Error loading url mappings`, e)
        }
    }

    return mappings.has(url) ? mappings.get(url) : url
}


const igvxhr = new IGVXhr()

export default igvxhr
export {arrayBufferToString, mapUrl}
