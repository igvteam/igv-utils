import {getApiKey} from "./googleAuth.js"
import igvxhr from "../igvxhr.js"

/**
 * Return information about a specific google drive URL
 *
 * @param googleDriveURL
 * @returns {Promise<any>}
 */
async function getDriveFileInfo(googleDriveURL) {

    const id = getGoogleDriveFileID(googleDriveURL);
    let url = "https://www.googleapis.com/drive/v3/files/" + id + "?supportsTeamDrives=true";
    const apiKey = getApiKey();
    if (apiKey) {
        url += "&key=" + apiKey;
    }

    const json = await igvxhr.loadJson(url)
    return json
}



function getGoogleDriveFileID(link) {

    if (link.startsWith("https://www.googleapis.com/drive")) {
        let i1 = link.indexOf("/files/")
        const i2 = link.indexOf("?")
        if (i1 > 0) {
            i1 += 7;
            return i2 > 0 ?
                link.substring(i1, i2) :
                link.substring(i1)
        }
    }

    throw Error("Unknown Google Drive url format: " + link);


}


export {getDriveFileInfo}