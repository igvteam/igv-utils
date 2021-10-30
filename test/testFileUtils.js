import "./utils/mockObjects.js"
import {assert} from 'chai';
import {getFilename, isFile} from '../src/fileUtils.js'

suite("file utils", function () {

    test("getFilename", function () {

        const expected = "foo.bar";

        const url = "https://abc.com/foo.bar?param=50";
        assert.equal(getFilename(url), expected);

        const f = new File(new ArrayBuffer(0), "foo.bar");
        assert.equal(getFilename(f), expected);
    })

    test("isFile", function () {

        const url = "https://abc.com/foo.bar?param=50";
        assert.equal(isFile(url), false);

        const f = new File(new ArrayBuffer(0), "foo.bar");
        assert.equal(isFile(f), true);

        assert.equal(isFile(foo), false)
    })




})


function foo() {
    return "bar";
}
