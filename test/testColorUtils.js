import "./utils/mockObjects.js"
import {assert} from 'chai';
import IGVColor from "../src/igv-color.js"

suite("color utils", function () {

    test("getRGBComponents", function () {

        const rgb = IGVColor.rgbComponents("rgb(100,150,200)");
        assert.equal(rgb[0], 100);
        assert.equal(rgb[1], 150);
        assert.equal(rgb[2], 200);

        const rgba = IGVColor.rgbComponents("rgba(100, 150, 200, 0.5)");
        assert.equal(rgba[0], 100);
        assert.equal(rgba[1], 150);
        assert.equal(rgba[2], 200);
        assert.equal(rgba[3], 0.5);

        //50, 168, 82
        const hex = IGVColor.rgbComponents("#32a852");
        assert.equal(hex[0], 50);
        assert.equal(hex[1], 168);
        assert.equal(hex[2], 82);

        //0, 255, 255
        const name = IGVColor.rgbComponents("aqua")
        assert.equal(name[0], 0);
        assert.equal(name[1], 255);
        assert.equal(name[2], 255);

    })


})

