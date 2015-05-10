(function () {
    function randomPoints(numPoints, min, max) {
        var output = [],
            i;
        
        for (i = 0; i < numPoints; i += 1) {
            output.push(Math.random() * (max - min) + min);
        }
        
        output.sort();
        
        return output;
    }
    
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
                "Currently " + (Math.round(data[data.length - 1] * 10) / 10) + " Netwons.",
                "No urgent action required."
            ].join("<br />");
            
            legendChildren[i].appendChild(info);
        }
    }
    
    Chart.defaults.global.responsive = true;
    
    (function (data) {
        var canvas = document.getElementById("chart"),
            context = canvas.getContext("2d"),
            chart = new Chart(context).Line(data);
        
        setLegend(chart, data.datasets);
    })({
        "labels": ["January", "February", "March", "April", "May", "June", "July"],
        "datasets": [
            {
                label: "Leg (Left) - Center Point",
                fillColor: "rgba(0,0,0,0)",
                strokeColor: "rgba(140,175,117,1)",
                pointColor: "rgba(175,210,140,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: randomPoints(7, 35, 56)
            },
            {
                label: "Leg (Left) - Right Point",
                fillColor: "rgba(0,0,0,0)",
                strokeColor: "rgba(175,117,140,1)",
                pointColor: "rgba(210,140,175,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: randomPoints(7, 14, 42)
            },
            {
                label: "Leg (Left) - Right Point",
                fillColor: "rgba(0,0,0,0)",
                strokeColor: "rgba(117,140,175,1)",
                pointColor: "rgba(140,175,210,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: randomPoints(7, 28, 35)
            }
        ]
    });
})();