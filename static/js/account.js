(function (theme) {
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
            periodMilliseconds = {
                "seconds": 1000,
                "minutes": 60000,
                "hours": 3600000,
                "days": 86400000
            }[periodString] * amount,
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

    function conglomerateData() {
        var amount = Number(document.getElementById("chooseAmount").value),
            period = document.getElementById("choosePeriod").value,
            labels = [
                "just now",
                "1 " + period.substr(0, period.length - 1) + " ago"
            ];

        document.getElementById("chartArea").className = "loading";
        document.getElementById("loader").className = "loading";

        startLoadingRecords(function (records) {
            var canvas = document.getElementById("chart"),
                context = canvas.getContext("2d"),
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
                            "data": (function () {
                                var data = [],
                                    j;

                                for (j = 0; j < amount; j += 1) {
                                    data.push((j + 4) * Math.random() - 2);
                                }

                                data.sort();

                                return data;
                            })()
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
});