import "./utils/mockObjects.js"
import {assert} from 'chai';
import * as URIUtils from '../src/uriUtils.js'

suite("testUriUtils", function () {

    /**
     * Parsing a uri => dictionary of parts
     */
    test("Parse URI", function () {
        this.timeout(10000);
        const uri = "https://igv.org/app?session=foo&args=bar";
        const result = URIUtils.parseUri(uri);
        assert.ok(result);
        assert.equal("igv.org", result.host);
        assert.equal("/app", result.path);
        assert.equal("session=foo&args=bar", result.query);
        assert.equal("https", result.protocol);
    })

    test("Resolve URL", async function () {

        const expected = "theURL";

        const t1 = await URIUtils.resolveURL(expected);
        assert.equal(t1, expected);

        const fn = function () { return expected};
        const t2 = await URIUtils.resolveURL(fn);
        assert.equal(t2, expected);

        const p = Promise.resolve(expected);
        const t3 = await URIUtils.resolveURL(p);
        assert.equal(t3, expected);

        const fn2 = function () {return p;}
        const t4 = await URIUtils.resolveURL(fn2);
        assert.equal(t4, expected);

        const arrow = () => expected;
        const t5 = await URIUtils.resolveURL(arrow);
        assert.equal(t5, expected);
    })

})

