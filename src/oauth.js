// Support for oauth token based authorization
// This class supports explicit setting of an oauth token either globally or for specific hosts.
//
// The variable oauth.google.access_token, which becomes igv.oauth.google.access_token on ES5 conversion is
// supported for backward compatibility

const DEFAULT_HOST = "googleapis"

class Oauth {

    constructor() {
        this.oauthTokens = {}
    }


    setToken(token, host) {
        host = host || DEFAULT_HOST
        this.oauthTokens[host] = token
    }

    getToken(host) {
        host = host || DEFAULT_HOST
        let token
        for (let key of Object.keys(this.oauthTokens)) {
            const regex = wildcardToRegExp(key)
            if (regex.test(host)) {
                token = this.oauthTokens[key]
                break
            }
        }
        return token
    }

    removeToken(host) {
        host = host || DEFAULT_HOST
        for (let key of Object.keys(this.oauthTokens)) {
            const regex = wildcardToRegExp(key)
            if (regex.test(host)) {
                this.oauthTokens[key] = undefined
            }
        }
    }

    // Special object for google -- legacy support
    // google: {
    //     setToken: function (token) {
    //         oauth.setToken(token);
    //     }
    // }
}


/**
 * Creates a RegExp from the given string, converting asterisks to .* expressions,
 * and escaping all other characters.
 *
 * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
 */
function wildcardToRegExp(s) {
    return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$')
}

/**
 * RegExp-escapes all characters in the given string.
 *
 * credit https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f
 */
function regExpEscape(s) {
    return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
}

export default Oauth
