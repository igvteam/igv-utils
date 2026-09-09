import Oauth from "./oauth.js"
import {isFile} from './fileUtils.js'
import {parseUri} from './uriUtils.js'
import {decodeDataURI, isgzipped, ungzip} from './bgzf.js'
import * as GoogleUtils from './google-utils/googleUtils.js'
import * as GoogleAuth from './google-utils/googleAuth.js'
import {getAccessToken} from './google-utils/googleAuth.js'
import Throttle from "./throttle.js"
import {StringUtils} from "./index.js"

const mappingURL = "https://igv.org/data/url_mappings.tsv"
// Generous -- the mapping table is only fetched after a request has already failed, it is not on the main path
const MAPPING_TIMEOUT = 5000

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
        options = {...options}       // Copy -- these methods add to options, the caller's object must not be modified
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
        options = {...options}
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
        options = {...options}
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
                return this._loadWithMapping(url, options)
            }
        } else {
            throw Error(`url must be either a 'File', 'string', 'function', or 'Promise'.  Actual type: ${urlType}`)
        }
    }

    /**
     * Load a URL, falling back to the url mapping table if the request fails.  The table maps references to
     * resources that have been, or will be, retired.  Most are still live -- so it is consulted only on failure,
     * and a request that succeeds never waits on it.
     */
    async _loadWithMapping(url, options) {

        try {
            // NOTE: "return await", not "return".  A bare return settles outside the try and the catch never runs.
            return await this._dispatch(url, {...options})
        } catch (e) {
            if (!isMappable(e)) throw e

            const mappedUrl = await getMapping(url)
            if (!mappedUrl) throw e

            try {
                return await this._dispatch(mappedUrl, {...options})
            } catch (mappedError) {
                // Surface the original failure, it names the url the caller actually asked for
                e.cause = mappedError
                throw e
            }
        }
    }

    /**
     * Send a URL request, through the throttle for hosts that require it.
     */
    async _dispatch(url, options) {
        if (GoogleUtils.isGoogleDriveURL(url) || url.startsWith("https://www.dropbox.com")) {
            return this.googleThrottle.add(async () => {
                return this._loadURL(url, options)
            })
        } else {
            return this._loadURL(url, options)
        }
    }

    async _loadURL(url, options) {

        const self = this
        const _url = url   // The unmodified URL, needed in case of an oAuth retry
        const {host} = parseUri(_url)

        url = mapUrl(url)

        options = options || {}

        let oauthToken
        if (GoogleUtils.isGoogleDriveURL(url)) {
            // Google drive urls always require oAuth
            oauthToken = await getAccessToken("https://www.googleapis.com/auth/drive.file")
        } else {
            oauthToken = options.oauthToken || this.getOauthToken(url)
            if (oauthToken) {
                oauthToken = await (typeof oauthToken === 'function' ? oauthToken() : oauthToken)
            }
        }

        return new Promise(function (resolve, reject) {

            // Various Google tansformations
            if (GoogleUtils.isGoogleURL(url) && !isGoogleStorageSigned(url)) {
                if (GoogleUtils.isGoogleStorageURL(url)) {
                    url = GoogleUtils.translateGoogleCloudURL(url)
                }
                url = addApiKey(url)

                if (GoogleUtils.isGoogleDriveURL(url)) {
                    url = addTeamDrive(url)
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
            for (let key of Object.keys(headers)) {
                xhr.setRequestHeader(key, headers[key])
            }

            // NOTE: using withCredentials with servers that return "*" for access-allowed-origin will fail
            if (options.withCredentials === true) {
                xhr.withCredentials = true
            }

            xhr.onload = async function (event) {

                const isFileProtocol = url.toLowerCase().startsWith("file:")

                // when the url points to a local file, the status is 0
                if ((xhr.status >= 200 && xhr.status < 300) || (isFileProtocol && xhr.status === 0)) {
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
                            // If file is large warn user.  NOTE: an arraybuffer response has "byteLength", a string "length"
                            const responseSize = xhr.response.byteLength !== undefined ?
                                xhr.response.byteLength :
                                xhr.response.length
                            if (responseSize > 1000000 && !self.RANGE_WARNING_GIVEN) {
                                self.RANGE_WARNING_GIVEN = true
                                console.warn(`Range header ignored for URL: ${url}.  This can have severe performance impacts.`)
                            }
                            resolve(xhr.response.slice(range.start, range.start + range.size))
                        } else {
                            resolve(xhr.response)
                        }
                    }
                } else if (xhr.status === 416) {
                    handleError(requestError(`416 Unsatisfiable Range: ${url}`, 416))
                } else if (GoogleAuth.isInitialized() &&
                    ((xhr.status === 404 || xhr.status === 401 || xhr.status === 403) &&
                        GoogleUtils.isGoogleURL(url)) &&
                    !options.retries) {
                    tryGoogleAuth()

                } else {
                    const error = requestError(`Error accessing resource: ${url} status: ${xhr.status}`, xhr.status)
                    if (xhr.status === 403) {
                        handleError(requestError("Access forbidden: " + url, 403))
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
                const error = requestError(`Error accessing resource: ${url} status: ${xhr.status}`, xhr.status)
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
                const error = requestError(`Timed out accessing resource: ${url}`, 0)
                if (host === self.UCSC_HOST) {
                    tryUcscBackup(self.UCSC_HOST, self.UCSC_BACKUP_HOST, error)
                } else if (self.corsProxy && !options.corsProxyRetried) {
                    tryCorsProxy(error)
                } else {
                    handleError(error)
                }
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
                reject(error)
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
                    if (error) {
                        handleError(error)
                    } else {
                        handleError(e)
                    }
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
                        if (typeof alert === 'function') {
                            alert(msg)
                        }
                        // The request is over either way -- settle it, or the caller waits forever
                        handleError(new Error(msg))
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

        options = {...options}
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
                options = {...options, method: 'HEAD', requestedHeaders: ['content-length']}
                const headerMap = await this._loadWithMapping(url, options)
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
 * Build a request failure.  "status" is the http status if we got a response, otherwise 0 (network error, timeout,
 * or a request blocked by CORS).  Note an aborted request rejects with the abort event, it has no status.
 */
function requestError(message, status) {
    const error = new Error(message)
    error.status = status
    return error
}

// Failures that could mean the resource has been retired.  A 416 (bad range) or an abort (no status) tells us
// nothing about the url, and a 5xx is the server's problem, not the url's.
const MAPPABLE_STATUS = new Set([0, 403, 404, 410])

function isMappable(error) {
    return error !== undefined && error !== null && MAPPABLE_STATUS.has(error.status)
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
    if (url.includes("supportsAllDrives")) {
        return url
    } else if (url.includes("supportsTeamDrives")) {
        return url.replaceAll("supportsTeamDrives", "supportsAllDrives")
    } else {
        const paramSeparator = url.includes("?") ? "&" : "?"
        return url + paramSeparator + "supportsAllDrives=true"
    }
}

/**
 * Perform some well-known url mappings.
 * @param url
 */
function mapUrl(url) {

    if (url.startsWith("https://www.dropbox.com")) {
        return url.replace("//www.dropbox.com", "//dl.dropboxusercontent.com")
    } else if (url.startsWith("http://www.broadinstitute.org/igvdata")) {
        return url.replace("http://www.broadinstitute.org/igvdata", "https://data.broadinstitute.org/igvdata");
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

    return new TextDecoder().decode(plain)
}

let mappingsPromise

/**
 * Fetch the table of "virtual" URL mappings.  Failure is not fatal, an empty map is returned, and the (empty)
 * result is cached -- we do not retry on every subsequent request.
 *
 * @returns {Promise<Map<string, string>>}
 */
async function loadMappings() {

    const mappings = new Map()
    try {
        // Bound the wait -- every url load blocks on this fetch, an unreachable host must not stall the browser
        const data = await igvxhr.loadString(mappingURL, {timeout: MAPPING_TIMEOUT})
        for (const line of data.split("\n")) {
            if (line.startsWith("#")) continue

            const tokens = line.split('\t')
            if (tokens.length === 2) {
                mappings.set(tokens[0], tokens[1])
            }
        }
    } catch (e) {
        console.warn(`Error loading url mappings`, e)
    }
    return mappings
}

/**
 * Return the replacement for a retired URL, or undefined if there is none.
 */
async function getMapping(url) {

    // The mapping table is itself fetched with "load", it must not be mapped or we would recurse indefinitely.
    if (url === mappingURL) {
        return undefined
    }

    // Cache the promise, not the map, so that concurrent callers all await the same fetch.
    if (!mappingsPromise) {
        mappingsPromise = loadMappings()
    }
    const mappings = await mappingsPromise

    const mappedUrl = mappings.get(url)
    return mappedUrl === url ? undefined : mappedUrl
}


const igvxhr = new IGVXhr()

export default igvxhr
export {arrayBufferToString, mapUrl, isMappable}
