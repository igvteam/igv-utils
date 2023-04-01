// Convenience functions for the gapi oAuth library.
// This wrapper is stateless -- this is important as multiple copies of this module might be present
// in an application.  All state is attached to the global google  object.

import {isGoogleDriveURL, isGoogleStorageURL} from "./googleUtils.js"

async function init(config) {

    if (!(google.accounts.oauth2.initTokenClient)) {
        throw new Error("Google accounts token client not loaded (https://accounts.google.com/gsi/client)")
    }

    if (isInitialized()) {
        throw new Error("Google client is already initialized")
    }

    // Note: callback is added when accessToken is requested
    const codeClientConfig = {
        client_id: config.client_id,
        scope: config.scope || 'https://www.googleapis.com/auth/userinfo.profile',
        state: config.state || 'igv',
        error: (err) => {
            throw new Error(err.type)
        },
        hint: config.hint,     // Optional
        hosted_domain: config.hosted_domain  // Optional
    }

    const tokenClient = google.accounts.oauth2.initTokenClient(codeClientConfig)

    // Attach an object to keep igv state
    google.igv = {
        tokenClient: tokenClient,
        apiKey: config.apiKey
    }
}

function isInitialized() {
    return window.google && window.google.igv
}

/**
 * Return the current access token if the user is signed in, or undefined otherwise.  This function does not
 * attempt a signIn or request any specfic scopes.
 *
 * @returns access_token || undefined
 */
function getCurrentAccessToken() {
    return (isInitialized() && google.igv.tokenResponse && Date.now() < google.igv.tokenExpiresAt) ?
        google.igv.tokenResponse.access_token :
        undefined
}

/**
 * Return the of the currently logged in user, if any, as represented by the current access token.  This does not force a login.*
 * @returns {Promise<any>}
 */
async function getCurrentUserProfile() {
    const access_token = getCurrentAccessToken()
    if (access_token) {
        const endPoint = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"
        const response = await fetch(endPoint, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        return response.json()
    } else {
        return undefined
    }
}


/**
 * Return a promise for an access token for the given scope.  If the user hasn't authorized the scope request it
 *
 * @param scope
 * @returns {Promise<unknown>}
 */
async function getAccessToken(scope) {

    if (!isInitialized()) {
        throw Error("Google oAuth has not been initialized")
    }

    if (google.igv.tokenResponse &&
        Date.now() < google.igv.tokenExpiresAt &&
        google.accounts.oauth2.hasGrantedAllScopes(google.igv.tokenResponse, scope)) {
        return google.igv.tokenResponse.access_token
    } else {
        const tokenClient = google.igv.tokenClient
        return new Promise((resolve, reject) => {
            try {
                // Settle this promise in the response callback for requestAccessToken()
                tokenClient.callback = (tokenResponse) => {
                    if (tokenResponse.error !== undefined) {
                        reject(tokenResponse)
                    }
                    google.igv.tokenResponse = tokenResponse
                    google.igv.tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000
                    resolve(tokenResponse.access_token)
                }
                tokenClient.requestAccessToken({scope})
            } catch (err) {
                console.log(err)
            }
        })
    }
}

async function signIn(scope) {

    if (!isInitialized()) {
        throw Error("Google oAuth has not been initialized")
    }

    scope = scope || 'https://www.googleapis.com/auth/userinfo.profile'
    await getAccessToken(scope)

    if (typeof google.igv.signInListener === 'function') {
        google.igv.signInListener(undefined !== google.igv.tokenResponse)

    }

    return google.igv.tokenResponse

}

async function signOut() {

    if (!isInitialized()) {
        throw Error("Google oAuth has not been initialized")
    }

    if (google.igv && google.igv.tokenResponse) {
        google.igv.tokenResponse = undefined
    }

    if (typeof google.igv.signInListener === 'function') {
        google.igv.signInListener(false)
    }
}

function signInListen(fn) {
    google.igv.signInListener = fn
}

// gapi.auth2.getAuthInstance().isSignedIn.listen(status => {
//     const user = gapi.auth2.getAuthInstance().currentUser.get()
//     queryGoogleAuthenticationStatus(user, status)
// })

function getScopeForURL(url) {
    if (isGoogleDriveURL(url)) {
        return "https://www.googleapis.com/auth/drive.readonly"
    } else if (isGoogleStorageURL(url)) {
        return "https://www.googleapis.com/auth/devstorage.read_only"
    } else {
        return 'https://www.googleapis.com/auth/userinfo.profile'
    }
}

function getApiKey() {
    return google.igv.apiKey
}


export {
    init,
    getAccessToken,
    getCurrentAccessToken,
    getScopeForURL,
    getApiKey,
    isInitialized,
    signIn,
    signOut,
    getCurrentUserProfile,
    signInListen
}

