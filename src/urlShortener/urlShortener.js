
// if (config.urlShortener) {
//     setURLShortener(config.urlShortener);
// }

import TinyURL from "./tinyURL.js";
import GoogleURL from "./googleURL.js";
import BitlyURL from "./bitlyURL.js";
import Alert from "../ui/alert.js";

let urlShortenerList = [];

const isURLShortenerSet = () => {
    return urlShortenerList.length > 0;
};

const setURLShortenerList = config => {

    for (let c of config) {
        urlShortenerList.push(getShortener(c));
    }

};

const getShortURL = async url =>  {
    return urlShortenerList.length > 0 ? await urlShortenerList[0].shortenURL(url) : url;
};

const getShortener = shortener => {

    const { provider } = shortener;
    if (provider) {
        if (provider === "tinyURL") {
            return new TinyURL(shortener);
        }
        if (provider === "google") {
            return new GoogleURL(shortener);
        } else if (provider === "bitly") {
            return new BitlyURL(shortener);
        } else {
            Alert.presentAlert(`Unknown url shortener provider: ${ provider}`);
        }
    } else {
        // Custom
        if (typeof shortener.shortenURL === "function") {
            return shortener;
        } else {
            Alert.presentAlert("URL shortener object must define functions 'shortenURL'");
        }
    }
};

export { isURLShortenerSet, setURLShortenerList, getShortURL }
