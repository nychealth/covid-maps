"use strict";

// missing forEach on NodeList for IE11
//   thanks panthony: https://github.com/miguelcobain/ember-paper/issues/1058
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

var geoObj = {};
var covidObj = {};
var viewObj = {};

// Get value of form on submit, and prevent submission
var zipCodeForm = document.getElementById('zip-code-form');

// set global instace of variables

var zipCode;        //holds the 5-digit zip code
var zipCodeData;    // the ZIP's data from fullData (data-by-modzcta)
var zipString;      // ZIP code, as a string
var fullName;       // ZIP Code plus neighborhood name
var parentBoro;     // ZIP's parent boro
var parentBoroDisplay; // Special display mode for BX, SI
var boroData;       // Boro's data from by-boro
var fullData;       // full data from data-by-modzcta
var cityData;       // full data from by-boro
var antibodyData;   // full data from antibody-by-modzcta
var cityTableData;  // Citywide valuesfrom by-boro
var metric = "TESTRATE"; // Initial map metric selection

var mapData;
var mapZipData;
var maxMDTR;
var minMDTR;
var minPP;
var maxPP;
var minPeople;
var maxPeople;

var mdtrMedian
var mdtrArray = [];
var ppMedian
var ppArray = [];

var numMedian
var numArray = [];

var rangeLo;
var rangeHi;
var rangeZip;
var zipMargin;
var medMargin;
var rangeMed;
var rangeArray = [];




// This listens for submission of the zip code form
zipCodeForm.addEventListener('submit', function (event) {
    event.preventDefault(); // prevent page re-load
    fullName = event.target[0].value; // assign selected value to fullName variable
    console.log("Selected neighborhood:" + event.target[0].value);
    zipCode = event.target[0].value.slice(0, 5); // trims it down to just the ZIP
    zipString = zipCode.toString(); // converts the numerical value to a string
    changeNeighborhood(zipCode); // runs the major display function
});



//you know have values for zipCode, fullName, and zipString


// d3 code to pull in data-by-modzcta 
d3.csv("https://raw.githubusercontent.com/nychealth/coronavirus-data/master/totals/data-by-modzcta.csv").then(function (data) {
    fullData = data;
});

// d3 code to pull in by-boro 
d3.csv("https://raw.githubusercontent.com/nychealth/coronavirus-data/master/totals/by-boro.csv").then(function (data) {
    cityData = data;
});

//you now have fullData by modzcta, and citywide/boro data


// d3 code to pull in ACS data into Object



// These are the map specs
var vegaSpec =
{
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": "container",
    "height": "container",
    "autosize": {
        "type": "fit",
        "contains": "padding"
    },
    "config": {
        "background": "#FFFFFF",
        "axisX": { "grid": false },
        "axisY": { "domain": false, "ticks": false, "gridDash": [2], "gridWidth": 1 },
        "view": { "stroke": "transparent" }
    },
    "layer": [
        {
            "data": {
                "url": "https://nychealth.github.io/covid-maps/nr/js/MODZCTA_2010_RI99999_WGS1984_1_topoms.json",
                "format": {
                    "type": "topojson",
                    "feature": "collection"
                }
            },
            "mark": {
                "type": "geoshape",
                "stroke": "#ffffff",
                "fill": "lightgray"
            }
        },
        {
            "data": {
                "url": "https://nychealth.github.io/covid-maps/nr/js/MODZCTA_2010_RI99999_WGS1984_1_topoms.json",
                "format": {
                    "type": "topojson",
                    "feature": "collection"
                }
            },
            "transform": [
                {
                    "lookup": "properties.MODZCTA",
                    "from": {
                        "data": {
                            "url": "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/latest/last7days-by-modzcta.csv"
                        },
                        "key": "modzcta",
                        "fields": [
                            "modzcta",
                            "modzcta_name",
                            "percentpositivity_7day",
                            "people_tested",
                            "people_positive",
                            "daterange",
                            "median_daily_test_rate"
                        ]
                    }
                }
            ],
            "mark": {
                "type": "geoshape",
                "stroke": "#FFFFFF"
            },
            "encoding": {
                "color": {
                    "bin": false,
                    "field": "median_daily_test_rate",
                    "type": "quantitative",
                    "scale": {
                        "scheme": {
                            "name": "goldgreen",
                            "extent": [
                                0.1,
                                1.5
                            ]
                        }
                    },
                    "legend": {
                        "title": "Median daily test rate (per 100,000)",
                        "titleFontSize": 10,
                        "orient": "top-left",
                        "gradientLength": 100
                    }
                },
                "strokeWidth": {
                    "value": 0.5
                },
                "tooltip": [
                    {
                        "field": "properties.label",
                        "type": "nominal",
                        "title": "ZIP code"
                    },
                    {
                        "field": "modzcta_name",
                        "type": "nominal",
                        "title": "Neighborhood"
                    },
                    {
                        "field": "median_daily_test_rate",
                        "type": "quantitative",
                        "title": "Daily tests per 100,000"
                    },
                    {
                        "field": "percentpositivity_7day",
                        "type": "quantitative",
                        "title": "Percent positive"
                    },

                    {
                        "field": "people_positive",
                        "type": "quantitative",
                        "title": "New people positive (reported so far)"
                    },

                    {
                        "field": "daterange",
                        "type": "nominal",
                        "title": "Dates"
                    }
                ]
            }
        }
    ]
};

var vegaDotSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": "container",
    "height": "container",
    "autosize": {
        "type": "fit",
        "contains": "padding"
    },
    "config": {
        "background": "#FFFFFF",
        "axisX": { "grid": false },
        "axisY": { "domain": false, "ticks": false, "gridDash": [2], "gridWidth": 1 },
        "view": { "stroke": "transparent" }
    },
    "layer": [
        {
            "data": {
                "url": "https://nychealth.github.io/covid-maps/nr/js/MODZCTA_2010_RI99999_WGS1984_1_topoms.json",
                "format": {
                    "type": "topojson",
                    "feature": "collection"
                }
            },
            "mark": {
                "type": "geoshape",
                "stroke": "#ffffff",
                "fill": "lightgray"
            }
        },
        {
            "data": {
                "url": "https://nychealth.github.io/covid-maps/nr/js/zcta_points.csv"
            },
            "transform": [
                {
                    "lookup": "MODZCTA",
                    "from": {
                        "data": {
                            "url": "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/latest/last7days-by-modzcta.csv"
                        },
                        "key": "modzcta",
                        "fields": [
                            "modzcta",
                            "modzcta_name",
                            "percentpositivity_7day",
                            "people_tested",
                            "people_positive",
                            "daterange",
                            "median_daily_test_rate"
                        ]
                    },
                    "default": "no data"
                }
            ],
            "mark": {
                "type": "circle",
                "stroke": "#8A2BE2",
                "fill": "red",
                "fillOpacity": 0.5
            },
            "encoding": {
                "latitude": {
                    "field": "lat",
                    "type": "quantitative"
                },
                "longitude": {
                    "field": "lon",
                    "type": "quantitative"
                },
                "size": {
                    "bin": false,
                    "field": "people_positive",
                    "type": "quantitative",
                    "scale": {
                        "range": [
                            0,
                            400
                        ]
                    },
                    "legend": {
                        "title": `New people positive (reported so far)`,
                        "titleFontSize": 10,
                        "orient": "top-left",
                        "symbolLimit": 5,
                        "symbolOpacity": 0.5,
                        "values": [
                            10,
                            50,
                            100
                        ]
                    }
                },
                "strokeWidth": {
                    "value": 0.5
                },
                "tooltip": [
                    {
                        "field": "modzcta",
                        "type": "nominal",
                        "title": "ZIP code"
                    },
                    {
                        "field": "modzcta_name",
                        "type": "nominal",
                        "title": "Neighborhood"
                    },
                    {
                        "field": "median_daily_test_rate",
                        "type": "quantitative",
                        "title": "Daily tests per 100,000"
                    },
                    {
                        "field": "percentpositivity_7day",
                        "type": "quantitative",
                        "title": "Percent positive"
                    },
                    {
                        "field": "people_positive",
                        "type": "quantitative",
                        "title": "People positive (reported to date)"
                    },

                    {
                        "field": "daterange",
                        "type": "nominal",
                        "title": "Dates"
                    }
                ]
            }
        }
    ]
}










// d3 code to pull in last7days-by-modzcta - will need to change to remote ref when live
d3.csv("https://raw.githubusercontent.com/nychealth/coronavirus-data/master/latest/last7days-by-modzcta.csv").then(function (data) {
    //console.log(data); // [{"Hello": "world"}, â€¦]
    mapData = data;

    /*
    console.log('full map data:')
    console.log(mapData);
    */


    function getMax(arr, prop) {
        var max;
        for (var i = 0; i < arr.length; i++) {
            if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
                max = arr[i];
        }
        return max;
    }

    function getMin(arr, prop) {
        var min;
        for (var i = 0; i < arr.length; i++) {
            if (!min || parseInt(arr[i][prop]) < parseInt(min[prop]))
                min = arr[i];
        }
        return min;
    }



    // Getting medians
    for (let i = 0; i < mapData.length; i++) {
        mdtrArray.push(mapData[i].median_daily_test_rate);
    };
    mdtrArray.sort(function (a, b) { return a - b }); // sorts in ascending order
    mdtrArray.splice(0, 88); // removes first 88 of 177 modzctas. 
    // console.log('MDTR median: ' + mdtrArray[0]); // gets the lowest value
    mdtrMedian = mdtrArray[0]; // assigns this median value to your variable


    for (let i = 0; i < mapData.length; i++) {
        ppArray.push(mapData[i].percentpositivity_7day);
    };
    ppArray.sort(function (a, b) { return a - b });
    ppArray.splice(0, 88); // removes first 88. then you'll get the lowest value
    // console.log('PP median: ' + ppArray[0]);
    ppMedian = ppArray[0];

    for (let i = 0; i < mapData.length; i++) {
        numArray.push(mapData[i].people_positive);
    };
    numArray.sort(function (a, b) { return a - b });
    numArray.splice(0, 88); // removes first 88. then you'll get the lowest value
    // console.log('number median: ' + numArray[0]);
    numMedian = numArray[0];


    maxMDTR = getMax(mapData, "median_daily_test_rate");
    minMDTR = getMin(mapData, "median_daily_test_rate");
    // console.log('min mdtr is: ' + minMDTR.modzcta_name + ", " + minMDTR.median_daily_test_rate + " per 100,000");
    // console.log('max mdtr is: ' + maxMDTR.modzcta_name + ", " + maxMDTR.median_daily_test_rate + ' per 100,000');

    minPP = getMin(mapData, "percentpositivity_7day");
    maxPP = getMax(mapData, "percentpositivity_7day");
    // console.log('min PP is: ' + minPP.modzcta_name + ", " + minPP.percentpositivity_7day + "%");
    // console.log('max PP is: ' + maxPP.modzcta_name + ", " + maxPP.percentpositivity_7day + "%");

    minPeople = getMin(mapData, "people_positive");
    maxPeople = getMax(mapData, "people_positive");
    // console.log('min people positive is: ' + minPeople.modzcta_name + ", " + minPeople.people_positive);
    // console.log('max people positive is: ' + maxPeople.modzcta_name + ", " + maxPeople.people_positive);

});

//End min/max/median work.


// Default tick-distribution plot spec
var tickSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "description": "Tick chart",
    "width": "container",
    "height": 40,
    "config": {
        "background": "#FFFFFF",
        "axisX": {
            "domain": false,
            "labels": true,
            "grid": false,
            "labelFontSize": 8,
            "tickColor": "#000000",
            "tickSize": 0,
            "titleFontSize": 12
        },
        "axisY": {
            "domain": false,
            "labels": false,
            "grid": false,
            "ticks": false
        },
        "view": { "stroke": "transparent" },
        "tick": { "thickness": 1, "bandSize": 30 }
    },

    "data": {
        "url": "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/latest/last7days-by-modzcta.csv"
    },

    "layer": [
        {
            "mark": {
                "type": "tick",
                "tooltip": true,
                "color": "darkgrey"
            },
            "encoding": {
                "x": {
                    "field": "median_daily_test_rate",
                    "type": "quantitative",

                    "title": null
                },
                "tooltip": [
                    { "field": "modzcta", "title": "ZIP" },
                    { "field": "median_daily_test_rate", "type": "quantitative", "title": "Daily test rate" }
                ]
            }
        },


        {
            "mark": {
                "type": "tick",
                "thickness": 3,
                "tooltip": true,
                "color": "hotpink"
            },
            "transform": [
                { "filter": "datum.modzcta == 11226" }
            ],
            "encoding": {
                "x": {
                    "field": "median_daily_test_rate",
                    "type": "quantitative",

                    "title": null
                },
                "tooltip": [
                    { "field": "modzcta", "title": "ZIP" },
                    { "field": "median_daily_test_rate", "type": "quantitative", "title": "Daily test rate positive" }
                ]
            }
        }

    ]
}





//Initial Map Render
var opt = {
    "renderer": "svg"
};
var radios = [];


function showMap(spec) {
    vegaEmbed('#map', spec, opt).then(function (result) {
        // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
        viewObj = result.view;
    }).catch(console.error);
}



/*
function hideMap() {
    document.getElementById('mapcont').classList.toggle('sr-only');
}
*/

//DEFAULT CHART SPEC 
var chartSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "description": "Test rate over time",
    "width": "container",
    "height": 350,
    "config": {
        "background": "#FFFFFF",
        "axisX": {
            "grid": false
        },
        "axisY": {
            "domain": false,
            "ticks": false,
            "gridDash": [
                2
            ],
            "gridWidth": 1
        },
        "view": {
            "stroke": "transparent"
        }
    },
    "data": {
        "url": "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/testrate-by-modzcta.csv"
    },
    "layer": [
        {
            "mark": {
                "type": "line",
                "point": true,
                "tooltip": true,
                "interpolate": "natural",
                "strokeWidth": 1.5
            },
            "encoding": {
                "x": {
                    "field": "week_ending",
                    "type": "temporal",
                    "title": ""
                },
                "y": {
                    "field": "TESTRATE_CITY",
                    "type": "quantitative",
                    "title": null
                },
                "color": {
                    "value": "black"
                },
                "tooltip": [
                    {
                        "field": "TESTRATE_CITY",
                        "title": "New York City"
                    },
                    {
                        "field": "week_ending",
                        "type": "temporal",
                        "title": "Week ending"
                    }
                ]
            }
        },
        {
            "mark": {
                "type": "line",
                "point": true,
                "tooltip": true,
                "interpolate": "natural",
                "strokeWidth": 1.5
            },
            "encoding": {
                "x": {
                    "field": "week_ending",
                    "type": "temporal"
                },
                "y": {
                    "field": "TESTRATE_BK",
                    "type": "quantitative"
                },
                "color": {
                    "value": "darkgrey"
                },
                "tooltip": [
                    {
                        "field": "TESTRATE_BK",
                        "title": "Brooklyn"
                    },
                    {
                        "field": "week_ending",
                        "type": "temporal",
                        "title": "Week ending"
                    }
                ]
            }
        },
        {
            "mark": {
                "type": "line",
                "point": {
                    "filled": false,
                    "fill": "white"
                },
                "tooltip": true,
                "interpolate": "natural",
                "strokeWidth": 3
            },
            "encoding": {
                "x": {
                    "field": "week_ending",
                    "type": "temporal"
                },
                "y": {
                    "field": "TESTRATE_11226",
                    "type": "quantitative"
                },
                "color": {
                    "value": "hotpink"
                },
                "tooltip": [
                    {
                        "field": "TESTRATE_11226",
                        "title": "ZIP Code 11226"
                    },
                    {
                        "field": "week_ending",
                        "type": "temporal",
                        "title": "Week ending"
                    }
                ]
            }
        }
    ]
};




// This function runs on button click and changes the variable "label"
function changeMetric(y) {
    var label = '';
    let btn = document.getElementById(`chartbtn${y}`);
    //Turns off highlights
    for (let button of document.querySelectorAll('.chartbutton')) button.classList.remove('highlight');
    btn.classList.add('highlight');

    if (y === 2) {
        metric = "PCTPOS";
        document.getElementById('datalabel').innerHTML = "Percent of people tested who tested positive";
    } else if (y === 3) {
        metric = "CASERATE";
        document.getElementById('datalabel').innerHTML = "Case rate (per 100,000 people)";
    } else {
        metric = "TESTRATE";
        document.getElementById('datalabel').innerHTML = "Test rate (per 100,000 people)";
    };

    chartDraw(zipString, metric);
}



function chartDraw(zs, m) {
    var boroLabel;
    if (parentBoro === "Bronx") { boroLabel = "BX" }
    else if (parentBoro === "Brooklyn") { boroLabel = "BK" }
    else if (parentBoro === "Manhattan") { boroLabel = "MN" }
    else if (parentBoro === "Queens") { boroLabel = "QN" }
    else { boroLabel = "SI" };

    // console.log('boroLabel is ' + boroLabel);

    //This updates the chart URL based on the metric
    if (metric === "TESTRATE") {
        chartSpec.data.url = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/testrate-by-modzcta.csv"
    } else if (metric === "PCTPOS") {
        chartSpec.data.url = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/percentpositive-by-modzcta.csv"
    } else if (metric === "CASERATE") {
        chartSpec.data.url = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/caserate-by-modzcta.csv"
    };

    // These update the encoding based on the metric, ZIP, and parent Boro
    chartSpec.layer[0].encoding.y.field = m + "_CITY";
    chartSpec.layer[0].encoding.tooltip[0].field = m + "_CITY";

    chartSpec.layer[1].encoding.y.field = m + "_" + boroLabel;
    chartSpec.layer[1].encoding.tooltip[0].field = m + "_" + boroLabel;
    chartSpec.layer[1].encoding.tooltip[0].title = parentBoro;

    chartSpec.layer[2].encoding.y.field = m + "_" + zs; // set line TESTRATE_11226
    chartSpec.layer[2].encoding.tooltip[0].field = m + "_" + zs; // set tooltip
    chartSpec.layer[2].encoding.tooltip[0].title = zs; // set tooltip title

    //and then this draws the chart
    vegaEmbed("#trchart", chartSpec);
}







//This is the big fuction where most of the stuff happens, that runs on zip selection. Putting this at the bottom to make sure everything is loaded when it happens. 
function changeNeighborhood(zipCode) {
    document.querySelector('.submitted__last-location').innerHTML = zipCode; // shows ZIP
    document.querySelector('.submitted').classList.remove('submitted--hidden'); // reveals Facts panel
    zipCodeData = fullData.filter(neighborhood => neighborhood.MODIFIED_ZCTA == zipString); // Filters data-by-modzcta to just selected neighborhood
    console.log("Data for your ZIP:");
    console.log(zipCodeData); // Look Ma, you can see it in the console

    // getting boro data for cumulative table
    parentBoro = zipCodeData[0].BOROUGH_GROUP;
    console.log('the parent boro is: ' + parentBoro);

    // This makes it so that filtering cityData doesn't break via "Staten Island" but causes other problems
    if (parentBoro === "Staten Island") {
        parentBoro = "StatenIsland"
    };
    boroData = cityData.filter(boro => boro.BOROUGH_GROUP == parentBoro);

    // This affords proper display of The Bronx, and Staten Island. parentBoro is used to filter data, parentBoroDisplay is used to print HTML
    if (parentBoro === "StatenIsland") {
        parentBoroDisplay = "Staten Island"
    } else if (parentBoro === "Bronx") {
        parentBoroDisplay = "The Bronx"
    } else {
        parentBoroDisplay = parentBoro
    }



    //getting city data for cumulative table
    cityTableData = cityData.filter(boro => boro.BOROUGH_GROUP == 'Citywide');
    /*
    console.log(cityTableData);
    */


    //Summary paragraph
    document.getElementById('ns1').innerHTML = fullName;

    var pop = Math.floor(zipCodeData[0].POP_DENOMINATOR);
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    pop = numberWithCommas(pop);

    //ZIP Code Summary facts
    document.getElementById('pop').innerHTML = pop;
    document.getElementById('case1').innerHTML = "&nbsp;" + zipCodeData[0].COVID_CASE_COUNT + "&nbsp;";
    document.getElementById('death1').innerHTML = "&nbsp;" + zipCodeData[0].COVID_DEATH_COUNT + "&nbsp;";
    document.getElementById('crzip').innerHTML = zipCodeData[0].COVID_CASE_RATE;
    document.getElementById('drzip').innerHTML = zipCodeData[0].COVID_DEATH_RATE;


    // 'per capita' (1 out of every XX) assignments
    var pc1 = 1 / (zipCodeData[0].COVID_CASE_COUNT / zipCodeData[0].POP_DENOMINATOR);
    document.getElementById('pc1').innerHTML = Math.floor(pc1);

    var pc2 = 1 / (zipCodeData[0].COVID_DEATH_COUNT / zipCodeData[0].POP_DENOMINATOR);
    document.getElementById('pc2').innerHTML = Math.floor(pc2);


    //Higher/Lower assignments

    // Case rate, ZIP to Boro:
    if (zipCodeData[0].COVID_CASE_RATE > boroData[0].CASE_RATE) {
        document.getElementById('hilo1').innerHTML = "&nbsp;Higher&nbsp;";
        document.getElementById('hilo1').classList.add('higher');
        document.getElementById('hilo1').classList.remove('lower');
    } else {
        document.getElementById('hilo1').innerHTML = "&nbsp;Lower&nbsp;";
        document.getElementById('hilo1').classList.add('lower');
        document.getElementById('hilo1').classList.remove('higher');
    }

    document.getElementById('boro1').innerHTML = parentBoroDisplay;
    document.getElementById('boro2').innerHTML = parentBoroDisplay;
    document.getElementById('bcr').innerHTML = boroData[0].CASE_RATE;
    document.getElementById('nycr').innerHTML = cityTableData[0].CASE_RATE;
    document.getElementById('bdr').innerHTML = boroData[0].DEATH_RATE;
    document.getElementById('nydr').innerHTML = cityTableData[0].DEATH_RATE;



    //Case rate, ZIp to City
    if (zipCodeData[0].COVID_CASE_RATE > cityTableData[0].CASE_RATE) {
        document.getElementById('hilo2').innerHTML = "&nbsp;Higher&nbsp;";
        document.getElementById('hilo2').classList.add('higher');
        document.getElementById('hilo2').classList.remove('lower');

    } else {
        document.getElementById('hilo2').innerHTML = "&nbsp;Lower&nbsp;";
        document.getElementById('hilo2').classList.add('lower');
        document.getElementById('hilo2').classList.remove('higher');

    }

    // Death rate, ZIP to boro
    if (zipCodeData[0].COVID_DEATH_RATE > boroData[0].DEATH_RATE) {
        document.getElementById('hilo3').innerHTML = "&nbsp;Higher&nbsp;"
        document.getElementById('hilo3').classList.add('higher');
        document.getElementById('hilo3').classList.remove('lower');
    } else {
        document.getElementById('hilo3').innerHTML = "&nbsp;Lower&nbsp;";
        document.getElementById('hilo3').classList.add('lower');
        document.getElementById('hilo3').classList.remove('higher');

    }

    //Death rate, zip to city
    if (zipCodeData[0].COVID_DEATH_RATE > cityTableData[0].DEATH_RATE) {
        document.getElementById('hilo4').innerHTML = "&nbsp;Higher&nbsp;";
        document.getElementById('hilo4').classList.add('higher');
        document.getElementById('hilo4').classList.remove('lower');

    } else {
        document.getElementById('hilo4').innerHTML = "&nbsp;Lower&nbsp;";
        document.getElementById('hilo4').classList.add('lower');
        document.getElementById('hilo4').classList.remove('higher');

    }

    console.log('zipString is ' + zipString + ', and metric is ' + metric);


    // Draws the chart based on the ZIP!
    chartDraw(zipString, metric);
    document.getElementById('chartzip').innerHTML = "&nbsp;" + zipString + "&nbsp;";
    document.getElementById('chartboro').innerHTML = "&nbsp;" + parentBoro + "&nbsp;";

    // Draws the map upon neighborhood selection
    showMap(vegaSpec);


    // Updates the distribution plot based on neighborhood
    tickSpec.layer[1].transform[0].filter = "datum.modzcta == " + zipCode;
    console.log("filter = " + tickSpec.layer[1].transform[0].filter)


    //Draws the distribution plot
    vegaEmbed("#ticks", tickSpec);



    // Filtering the map data
    mapZipData = mapData.filter(neighborhood => neighborhood.modzcta == zipString);

    document.getElementById('daterange').innerHTML = mapZipData[0].daterange;

    //Sending initial min, max, median, values to range chart
    document.getElementById('lozip').innerHTML = minMDTR.median_daily_test_rate;;
    document.getElementById('hizip').innerHTML = maxMDTR.median_daily_test_rate;
    document.getElementById('zrv').innerHTML = mapZipData[0].median_daily_test_rate;
    document.getElementById('zrmv').innerHTML = mdtrMedian;

    changeMap(1);

};







//Change map on button click
function changeMap(x) {
    let btn = document.getElementById(`mb${x}`);
    //Turns off highlights
    for (let button of document.querySelectorAll('.mapbutton')) button.classList.remove('highlight');
    btn.classList.add('highlight');

    if (x === 1) {
        vegaSpec.layer[1].encoding.color.field = 'median_daily_test_rate';
        vegaSpec.layer[1].encoding.color.legend.title = 'Median daily test rate (per 100,000)';
        vegaSpec.layer[1].encoding.color.scale.scheme.name = "goldgreen";
        document.getElementById('mb1').setAttribute('aria-label', 'Tab selected');
        vegaEmbed('#map', vegaSpec);
        document.getElementById('mapmetric').innerHTML = "Daily test rate, per 100,000 people";

        tickSpec.layer[0].encoding.x.field = 'median_daily_test_rate';
        tickSpec.layer[0].encoding.tooltip[1].field = 'median_daily_test_rate';
        tickSpec.layer[0].encoding.tooltip[1].title = 'Daily test rate';
        tickSpec.layer[1].encoding.x.field = 'median_daily_test_rate';
        tickSpec.layer[1].encoding.tooltip[1].field = 'median_daily_test_rate';
        tickSpec.layer[1].encoding.tooltip[1].title = 'Daily test rate';
        console.log(tickSpec)
        vegaEmbed('#ticks', tickSpec);


        rangeLo = minMDTR.median_daily_test_rate;
        rangeHi = maxMDTR.median_daily_test_rate;

        zipMargin = 100 * (maxMDTR.median_daily_test_rate - mapZipData[0].median_daily_test_rate) / (maxMDTR.median_daily_test_rate - minMDTR.median_daily_test_rate);
        rangeZip = mapZipData[0].median_daily_test_rate;

        rangeMed = mdtrMedian
        medMargin = 100 * (maxMDTR.median_daily_test_rate - mdtrMedian) / (maxMDTR.median_daily_test_rate - minMDTR.median_daily_test_rate);

        if (rangeZip > rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;higher&nbsp;"
        } else if (rangeZip < rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;lower&nbsp;"
        } else if (rangeZip === rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;equal to&nbsp;"
        }


    }


    else if (x === 2) {
        vegaSpec.layer[1].encoding.color.field = 'percentpositivity_7day';
        vegaSpec.layer[1].encoding.color.legend.title = 'Percent Positive';
        vegaSpec.layer[1].encoding.color.scale.scheme.name = "orangered";
        vegaEmbed('#map', vegaSpec);
        document.getElementById('mapmetric').innerHTML = "Percent positive";

        tickSpec.layer[0].encoding.x.field = 'percentpositivity_7day';
        tickSpec.layer[0].encoding.tooltip[1].field = 'percentpositivity_7day';
        tickSpec.layer[0].encoding.tooltip[1].title = 'Percent Positive';
        tickSpec.layer[1].encoding.x.field = 'percentpositivity_7day';
        tickSpec.layer[1].encoding.tooltip[1].field = 'percentpositivity_7day';
        tickSpec.layer[1].encoding.tooltip[1].title = 'Percent Positive';


        vegaEmbed('#ticks', tickSpec);

        rangeLo = minPP.percentpositivity_7day;
        rangeHi = maxPP.percentpositivity_7day;
        rangeZip = mapZipData[0].percentpositivity_7day
        rangeMed = ppMedian;

        zipMargin = 100 * (maxPP.percentpositivity_7day - mapZipData[0].percentpositivity_7day) / (maxPP.percentpositivity_7day - minPP.percentpositivity_7day);
        medMargin = 100 * (maxPP.percentpositivity_7day - ppMedian) / (maxPP.percentpositivity_7day - minPP.percentpositivity_7day);

        if (rangeZip > rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;higher&nbsp;"
        } else if (rangeZip < rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;lower&nbsp;"
        } else if (rangeZip === rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;equal to&nbsp;"
        }


    }


    else if (x === 3) {
        showMap(vegaDotSpec);
        document.getElementById('mapmetric').innerHTML = "New people positive";
        rangeLo = minPeople.people_positive;
        rangeHi = maxPeople.people_positive;

        tickSpec.layer[0].encoding.x.field = 'people_positive';
        tickSpec.layer[0].encoding.tooltip[1].field = 'people_positive';
        tickSpec.layer[0].encoding.tooltip[1].title = 'New people positive';
        tickSpec.layer[1].encoding.x.field = 'people_positive';
        tickSpec.layer[1].encoding.tooltip[1].field = 'people_positive';
        tickSpec.layer[1].encoding.tooltip[1].title = 'New people positive';

        vegaEmbed('#ticks', tickSpec);

        rangeZip = mapZipData[0].people_positive;
        rangeMed = numMedian;

        zipMargin = 100 * (maxPeople.people_positive - mapZipData[0].people_positive) / (maxPeople.people_positive - minPeople.people_positive);
        medMargin = 100 * (maxPeople.people_positive - numMedian) / (maxPeople.people_positive - minPeople.people_positive);

        if (rangeZip > rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;higher&nbsp;"
        } else if (rangeZip < rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;lower&nbsp;"
        } else if (rangeZip === rangeMed) {
            document.getElementById('medcomp').innerHTML = "&nbsp;equal to&nbsp;"
        }

    };



    // Update range chart
    document.getElementById('lozip').innerHTML = rangeLo;
    document.getElementById('hizip').innerHTML = rangeHi;
    document.getElementById('zrv').innerHTML = rangeZip;
    document.getElementById('zrmv').innerHTML = rangeMed;






};



