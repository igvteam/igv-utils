import pako from "./vendor/pako.js";

const deflateRaw = pako.deflateRaw;
const deflate = pako.deflate;
const inflateRaw = pako.inflateRaw;
const inflate = pako.inflate;
const gzip = pako.gzip;

const FEXTRA = 4;  // gzip spec F.EXTRA flag

function isgzipped(data) {
    const b = ArrayBuffer.isView(data) ? ba : new Uint8Array(data);
    return b[0] ===31 && b[1] === 139;
}

/**
 * Pako does not properly ungzip block compressed files if > 1 block is present.  Test for bgzip and use wrapper.
 */
function ungzip(data) {
    const ba = ArrayBuffer.isView(data) ? ba : new Uint8Array(data);
    const b = ba[3] & FEXTRA;
    if (b !== 0 && ba[12] === 66 && ba[13] === 67) {
        return unbgzf(ba.buffer);
    } else {
        return pako.ungzip(ba);
    }
}

// Uncompress data,  assumed to be series of bgzipped blocks
function unbgzf(data, lim) {

    const oBlockList = [];
    let ptr = 0;
    let totalSize = 0;

    lim = lim || data.byteLength - 18;

    while (ptr < lim) {
        try {
            const ba = new Uint8Array(data, ptr, 18);
            const xlen = (ba[11] << 8) | (ba[10]);
            const flg = ba[3];
            const fextra = flg & FEXTRA;
            const si1 = ba[12];
            const si2 = ba[13];
            const slen = (ba[15] << 8) | (ba[14]);
            const bsize = ((ba[17] << 8) | (ba[16])) + 1;
            const start = 12 + xlen + ptr;    // Start of CDATA
            const bytesLeft = data.byteLength - start;
            const cDataSize = bsize - xlen - 19;
            if (bytesLeft < cDataSize || cDataSize <= 0) break;

            const a = new Uint8Array(data, start, cDataSize);
            const unc = pako.inflateRaw(a);

            // const inflate = new Zlib.RawInflate(a);
            // const unc = inflate.decompress();

            ptr += (cDataSize - 1) + 26; //inflate.ip + 26
            totalSize += unc.byteLength;
            oBlockList.push(unc);
        } catch (e) {
            console.error(e)
            break;
        }
    }

    // Concatenate decompressed blocks
    if (oBlockList.length === 1) {
        return oBlockList[0];
    } else {
        const out = new Uint8Array(totalSize);
        let cursor = 0;
        for (let i = 0; i < oBlockList.length; ++i) {
            var b = new Uint8Array(oBlockList[i]);
            arrayCopy(b, 0, out, cursor, b.length);
            cursor += b.length;
        }
        return out;
    }
}

function bgzBlockSize(data) {
    const ba = new Uint8Array(data);
    const bsize = (ba[17] << 8 | ba[16]) + 1;
    return bsize;
}

// From Thomas Down's zlib implementation

const testArray = new Uint8Array(1);
const hasSubarray = (typeof testArray.subarray === 'function');
const hasSlice = false; /* (typeof testArray.slice === 'function'); */ // Chrome slice performance is so dire that we're currently not using it...

function arrayCopy(src, srcOffset, dest, destOffset, count) {
    if (count === 0) {
        return;
    }
    if (!src) {
        throw "Undef src";
    } else if (!dest) {
        throw "Undef dest";
    }
    if (srcOffset === 0 && count === src.length) {
        arrayCopy_fast(src, dest, destOffset);
    } else if (hasSubarray) {
        arrayCopy_fast(src.subarray(srcOffset, srcOffset + count), dest, destOffset);
    } else if (src.BYTES_PER_ELEMENT === 1 && count > 100) {
        arrayCopy_fast(new Uint8Array(src.buffer, src.byteOffset + srcOffset, count), dest, destOffset);
    } else {
        arrayCopy_slow(src, srcOffset, dest, destOffset, count);
    }
}

function arrayCopy_slow(src, srcOffset, dest, destOffset, count) {
    for (let i = 0; i < count; ++i) {
        dest[destOffset + i] = src[srcOffset + i];
    }
}

function arrayCopy_fast(src, dest, destOffset) {
    dest.set(src, destOffset);
}


export {unbgzf, bgzBlockSize, deflateRaw, deflate, gzip, inflate, inflateRaw, ungzip, isgzipped};

