import {isString} from "./stringUtils.js";
import {isGoogleDriveURL} from "./google/googleUtils.js";
import {getDriveFileInfo} from "./google/googleDrive.js";
import {parseUri} from "./uriUtils.js";

function getExtension(url) {

    if (undefined === url) {
        return undefined;
    }

    let path = (isFilePath(url) || url.google_url) ? url.name : url;
    let filename = path.toLowerCase();

    //Strip parameters -- handle local files later
    let index = filename.indexOf("?");
    if (index > 0) {
        filename = filename.substr(0, index);
    }

    //Strip aux extensions .gz, .tab, and .txt
    if (filename.endsWith(".gz")) {
        filename = filename.substr(0, filename.length - 3);
    } else if (filename.endsWith(".txt") || filename.endsWith(".tab") || filename.endsWith(".bgz")) {
        filename = filename.substr(0, filename.length - 4);
    }

    index = filename.lastIndexOf(".");

    return index < 0 ? filename : filename.substr(1 + index);
}

/**
 * Return the filename from the path.   Example
 *   https://foo.com/bar.bed?param=2   => bar.bed
 * @param urlOrFile
 */

function getFilename (urlOrFile) {

    if (urlOrFile instanceof File) {
        return urlOrFile.name;
    } else if (isString(urlOrFile)){

        let index = urlOrFile.lastIndexOf("/");
        let filename = index < 0 ? urlOrFile : urlOrFile.substr(index + 1);

        //Strip parameters -- handle local files later
        index = filename.indexOf("?");
        if (index > 0) {
            filename = filename.substr(0, index);
        }
        return filename;
    } else {
        throw Error(`Expected File or string, got ${typeof urlOrFile}`);
    }
}

async function getFilenameExtended (path) {

    if (path instanceof File) {
        return path.name
    } else if (isGoogleDriveURL(path)) {
        if(typeof gapi === "undefined") {
            throw Error(`Google initialization with API key is required to load Google urls (${path})`)
        }
        const info = await getDriveFileInfo(path)
        return info.name || info.originalFileName
    } else {
        const result = parseUri(path)
        return result.file;
    }

}

function isFilePath (path) {
    return (path instanceof File);
}


function download  (filename, data) {

    const element = document.createElement('a');
    element.setAttribute('href', data);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export {getExtension, getFilename, getFilenameExtended, isFilePath, download}
