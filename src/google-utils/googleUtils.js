function isGoogleURL(url) {
     return (url.includes("googleapis") && !url.includes("urlshortener")) ||
         isGoogleStorageURL(url) ||
         isGoogleDriveURL(url);
 }

 function isGoogleStorageURL(url) {
     return url.startsWith("gs://") ||
         url.startsWith("https://www.googleapis.com/storage") ||
         url.startsWith("https://storage.cloud.google.com") ||
         url.startsWith("https://storage.googleapis.com");
 }

 function isGoogleDriveURL(url) {
     return url.startsWith("https://www.googleapis.com/drive/v3/files");
 }

 /**
  * Translate gs:// urls to https
  * See https://cloud.google.com/storage/docs/json_api/v1
  * @param gsUrl
  * @returns {string|*}
  */
 function translateGoogleCloudURL(gsUrl) {
     try {
         let {bucket, object} = parseBucketName(gsUrl);
         object = encode(object);

         const qIdx = gsUrl.indexOf('?');
         let paramString = (qIdx > 0) ? gsUrl.substring(qIdx) : "";

         if (!paramString.includes("alt=media")) {
             paramString = paramString ? `${paramString}&alt=media` : "?alt=media";
         }

         return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}${paramString}`;
     } catch (error) {
         throw new Error(`Failed to translate Google Cloud URL: ${error.message}`);
     }
 }

 /**
  * Parse a google bucket and object name from a google storage URL.
  * @param url
  */
 function parseBucketName(url) {
     const regex = /gs:\/\/([a-zA-Z0-9._-]+)\/([^?]+)|https?:\/\/(?:storage\.googleapis\.com|storage\.cloud\.google\.com|www\.googleapis\.com)\/(?:storage\/v1\/b\/)?([a-zA-Z0-9._-]+)\/(?:o\/)?([^?]+)/;
     const match = url.match(regex);

     if (match) {
         const bucket = match[1] || match[3];
         const object = match[2] || match[4];
         if (bucket && object) {
             return { bucket, object };
         }
     }
     throw new Error(`Unrecognized Google Storage URI: ${url}`);
 }

 /**
  * Percent a GCS object name.  See https://cloud.google.com/storage/docs/request-endpoints
  * @param objectName
  */
 function encode(objectName) {
     return objectName.split('').map(letter => encodings.get(letter) || letter).join('');
 }

 const encodings = new Map([
     ["!", "%21"], ["#", "%23"], ["$", "%24"], ["%", "%25"], ["&", "%26"],
     ["'", "%27"], ["(", "%28"], [")", "%29"], ["*", "%2A"], ["+", "%2B"],
     [",", "%2C"], ["/", "%2F"], [":", "%3A"], [";", "%3B"], ["=", "%3D"],
     ["?", "%3F"], ["@", "%40"], ["[", "%5B"], ["]", "%5D"], [" ", "%20"]
 ]);

 export {
     isGoogleURL, isGoogleDriveURL, isGoogleStorageURL, translateGoogleCloudURL, parseBucketName
 };