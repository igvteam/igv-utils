import {getAccessToken, getApiKey} from "./googleAuth.js"


/**
 * Return information about a specific google drive URL
 *
 * @param googleDriveURL
 * @returns {Promise<any>}
 */
async function getDriveFileInfo(googleDriveURL) {

    const id = getGoogleDriveFileID(googleDriveURL);
    let endPoint = "https://www.googleapis.com/drive/v3/files/" + id + "?supportsTeamDrives=true";
    const apiKey = getApiKey();
    if (apiKey) {
        endPoint += "&key=" + apiKey;
    }
    const response = await fetch(endPoint);
    let json = await response.json();
    if (json.error && json.error.code === 404) {
        let scope = "https://www.googleapis.com/auth/drive.readonly"
        const access_token = await getAccessToken(scope);
        if (access_token) {
            const response = await fetch(endPoint, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
            json = await response.json();
            if (json.error) {
                throw Error(json.error);
            }
        } else {
            throw Error(json.error);
        }
    }
    return json;
}

/**
 * Return general Google Drive information for the currently logged in user*
 * *
 * @returns {Promise<any>}
 */
async function getDriveInfo() {
    const access_token = await getAccessToken('https://www.googleapis.com/auth/drive.readonly')
    const endPoint = "https://www.googleapis.com/drive/v3/about?fields=*"
    const response = await fetch(endPoint, {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    return response.json()
}


function getDriveDownloadURL(link) {
    // Return a google drive download url for the sharable link
    //https://drive.google.com/open?id=0B-lleX9c2pZFbDJ4VVRxakJzVGM
    //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
    var id = getGoogleDriveFileID(link);
    return id ? "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media&supportsTeamDrives=true" : link;
}

function getGoogleDriveFileID(link) {

    //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
    //https://www.googleapis.com/drive/v3/files/1w-tvo6p1SH4p1OaQSVxpkV_EJgGIstWF?alt=media&supportsTeamDrives=true"

    if (link.includes("/open?id=")) {
        const i1 = link.indexOf("/open?id=") + 9;
        const i2 = link.indexOf("&");
        if (i1 > 0 && i2 > i1) {
            return link.substring(i1, i2)
        } else if (i1 > 0) {
            return link.substring(i1);
        }

    } else if (link.includes("/file/d/")) {
        const i1 = link.indexOf("/file/d/") + 8;
        const i2 = link.lastIndexOf("/");
        return link.substring(i1, i2);

    } else if (link.startsWith("https://www.googleapis.com/drive")) {
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



export {getDriveFileInfo, getDriveInfo, getDriveDownloadURL, getGoogleDriveFileID}