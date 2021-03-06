import "./utils/mockObjects.js"
import {assert} from 'chai';
import {StringUtils} from "../src/index.js"

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

    test("Test uncompress fasta ", function () {
        const fasta = "H4sIAD/GrF8C/71Su27DMBDb+y/dFMTtUODAQT/AP+jSOf8/9EhK9lKgQIDWSmLpzsdX/PH59bi9j/sYx/E67rdxvL1gzurVF9k3aFczRa8CSk3/eq/+avYRa2VYNfB8pD99+pnjWhp+luVXmo3yZwT/6uJ5FAQHyAZqoDizGoQn1Xpau+ZpI2n1gYLWVzzmkk14nObllmWgchTCK1c0vXTSgsuI04KlLUcL14sXSmzRdo8tsSwlBbEYZMVuzURi6AvlcotsRUV5Ov+ZQAlAdozKlZ+YC5tu7rQRG0nE8UuI3VFZtlXHnu5MGldlPZjX5LJunxIqDxSRTyKzeknzhlXJZWZIlpQN14j1wDexxwO/AXEZH/z+AwAA"
        const str = atob(fasta);
        console.log(fasta)
        assert.ok(str);
    })
})

