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

SocketStorage.prototype.findRecords = function (filters, callback) {
    var scope = this;

    scope.ensureNumericFilters(filters);

    this.getCollection("records", function (error, collection) {
        if (error) {
            scope.log("Error in findRecords > getCollection", error);
            callback(error);
            return;
        }

        collection.find(filters).toArray(function (error, results) {
            if (error) {
                scope.log("Error in findAll > getCollection > toArray", error);
            }

            callback(error, results);
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

        // Ensure numeric fields are indeed numeric
        scope.ensureNumericRecord(record);

        scope.log("Inserting", record);
        collection.insert(record);

        callback();
    });
};

SocketStorage.prototype.dropDatabase = function (callback) {
    try {
        this.db.dropDatabase();
        callback();
    } catch (error) {
        callback(error);
    }
};

SocketStorage.prototype.ensureNumericRecord = function (record) {
    if (!record.hasOwnProperty("timestamp")) {
        record.timestamp = Math.round(new Date().getTime() / 1000);
    } else {
        record.timestamp = Number(record.timestamp);
    }

    if (record.hasOwnProperty("volts")) {
        // record.pressure = this.convertVoltsToPascals(record.volts);
        record.pressure = Number(record.volts);
        delete record.volts;
    } else {
        record.pressure = Number(record.pressure);
    }

    record.user = Number(record.user);
    record.socket = Number(record.socket);
};

SocketStorage.prototype.convertVoltsToPascals = function (volts) {
    return (190.62 * this.log10(Math.min(1, volts)) - 294.79) / (Math.PI * 0.00009025);
};

SocketStorage.prototype.log10 = function (value) {
    return Math.log(value) / Math.LN10;
}

SocketStorage.prototype.ensureNumericFilters = function (filters) {
    var filter,
        i, j;

    for (i in filters) {
        filter = filters[i];

        for (j in filter) {
            filter[j] = Number(filter[j]);
        }
    }
}

SocketStorage.prototype.log = function () {
    if (!this.settings.verbose) {
        return;
    }

    var arguments = Array.prototype.slice.call(arguments);

    arguments.unshift(this.name + ":");

    console.log.apply(console, arguments);
};

exports.SocketStorage = SocketStorage;