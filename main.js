// Fix for Heroku and __dirname 
// http://stackoverflow.com/questions/17212624/deploy-nodejs-on-heroku-fails-serving-static-files-located-in-subfolders
process.env.PWD = process.cwd();

var express = require("express"),
    mongodb = require("mongodb"),
    bodyParser = require("body-parser"),
    querystring = require("querystring"),
    storage = new (require("./storage.js").SocketStorage)({
        "verbose": true
    }),
    app = express(),
    indexOptions = {
        "root": __dirname + "/static/",
        "dotfiles": "deny",
        "headers": {
            "x-timestamp": Date.now(),
            "x-sent": true
        }
    };

app.set("port", (process.env.PORT || 5000));
app.use(express.static(process.env.PWD + "/static"));
app.use(bodyParser.text());

// POST /api/single: add a single record to storage
app.post("/api/single", function (request, response) {
    if (!storage.initialized) {
        response.writeHead(503);
        response.end("Try again later!");
        return;
    }

    var received = "",
        pair, i;

    request.on("data", function (chunk) {
        received += chunk.toString();
    });

    request.on("end", function () {
        storage.addRecord(querystring.parse(received), function (error) {
            if (error) {
                response.writeHead(500);
                response.end("There was an error.");
                storage.log(error);
            } else {
                response.writeHead(200);
                response.end("ACK");
            }
        });
    });
});

// POST /api/multi: add multiple records to storage
app.post("/api/multi", function (request, response) {
    if (!storage.initialized) {
        response.writeHead(503);
        response.end("Try again later!");
        return;
    }

    var received = "",
        pair, i;

    request.on("data", function (chunk) {
        received += chunk.toString();
    });

    request.on("end", function () {
        var request = querystring.parse(received),
            finished = 0,
            started = 0;

        request.volts = request.volts.split(",")
            .filter(function (volts) {
                return volts;
            })
            .map(function (volts) {
                return Number(volts);
            })
            .forEach(function (volts, i) {
                var record = {
                    "volts": volts,
                    "user": request.user,
                    "socket": i
                };

                started += 1;

                storage.addRecord(record, function (error) {
                    finished += 1;

                    if (finished === started) {
                        response.writeHead(200);
                        response.end("ACK");
                    }
                });
            });
    });
});

// GET api[/key/operator/value...]: retrieve records where key (operator) value
// E.x. /api: retrieve everything
// E.x. /api/socket/eq/1: retrieve records where socket = 1
// E.x. /api/socket/gt/1/user/eq/5: where socket is > 1 and user = 5
app.get("/api*", function (request, response) {
    if (!storage.initialized) {
        response.writeHead(503);
        response.end("Try again later!");
        return;
    }

    var queryRaw = request.params[0],
        querySplit = queryRaw.split("/"),
        filters = {},
        filter, i;

    for (i = 1; i < querySplit.length - 2; i += 3) {
        filter = {};
        filter["$" + querySplit[i + 1]] = querySplit[i + 2];

        filters[querySplit[i]] = filter;
    }

    storage.findRecords(filters, function (error, records) {
        if (error) {
            response.end("There was an error (" + error.name + "). " + error.$err);
            storage.log(error);
            return;
        }

        response.end(JSON.stringify(records));
    });
});

// Redirect everything else to the /static/ dir (because of indexOptions)
app.get("*", function (request, response) {
    response.sendFile(request.url, indexOptions, function () {
        response.end();
    });
});

app.listen(app.get("port"), function () {
    console.log("Server running at port " + app.get("port"));
});
