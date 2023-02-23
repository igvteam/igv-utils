import "./utils/mockObjects.js"
import {assert} from 'chai';

import * as GoogleUtils from '../node_modules/google-utils/src/googleUtils.js'
suite("testGoogle", async function () {

    test("google storage 1", function () {
        let gsURL = "gs://BUCKET_NAME/OBJECT_NAME";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);

        gsURL += "?foo=bar"
        bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);

    })

    test("google storage 2", function () {
        let gsURL = "https://storage.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);

        gsURL += "?foo=bar"
        bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);
    })

    test("google storage 3", function () {
        let gsURL = "https://www.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);

        gsURL += "?foo=bar"
        bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);
    })

    test("google storage 4", function () {
        let gsURL = "https://storage.googleapis.com/download/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);

        gsURL += "?foo=bar"
        bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("BUCKET_NAME", bo.bucket);
        assert.equal("OBJECT_NAME", bo.object);
    })

    test("google storage 5", function () {
        let gsURL = "gs://BUCKET_NAME/OBJECT_NAME";
        const url = GoogleUtils.translateGoogleCloudURL(gsURL);
        assert.equal(url, "https://storage.googleapis.com/storage/v1/b/BUCKET_NAME/o/OBJECT_NAME?alt=media");
    })

    test("google storage 6", function () {
        let gsURL = "gs://genomics-public-data/platinum-genomes/bam/NA12877_S1.bam";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("genomics-public-data", bo.bucket);
        assert.equal("platinum-genomes/bam/NA12877_S1.bam", bo.object);
    })

    test("google storage 7", function () {
        let gsURL = "gs://genomics-public-data/platinum-genomes/bam/NA12877_S1.bam";
        const url = GoogleUtils.translateGoogleCloudURL(gsURL);
        assert.equal(url, "https://storage.googleapis.com/storage/v1/b/genomics-public-data/o/platinum-genomes%2Fbam%2FNA12877_S1.bam?alt=media");
    })

    test("google storage 8", function () {
        let gsURL = "https://storage.googleapis.com/amoebidium_browser/Aparasiticum_pilon2nd.fasta.fai";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("amoebidium_browser", bo.bucket);
        assert.equal("Aparasiticum_pilon2nd.fasta.fai", bo.object);
    })

    test("google storage 9", function () {
        let gsURL = "https://storage.cloud.google.com/fc-0d14d0d0-242d-40c8-bc98-055c6639e05d/CopyNumber.seg?authuser=1";
        let bo = GoogleUtils.parseBucketName(gsURL);
        assert.equal("fc-0d14d0d0-242d-40c8-bc98-055c6639e05d", bo.bucket);
        assert.equal("CopyNumber.seg", bo.object);
    })
    
})

