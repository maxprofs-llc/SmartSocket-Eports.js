// http://stackoverflow.com/questions/20390967/setting-up-mongodb-on-heroku-with-node

var mongodb = require("mongodb"),
    fs = require("fs"),
    MongoClient = mongodb.MongoClient,
    Connection = mongodb.Connection,
    Server = mongodb.Server;

// mongodb://<dbuser>:<dbpassword>@ds053937.mongolab.com:53937/heroku_app36727299
function SocketStorage(settings) {
    var scope = this;

    if (!settings) {
        settings = {};
    }

    scope.initialized = false;
    scope.settings = settings;
    scope.name = settings.name || "SocketStorage";

    fs.readFile("storage.json", "utf-8", function (error, data) {
        if (error) {
            throw error;
        }

        scope.information = JSON.parse(data);

        MongoClient.connect([
            "mongodb://",
            scope.information.username,
            ":",
            scope.information.password,
            "@ds053937.mongolab.com:53937/heroku_app36727299"
        ].join(""), function (error, database) {
            if (error) {
                throw error;
            }

            scope.db = database;
            scope.users = scope.db.collection("users");
            scope.accounts = scope.db.collection("accounts");

            scope.initialized = true;
            scope.log("Database initialized.");

            if (settings.callback) {
                settings.callback();
            }
        });
    });

    this.log("Loading storage.json...");
};

SocketStorage.prototype.getCollection = function (collectionName, callback) {
    this.db.collection(collectionName, function (error, users) {
        if (error) {
            callback(error);
        } else {
            callback(null, users);
        }
    });
};

SocketStorage.prototype.findAll = function (callback) {
    var scope = this;

    this.log("Finding all.");

    this.getCollection("records", function (error, collection) {
        scope.log("Got collection");
        scope.log("Callback is", callback);
        if (error) {
            scope.log("Error", error);
            callback(error);
            return;
        }

        collection.find().toArray(function (error, results) {
            if (error) {
                callback(error);
            } else {
                callback(null, results);
            }
        });
    });
};

SocketStorage.prototype.addRecord = function (record, callback) {
    var scope = this;

    this.getCollection("records", function (error, collection) {
        if (error) {
            callback(error);
            return;
        }

        scope.log("Inserting", record);
        collection.insert(record);
    });
    callback();
};

SocketStorage.prototype.log = function () {
    if (!this.settings.verbose) {
        return;
    }

    var arguments = Array.prototype.slice.call(arguments);

    arguments.unshift(this.name + ":");

    console.log.apply(console, arguments);
};

exports.SocketStorage = SocketStorage;