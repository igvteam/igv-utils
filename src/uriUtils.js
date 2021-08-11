import pako from "./vendor/pako.js";

if (typeof process === 'object' && typeof window === 'undefined') {
    global.atob = function (str) {
        return Buffer.from(str, 'base64').toString('binary');
    }
}

/**
 * @param dataURI
 * @returns {Array<number>|Uint8Array}
 */
function decodeDataURI(dataURI, gzip) {

    const split = dataURI.split(',');
    const info = split[0].split(':')[1];
    let dataString = split[1];

    if (info.indexOf('base64') >= 0) {
        dataString = atob(dataString);
    } else {
        dataString = decodeURI(dataString);      // URL encoded string -- not currently used of tested
    }
    const bytes = new Uint8Array(dataString.length);
    for (let i = 0; i < dataString.length; i++) {
        bytes[i] = dataString.charCodeAt(i);
    }

    let plain
    if (gzip || info.indexOf('gzip') > 0) {
        plain = pako.ungzip(bytes)
    } else {
        plain = bytes
    }
    return plain
}

function parseUri(str) {

    var o = options,
        m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
}

const options = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
    q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

function addExtension(url, extension) {

    const idx = url.indexOf("?");
    if (idx < 0) {
        return url + extension;
    } else {
        return url.substring(0, idx) + extension + url.substring(idx);
    }
}

/**
 * Resolve a url, which might be a string, function (that returns a string or Promse), or Promise (that resolves to a string)
 *
 * @param url
 * @returns {Promise<*>}
 */
async function resolveURL(url) {
    return (typeof url === 'function')  ?  url() :  url;
}

export {parseUri, decodeDataURI, addExtension, resolveURL};

