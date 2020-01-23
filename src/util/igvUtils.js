/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Broad Institute
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

const extend = function (parent, child) {

    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
    child.prototype._super = Object.getPrototypeOf(child.prototype);
    return child;
}

/**
 * Test if the given value is a string or number.  Not using typeof as it fails on boxed primitives.
 *
 * @param value
 * @returns boolean
 */

function isSimpleType(value) {
    const simpleTypes = new Set(["boolean", "number", "string", "symbol"]);
    const valueType = typeof value;
    return (value !== undefined && (simpleTypes.has(valueType) || value.substring || value.toFixed))
}

function buildOptions (config, options) {

    var defaultOptions = {
        oauthToken: config.oauthToken,
        headers: config.headers,
        withCredentials: config.withCredentials,
        filename: config.filename
    };

    return Object.assign(defaultOptions, options);
}


function download  (filename, data) {

    const element = document.createElement('a');
    element.setAttribute('href', data);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


/**
 * isMobile test from http://detectmobilebrowsers.com
 * TODO -- improve UI design so this isn't neccessary
 * @returns {boolean}
 */

const doAutoscale = function (features) {
    var min, max;

    if (features.length > 0) {
        min = Number.MAX_VALUE;
        max = -Number.MAX_VALUE;

        features.forEach(function (f) {
            if (!Number.isNaN(f.value)) {
                min = Math.min(min, f.value);
                max = Math.max(max, f.value);
            }
        });

        // Insure we have a zero baseline
        if (max > 0) min = Math.min(0, min);
        if (max < 0) max = 0;
    } else {
        // No features -- default
        min = 0;
        max = 100;
    }

    return {min: min, max: max};
}


const validateLocusExtent = function (chromosomeLengthBP, extent, minimumBP) {

    let ss = extent.start;
    let ee = extent.end;

    if (undefined === ee) {

        ss -= minimumBP / 2;
        ee = ss + minimumBP;

        if (ee > chromosomeLengthBP) {
            ee = chromosomeLengthBP;
            ss = ee - minimumBP;
        } else if (ss < 0) {
            ss = 0;
            ee = minimumBP;
        }

    } else if (ee - ss < minimumBP) {

        const center = (ee + ss) / 2;

        if (center - minimumBP / 2 < 0) {
            ss = 0;
            ee = ss + minimumBP;
        } else if (center + minimumBP / 2 > chromosomeLengthBP) {
            ee = chromosomeLengthBP;
            ss = ee - minimumBP;
        } else {
            ss = center - minimumBP / 2;
            ee = ss + minimumBP;
        }
    }

    extent.start = Math.ceil(ss);
    extent.end = Math.floor(ee);
};

export {extend, isSimpleType, buildOptions, download, validateLocusExtent, doAutoscale}

