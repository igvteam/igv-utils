if (typeof process === 'object' && typeof window === 'undefined') {
    global.atob = function (str) {
        return Buffer.from(str, 'base64').toString('binary');
    }
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

export {parseUri, addExtension, resolveURL};

