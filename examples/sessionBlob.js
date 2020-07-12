//  Create an igv.js session blob.
// Run from the command line with "esm" option
//    node -r esm sessionBlob.js

import {StringUtils} from "../src";

const session =         {
    "genome": "hg38",
    "tracks": [
        {
            "url": "https://s3.amazonaws.com/igv.org.test/data/gm12878_loops.bedpe.gz",
            "type": "interaction",
            "format": "bedpe",
            "name": "GM12878 Loops (bedpe - nested)"
        }
    ]
};

const json = JSON.stringify(session);

const blobParameter = StringUtils.compressString(json);

console.log(blobParameter);


// output => HY5BjsIwDEWvEnk1SEwipguqXoANcwKEkGlNqKaJo8SAplXv3iTb9633vIAlz46gg6dtWtiDROz_EnSXBV5xKlwkpM6Y1Gh0OLPHT9I9OzPat.ZotVASM6Cgse7w0x7b28Qckr7TEEjbuUj_Q0mMXijrZWSf4YOjQ8m4HmbgsT5y.q0WdS4W9VVX9a18ztCwg_W6bg--

// example usage
//    https://igv.org/app/sessionURL=blob:HY5BjsIwDEWvEnk1SEwipguqXoANcwKEkGlNqKaJo8SAplXv3iTb9633vIAlz46gg6dtWtiDROz_EnSXBV5xKlwkpM6Y1Gh0OLPHT9I9OzPat.ZotVASM6Cgse7w0x7b28Qckr7TEEjbuUj_Q0mMXijrZWSf4YOjQ8m4HmbgsT5y.q0WdS4W9VVX9a18ztCwg_W6bg--