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

// POST requests: add the record in storage
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

// GET requests: retrieve EVERYTHING (for now)
app.get("/api", function (request, response) {
    if (!storage.initialized) {
        response.end("Try again later!");
        return;
    }

    storage.findAll(function (error, users) {
        if (error) {
            response.end("There was an error.");
            storage.log(error);
            return;
        }

        response.end(JSON.stringify(users));
    })
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
