import "./utils/mockObjects.js"
import igvxhr from "../src/igvxhr.js"
import {mapUrl} from "../src/igvxhr.js"
import {assert} from 'chai'
import {fileToDataURL} from "./utils/dataURL.js"
import {createFile} from "./utils/File.js"
import IGVXhr from "../src/igvxhr.js"

suite("testIgvXhr", function () {

    const range = {start: 25, size: 100}

    function verifyBytes(arrayBuffer, range) {
        assert.ok(arrayBuffer)
        const dataView = new DataView(arrayBuffer)
        const start = range ? range.start : 0
        for (let i = 0; i <= range.size; i++) {
            const expectedValue = -128 + range.start + i
            const value = dataView.getInt8(i)
            assert.equal(expectedValue, value)
        }
    }

    test("test load", async function () {
        const url = "test/data/misc/BufferedReaderTest.bin"
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
                range: range
            })
        verifyBytes(data, assert)
    })

    test("test load file slice", async function () {
        const url = createFile("test/data/misc/BufferedReaderTest.bin")
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
                range: range
            })
        verifyBytes(data, assert)
    })


    test("test load binary string", async function () {
        const url = "test/data/misc/NC_045512v2.fa"
        const startByte = 13
        const byteCount = 4
        const expected = "ATTA"
        const allBytes = await igvxhr.load(url, {
            range: {
                start: startByte,
                size: byteCount
            }
        })
        assert.equal(expected, allBytes)
    })

    test("test load binary string - file slice", async function () {
        const url = createFile("test/data/misc/NC_045512v2.fa")
        const startByte = 13
        const byteCount = 4
        const expected = "ATTA"
        const allBytes = await igvxhr.load(url, {
            range: {
                start: startByte,
                size: byteCount
            }
        })
        assert.equal(allBytes, expected)
    })

    test("test loadArrayBuffer", async function () {
        const url = "test/data/misc/BufferedReaderTest.bin"
        const data = await igvxhr.loadArrayBuffer(url, {})
        verifyBytes(data, assert)
    })

    test("test loadArrayBuffer slice", async function () {
        const url = "test/data/misc/BufferedReaderTest.bin"
        const data = await igvxhr.loadArrayBuffer(url,
            {
                range: range
            })
        verifyBytes(data, assert)
    })

    test("test loadString", async function () {
        const url = "test/data/json/example.json"
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test loadString from file", async function () {
        const url = createFile("test/data/json/example.json")
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test loadJson", async function () {
        const url = "test/data/json/example.json"
        const result = await igvxhr.loadJson(url, {})
        assert.ok(result)
        assert.ok(result.hasOwnProperty("employees"))
    })

    test("test loadString gzipped", async function () {
        const url = "test/data/json/example.json.gz"
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))

    })

    test("test loadString bg-zipped", async function () {
        const url = "test/data/json/example.json.bgz"
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test loadByteArray", async function () {
        const url = "test/data/json/example.json"
        const data = await igvxhr.loadByteArray(url, {})
        const result = (new TextDecoder()).decode(data)
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test loadByteArray gzipped", async function () {
        const url = "test/data/json/example.json.gz"
        const data = await igvxhr.loadByteArray(url, {})
        const result = (new TextDecoder()).decode(data)
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))

    })

    test("test loadByteArray bg-zipped", async function () {
        const url = "test/data/json/example.json.bgz"
        const data = await igvxhr.loadByteArray(url, {})
        const result = (new TextDecoder()).decode(data)
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    // Data URL tests follow


    test("test loadString dataURI", async function () {
        const url = fileToDataURL("test/data/json/example.json")
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test loadArrayBuffer dataURI", async function () {
        const url = fileToDataURL("test/data/misc/BufferedReaderTest.bin")
        const data = await igvxhr.loadArrayBuffer(url, {})
        verifyBytes(data, assert)
    })

    test("test loadArrayBuffer slice dataURI", async function () {
        const url = fileToDataURL("test/data/misc/BufferedReaderTest.bin")
        const data = await igvxhr.loadArrayBuffer(url,
            {
                range: range
            })
        assert.equal(data.byteLength, range.size)
        verifyBytes(data, assert)
    })

    test("test loadJson dataURI", async function () {
        const url = fileToDataURL("test/data/json/example.json")
        const result = await igvxhr.loadJson(url, {})
        assert.ok(result)
        assert.ok(result.hasOwnProperty("employees"))
    })

    test("test loadString gzipped dataURI", async function () {
        const url = fileToDataURL("test/data/json/example.json.gz")
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test loadString bg-zipped dataURI", async function () {
        const url = fileToDataURL("test/data/json/example.json.bgz")
        const result = await igvxhr.loadString(url, {})
        assert.ok(result)
        assert.ok(result.startsWith("{\"employees\""))
    })

    test("test getContentLength", async function () {

        this.timeout(10000)
        const url = "https://raw.githubusercontent.com/igvteam/igv-genomes/refs/heads/main/data/gbk/NC_012920.1.gbk"
        const contentLength = await igvxhr.getContentLength(url, {})
        assert.equal(contentLength, 70549)

    })

    test("test ucsc backup URL", async function () {

        this.timeout(10000)

        // Modify UCSC_HOST property to point to a non-existent host to force use of backup URL
        const originalHost = igvxhr.UCSC_HOST
        igvxhr.UCSC_HOST = "nonexistenthost.abc"

        const range = {start: 0, size: 100}
        const url = "https://" + igvxhr.UCSC_HOST + "/gbdb/hg38/knownGene.txt"
        const result = await igvxhr.load(url, {range})
        assert.ok(result.startsWith("ENST00000000233.10"))

        // Restore original UCSC_HOST property
        igvxhr.UCSC_HOST = originalHost

    })

    /**
     * Test URL mappings
     */
    test("test url mappings", function () {

        let u1 = "https://www.dropbox.com/foo"
        let u2 = "https://dl.dropboxusercontent.com/foo"
        assert.equal(mapUrl(u1), u2)

         u1 = "https://www.broadinstitute.org/igvdata/foo"
         u2 = "https://data.broadinstitute.org/igvdata/foo"
        assert.equal(mapUrl(u1), u2)

         u1 = "https://igvdata.broadinstitute.org/foo"
         u2 = "https://s3.amazonaws.com/igv.broadinstitute.org/foo"
        assert.equal(mapUrl(u1), u2)

         u1 = "https://igv.genepattern.org/foo"
         u2 = "https://igv-genepattern-org.s3.amazonaws.com/foo"
        assert.equal(mapUrl(u1), u2)
    })

})
