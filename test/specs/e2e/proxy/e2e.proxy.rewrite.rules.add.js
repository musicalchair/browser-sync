"use strict";

var browserSync = require("../../../../index");

var connect = require("connect");
var serveStatic = require("serve-static");
var request = require("supertest");
var assert = require("chai").assert;

describe("E2E proxy test with adding rewrite rules dynamically", function () {

    var bs, server, options;

    before(function (done) {

        browserSync.reset();

        var app = connect();
        app.use(serveStatic("test/fixtures"));
        server = app.listen();
        var proxytarget = "http://localhost:" + server.address().port;

        var config = {
            proxy:     proxytarget,
            logLevel: "silent",
            open:      false,
            rewriteRules: [
                {
                    match: /BrowserSync/g,
                    fn: function () {
                        return "BROWSERSYNC";
                    }
                }
            ]
        };

        bs = browserSync.init([], config, function (err, bs) {
            options = bs.options;
            done();
        }).instance;
    });

    after(function () {
        bs.cleanup();
        server.close();
    });

    it("can add rules on the fly", function (done) {

        request(bs.server)
            .get("/index.html")
            .set("accept", "text/html")
            .expect(200)
            .end(function (err, res) {

                assert.include(res.text, "BROWSERSYNC");

                bs.addRewriteRule({
                    match: "BROWSERSYNC",
                    replace: "browsersync"
                }, {id: "myrule"});

                request(bs.server)
                    .get("/index.html")
                    .set("accept", "text/html")
                    .expect(200)
                    .end(function (err, res) {
                        assert.include(res.text, "browsersync");
                        assert.notInclude(res.text, "BROWSERSYNC");
                        done();
                    });
            });
    });
});
