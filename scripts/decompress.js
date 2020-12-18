import {uncompressString} from "../src/stringUtils.js";

global.atob = require("atob");

let compressedString = process.argv[2];

if (compressedString.startsWith("blob:")  || compressedString.startsWith("data:")) {
    compressedString = compressedString.substring(5);
}

const str = uncompressString(compressedString);

const json = JSON.parse(str);

console.log(JSON.stringify(json, null,' '));
