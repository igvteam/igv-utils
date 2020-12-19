import "./utils/mockObjects.js"
import {assert} from 'chai';
import {URIUtils} from "../src/index.js"
import {GoogleUtils, GoogleAuth, GoogleDrive} from "../src/index.js";
import {getGoogleDriveFileID} from "../src/google/googleUtils"

suite("testGoogle", async function () {

    /**
     * Parsing a uri => dictionary of parts
     */
    test("share link",  function () {
        const url = "https://drive.google.com/file/d/1VHkNjxyj9FaNSkqSSZBlo-hgw8FnW-sM/view?usp=sharing";
        const id = GoogleUtils.getGoogleDriveFileID(url);
        assert.equal(id, "1VHkNjxyj9FaNSkqSSZBlo-hgw8FnW-sM")
    })


    test("download url", function () {
        const url = "https://www.googleapis.com/drive/v3/files/1w-tvo6p1SH4p1OaQSVxpkV_EJgGIstWF?alt=media&supportsTeamDrives=true";
        const id = GoogleUtils.getGoogleDriveFileID(url);
        assert.equal(id, "1w-tvo6p1SH4p1OaQSVxpkV_EJgGIstWF")
    })

})

