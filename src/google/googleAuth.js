import {isGoogleDriveURL, isGoogleStorageURL} from "./googleUtils.js"

const FIVE_MINUTES = 5 * 60 * 1000;

async function load() {
    return new Promise(function (resolve, reject) {
        gapi.load("auth2", {
            callback: resolve,
            onerror: reject
        });
    })
}

async function init(config) {
    if (!gapi.auth2) {
        await load();
    }
    return new Promise(function (resolve, reject) {
        gapi.auth2.init(config).then(resolve, reject)
    })
}


async function getAccessToken(scope) {

    let currentUser = gapi.auth2.getAuthInstance().currentUser.get();
    if (currentUser.isSignedIn()) {
        if (!currentUser.hasGrantedScopes(scope)) {
            await currentUser.grant({scope})
        }
        const {access_token, expires_at} = currentUser.getAuthResponse();
        if (Date.now()  < (expires_at - FIVE_MINUTES)) {
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
        return "https://www.googleapis.com/auth/drive.readonly";
    } else if (isGoogleStorageURL(url)) {
        return "https://www.googleapis.com/auth/devstorage.read_only";
    } else {
        return 'https://www.googleapis.com/auth/userinfo.profile';
    }
}


export {init, getAccessToken, getScopeForURL}

