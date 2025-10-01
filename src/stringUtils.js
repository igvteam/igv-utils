/**
 * Covers string literals and String objects
 * @param x
 * @returns {boolean}
 */
function isString(x) {
    return typeof x === "string" || x instanceof String
}


// StackOverflow: http://stackoverflow.com/a/10810674/116169
function numberFormatter(rawNumber) {

    var dec = String(rawNumber).split(/[.,]/),
        sep = ',',
        decsep = '.'

    return dec[0].split('').reverse().reduce(function (prev, now, i) {
        return i % 3 === 0 ? prev + sep + now : prev + now
    }).split('').reverse().join('') + (dec[1] ? decsep + dec[1] : '')
}

const numberUnFormatter = formatedNumber => formatedNumber.split(",").join().replace(",", "", "g")

const splitLines = function (string) {
    return string.split(/\n|\r\n|\r/g)
}


function splitStringRespectingQuotes(string, delim) {

    var tokens = [],
        len = string.length,
        i,
        n = 0,
        quote = false,
        c

    if (len > 0) {

        tokens[n] = string.charAt(0)
        for (i = 1; i < len; i++) {
            c = string.charAt(i)
            if (c === '"') {
                quote = !quote
            } else if (!quote && c === delim) {
                n++
                tokens[n] = ""
            } else {
                tokens[n] += c
            }
        }
    }
    return tokens
}

function stripQuotes(str) {
    if (str === undefined) {
        return str
    }
    if (str.startsWith("'") || str.startsWith('"')) {
        str = str.substring(1)
    }
    if (str.endsWith("'") || str.endsWith('"')) {
        str = str.substring(0, str.length - 1)
    }
    return str
}

function hashCode(s) {
    return s.split("").reduce(function (a, b) {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
    }, 0)
}

function capitalize(str) {
    return str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : str
}


/**
 * Parse a locus string and return a range object.  Locus string is of the form chr:start-end.  End is optional
 *
 */
function parseLocusString(string) {

    const t1 = string.split(":")
    const t2 = t1[1].split("-")

    const range = {
        chr: t1[0],
        start: Number.parseInt(t2[0].replace(/,/g, '')) - 1
    }

    if (t2.length > 1) {
        range.end = Number.parseInt(t2[1].replace(/,/g, ''))
    } else {
        range.end = range.start + 1
    }

    return range
}

export {
    isString, numberFormatter, numberUnFormatter, splitLines, splitStringRespectingQuotes, stripQuotes,
    hashCode, capitalize, parseLocusString
}