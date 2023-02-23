
import {isgzipped, ungzip, decodeDataURI, uncompressString, compressString} from "../src/bgzf.js"
import {strict as assert} from 'node:assert'
import fs from 'fs'

suite("testBGzip", function () {

    test("compressString", async function () {

        const str = "!@#$%^&*()_+=//{}"
        const compressed = compressString(str)
        const uncomp = uncompressString(compressed)
        assert.equal(uncomp, str)

    })


    test("isGzipped", async function () {

        const data = fs.readFileSync("test/data/json/example.json.bgz")

        const result = isgzipped(data)
        assert.equal(result, true)

        const result2 = isgzipped(new Uint8Array(data))
        assert.equal(result2, true)

    })

    /**
     * Very minimal test of a small file, most likely compressed into a single block.
     */
    test("bgzip", async function () {
        const buffer = fs.readFileSync("test/data/json/example.json.bgz")
        const data = bufferToArrayBuffer(buffer)
        const result = ungzip(data)
        const str = new TextDecoder().decode(result)
        const expected = "{\"employees\":[\n" +
            "  {\"firstName\":\"John\", \"lastName\":\"Doe\"},\n" +
            "  {\"firstName\":\"Anna\", \"lastName\":\"Smith\"},\n" +
            "  {\"firstName\":\"Peter\", \"lastName\":\"Jones\"}\n" +
            "]}\n"
        assert.equal(str, expected)

        const result2 = ungzip(new Uint8Array(data))
        const str2 = String.fromCharCode.apply(null, result2)
        assert.equal(str2, expected)

    })

    /**
     * gzip (not bgzipped)
     */
    test("gzip", async function () {
        const buffer = fs.readFileSync("test/data/json/example.json.gz")
        const data = bufferToArrayBuffer(buffer)
        const result = ungzip(data)
        const str = String.fromCharCode.apply(null, result)
        const expected = "{\"employees\":[\n" +
            "  {\"firstName\":\"John\", \"lastName\":\"Doe\"},\n" +
            "  {\"firstName\":\"Anna\", \"lastName\":\"Smith\"},\n" +
            "  {\"firstName\":\"Peter\", \"lastName\":\"Jones\"}\n" +
            "]}\n"
        assert.equal(str, expected)

        const result2 = ungzip(new Uint8Array(data))
        const str2 = String.fromCharCode.apply(null, result2)
        assert.equal(str2, expected)

    })

    /**
     * Block-gzipped file with multiple blocks.  This will fail with pako's ungzip
     */
    test("gzip csi index", async function () {

        this.timeout(100000)
        const url = "https://s3.amazonaws.com/igv.org.genomes/hg38/Homo_sapiens.GRCh38.94.chr.gff3.gz.csi"
        const response = await fetch(url)
        const data = await response.arrayBuffer()
        const result = ungzip(data)
        const str = String.fromCharCode.apply(null, result.slice(0, 3))
        assert.equal(str, "CSI")
    })


    test("Test decode URL 1", function () {
        const session = "data:application/gzip;base64,H4sIAAbNClwC/w3Hx5KiQAAA0F/Z8spWMWiDMlt7gBaVHCTfmtzkgSbo1Pz77ru978OUF/mU92l++Pz1fSjQTJDnaP9zyBBBn2gcW5wigoeeLt94/JOgOefA7weYZUFIDNhukD4zTzM4X3XxOl/AcLGbJFUsEcOeLS0MN+/+9aA/smPcNGMWQamC+2uJd41ecPHm1wkc1/lN36k1OCV0wcEWG5RrViKREo6hlnmy0TAGUQDcUSDn6sq/G0uU2ODEh3u1uTS3aCcVlukgJrYQqSQetG1UpizAvnX/6urT7Wrns1NrpJMm3ryEmqzfZBbm5l1NGiojprBFk1EitJAqym03atrjwu2KjFpfkmZx7PbgbTh67giLsmGPudn9DFaPEWAjHut0iXp2hhi9CGllRt2tm4YNxglQ7O8M10+ZCtTJ3GmMwqxYPO/RlVjb3C7zta7K9a/bjsJYbuPUYPdwKlu+1ja2q+2zo6n3RlEweQFv9fXKcuJx3J7bs2vb+pWubs5TelQMH3V4YsBC0QX0awas4CoIwt/Dz88/fLgIFuABAAA="
        const plain = decodeDataURI(session)
        const str = String.fromCharCode.apply(null, plain)
        const expected = "{\"reference\": {\"fastaURL\": \"data:application/gzip;base64,H4sIAAbNClwC/71SOW7DMBDs84o8QkbcJPBiCn5gPiCwUGqH/0d2ZkkpdYCEhCxyuZxL/uifz9vr42vsz/G+vW3b/f6CliN+TOhBtEb61+usrQaopWYW4TpAt7hD9zkPBE5W39XxhwT/6uL3KCgcoBbQAYKtZoLwpJrdWiVPGqmj3FDQesRjLtmEr9O8XLIMFI5CeOGKbk+dtOAwYrNgaauthYeQTYkl2u6xJIalVEEsBpmxWzNRMeRAuJwiU1FQns4vU1ACkB2jcuYn5sCiayttlI1KxPFLiN1RWaZVx16nrdK4KrOx/iaXdfuUUHmgiLwTmdVLmheMqFxaXZIlZcN5xXrgl9jLw5mjQ7RLKGkJJity4UvVMhPRZppwSwSmlljycvTe9+MYfo0jX314u+/fCVj14v4DAAA=\"}}"
        assert.equal(str, expected)
    })

    test("Test decode URL 2", function () {
        const url = "data:,Hello%2C%20World%21"
        const str = decodeDataURI(url)
        const expected = "Hello, World!"
        assert.equal(str, expected)
    })


    test("Test uncompressString", function () {
        const session = "tVN_a9swEP0qRX9t4MhWHOPGMEa3krRjaWmS0rJRgmKfbS22lEpyki7ku_fk9McKbf_qDAb77une6b27LdGQgwaZAkm2RGQkIZYLzQLiEclrjJIjemBLXgku.cGn6dHp.IAFnzGdc2P55fgnQkprlybxfRPSrOEVxtMFbUwHENJhlNf8r5J8bWiqal8UK6p0QQuQqgbj7_l8V5kFs7TUM15VFKsjh5AZbP4nB74Cedz1zIfztFWp5XOy80il0saQ5DfpJrEX9QKvF8Qd9xV5rHtIbjxSWNhMoILUCiURun0Dignka62ZdocsDnvOLSOXJJFNVe2QzGrs2rFtib1bOqiB26a12SNKZ6BJ0ukHQcz6_W7Ui3tBv8_QcTVZCild1uoGdt6WNLr6R5RMixXQQqmiglaAXFTgZz47Pj7Lzvqj04urzuHoxyZvuouL.eb8.ioezZejP9_8lYD118Ysv5iSayGL5_kaTkasF8dRGFFd0zmv3Wxh2XfSr4zFm50xw8XiOl9MZuz8Dn7xwyH_fnk8Bn66toMUTl7t7KUO2I_SNbdIt.c3qtEpTPfKOiKMPeiMnheyBmkxVIIoSjwVBoFHUrUCzQuYOmtOHjIRJnAS0fSBhttpqcGUqsItDGj3yajQ.fCoBhrvFuOpoSLPQ_x_adMHzO5wMAhnbswMRYpHzQFby7EwSqKhVis.x7s_Rh7aZUH7vKbis6tvsbynrJTKcrcbGKv5ZqzWOOGRY0KgBe1OtRuG.61qZfBWiGxX5WZ3s7sH"
        const str = uncompressString(session)
        const expected = "{\"reference\":{\"id\":\"tair10\",\"name\":\"A. thaliana (TAIR 10)\",\"fastaURL\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_chr_all.fas\",\"indexURL\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_chr_all.fas.fai\",\"aliasURL\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_alias.tab\"},\"locus\":[\"2:7,540,407-7,545,128\"],\"gtexSelections\":{\"2:7,540,407-7,545,128\":{\"gene\":\"AT2G17340\",\"snp\":null}},\"tracks\":[{\"type\":\"sequence\",\"order\":-9007199254740991,\"noSpinner\":true},{\"url\":\"https://drive.google.com/file/d/1DDNdN9MIQW-8MJxfu2kQbxOXW7MbpMjB/view?usp=sharing\",\"name\":\"GSM1477535.rm.bam\",\"filename\":\"GSM1477535.rm.bam\",\"indexURL\":\"https://drive.google.com/file/d/11saikXfkS_1OyeZa8GaCUDReaIwtFceH/view?usp=sharing\",\"noSpinner\":true,\"format\":\"bam\",\"sourceType\":\"file\",\"type\":\"alignment\",\"height\":300,\"coverageTrackHeight\":50,\"alleleFreqThreshold\":0.2,\"order\":3},{\"name\":\"Genes\",\"format\":\"gff3\",\"url\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_GFF3_genes.gff\",\"indexed\":false,\"removable\":false,\"order\":1000000,\"noSpinner\":true,\"filename\":\"TAIR10_GFF3_genes.gff\",\"sourceType\":\"file\",\"type\":\"annotation\",\"maxRows\":500,\"filterTypes\":[\"chromosome\",\"gene\"]}]}"
        assert.equal(str, expected)
    })


})


function bufferToArrayBuffer(buffer) {

    const arrayBufer = new ArrayBuffer(buffer.length)
    const typedArray = new Uint8Array(arrayBufer)
    for(let i=0; i< buffer.length; i++) {
        typedArray[i] = buffer[i]
    }
    return arrayBufer

}


