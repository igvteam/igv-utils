import {getAccessToken, getApiKey} from "./googleAuth.js"
import {getGoogleDriveFileID} from "./googleUtils.js"

async function getDriveFileInfo(googleDriveURL) {

    const id = getGoogleDriveFileID(googleDriveURL);
    const apiKey = getApiKey();

    const endPoint = "https://www.googleapis.com/drive/v3/files/" + id + "?supportsTeamDrives=true&key=" + apiKey;
    const response = await fetch(endPoint);
    let json = await response.json();
    if (json.error && json.error.code === 404) {
        const {access_token} = await getAccessToken("https://www.googleapis.com/auth/drive.readonly");
        if (access_token) {
            const response = await fetch(endPoint, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
            json = await response.json();
            if(json.error) {
                throw Error(json.error);
            }
        } else {
            throw Error(json.error);
        }
    }
    return json;
}

export {getDriveFileInfo}