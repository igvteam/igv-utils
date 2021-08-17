import "./utils/mockObjects.js"
import {assert} from 'chai';
import {parseLocusString} from "../src/stringUtils.js";

suite("testStringUtils", function () {

    test("Test locus parsing 1", function () {
        const locus = "chr1:101-200";
        const range = parseLocusString(locus);
        assert.equal(range.chr, "chr1");
        assert.equal(range.start, 100);
        assert.equal(range.end, 200);
    })

    test("Test locus parsing 2", function () {
        const locus = "chr1:101";
        const range = parseLocusString(locus);
        assert.equal(range.chr, "chr1");
        assert.equal(range.start, 100);
        assert.equal(range.end, 101);
    })

})

