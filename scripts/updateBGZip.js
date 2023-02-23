import fs from 'fs'

const googleFiles = ['bgzip.js', 'pako.exm.js']
for(let fn of googleFiles) {
    const inputPath = `node_modules/google-utils/src/${fn}`
    const outputPath = `src/${fn}`
    const contents = fs.readFileSync(inputPath)
    fs.writeFileSync(outputPath, contents)
}
