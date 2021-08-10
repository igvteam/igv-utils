import "./utils/mockObjects.js"
import {ungzip} from "../src/bgzf.js";
import pako from "../src/vendor/pako.js";
import igvxhr from "../src/igvxhr.js";
import {assert} from 'chai';

suite("testTabix", function () {

    /**
     * Very minimal test of a small file, most likely compressed into a single block.
     */
    test("bgzip", async function () {
        const url = require.resolve("./data/json/example.json.bgz");
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
            })
        const result = ungzip(data);
        const str = String.fromCharCode.apply(null, result);
        const expected = "{\"employees\":[\n" +
            "  {\"firstName\":\"John\", \"lastName\":\"Doe\"},\n" +
            "  {\"firstName\":\"Anna\", \"lastName\":\"Smith\"},\n" +
            "  {\"firstName\":\"Peter\", \"lastName\":\"Jones\"}\n" +
            "]}\n"
        assert.equal(str, expected)
    })

    /**
     * gzip (not bgzipped)
     */
    test("gzip", async function () {
        const url = require.resolve("./data/json/example.json.gz");
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
            })

        const result = ungzip(data);
        const str = String.fromCharCode.apply(null, result);
        const expected = "{\"employees\":[\n" +
            "  {\"firstName\":\"John\", \"lastName\":\"Doe\"},\n" +
            "  {\"firstName\":\"Anna\", \"lastName\":\"Smith\"},\n" +
            "  {\"firstName\":\"Peter\", \"lastName\":\"Jones\"}\n" +
            "]}\n"
        assert.equal(str, expected)
    })

    /**
     * Block-gzipped file with multiple blocks.  This will fail with pako's ungzip
     */
    test("gzip csi index", async function () {

        this.timeout(100000);

        const url = require.resolve("./data/misc/Homo_sapiens.GRCh38.94.chr.gff3.gz.csi");
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
            })

        const result = ungzip(data);
        const str = String.fromCharCode.apply(null, result.slice(0, 3));
        assert.equal(str, "CSI")
    })

})



