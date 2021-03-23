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

/**
 * Translate gs:// urls to https
 * See https://cloud.google.com/storage/docs/json_api/v1
 * @param gsUrl
 * @returns {string|*}
 */
function translateGoogleCloudURL(gsUrl) {

    let {bucket, object} = parseBucketName(gsUrl);
    object = encode(object);

    const qIdx = gsUrl.indexOf('?');
    const paramString = (qIdx > 0) ? gsUrl.substring(qIdx) + "&alt=media" : "?alt=media";

    return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}${paramString}`
}

/**
 * Parse a google bucket and object name from a google storage URL.  Known forms include
 *
 * gs://BUCKET_NAME/OBJECT_NAME
 * https://storage.googleapis.com/BUCKET_NAME/OBJECT_NAME
 * https://storage.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
 * https://www.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME"
 * https://storage.googleapis.com/download/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME
 *
 * @param url
 */
function parseBucketName(url) {

    let bucket;
    let object;

    if (url.startsWith("gs://")) {
        const i = url.indexOf('/', 5);
        if (i >= 0) {
            bucket = url.substring(5, i);
            const qIdx = url.indexOf('?');
            object = (qIdx < 0) ? url.substring(i + 1) : url.substring(i + 1, qIdx);
        }

    } else if (url.startsWith("https://storage.googleapis.com") || url.startsWith("https://storage.cloud.google.com")) {
        const bucketIdx = url.indexOf("/v1/b/", 8)
        if (bucketIdx > 0) {
            const objIdx = url.indexOf("/o/", bucketIdx);
            if (objIdx > 0) {
                const queryIdx = url.indexOf("?", objIdx);
                bucket = url.substring(bucketIdx + 6, objIdx);
                object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
            }

        } else {
            const idx1 = url.indexOf("/", 8);
            const idx2 = url.indexOf("/", idx1+1);
            const idx3 = url.indexOf("?", idx2);
            if (idx2 > 0) {
                bucket = url.substring(idx1+1, idx2);
                object = idx3 < 0 ? url.substring(idx2+1) : url.substring(idx2+1, idx3);
            }
        }

    } else if (url.startsWith("https://www.googleapis.com/storage/v1/b")) {
        const bucketIdx = url.indexOf("/v1/b/", 8);
        const objIdx = url.indexOf("/o/", bucketIdx);
        if (objIdx > 0) {
            const queryIdx = url.indexOf("?", objIdx);
            bucket = url.substring(bucketIdx + 6, objIdx);
            object = queryIdx > 0 ? url.substring(objIdx + 3, queryIdx) : url.substring(objIdx + 3);
        }
    }

    if (bucket && object) {
        return {
            bucket, object
        }
    } else {
        throw Error(`Unrecognized Google Storage URI: ${url}`)
    }

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


/**
 * Percent a GCS object name.  See https://cloud.google.com/storage/docs/request-endpoints
 * Specific characters to encode:
 *   !, #, $, &, ', (, ), *, +, ,, /, :, ;, =, ?, @, [, ], and space characters.
 * @param obj
 */

function encode(objectName) {

    let result = '';
    objectName.split('').forEach(function(letter) {
        if(encodings.has(letter)) {
            result += encodings.get(letter);
        } else {
            result += letter;
        }
    })
    return result;
}

//	%23	%24	%25	%26	%27	%28	%29	%2A	%2B	%2C	%2F	%3A	%3B	%3D	%3F	%40	%5B	%5D
const encodings = new Map();
encodings.set("!", "%21");
encodings.set("#", "%23");
encodings.set("$", "%24");
encodings.set("%", "%25");
encodings.set("&", "%26");
encodings.set("'", "%27");
encodings.set("(", "%28");
encodings.set(")", "%29");
encodings.set("*", "%2A");
encodings.set("+", "%2B");
encodings.set(",", "%2C");
encodings.set("/", "%2F");
encodings.set(":", "%3A");
encodings.set(";", "%3B");
encodings.set("=", "%3D");
encodings.set("?", "%3F");
encodings.set("@", "%40");
encodings.set("[", "%5B");
encodings.set("]", "%5D");
encodings.set(" ", "%20");

// For testing
//for(let [key, value] of encodings) {
//    const v2 = encodeURIComponent(key);
//    console.log(value + "  " + v2);
//}

export {
    isGoogleURL, driveDownloadURL, getGoogleDriveFileID,
    isGoogleDriveURL, isGoogleStorageURL, translateGoogleCloudURL, parseBucketName
}



