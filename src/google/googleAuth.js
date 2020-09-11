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
        if (currentUser.hasGrantedScopes(scope)) {
            const {access_token, expires_at} = currentUser.getAuthResponse();
            if ((Date.now() - FIVE_MINUTES) < expires_at) {
                return access_token;
            } else {
                // reloadAuthResponse should work but doesn't reliably.  Force another sign-in as a workaround
                // const reloadResponse = await currentUser.reloadAuthResponse();
                // return reloadResponse.access_token;
                currentUser = await signIn(scope);
                const {access_token} = currentUser.getAuthResponse();
                return access_token;
            }
        } else {
            const {access_token} = currentUser.grant({scope});
            return access_token;
        }
    } else {
        currentUser = await signIn(scope);
        const {access_token} = currentUser.getAuthResponse();
        return access_token;
    }
}

async function signIn(scope) {

    const options = new gapi.auth2.SigninOptionsBuilder();
    options.setPrompt('select_account');
    options.setScope(scope);
    return gapi.auth2.getAuthInstance().signIn(options)
}


export {init, getAccessToken}

