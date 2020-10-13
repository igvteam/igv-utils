import {FileUtils} from "../src/index.js"

import {assert} from 'chai';
import {createMockObjects} from "@igvteam/test-utils/src"

suite("file utils", function () {

    createMockObjects();

    test("getFilename", function () {

        const expected = "foo.bar";

        const url = "https://abc.com/foo.bar?param=50";
        assert.equal(FileUtils.getFilename(url), expected);

        const f = new File(new ArrayBuffer(0), "foo.bar");
        assert.equal(FileUtils.getFilename(f), expected);
    })


})

