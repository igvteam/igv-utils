import "./utils/mockObjects.js"
import Oauth from "../src/oauth.js"
import {assert} from 'chai'

/**
 * Created by Jim Robinson on 9/15/2018
 *
 * Tests of the oauth object -- does not test oAuth servers or interaction with them
 */

suite("testOauth", function () {

    const oauth = new Oauth()

    test("Test google token", function () {

        oauth.setToken("foo")
        assert.equal(oauth.getToken(), "foo")

        oauth.removeToken()
        assert.ok(undefined === oauth.getToken())

        // Legacy method
        // igv.setGoogleOauthToken("foo");
        // assert.equal(oauth.google.access_token, "foo");
    })

    test("Test exact host", function () {

        oauth.setToken("foo", "host")
        assert.equal(oauth.getToken("host"), "foo")

        oauth.removeToken("host")
        assert.ok(undefined === oauth.getToken("host"))
    })

    test("Test wildcard host", function () {
        oauth.setToken("foo", "hos*")
        assert.equal(oauth.getToken("host.com"), "foo")

        oauth.removeToken("hos*")
        assert.ok(undefined === oauth.getToken("host"))
    })
})