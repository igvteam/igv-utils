import "./utils/mockObjects.js"
import Throttle from "../src/throttle.js"
import {assert} from 'chai'

suite("testThrottle", function () {

    test("Test throttle", async function () {

        this.timeout(20000000)
        const test = new Promise(function (fulfill, reject) {
            const requestsPerSecond = 10
            const minTimeMillis = 1000 / requestsPerSecond
            const throttle = new Throttle({requestsPerSecond})
            let lastTime = 0
            let count = 10
            let i = 0
            while (count--) {
                const p = async function () {
                    i++
                    const time = Date.now()
                    assert.ok(time - lastTime >= minTimeMillis)
                    lastTime = time
                    if (i === 10) {
                        fulfill()
                    }
                }
                throttle.add(p)
            }
        })
        return test
    })


})

