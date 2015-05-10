// Fix for Heroku and __dirname 
// http://stackoverflow.com/questions/17212624/deploy-nodejs-on-heroku-fails-serving-static-files-located-in-subfolders
process.env.PWD = process.cwd()

var express = require("express"),
    pluralize = require("pluralize"),
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

app.post("/api", function (request, response) {
    response.end("Posted!");
});

app.get("/api", function (request, response) {
    response.end("Gotten!");
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
