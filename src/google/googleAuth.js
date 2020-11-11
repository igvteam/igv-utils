// Convenience functions for the gapi oAuth library.
// This wrapper is stateless -- this is important as multiple copies of igv-utils might be present
// in an application.  All state is held in the gapi library itself.

import {isGoogleDriveURL, isGoogleStorageURL} from "./googleUtils.js"

const FIVE_MINUTES = 5 * 60 * 1000;

async function load(library) {
    return new Promise(function (resolve, reject) {
        gapi.load(library, {
            callback: resolve,
            onerror: reject
        });
    })
}

async function init(config) {

    if (isInitialized()) {
        console.warn("oAuth has already been initialized");
        return;
    }

    gapi.apiKey = config.apiKey;

    // copy config, gapi will modify it
    const configCopy = Object.assign({}, config);
    if (!configCopy.scope) {
        configCopy.scope = 'profile'
    }
    if (!config.client_id) {
        config.client_id = config.clientId;
    }

    await load("auth2");
    return new Promise(function (resolve, reject) {
        gapi.auth2.init(configCopy).then(resolve, reject)
    })
}

function isInitialized() {
    return typeof gapi !== "undefined" && gapi.auth2 && gapi.auth2.getAuthInstance();
}

let inProgress = false;

async function getAccessToken(scope) {

    if (typeof gapi === "undefined") {
        throw Error("Google authentication requires the 'gapi' library")
    }
    if (!gapi.auth2) {
        throw Error("Google 'auth2' has not been initialized")
    }

    if (inProgress) {
        return new Promise(function (resolve, reject) {
            let intervalID;
            const checkForToken = () => {    // Wait for inProgress to equal "false"
                try {
                    if (inProgress === false) {
                        //console.log("Delayed resolution for " + scope);
                        resolve(getAccessToken(scope));
                        clearInterval(intervalID);
                    }
                } catch (e) {
                    clearInterval(intervalID);
                    reject(e);
                }
            }
            intervalID = setInterval(checkForToken, 100);
        })
    } else {
        inProgress = true;
        try {
            let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
            let token;
            if (currentUser.isSignedIn()) {
                if (!currentUser.hasGrantedScopes(scope)) {
                    await currentUser.grant({scope})
                }
                const {access_token, expires_at} = currentUser.getAuthResponse();
                if (Date.now() < (expires_at - FIVE_MINUTES)) {
                    token = {access_token, expires_at};
                } else {
                    const {access_token, expires_at} = currentUser.reloadAuthResponse();
                    token = {access_token, expires_at};
                }
            } else {
                currentUser = await signIn(scope);
                const {access_token, expires_at} = currentUser.getAuthResponse();
                token = {access_token, expires_at};
            }
            return token;
        } finally {
            inProgress = false;
        }
    }
}

/**
 * Return the current access token if the user is signed in, or undefined otherwise.  This function does not
 * attempt a signIn or request any specfic scopes.
 *
 * @returns access_token || undefined
 */
function getCurrentAccessToken() {

    let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
    if (currentUser && currentUser.isSignedIn()) {
        const {access_token, expires_at} = currentUser.getAuthResponse();
        return {access_token, expires_at};
    } else {
        return undefined;
    }

}

async function signIn(scope) {

    const options = new gapi.auth2.SigninOptionsBuilder();
    options.setPrompt('select_account');
    options.setScope(scope);
    return gapi.auth2.getAuthInstance().signIn(options)
}

async function signOut() {
    return gapi.auth2.getAuthInstance().signOut();
}

function getScopeForURL(url) {
    if (isGoogleDriveURL(url)) {
        return "https://www.googleapis.com/auth/drive.file";
    } else if (isGoogleStorageURL(url)) {
        return "https://www.googleapis.com/auth/devstorage.read_only";
    } else {
        return 'https://www.googleapis.com/auth/userinfo.profile';
    }
}

function getApiKey() {
    return gapi.apiKey;
}


export {init, getAccessToken, getCurrentAccessToken, getScopeForURL, getApiKey, isInitialized, signIn, signOut}

