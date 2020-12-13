
// if (config.urlShortener) {
//     setURLShortener(config.urlShortener);
// }

import TinyURL from "./tinyURL.js";
import GoogleURL from "./googleURL.js";
import BitlyURL from "./bitlyURL.js";

let urlShortenerList = [];

function isURLShortenerSet  ()  {
    return urlShortenerList.length > 0;
}

function setURLShortenerList (config) {
    for (let c of config) {
        urlShortenerList.push(getShortener(c));
    }
}

async function getShortURL (url)  {
    return urlShortenerList.length > 0 ? await urlShortenerList[0].shortenURL(url) : url;
}

function getShortener(config) {

    const { provider } = config;
    if (provider) {
        if (provider === "tinyURL") {
            return new TinyURL(config);
        }
        if (provider === "google") {
            return new GoogleURL(config);
        } else if (provider === "bitly") {
            return new BitlyURL(config);
        } else {
            alert(`Unknown url shortener provider: ${ provider}`);
        }
    } else {
        // Custom
        if (typeof shortener.shortenURL === "function") {
            return shortener;
        } else {
            alert("URL shortener object must define functions 'shortenURL'");
        }
    }
}

export { isURLShortenerSet, setURLShortenerList, getShortURL, getShortener }
