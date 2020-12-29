import "./utils/mockObjects.js"
import {unbgzf} from "../src/bgzf.js";
import igvxhr from "../src/igvxhr.js";
import {assert} from 'chai';

suite("testTabix", function () {

    test("bgzip", async function () {
        const url = require.resolve("./data/json/example.json.bgz");
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
            })
        const result = unbgzf(data)
        assert.ok(result)
    })


})



