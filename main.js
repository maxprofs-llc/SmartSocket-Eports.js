// Fix for Heroku and __dirname 
// http://stackoverflow.com/questions/17212624/deploy-nodejs-on-heroku-fails-serving-static-files-located-in-subfolders
process.env.PWD = process.cwd()

var express = require("express"),
    mongodb = require("mongodb"),
    bodyParser = require("body-parser"),
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// POST /: add the record in storage
app.post("/api", function (request, response) {
    if (!storage.initialized) {
        response.end("Try again later!");
    }

    storage.addRecord(request.body, function (error) {
        if (error) {
            response.end("There was an error.");
            storage.log(error);
        } else {
            response.end("ACK");
        }
    });
});

// GET api[/key/value...]: retrieve records where key equals value
// E.x. /api: retrieve everything
// E.x. /api/socket/eq/1: retrieve records where socket = 1
// E.x. /api/socket/gt/1/user/eq/5: where socket is > 1 and user = 5
app.get("/api*", function (request, response) {
    if (!storage.initialized) {
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
