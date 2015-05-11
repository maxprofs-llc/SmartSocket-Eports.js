(function () {
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
            info.innerHTML = [
                "Currently " + (Math.round(data[data.length - 1] * 10) / 10) + " Newtons.",
                "No urgent action required."
            ].join("<br />");

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
            }
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

    function startLoadingRecords() {
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
                return JSON.parse(request.ajax.responseText);/*.map(function (data) {
                    
                });*/
            });

            console.log("Results", results);
        });
    }

    Chart.defaults.global.responsive = true;

    startLoadingRecords();

    //(function (data) {
    //    var canvas = document.getElementById("chart"),
    //        context = canvas.getContext("2d"),
    //        chart = new Chart(context).Line(data);

    //    setLegend(chart, data.datasets);
    //})({
    //    "labels": ["January", "February", "March", "April", "May", "June", "July"],
    //    "datasets": [
    //        {
    //            label: "Leg (Left) - Center Point",
    //            fillColor: "rgba(0,0,0,0)",
    //            strokeColor: "rgba(140,175,117,1)",
    //            pointColor: "rgba(175,210,140,1)",
    //            pointStrokeColor: "#fff",
    //            pointHighlightFill: "#fff",
    //            pointHighlightStroke: "rgba(220,220,220,1)",
    //            data: randomPoints(7, 35, 56)
    //        },
    //        {
    //            label: "Leg (Left) - Right Point",
    //            fillColor: "rgba(0,0,0,0)",
    //            strokeColor: "rgba(175,117,140,1)",
    //            pointColor: "rgba(210,140,175,1)",
    //            pointStrokeColor: "#fff",
    //            pointHighlightFill: "#fff",
    //            pointHighlightStroke: "rgba(220,220,220,1)",
    //            data: randomPoints(7, 14, 42)
    //        },
    //        {
    //            label: "Leg (Left) - Right Point",
    //            fillColor: "rgba(0,0,0,0)",
    //            strokeColor: "rgba(117,140,175,1)",
    //            pointColor: "rgba(140,175,210,1)",
    //            pointStrokeColor: "#fff",
    //            pointHighlightFill: "#fff",
    //            pointHighlightStroke: "rgba(220,220,220,1)",
    //            data: randomPoints(7, 28, 35)
    //        }
    //    ]
    //});
})();