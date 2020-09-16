import {getAccessToken, getApiKey} from "./googleAuth.js";

function isGoogleURL(url) {
    return (url.includes("googleapis") && !url.includes("urlshortener")) ||
        isGoogleStorageURL(url) ||
        isGoogleDriveURL(url)
}

function isGoogleStorageURL(url) {
    return url.startsWith("gs://") ||
        url.startsWith("https://www.googleapis.com/storage") ||
        url.startsWith("https://storage.cloud.google.com") ||
        url.startsWith("https://storage.googleapis.com");
}

function isGoogleDriveURL(url) {
    return url.indexOf("drive.google.com") >= 0 || url.indexOf("www.googleapis.com/drive") > 0
}

function translateGoogleCloudURL(gsUrl) {

    var i, bucket, object, qIdx, objectString, paramString;

    i = gsUrl.indexOf('/', 5);
    qIdx = gsUrl.indexOf('?');

    if (i < 0) {
        console.log("Invalid gs url: " + gsUrl);
        return gsUrl;
    }

    bucket = gsUrl.substring(5, i);

    objectString = (qIdx < 0) ? gsUrl.substring(i + 1) : gsUrl.substring(i + 1, qIdx);
    object = encodeURIComponent(objectString);

    if (qIdx > 0) {
        paramString = gsUrl.substring(qIdx);
    }

    return "https://www.googleapis.com/storage/v1/b/" + bucket + "/o/" + object +
        (paramString ? paramString + "&alt=media" : "?alt=media");

}

function driveDownloadURL(link) {
    // Return a google drive download url for the sharable link
    //https://drive.google.com/open?id=0B-lleX9c2pZFbDJ4VVRxakJzVGM
    //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
    var id = getGoogleDriveFileID(link);
    return id ? "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media&supportsTeamDrives=true" : link;
}

function getGoogleDriveFileID(link) {

    //https://drive.google.com/file/d/1_FC4kCeO8E3V4dJ1yIW7A0sn1yURKIX-/view?usp=sharing
    var i1, i2;

    if (link.includes("/open?id=")) {
        i1 = link.indexOf("/open?id=") + 9;
        i2 = link.indexOf("&");
        if (i1 > 0 && i2 > i1) {
            return link.substring(i1, i2)
        } else if (i1 > 0) {
            return link.substring(i1);
        }

    } else if (link.includes("/file/d/")) {
        i1 = link.indexOf("/file/d/") + 8;
        i2 = link.lastIndexOf("/");
        return link.substring(i1, i2);
    }
}

export {
    isGoogleURL, driveDownloadURL, getGoogleDriveFileID,
    isGoogleDriveURL, isGoogleStorageURL, translateGoogleCloudURL
}



