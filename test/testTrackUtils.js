import {TrackUtils} from "../src/index.js"
import {assert} from 'chai';
import {createMockObjects} from "@igvteam/test-utils/src"

suite("testTrackUtils", function () {

    createMockObjects();

    test("Test infer track type", function () {

        const config = {
            url: "http://foo/bam.cram",
            indexURL: "http://foo/bam.cram.cri"
        }

        TrackUtils.inferTrackTypes(config);
        assert.equal(config.format, "cram")
        assert.equal(config.type, "alignment")
    })
})

