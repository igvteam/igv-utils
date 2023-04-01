import fs from 'fs'

const files = ["googleAuth.js", "googleDrive.js", "googleUtils.js", "googleFilePicker.js"]
const src = "node_modules/google-utils/src"
const dest = "src/google-utils"

for(let f of files) {
    fs.copyFileSync(`${src}/${f}`, `${dest}/${f}`)
}