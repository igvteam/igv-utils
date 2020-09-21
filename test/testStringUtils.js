import {StringUtils} from "../src/index.js"
import {assert} from 'chai';

suite("testStringUtils", function () {

    test("Test locus parsing 1", function () {
        const locus = "chr1:101-200";
        const range = StringUtils.parseLocusString(locus);
        assert.equal(range.chr, "chr1");
        assert.equal(range.start, 100);
        assert.equal(range.end, 200);
    })

    test("Test locus parsing 2", function () {
        const locus = "chr1:101";
        const range = StringUtils.parseLocusString(locus);
        assert.equal(range.chr, "chr1");
        assert.equal(range.start, 100);
        assert.equal(range.end, 101);
    })

    test("Test uncompressString", function () {
      const session = "tVN_a9swEP0qRX9t4MhWHOPGMEa3krRjaWmS0rJRgmKfbS22lEpyki7ku_fk9McKbf_qDAb77une6b27LdGQgwaZAkm2RGQkIZYLzQLiEclrjJIjemBLXgku.cGn6dHp.IAFnzGdc2P55fgnQkprlybxfRPSrOEVxtMFbUwHENJhlNf8r5J8bWiqal8UK6p0QQuQqgbj7_l8V5kFs7TUM15VFKsjh5AZbP4nB74Cedz1zIfztFWp5XOy80il0saQ5DfpJrEX9QKvF8Qd9xV5rHtIbjxSWNhMoILUCiURun0Dignka62ZdocsDnvOLSOXJJFNVe2QzGrs2rFtib1bOqiB26a12SNKZ6BJ0ukHQcz6_W7Ui3tBv8_QcTVZCild1uoGdt6WNLr6R5RMixXQQqmiglaAXFTgZz47Pj7Lzvqj04urzuHoxyZvuouL.eb8.ioezZejP9_8lYD118Ysv5iSayGL5_kaTkasF8dRGFFd0zmv3Wxh2XfSr4zFm50xw8XiOl9MZuz8Dn7xwyH_fnk8Bn66toMUTl7t7KUO2I_SNbdIt.c3qtEpTPfKOiKMPeiMnheyBmkxVIIoSjwVBoFHUrUCzQuYOmtOHjIRJnAS0fSBhttpqcGUqsItDGj3yajQ.fCoBhrvFuOpoSLPQ_x_adMHzO5wMAhnbswMRYpHzQFby7EwSqKhVis.x7s_Rh7aZUH7vKbis6tvsbynrJTKcrcbGKv5ZqzWOOGRY0KgBe1OtRuG.61qZfBWiGxX5WZ3s7sH";
      const str = StringUtils.uncompressString(session);
      assert.ok(str);
    })
})

