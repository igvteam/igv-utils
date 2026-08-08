import "./utils/mockObjects.js"
import igvxhr, {mapUrl, isMappable, arrayBufferToString} from "../src/igvxhr.js"
import {gzip} from "../src/pako.esm.js"
import {assert} from 'chai'
import {fileToDataURL} from "./utils/dataURL.js"
import {createFile} from "./utils/File.js"
import {XMLHttpRequestLocal} from "./utils/XMLHttpRequestLocal.js"
import fs from "fs"
import os from "os"
import path from "path"

suite("testIgvXhr", function () {

    const range = {start: 25, size: 100}

    /**
     * The fixture is 256 bytes, byte i holding the signed value -128 + i.  With no range the whole file is
     * expected, otherwise just the requested slice.
     */
    function verifyBytes(arrayBuffer, range) {
        assert.ok(arrayBuffer)
        const dataView = new DataView(arrayBuffer)
        const start = range ? range.start : 0
        const size = range ? range.size : arrayBuffer.byteLength

        assert.equal(arrayBuffer.byteLength, size)
        for (let i = 0; i < size; i++) {
            const expectedValue = -128 + start + i
            assert.equal(dataView.getInt8(i), expectedValue, `byte ${i}`)
        }
    }

    test("test load", async function () {
        const url = "test/data/misc/BufferedReaderTest.bin"
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
                range: range
            })
        verifyBytes(data, range)
    })

    test("test load file slice", async function () {
        const url = createFile("test/data/misc/BufferedReaderTest.bin")
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
                range: range
            })
        verifyBytes(data, range)
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
        verifyBytes(data)
    })

    test("test loadArrayBuffer slice", async function () {
        const url = "test/data/misc/BufferedReaderTest.bin"
        const data = await igvxhr.loadArrayBuffer(url,
            {
                range: range
            })
        verifyBytes(data, range)
    })

    /**
     * Some servers ignore the Range header and answer 200 with the whole file -- seen with very small files.
     * igvxhr slices the response itself rather than handing the caller more data than it asked for.
     */
    test("test range ignored by server", async function () {

        XMLHttpRequestLocal.ignoreRange = true
        try {
            const data = await igvxhr.loadArrayBuffer("test/data/misc/BufferedReaderTest.bin", {range})
            verifyBytes(data, range)

            // Same, for a text response -- sliced by character rather than byte
            const text = await igvxhr.load("test/data/misc/NC_045512v2.fa", {range: {start: 13, size: 4}})
            assert.equal(text, "ATTA")
        } finally {
            XMLHttpRequestLocal.ignoreRange = false
        }
    })

    /**
     * Slicing a large response wastes the bandwidth spent on the rest of it, so the user is warned -- once.
     */
    test("test range ignored warns once for a large response", async function () {

        const bigFile = path.join(os.tmpdir(), "igvxhr-range-ignored.bin")
        fs.writeFileSync(bigFile, Buffer.alloc(1024 * 1024 + 1000))

        const warnings = []
        const originalWarn = console.warn
        const originalGiven = igvxhr.RANGE_WARNING_GIVEN

        XMLHttpRequestLocal.ignoreRange = true
        console.warn = (msg) => warnings.push(msg)
        igvxhr.RANGE_WARNING_GIVEN = false

        try {
            const first = await igvxhr.loadArrayBuffer(bigFile, {range})
            const second = await igvxhr.loadArrayBuffer(bigFile, {range})

            // Still only the requested slice, however much the server sent
            assert.equal(first.byteLength, range.size)
            assert.equal(second.byteLength, range.size)

            assert.equal(warnings.length, 1, "expected exactly one warning")
            assert.include(warnings[0], "Range header ignored")
        } finally {
            console.warn = originalWarn
            igvxhr.RANGE_WARNING_GIVEN = originalGiven
            XMLHttpRequestLocal.ignoreRange = false
            fs.unlinkSync(bigFile)
        }
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
        verifyBytes(data)
    })

    test("test loadArrayBuffer slice dataURI", async function () {
        const url = fileToDataURL("test/data/misc/BufferedReaderTest.bin")
        const data = await igvxhr.loadArrayBuffer(url,
            {
                range: range
            })
        assert.equal(data.byteLength, range.size)
        verifyBytes(data, range)
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
        // Pinned to a commit sha -- a branch ref would let an upstream edit change the content length out from under us
        const url = "https://raw.githubusercontent.com/igvteam/igv-data/2fe36d006d7397812309caf4e3951466bb01dd25/genomes/gbk/NC_012920.1.gbk"
        const contentLength = await igvxhr.getContentLength(url, {})
        assert.equal(contentLength, 70556)
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

        u1 = "ftp://ftp.ncbi.nlm.nih.gov/geo/foo"
        u2 = "https://ftp.ncbi.nlm.nih.gov/geo/foo"
        assert.equal(mapUrl(u1), u2)

        // Not a known mapping -- returned unchanged
        u1 = "https://example.com/foo"
        assert.equal(mapUrl(u1), u1)
    })

    /**
     * The mapping table (https://igv.org/data/url_mappings.tsv) is consulted only when a request fails.  Many of
     * its entries are prospective -- the source url is still live, and must be served as-is until it isn't.
     */
    test("test retired url falls back to mapping", async function () {

        this.timeout(10000)

        // This bucket has been retired, it answers 403.  The table maps it to a copy on github.
        const retiredUrl = "https://igv-genepattern-org.s3.us-east-1.amazonaws.com/genomes/genomes.tsv"
        const result = await igvxhr.loadString(retiredUrl)
        assert.ok(result.startsWith("# Hosted genomes list."))
    })

    test("test live url is not mapped", async function () {

        this.timeout(10000)

        // Present in the mapping table, but still live -- we must get the original resource, not the replacement
        const liveUrl = "https://s3.us-east-1.amazonaws.com/igv.org.genomes/genomes.json"
        const mappedUrl = "https://raw.githubusercontent.com/igvteam/igv-data/refs/heads/main/genomes/legacy/genomes.json"

        const result = await igvxhr.loadJson(liveUrl)
        const mapped = await igvxhr.loadJson(mappedUrl)

        assert.ok(Array.isArray(result))

        // The two copies differ.  A failure here means the url was mapped when it should not have been -- or the
        // bucket has finally been retired, in which case mapping is correct and this test should be removed.
        assert.notDeepEqual(result, mapped)
    })

    test("test unmapped failure reports the original url", async function () {

        this.timeout(10000)

        const missingUrl = "https://raw.githubusercontent.com/igvteam/igv-data/refs/heads/main/no-such-file-xyz"
        try {
            await igvxhr.loadString(missingUrl)
            assert.fail("Expected an error")
        } catch (e) {
            assert.include(e.message, missingUrl)
            assert.equal(e.status, 404)
        }
    })

    test("test caller options are not modified", async function () {

        const options = {responseType: "arraybuffer"}
        await igvxhr.loadString("test/data/misc/BufferedReaderTest.bin", options)

        // loadString forces responseType internally, and the retry helpers set flags -- none may leak back
        assert.deepEqual(options, {responseType: "arraybuffer"})
    })

    test("test timeout", async function () {

        this.timeout(10000)

        // TEST-NET-1 (RFC 5737), reserved and unroutable -- the connection hangs until we time it out
        const url = "https://192.0.2.1/some/file.txt"

        const start = Date.now()
        try {
            await igvxhr.loadString(url, {timeout: 500})
            assert.fail("Expected a timeout")
        } catch (e) {
            assert.include(e.message, "Timed out")
            assert.equal(e.status, 0)
        }

        // Guard against the timeout being ignored and the socket failing on its own much later
        assert.isBelow(Date.now() - start, 8000)
    })

    /**
     * The mappings table is fetched once and shared.  Requests issued before that fetch completes must all wait
     * for it -- an earlier version installed the (empty) map before awaiting, so concurrent callers saw a
     * populated-looking table and silently skipped mapping.
     *
     * The module caches the table for the life of the process, so this test needs its own copy of the module.
     * A query string on the specifier defeats the ESM cache.
     */
    test("test concurrent loads share one mappings fetch", async function () {

        this.timeout(20000)

        const {default: freshXhr} = await import("../src/igvxhr.js?concurrent-mappings")

        const retiredUrl = "https://igv-genepattern-org.s3.us-east-1.amazonaws.com/genomes/genomes.tsv"
        const results = await Promise.all(
            Array.from({length: 10}, () => freshXhr.loadString(retiredUrl)))

        assert.equal(results.length, 10)
        for (let result of results) {
            assert.ok(result.startsWith("# Hosted genomes list."))
        }
    })

    test("test cors proxy fallback", async function () {

        this.timeout(10000)

        // The proxy is called as <corsProxy>?url=<encoded original>.  Any static file that ignores unknown query
        // parameters stands in for a real proxy -- we only need to prove the retry fired and its result was used.
        const originalProxy = igvxhr.corsProxy
        igvxhr.corsProxy = "https://raw.githubusercontent.com/igvteam/igv-data/2fe36d006d7397812309caf4e3951466bb01dd25/genomes/gbk/NC_012920.1.gbk"

        try {
            const result = await igvxhr.loadString("https://nonexistenthost.abc/foo")
            assert.ok(result.startsWith("LOCUS"))
        } finally {
            igvxhr.corsProxy = originalProxy
        }
    })

    /**
     * "load" accepts a url, a function returning one, a promise, or a function returning a promise.
     */
    test("test url argument types", async function () {

        const path = "test/data/json/example.json"

        for (let url of [path, () => path, Promise.resolve(path), () => Promise.resolve(path)]) {
            const result = await igvxhr.loadString(url)
            assert.ok(result.startsWith("{\"employees\""), `url type ${typeof url}`)
        }
    })

    test("test url argument of unsupported type", async function () {

        try {
            await igvxhr.load(42)
            assert.fail("Expected an error")
        } catch (e) {
            assert.include(e.message, "url must be either")
        }
    })

    test("test getContentLength of a file", async function () {

        const file = createFile("test/data/json/example.json")
        const contentLength = await igvxhr.getContentLength(file)
        assert.equal(contentLength, file.size)
    })

    test("test getContentLength of a missing url", async function () {

        this.timeout(10000)

        // Failure is reported as -1, not thrown -- callers treat the length as unknown
        const missingUrl = "https://raw.githubusercontent.com/igvteam/igv-data/refs/heads/main/no-such-file-xyz"
        const contentLength = await igvxhr.getContentLength(missingUrl)
        assert.equal(contentLength, -1)
    })

    /**
     * All other fixtures are ASCII.  arrayBufferToString decodes with TextDecoder, these assert it handles
     * multi-byte sequences, including a codepoint outside the BMP.
     */
    test("test decode multibyte utf-8", function () {

        const text = "hello éà中文 🚀"
        const encoded = new TextEncoder().encode(text)

        assert.equal(arrayBufferToString(encoded.buffer), text)
        assert.equal(arrayBufferToString(gzip(encoded).buffer), text)
    })

    test("test isMappable", function () {

        // Failures that can mean a retired resource
        for (let status of [0, 403, 404, 410]) {
            assert.isTrue(isMappable({status}), `status ${status}`)
        }

        // A bad range, a server error, and an abort (rejects with an event, no status) tell us nothing about the url
        for (let status of [416, 500, undefined]) {
            assert.isFalse(isMappable({status}), `status ${status}`)
        }
        assert.isFalse(isMappable(undefined))
    })

})
