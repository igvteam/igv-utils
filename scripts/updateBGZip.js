import fs from 'fs'

const files = ['bgzip.js', 'pako.exm.js']
for(let fn of files) {
    const inputPath = `node_modules/bgzip/src/${fn}`
    const outputPath = `src/${fn}`
    const contents = fs.readFileSync(inputPath)
    fs.writeFileSync(outputPath, contents)
}
