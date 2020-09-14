/*
 *  Author: Jim Robinson, 2020
 *
 * Wrapper functions for the Google picker API
 *
 * PREQUISITES
 *    gapi loaded
 *    oauth2 loaded and initialized
 */

import * as GoogleAuth from './googleAuth.js'

let pickerAPILoaded = false;

async function init() {
    return new Promise(function (resolve, reject) {
        gapi.load("picker", {
            callback: function(result) {
                pickerAPILoaded = true;
                resolve(result);
            },
            onerror: reject});
    })
}

async function createDropdownButtonPicker(multipleFileSelection, filePickerHandler) {

    if(!pickerAPILoaded) {
        await init();
    }

    const {access_token} = await GoogleAuth.getAccessToken('https://www.googleapis.com/auth/drive.readonly')
    if (access_token) {

        const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
        view.setIncludeFolders(true);

        const teamView = new google.picker.DocsView(google.picker.ViewId.DOCS);
        teamView.setEnableTeamDrives(true);
        teamView.setIncludeFolders(true);

        let picker;
        if (multipleFileSelection) {
             picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .setOAuthToken(access_token)
                .addView(view)
                .addView(teamView)
                .enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES)
                .setCallback(function (data) {
                    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                        filePickerHandler(data[google.picker.Response.DOCUMENTS]);
                    }
                })
                .build();

        } else {
             picker = new google.picker.PickerBuilder()
                .disableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .setOAuthToken(access_token)
                .addView(view)
                .addView(teamView)
                .enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES)
                .setCallback(function (data) {
                    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                        filePickerHandler(data[google.picker.Response.DOCUMENTS]);
                    }
                })
                .build();

        }

        picker.setVisible(true);

    } else {
        throw Error("Sign into Google before using picker");
    }
}


function pickerCallback(data) {

    let doc,
        obj,
        documents;

    documents = data[google.picker.Response.DOCUMENTS];

    doc = documents[0];

    obj =
        {
            name: doc[google.picker.Document.NAME],
            path: 'https://www.googleapis.com/drive/v3/files/' + doc[google.picker.Document.ID] + '?alt=media'
        };

    return obj;
};

function updateSignInStatus(signInStatus) {
    // do nothing
};


export {init, createDropdownButtonPicker};
