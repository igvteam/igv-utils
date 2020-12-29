import "./utils/mockObjects.js"
import {assert} from 'chai';
import {FileUtils} from "../src/index.js"

suite("file utils", function () {

    test("getFilename", function () {

        const expected = "foo.bar";

        const url = "https://abc.com/foo.bar?param=50";
        assert.equal(FileUtils.getFilename(url), expected);

        const f = new File(new ArrayBuffer(0), "foo.bar");
        assert.equal(FileUtils.getFilename(f), expected);
    })


})

