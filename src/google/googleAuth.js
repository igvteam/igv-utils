// Convenience functions for the gapi oAuth library.
// This wrapper is stateless -- this is important as multiple copies of igv-utils might be present
// in an application.  All state is held in the gapi library itself.

import {isGoogleDriveURL, isGoogleStorageURL} from "./googleUtils.js"

const FIVE_MINUTES = 5 * 60 * 1000;

let apiKey;

async function load(library) {
    return new Promise(function (resolve, reject) {
        gapi.load(library, {
            callback: resolve,
            onerror: reject
        });
    })
}

async function init(config) {

    if(isInitialized()) {
        console.warn("oAuth has already been initialized");
        return;
    }

    apiKey = config.apiKey;

    // copy config, gapi will modify it
    const configCopy = Object.assign({}, config);
    if(!configCopy.scope) {
        configCopy.scope = 'profile'
    }
    if(!config.client_id) {
        config.client_id = config.clientId;
    }

    await load("auth2");
    return new Promise(function (resolve, reject) {
        gapi.auth2.init(configCopy).then(resolve, reject)
    })
}

function isInitialized() {
    return gapi.auth2 && gapi.auth2.getAuthInstance();
}

async function getAccessToken(scope) {

    if(typeof gapi === "undefined") {
        throw Error("Google authentication requires the 'gapi' library")
    }
    if(!gapi.auth2) {
        throw Error("Google 'auth2' has not been initialized")
    }


    let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
    if (currentUser.isSignedIn()) {
        if (!currentUser.hasGrantedScopes(scope)) {
            await currentUser.grant({scope})
        }
        const {access_token, expires_at} = currentUser.getAuthResponse();
        if (Date.now() < (expires_at - FIVE_MINUTES)) {
            return {access_token, expires_at};
        } else {
            const {access_token, expires_at} = currentUser.reloadAuthResponse();
            return {access_token, expires_at};
        }
    } else {
        currentUser = await signIn(scope);
        const {access_token, expires_at} = currentUser.getAuthResponse();
        return {access_token, expires_at};
    }
}

async function signIn(scope) {

    const options = new gapi.auth2.SigninOptionsBuilder();
    options.setPrompt('select_account');
    options.setScope(scope);
    return gapi.auth2.getAuthInstance().signIn(options)
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
    return apiKey;
}


export {init, getAccessToken, getScopeForURL, getApiKey, isInitialized}

