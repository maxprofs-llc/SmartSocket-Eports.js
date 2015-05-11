(function (settings) {
    var numSockets = settings.numSockets,
        periodConversions = settings.periodConversions,
        theme = settings.theme;

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

    function requestAllRecords(numSockets, timeMinimum, callback) {
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

    function startLoadingRecords(callback) {
        var amount = Number(document.getElementById("chooseAmount").value),
            periodString = document.getElementById("choosePeriod").value,
            periodMilliseconds = periodConversions[periodString] * amount,
            timeMinimum = new Date().getTime() - periodMilliseconds;

        console.log("k", amount, periodString, periodMilliseconds, timeMinimum);

        // Hardcoded to 7 sockets, because Mariah said so.
        requestAllRecords(7, timeMinimum, function (requests) {
            var results = requests.map(function (request) {
                return JSON.parse(request.ajax.responseText);
            });

            // Sort in order of timestamp - greater later
            results.sort(function (a, b) {
                return b.timestamp - a.timestamp;
            });

            callback(results);
        });
    }

    // Dates are the -X * i places in time (milliseconds / Unix stamps)
    function groupRecords(amount, period, records) {
        var dates = [],
            grouped = [],
            now = new Date().getTime(),
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

    function conglomerateData() {
        var amount = Number(document.getElementById("chooseAmount").value),
            period = document.getElementById("choosePeriod").value,
            labels = [
                "just now",
                "1 " + period.substr(0, period.length - 1) + " ago"
            ];

        document.getElementById("chartArea").className = "loading";
        document.getElementById("loader").className = "loading";

        startLoadingRecords(function (recordGroups) {
            var canvas = document.getElementById("chart"),
                context = canvas.getContext("2d"),
                records = recordGroups.map(function (recordGroup) {
                    return groupRecords(amount, periodConversions[period], recordGroup);
                }),
                data = {
                    "labels": (function () {
                        for (var i = 2; i < amount; i += 1) {
                            labels.push("-" + i + " " + period + " ago");
                        }

                        labels.reverse();

                        return labels;
                    })(),
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

    var elements = document.querySelectorAll("#chooser input, #chooser select"),
        i;

    for (i = 0; i < elements.length; i += 1) {
        elements[i].onchange = conglomerateData;
    }

    document.getElementById("refresher").onclick = conglomerateData;

    Chart.defaults.global.animation = false;
    Chart.defaults.global.responsive = true;
    conglomerateData();
})({
    "numSockets": 7,
    "periodConversions": {
        "seconds": 1000,
        "minutes": 60000,
        "hours": 3600000,
        "days": 86400000
    },
    "theme": {
        "strokeColors": [
            "rgb(210, 70, 70)",
            "rgb(210, 140, 70)",
            "rgb(210, 210, 70)",
            "rgb(70, 140, 70)",
            "rgb(70, 70, 140)",
            "rgb(140, 70, 140)",
            "rgb(210, 175, 189)"
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