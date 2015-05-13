Chart.defaults.Line.animation = false;
Chart.defaults.Line.bezierCurve = false;
Chart.defaults.Line.pointDotRadius = 4.9;
Chart.defaults.Line.responsive = true;
Chart.defaults.Line.showTooltips = false;

(function (settings) {
    var numSockets = settings.numSockets,
        periodConversions = settings.periodConversions,
        theme = settings.theme,
        refreshRate = settings.refreshRate,
        pingTimeout;

    /**
     * 
     */
    function obtainTimestamp() {
        return new Date().getTime() / 1000 - 10;
    }

    /**
     * 
     */
    function setLegend(chart, datasets) {
        var legendElement = document.getElementById("legend"),
            legendHTML = chart.generateLegend(),
            legendChildren, info, data, i;

        legendElement.innerHTML = legendHTML;
        legendChildren = legendElement.querySelectorAll("li");

        for (i = 0; i < legendChildren.length; i += 1) {
            info = document.createElement("span");
            data = datasets[i].data;

            info.className = "info";
            info.innerHTML = "Currently " + (Math.round(data[data.length - 1] * 10) / 10) + " Newtons.";

            legendChildren[i].appendChild(info);
        }
    }

    /**
     * 
     */
    function generateQuery(filterGroups) {
        var query = window.location.origin + "/api",
            filterGroup, filter, i, j;

        for (i in filterGroups) {
            filterGroup = filterGroups[i];

            for (j = 0; j < filterGroup.length; j += 1) {
                filter = filterGroup[j];
                query += "/" + i + "/" + filter[0] + "/" + filter[1];
            }
        }

        return query;
    }

    /**
     * 
     */
    function requestSocketRecords(socket, timeMinimum, callback) {
        var ajax = new XMLHttpRequest(),
            status = {
                "ajax": ajax,
                "completed": false
            };

        ajax.open("GET", generateQuery({
            "user": [
                ["eq", 1]
            ],
            "socket": [
                ["eq", socket]
            ],
            "timestamp": [
                ["gt", timeMinimum]
            ]
        }));
        ajax.send();

        ajax.onreadystatechange = function () {
            if (ajax.readyState !== 4) {
                return;
            }

            status.completed = true;

            if (callback) {
                callback(status);
            }
        }

        return status;
    }

    /**
     * 
     */
    function requestAllRecords(timeMinimum, callback) {
        var requests = new Array(),
            numCompleted = 0,
            i;

        for (i = 0; i < numSockets; i += 1) {
            requests[i] = requestSocketRecords(i, timeMinimum, function () {
                numCompleted += 1;
                if (numCompleted === numSockets && callback) {
                    callback(requests);
                }
            });
        }

        return requests;
    }

    /**
     * Sends a number of requests for socket records (1 for each socket), 
     * filtered on the HTML selects for amount and period. 
     * 
     * @param {Function} callback   A callback to call on an Array of results
     *                              once they return.
     */
    function startLoadingRecords(callback) {
        var amount = Number(document.getElementById("chooseAmount").value),
            periodString = document.getElementById("choosePeriod").value,
            periodMilliseconds = periodConversions[periodString] * amount,
            timeMinimum = obtainTimestamp() - periodMilliseconds;

        requestAllRecords(timeMinimum, function (requests) {
            callback(
                requests
                    .map(function (request) {
                        try {
                            return JSON.parse(request.ajax.responseText);
                        } catch (error) {
                            return undefined;
                        }
                    })
                    .filter(function (dataset) {
                        return dataset;
                    })
            );
        });
    }

    // Dates are the -X * i places in time (milliseconds / Unix stamps)
    /**
     * Turns a bunch of records into a Number[] that can be displayed as a line
     * on the chart by grouping them into their closest date, then averaging
     * those groups.
     * 
     * @param {Number} amount   How many points there should be on the line.
     * @param {Number} period   How many milliseconds between each point.
     * @param {Record[]} records   Records obtained from /api.
     * @return {Number[]} Records grouped and averaged into a chartable line.
     */
    function groupRecords(amount, period, records) {
        var dates = [],
            grouped = [],
            now = obtainTimestamp(),
            record, i, j;

        for (i = 0; i < amount; i += 1) {
            dates.push(now - i * period);
            grouped.push([]);
        }

        dates.reverse();

        for (i = 0; i < records.length; i += 1) {
            record = records[i];

            // Find the first date that's after the timestamp: add it there
            for (j = 0; j < amount - 1; j += 1) {
                if (dates[j] > record.timestamp) {
                    break;
                }
            }

            grouped[j].push(record);
        }

        return grouped.map(function (group) {
            if (group.length === 0) {
                return 0;
            }

            var total = 0,
                i;

            for (i = 0; i < group.length; i += 1) {
                total += group[i].pressure;
            }

            return total / group.length;
        });

        // return grouped mapped so each sub array becomes average pressure
        return output;
    }

    /**
     * 
     */
    function populateLabels(labels, amount, period) {
        var skipper = Math.ceil(amount / 25),
            i, j;

        for (i = 2; i < amount; i += skipper) {
            labels.push("-" + i + " " + period + " ago");
            for (j = 1; j < skipper; j += 1) {
                labels.push("");
            }
        }

        if (skipper > 3) {
            labels[1] = "";
            labels[2] = "";
        }

        labels.reverse();

        return labels;
    }

    /**
     * Driver Function to request an updated listing of records from the api,
     * conglomerate them into averaged timestamped groups, and display them on
     * the chart.
     * 
     * @param {Boolean} [silent]   Whether to skip adding the "loading" class to
     *                             the chart and loader areas (so to make it
     *                             appear to work in the background).
     */
    function conglomerateData(silent) {
        var amount = Number(document.getElementById("chooseAmount").value),
            period = document.getElementById("choosePeriod").value,
            labels = [
                "just now",
                "1 " + period.substr(0, period.length - 1) + " ago"
            ];

        clearTimeout(pingTimeout);
        setTimeout(startPingingData, refreshRate);

        if (silent !== true) {
            document.getElementById("chartArea").className = "loading";
            document.getElementById("loader").className = "loading";
        }

        startLoadingRecords(function (recordGroups) {
            var canvas = document.getElementById("chart"),
                context = canvas.getContext("2d"),
                records = recordGroups.map(function (recordGroup) {
                    return groupRecords(amount, periodConversions[period], recordGroup);
                }),
                data = {
                    "labels": populateLabels(labels, amount, period),
                    "datasets": records.map(function (record, i) {
                        return {
                            "label": "Socket " + i,
                            "fillColor": "rgba(0,0,0,0)",
                            "strokeColor": theme.strokeColors[i],
                            "pointColor": theme.pointColors[i],
                            "pointStrokeColor": "#fff",
                            "pointHighlightFill": "#fff",
                            "pointHighlightStroke": "rgba(220,220,220,1)",
                            "data": records[i]
                        }
                    })
                },
                chart = new Chart(context).Line(data);

            setLegend(chart, data.datasets);
            document.getElementById("chartArea").className = "";
            document.getElementById("loader").className = "";
        });
    }

    /**
     * 
     */
    function startPingingData() {
        conglomerateData(true);

        pingTimeout = setTimeout(startPingingData, refreshRate);
    }

    var elements = document.querySelectorAll("#chooser input, #chooser select"),
        i;

    for (i = 0; i < elements.length; i += 1) {
        elements[i].onchange = conglomerateData;
    }

    startPingingData();
})({
    "numSockets": 6,
    "refreshRate": 1170,
    "periodConversions": {
        "seconds": 1,
        "minutes": 60,
        "hours": 3600,
        "days": 86400
    },
    "theme": {
        "strokeColors": [
            "rgba(210, 70, 70, .49)",
            "rgba(210, 140, 70, .49)",
            "rgba(210, 210, 70, .49)",
            "rgba(70, 140, 70, .49)",
            "rgba(70, 70, 140, .49)",
            "rgba(140, 70, 140, .49)",
            "rgba(210, 175, 189, .49)"
        ],
        "pointColors": [
            "rgb(245, 117, 117)",
            "rgb(245, 175, 117)",
            "rgb(245, 245, 117)",
            "rgb(117, 175, 117)",
            "rgb(117, 117, 175)",
            "rgb(175, 117, 175)",
            "rgb(245, 210, 224)"
        ]
    }
});