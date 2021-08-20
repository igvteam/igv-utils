import "./utils/mockObjects.js"
import {isgzipped, ungzip, decodeDataURI, uncompressString} from "../src/bgzf.js";
import igvxhr from "../src/igvxhr.js";
import {assert} from 'chai';

suite("testTabix", function () {

    test("isGzipped", async function () {
        const url = require.resolve("./data/json/example.json.bgz");
        const data = await igvxhr.load(url,
            {
                responseType: "arraybuffer",
            })
        const result = isgzipped(data);
        assert.equal(result, true);

        const result2 = isgzipped(new Uint8Array(data));
        assert.equal(result2, true)

    })

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

        const result2 = ungzip(new Uint8Array(data));
        const str2 = String.fromCharCode.apply(null, result2);
        assert.equal(str2, expected)

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

        const result2 = ungzip(new Uint8Array(data));
        const str2 = String.fromCharCode.apply(null, result2);
        assert.equal(str2, expected)

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


    test("Test decode URI", function () {
        const dataURI = "data:application/gzip;base64,H4sIANPMClwC/32WQW/bMAyFz/JfmVSIpCiJGHZwk6YNuqaBYwxtL8Gww7bbDvv/GJV1s2MLugSwGed9eXwi3W/6Te/caew3aCITZ5OBcjb77adx2B/24+v5/v4McP7mz9/h/BM+1m/f/Pr6+0e7eK4XDXhvPlyJe0MmkZVkEfXKAgb94Oyx6x824w6cO/R9bwBjNoyQ0pKX67zc4uUWLy95Z9oFF4hsSkoqyhskebLsU/bddr99Vt5x3JcnMxkKiWnBi1VcbNBiA3aqGZGCOsl6gyYFq3cUk4gjdk93W+XrN6cdGs7AhrQVYWlorBsaW4bGlqFxaehM+9J/sCg2x9J+rxfkI9E77Gl8uT0GA0BgAgsu4ypVWGmwSgNVrkndXPfSesiWs6WCGqh0PoQUoRuOp/h4W3APu1yaEAzmkGRpra9b61vW+pa1fpXVSdsb9Y2jZbBAYovZFtn7YDF6ZouJFF3nwbAl57bPj1yezgYJ/TIUqQqeGtypgZ1WNk+6l9iKni4ouCDCivgC0bmhv9PvJ0oGcsDlHKAqITUIqUFIK18n3XdCoZLXyJK68WHoy7ny4iOmm/IMZzEIUdNzjalnAdaY09015rJ2rtb+GzkJl8CyzqmQbAyXs1WuvKTcjc+XsL4ehnuDUdCQkIZ6kdZ6WFtZbUV12fOZbkmqKCDo2Y8WfRlYDBz0k3M5bhFDNw7HTeiPzj0Nx8+Bje6LbMgn/bEFdz0K0MoCtMIAqzTMtEsaRPNalgFm/T9rUIo6k0GIK6BQB4UWKLRAr/Mw0y6gWPbBZQ5IiLn70h9vnds/vu10tKHXujCuKOsbC1orC1o7a1b8l9pJ+zJlRTFBs8pcUJPXCYYZFPjt6fWwzc5t7o46yXTOSSwZZ15Og/pLQeudoPVKwIstO9ctwIU35r/BxSQaB8ycQvcHZwncbXMJAAA=";
        let plain = decodeDataURI(dataURI);
        let str = String.fromCharCode.apply(null, plain);
        assert.ok(str);


        const session = "data:application/gzip;base64,H4sIAAbNClwC/w3Hx5KiQAAA0F/Z8spWMWiDMlt7gBaVHCTfmtzkgSbo1Pz77ru978OUF/mU92l++Pz1fSjQTJDnaP9zyBBBn2gcW5wigoeeLt94/JOgOefA7weYZUFIDNhukD4zTzM4X3XxOl/AcLGbJFUsEcOeLS0MN+/+9aA/smPcNGMWQamC+2uJd41ecPHm1wkc1/lN36k1OCV0wcEWG5RrViKREo6hlnmy0TAGUQDcUSDn6sq/G0uU2ODEh3u1uTS3aCcVlukgJrYQqSQetG1UpizAvnX/6urT7Wrns1NrpJMm3ryEmqzfZBbm5l1NGiojprBFk1EitJAqym03atrjwu2KjFpfkmZx7PbgbTh67giLsmGPudn9DFaPEWAjHut0iXp2hhi9CGllRt2tm4YNxglQ7O8M10+ZCtTJ3GmMwqxYPO/RlVjb3C7zta7K9a/bjsJYbuPUYPdwKlu+1ja2q+2zo6n3RlEweQFv9fXKcuJx3J7bs2vb+pWubs5TelQMH3V4YsBC0QX0awas4CoIwt/Dz88/fLgIFuABAAA=";
        plain = decodeDataURI(session);
        str = String.fromCharCode.apply(null, plain);
        const expected = "{\"reference\": {\"fastaURL\": \"data:application/gzip;base64,H4sIAAbNClwC/71SOW7DMBDs84o8QkbcJPBiCn5gPiCwUGqH/0d2ZkkpdYCEhCxyuZxL/uifz9vr42vsz/G+vW3b/f6CliN+TOhBtEb61+usrQaopWYW4TpAt7hD9zkPBE5W39XxhwT/6uL3KCgcoBbQAYKtZoLwpJrdWiVPGqmj3FDQesRjLtmEr9O8XLIMFI5CeOGKbk+dtOAwYrNgaauthYeQTYkl2u6xJIalVEEsBpmxWzNRMeRAuJwiU1FQns4vU1ACkB2jcuYn5sCiayttlI1KxPFLiN1RWaZVx16nrdK4KrOx/iaXdfuUUHmgiLwTmdVLmheMqFxaXZIlZcN5xXrgl9jLw5mjQ7RLKGkJJity4UvVMhPRZppwSwSmlljycvTe9+MYfo0jX314u+/fCVj14v4DAAA=\"}}";
        assert.equal(str, expected);
    })

    test("Test decode data uri", function () {
        const dataURI = "data:application/gzip;base64,H4sIANPMClwC/32WQW/bMAyFz/JfmVSIpCiJGHZwk6YNuqaBYwxtL8Gww7bbDvv/GJV1s2MLugSwGed9eXwi3W/6Te/caew3aCITZ5OBcjb77adx2B/24+v5/v4McP7mz9/h/BM+1m/f/Pr6+0e7eK4XDXhvPlyJe0MmkZVkEfXKAgb94Oyx6x824w6cO/R9bwBjNoyQ0pKX67zc4uUWLy95Z9oFF4hsSkoqyhskebLsU/bddr99Vt5x3JcnMxkKiWnBi1VcbNBiA3aqGZGCOsl6gyYFq3cUk4gjdk93W+XrN6cdGs7AhrQVYWlorBsaW4bGlqFxaehM+9J/sCg2x9J+rxfkI9E77Gl8uT0GA0BgAgsu4ypVWGmwSgNVrkndXPfSesiWs6WCGqh0PoQUoRuOp/h4W3APu1yaEAzmkGRpra9b61vW+pa1fpXVSdsb9Y2jZbBAYovZFtn7YDF6ZouJFF3nwbAl57bPj1yezgYJ/TIUqQqeGtypgZ1WNk+6l9iKni4ouCDCivgC0bmhv9PvJ0oGcsDlHKAqITUIqUFIK18n3XdCoZLXyJK68WHoy7ny4iOmm/IMZzEIUdNzjalnAdaY09015rJ2rtb+GzkJl8CyzqmQbAyXs1WuvKTcjc+XsL4ehnuDUdCQkIZ6kdZ6WFtZbUV12fOZbkmqKCDo2Y8WfRlYDBz0k3M5bhFDNw7HTeiPzj0Nx8+Bje6LbMgn/bEFdz0K0MoCtMIAqzTMtEsaRPNalgFm/T9rUIo6k0GIK6BQB4UWKLRAr/Mw0y6gWPbBZQ5IiLn70h9vnds/vu10tKHXujCuKOsbC1orC1o7a1b8l9pJ+zJlRTFBs8pcUJPXCYYZFPjt6fWwzc5t7o46yXTOSSwZZ15Og/pLQeudoPVKwIstO9ctwIU35r/BxSQaB8ycQvcHZwncbXMJAAA=";
        let plain = decodeDataURI(dataURI);
        let str = String.fromCharCode.apply(null, plain);
        assert.ok(str);

        const session = "data:application/gzip;base64,H4sIAAbNClwC/w3Hx5KiQAAA0F/Z8spWMWiDMlt7gBaVHCTfmtzkgSbo1Pz77ru978OUF/mU92l++Pz1fSjQTJDnaP9zyBBBn2gcW5wigoeeLt94/JOgOefA7weYZUFIDNhukD4zTzM4X3XxOl/AcLGbJFUsEcOeLS0MN+/+9aA/smPcNGMWQamC+2uJd41ecPHm1wkc1/lN36k1OCV0wcEWG5RrViKREo6hlnmy0TAGUQDcUSDn6sq/G0uU2ODEh3u1uTS3aCcVlukgJrYQqSQetG1UpizAvnX/6urT7Wrns1NrpJMm3ryEmqzfZBbm5l1NGiojprBFk1EitJAqym03atrjwu2KjFpfkmZx7PbgbTh67giLsmGPudn9DFaPEWAjHut0iXp2hhi9CGllRt2tm4YNxglQ7O8M10+ZCtTJ3GmMwqxYPO/RlVjb3C7zta7K9a/bjsJYbuPUYPdwKlu+1ja2q+2zo6n3RlEweQFv9fXKcuJx3J7bs2vb+pWubs5TelQMH3V4YsBC0QX0awas4CoIwt/Dz88/fLgIFuABAAA=";
        plain = decodeDataURI(session);
        str = String.fromCharCode.apply(null, plain);
        const expected = "{\"reference\": {\"fastaURL\": \"data:application/gzip;base64,H4sIAAbNClwC/71SOW7DMBDs84o8QkbcJPBiCn5gPiCwUGqH/0d2ZkkpdYCEhCxyuZxL/uifz9vr42vsz/G+vW3b/f6CliN+TOhBtEb61+usrQaopWYW4TpAt7hD9zkPBE5W39XxhwT/6uL3KCgcoBbQAYKtZoLwpJrdWiVPGqmj3FDQesRjLtmEr9O8XLIMFI5CeOGKbk+dtOAwYrNgaauthYeQTYkl2u6xJIalVEEsBpmxWzNRMeRAuJwiU1FQns4vU1ACkB2jcuYn5sCiayttlI1KxPFLiN1RWaZVx16nrdK4KrOx/iaXdfuUUHmgiLwTmdVLmheMqFxaXZIlZcN5xXrgl9jLw5mjQ7RLKGkJJity4UvVMhPRZppwSwSmlljycvTe9+MYfo0jX314u+/fCVj14v4DAAA=\"}}";
        assert.equal(str, expected);
    })


    test("Test uncompressString", function () {
        const session = "tVN_a9swEP0qRX9t4MhWHOPGMEa3krRjaWmS0rJRgmKfbS22lEpyki7ku_fk9McKbf_qDAb77une6b27LdGQgwaZAkm2RGQkIZYLzQLiEclrjJIjemBLXgku.cGn6dHp.IAFnzGdc2P55fgnQkprlybxfRPSrOEVxtMFbUwHENJhlNf8r5J8bWiqal8UK6p0QQuQqgbj7_l8V5kFs7TUM15VFKsjh5AZbP4nB74Cedz1zIfztFWp5XOy80il0saQ5DfpJrEX9QKvF8Qd9xV5rHtIbjxSWNhMoILUCiURun0Dignka62ZdocsDnvOLSOXJJFNVe2QzGrs2rFtib1bOqiB26a12SNKZ6BJ0ukHQcz6_W7Ui3tBv8_QcTVZCild1uoGdt6WNLr6R5RMixXQQqmiglaAXFTgZz47Pj7Lzvqj04urzuHoxyZvuouL.eb8.ioezZejP9_8lYD118Ysv5iSayGL5_kaTkasF8dRGFFd0zmv3Wxh2XfSr4zFm50xw8XiOl9MZuz8Dn7xwyH_fnk8Bn66toMUTl7t7KUO2I_SNbdIt.c3qtEpTPfKOiKMPeiMnheyBmkxVIIoSjwVBoFHUrUCzQuYOmtOHjIRJnAS0fSBhttpqcGUqsItDGj3yajQ.fCoBhrvFuOpoSLPQ_x_adMHzO5wMAhnbswMRYpHzQFby7EwSqKhVis.x7s_Rh7aZUH7vKbis6tvsbynrJTKcrcbGKv5ZqzWOOGRY0KgBe1OtRuG.61qZfBWiGxX5WZ3s7sH";
        const str = uncompressString(session);
        const expected = "{\"reference\":{\"id\":\"tair10\",\"name\":\"A. thaliana (TAIR 10)\",\"fastaURL\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_chr_all.fas\",\"indexURL\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_chr_all.fas.fai\",\"aliasURL\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_alias.tab\"},\"locus\":[\"2:7,540,407-7,545,128\"],\"gtexSelections\":{\"2:7,540,407-7,545,128\":{\"gene\":\"AT2G17340\",\"snp\":null}},\"tracks\":[{\"type\":\"sequence\",\"order\":-9007199254740991,\"noSpinner\":true},{\"url\":\"https://drive.google.com/file/d/1DDNdN9MIQW-8MJxfu2kQbxOXW7MbpMjB/view?usp=sharing\",\"name\":\"GSM1477535.rm.bam\",\"filename\":\"GSM1477535.rm.bam\",\"indexURL\":\"https://drive.google.com/file/d/11saikXfkS_1OyeZa8GaCUDReaIwtFceH/view?usp=sharing\",\"noSpinner\":true,\"format\":\"bam\",\"sourceType\":\"file\",\"type\":\"alignment\",\"height\":300,\"coverageTrackHeight\":50,\"alleleFreqThreshold\":0.2,\"order\":3},{\"name\":\"Genes\",\"format\":\"gff3\",\"url\":\"https://s3.dualstack.us-east-1.amazonaws.com/igv.org.genomes/tair10/TAIR10_GFF3_genes.gff\",\"indexed\":false,\"removable\":false,\"order\":1000000,\"noSpinner\":true,\"filename\":\"TAIR10_GFF3_genes.gff\",\"sourceType\":\"file\",\"type\":\"annotation\",\"maxRows\":500,\"filterTypes\":[\"chromosome\",\"gene\"]}]}";
        assert.equal(str, expected);
    })


})



