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

import {isFilePath} from './fileUtils.js'
import FileFormats from "./fileFormats.js";

const knownFileExtensions = new Set([

    "narrowpeak",
    "broadpeak",
    "regionpeak",
    "peaks",
    "bedgraph",
    "wig",
    "gff3",
    "gff",
    "gtf",
    "fusionjuncspan",
    "refflat",
    "seg",
    "aed",
    "bed",
    "vcf",
    "bb",
    "bigbed",
    "bw",
    "bigwig",
    "bam",
    "tdf",
    "refgene",
    "genepred",
    "genepredext",
    "bedpe",
    "bp",
    "snp",
    "rmsk",
    "cram",
    "gwas"
]);

/**
 * Return a custom format object with the given name.
 * @param name
 * @returns {*}
 */
function getFormat(name) {

    if (FileFormats && FileFormats[name]) {
        return expandFormat(FileFormats[name]);
    } else {
        return undefined;
    }

    function expandFormat(format) {

        const fields = format.fields;
        const keys = ['chr', 'start', 'end'];

        for (let i = 0; i < fields.length; i++) {
            for (let key of keys) {
                if (key === fields[i]) {
                    format[key] = i;
                }
            }
        }

        return format;
    }
}

function inferFileFormat(fn) {

    var idx, ext;

    fn = fn.toLowerCase();

    // Special case -- UCSC refgene files
    if (fn.endsWith("refgene.txt.gz") ||
        fn.endsWith("refgene.txt.bgz") ||
        fn.endsWith("refgene.txt") ||
        fn.endsWith("refgene.sorted.txt.gz") ||
        fn.endsWith("refgene.sorted.txt.bgz")) {
        return "refgene";
    }


    //Strip parameters -- handle local files later
    idx = fn.indexOf("?");
    if (idx > 0) {
        fn = fn.substr(0, idx);
    }

    //Strip aux extensions .gz, .tab, and .txt
    if (fn.endsWith(".gz")) {
        fn = fn.substr(0, fn.length - 3);
    }

    if (fn.endsWith(".txt") || fn.endsWith(".tab") || fn.endsWith(".bgz")) {
        fn = fn.substr(0, fn.length - 4);
    }


    idx = fn.lastIndexOf(".");
    ext = idx < 0 ? fn : fn.substr(idx + 1);

    switch (ext) {
        case "bw":
            return "bigwig";
        case "bb":
            return "bigbed";

        default:
            if (knownFileExtensions.has(ext)) {
                return ext;
            } else {
                return undefined;
            }
    }

}

function inferIndexPath(url, extension) {

    var path, idx;

    if (url instanceof File) {
        throw new Error("Cannot infer an index path for a local File.  Please select explicitly")
    }

    if (url.includes("?")) {
        idx = url.indexOf("?");
        return url.substring(0, idx) + "." + extension + url.substring(idx);
    } else {
        return url + "." + extension;
    }
}

export {knownFileExtensions, getFormat, inferFileFormat, inferIndexPath};
