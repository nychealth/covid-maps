"use strict";

/*
In general, this works by using d3.csv to load CSV files of the data into variables;
an event listener on the zipCodeForm looks for submission and determines the zip of the selected neighborhood;
changeNeighborhood(zipCode) runs to filter the imported data by the selected zipCode, and send the data on to the page.
the app has a lot of calculations (to comapre higher/lower than boro and citywide values) and conditional styling (higher/lower), plus median, min, and max calculations.  
*/

// missing forEach on NodeList for IE11
//   thanks panthony: https://github.com/miguelcobain/ember-paper/issues/1058
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

var geoObj = {};
var covidObj = {};
var viewObj = {};

// Get value of form on submit, and prevent submission
var zipCodeForm = document.getElementById("zip-code-form");

// set global instace of variables
var zipCode; //holds the 5-digit zip code
var zipCodeData; // the ZIP's data from fullData (data-by-modzcta)
var zipString; // ZIP code, as a string
var fullName; // ZIP Code plus neighborhood name
var parentBoro; // ZIP's parent boro
var parentBoroDisplay; // Special display mode for BX, SI
var boroData; // Boro's data from by-boro
var fullData; // full data from data-by-modzcta
var cityData; // full data from by-boro
var antibodyData; // full data from antibody-by-modzcta
var cityTableData; // Citywide valuesfrom by-boro
var metric = "CASERATE"; // Initial map metric selection
var vax1MedArray = [];
var vaxFullyMedArray = [];
var vax1Median;
var vaxFullyMedian;
var vax1PlusMin;
var vax1PlusMax;
var vaxFullyMin;
var vaxFullyMax;
var zipVaxData;
var perc1;
var percF;
var boroVax;
var uhfSelect;
var uhfSelectId;
var uhfTransmission;
var uhfLevel;
var trendData;
var mostRecent;
var dataNow;
var vaxData;
var vaxDataNum;

// LISTENS FOR FORM SUBMISSION AND GETS CHOSEN ZIP CODE
zipCodeForm.addEventListener("submit", function (event) {
  event.preventDefault(); // prevent page re-load
  fullName = event.target[0].value; // assign selected value to fullName variable
  console.log("Selected neighborhood:" + event.target[0].value);
  zipCode = event.target[0].value.slice(0, 5); // trims it down to just the ZIP
  zipString = zipCode.toString(); // converts the numerical value to a string
  changeNeighborhood(zipCode); // runs the major display function
});

// IMPORTS DATA THAT APP WILL DISPLAY
//  pull in data-by-modzcta
d3.csv(
  "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/totals/data-by-modzcta.csv"
).then(function (data) {
  fullData = data;
});

// pull in by-boro
d3.csv(
  "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/totals/by-boro.csv"
).then(function (data) {
  cityData = data;
});

// vax by boro data
d3.csv(
  "https://raw.githubusercontent.com/nychealth/covid-vaccine-data/main/people/coverage-summary-allages.csv"
).then(function (data) {
  boroVax = data;
});

// pulls in Transmission data.
d3.csv(
  "https://gist.githubusercontent.com/mmontesanonyc/2fdc46bcac05e56cac382524717e4d35/raw/2a9415cc64fb5e2ed3b1b8f513c4677c15619912/sevenday_caserates.csv"
).then(function (data) {
  trendData = data;
  // Establishes the most recent entry in Trend Data.
  mostRecent = trendData[trendData.length - 1];
});

// pull in vax by modzcta data
d3.csv(
  "https://raw.githubusercontent.com/nychealth/covid-vaccine-data/main/people/coverage-by-modzcta-allages.csv"
).then(function (data) {
  vaxData = data;

  // converting strings to numbers
  for (let i = 0; i < vaxData.length; i++) {
    vaxData[i].PERC_1PLUS = Number(vaxData[i].PERC_1PLUS);
    vaxData[i].PERC_FULLY = Number(vaxData[i].PERC_FULLY);
  }

  vaxData.sort(function (a, b) {
    return a.PERC_1PLUS - b.PERC_1PLUS;
  });

  // hard-stopping values that are over 100%
  for (let i = 0; i < vaxData.length; i++) {
    if (vaxData[i].PERC_1PLUS > 100) {
      vaxData[i].PERC_1PLUS = 99.9;
    }
    if (vaxData[i].PERC_FULLY > 100) {
      vaxData[i].PERC_FULLY = 99.9;
    }
  }

  vax1PlusMin = getMin(vaxData, "PERC_1PLUS");
  vax1PlusMax = getMax(vaxData, "PERC_1PLUS");
  vaxFullyMin = getMin(vaxData, "PERC_FULLY");
  vaxFullyMax = getMax(vaxData, "PERC_FULLY");

  document.getElementById("lozip").innerHTML = vax1PlusMin.PERC_1PLUS;
  document.getElementById("hizip").innerHTML = vax1PlusMax.PERC_1PLUS;

  // Getting medians
  for (let i = 0; i < vaxData.length; i++) {
    vax1MedArray.push(vaxData[i].PERC_1PLUS);
  }

  vax1MedArray.sort(function (a, b) {
    return a - b;
  }); // sorts in ascending order
  vax1MedArray.splice(0, 88); // removes first 88 of 177 modzctas.
  vax1Median = Number(vax1MedArray[0]); // assigns this median value to your variable

  for (let i = 0; i < vaxData.length; i++) {
    vaxFullyMedArray.push(vaxData[i].PERC_FULLY);
  }
  vaxFullyMedArray.sort(function (a, b) {
    return a - b;
  }); // sorts in ascending order
  vaxFullyMedArray.splice(0, 88); // removes first 88 of 177 modzctas.
  vaxFullyMedian = Number(vaxFullyMedArray[0]); // assigns this median value to your variable
});

// CHANGE BAR CHART BETWEEN 1+ AND FULLY VACCINATED
function vax(x) {
  document.getElementById("vb1").classList.remove("highlight");
  document.getElementById("vb2").classList.remove("highlight");

  if (x == 1) {
    document.getElementById("vb1").classList.add("highlight");
    tickSpec2.layer[0].encoding.y.field = "PERC_1PLUS";
    tickSpec2.layer[1].encoding.y.field = "PERC_1PLUS";
    tickSpec2.layer[0].encoding.tooltip[1].field = "PERC_1PLUS";
    tickSpec2.layer[0].encoding.tooltip[1].title =
      "Percent with at least 1 dose";
    tickSpec2.layer[1].encoding.tooltip[1].field = "PERC_1PLUS";
    tickSpec2.layer[1].encoding.tooltip[1].title =
      "Percent with at least 1 dose";
    tickSpec2.layer[0].encoding.x.sort.field = "PERC_1PLUS";
    tickSpec2.layer[1].encoding.x.sort.field = "PERC_1PLUS";
    document.getElementById("lozip").innerHTML = vax1PlusMin.PERC_1PLUS;
    document.getElementById("hizip").innerHTML = vax1PlusMax.PERC_1PLUS;
    document.getElementById("zrv").innerHTML = zipVaxData[0].PERC_1PLUS;
    document.getElementById("metrictext").innerHTML =
      "have had at least 1 dose.";
    document.getElementById("zrmv").innerHTML = vax1Median;
    testMedians(1);
    vegaEmbed("#ticks2", tickSpec2).then((res) =>
      res.view.insert("tickData", vaxData).run()
    );
  } else if (x == 2) {
    document.getElementById("vb2").classList.add("highlight");
    tickSpec2.layer[0].encoding.y.field = "PERC_FULLY";
    tickSpec2.layer[1].encoding.y.field = "PERC_FULLY";
    tickSpec2.layer[0].encoding.tooltip[1].field = "PERC_FULLY";
    tickSpec2.layer[0].encoding.tooltip[1].title = "Percent fully vaccinated";
    tickSpec2.layer[1].encoding.tooltip[1].field = "PERC_FULLY";
    tickSpec2.layer[1].encoding.tooltip[1].title = "Percent fully vaccinated";
    tickSpec2.layer[0].encoding.x.sort.field = "PERC_FULLY";
    tickSpec2.layer[1].encoding.x.sort.field = "PERC_FULLY";
    document.getElementById("lozip").innerHTML = vaxFullyMin.PERC_FULLY;
    document.getElementById("hizip").innerHTML = vaxFullyMax.PERC_FULLY;
    document.getElementById("zrv").innerHTML = zipVaxData[0].PERC_FULLY;
    document.getElementById("metrictext").innerHTML = "are fully vaccinated.";
    document.getElementById("zrmv").innerHTML = vaxFullyMedian;
    testMedians(2);
    vegaEmbed("#ticks2", tickSpec2).then((res) =>
      res.view.insert("tickData", vaxData).run()
    );
  }
}

// getMax and getMin will get the min and max values in an array, for a specified property in the array. Returns the whole array entry.
function getMax(arr, prop) {
  var max;
  for (var i = 0; i < arr.length; i++) {
    if (!max || parseInt(arr[i][prop]) > parseInt(max[prop])) max = arr[i];
  }
  return max;
}

function getMin(arr, prop) {
  var min;
  for (var i = 0; i < arr.length; i++) {
    if (!min || parseInt(arr[i][prop]) < parseInt(min[prop])) min = arr[i];
  }
  return min;
}

// BAR CHART DEFAULT SPECIFICATION
var tickSpec2 = {
  $schema: "https://vega.github.io/schema/vega-lite/v4.json",
  description: "Tick chart",
  width: "container",
  height: "container",
  config: {
    background: "#FFFFFF",
    axisX: {
      domain: true,
      labels: false,
      grid: false,
      labelFontSize: 8,
      tickColor: "#000000",
      tickSize: 2,
      titleFontSize: 12,
    },
    axisY: { domain: false, labels: false, grid: false, ticks: false },
    view: { stroke: "transparent" },
    tick: { thickness: 0.65, bandSize: 40 },
  },
  data: {
    name: "tickData",
  },
  layer: [
    {
      mark: { type: "bar", tooltip: true, color: "darkgrey" },
      encoding: {
        y: { field: "PERC_1PLUS", type: "quantitative", title: null },
        tooltip: [
          { field: "Label", title: "ZIP" },
          { field: "NEIGHBORHOOD_NAME", title: "Neighborhood" },
          {
            field: "PERC_1PLUS",
            type: "quantitative",
            title: "Percent with at least 1 dose",
          },
        ],
        x: { field: "MODZCTA", sort: { field: "PERC_FULLY" }, axis: null },
      },
    },
    {
      mark: { type: "bar", tooltip: true, color: "#DB00A8" },
      encoding: {
        y: { field: "PERC_1PLUS", type: "quantitative", title: null },
        tooltip: [
          { field: "Label", title: "ZIP" },
          { field: "NEIGHBORHOOD_NAME", title: "Neighborhood" },
          {
            field: "PERC_1PLUS",
            type: "quantitative",
            title: "Percent with at least 1 dose",
          },
        ],
        x: { field: "MODZCTA", sort: { field: "PERC_FULLY" }, axis: null },
      },
      transform: [{ filter: "datum.MODZCTA == 11226" }],
    },
  ],
};

//LINE CHART DEFAULT SPEC
var chartSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v4.json",
  description: "LINE CHART",
  width: "container",
  height: 350,
  config: {
    background: "#FFFFFF",
    axisX: {
      grid: false,
    },
    axisY: {
      domain: false,
      ticks: false,
      gridDash: [2],
      gridWidth: 1,
    },
    view: {
      stroke: "transparent",
    },
  },
  data: {
    url: "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/caserate-by-modzcta.csv",
  },
  layer: [
    {
      mark: {
        type: "line",
        point: true,
        tooltip: true,
        interpolate: "natural",
        strokeWidth: 1.5,
      },
      encoding: {
        x: {
          field: "week_ending",
          type: "temporal",
          title: "",
        },
        y: {
          field: "CASERATE_CITY",
          type: "quantitative",
          title: null,
        },
        color: {
          value: "black",
        },
        tooltip: [
          {
            field: "CASERATE_CITY",
            title: "New York City",
          },
          {
            field: "week_ending",
            type: "temporal",
            title: "Week ending",
          },
        ],
      },
    },
    {
      mark: {
        type: "line",
        point: true,
        tooltip: true,
        interpolate: "natural",
        strokeWidth: 1.5,
      },
      encoding: {
        x: {
          field: "week_ending",
          type: "temporal",
        },
        y: {
          field: "CASERATE_BK",
          type: "quantitative",
        },
        color: {
          value: "darkgrey",
        },
        tooltip: [
          {
            field: "CASERATE_BK",
            title: "Brooklyn",
          },
          {
            field: "week_ending",
            type: "temporal",
            title: "Week ending",
          },
        ],
      },
    },
    {
      mark: {
        type: "line",
        point: {
          filled: false,
          fill: "white",
        },
        tooltip: true,
        interpolate: "natural",
        strokeWidth: 3,
      },
      encoding: {
        x: {
          field: "week_ending",
          type: "temporal",
        },
        y: {
          field: "CASERATE_11226",
          type: "quantitative",
        },
        color: {
          value: "hotpink",
        },
        tooltip: [
          {
            field: "CASERATE_11226",
            title: "ZIP Code 11226",
          },
          {
            field: "week_ending",
            type: "temporal",
            title: "Week ending",
          },
        ],
      },
    },
  ],
};

// RUNS ON LINE CHART BUTTON SELECTION TO CHANGE METRIC AND DISPLAY
function changeMetric(y) {
  var label = "";
  let btn = document.getElementById(`chartbtn${y}`);
  //Turns off highlights
  for (let button of document.querySelectorAll(".chartbutton"))
    button.classList.remove("highlight");
  btn.classList.add("highlight");

  //Removes aria-label from everything based on class
  for (let atr of document.querySelectorAll(".togglebutton"))
    atr.removeAttribute("aria-label", "Tab selected");
  //Adds aria-label to selected button
  btn.setAttribute("aria-label", "Tab selected");

  if (y === 2) {
    metric = "PCTPOS";
    document.getElementById("datalabel").innerHTML =
      "Percent of people tested who tested positive";
  } else if (y === 3) {
    metric = "CASERATE";
    document.getElementById("datalabel").innerHTML =
      "Case rate (per 100,000 people)";
  } else {
    metric = "TESTRATE";
    document.getElementById("datalabel").innerHTML =
      "Test rate (per 100,000 people)";
  }

  chartDraw(zipString, metric);
}

function chartDraw(zs, m) {
  var boroLabel;
  if (parentBoro === "Bronx") {
    boroLabel = "BX";
  } else if (parentBoro === "Brooklyn") {
    boroLabel = "BK";
  } else if (parentBoro === "Manhattan") {
    boroLabel = "MN";
  } else if (parentBoro === "Queens") {
    boroLabel = "QN";
  } else {
    boroLabel = "SI";
  }

  // console.log('boroLabel is ' + boroLabel);

  //This updates the chart URL based on the metric
  if (metric === "TESTRATE") {
    chartSpec.data.url =
      "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/testrate-by-modzcta.csv";
  } else if (metric === "PCTPOS") {
    chartSpec.data.url =
      "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/percentpositive-by-modzcta.csv";
  } else if (metric === "CASERATE") {
    chartSpec.data.url =
      "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/trends/caserate-by-modzcta.csv";
  }

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

//RUNS ON ZIP CODE SELECTION TO CHANGE AND DISPLAY DATA
function changeNeighborhood(zipCode) {
  document.querySelector(".submitted__last-location").innerHTML = zipCode; // shows ZIP
  document.querySelector(".submitted").classList.remove("submitted--hidden"); // reveals Facts panel
  zipCodeData = fullData.filter(
    (neighborhood) => neighborhood.MODIFIED_ZCTA == zipString
  ); // Filters data-by-modzcta to just selected neighborhood

  zipVaxData = vaxData.filter(
    (neighborhood) => neighborhood.MODZCTA == zipString
  ); // filters vax data to just selected neighb
  // adding zip and citywide vax values to summary table
  document.getElementById("pv").innerHTML = Number(
    zipVaxData[0].COUNT_1PLUS_CUMULATIVE
  ).toLocaleString("en-US");
  document.getElementById("pfv").innerHTML = Number(
    zipVaxData[0].COUNT_FULLY_CUMULATIVE
  ).toLocaleString("en-US");
  document.getElementById("vxrate").innerHTML = zipVaxData[0].PERC_1PLUS + "%";
  document.getElementById("vnyc").innerHTML = boroVax[0].PERC_1PLUS + "%";

  // comparing vax rates to citywide
  document.getElementById("vccomp").removeAttribute("class"); // first strip previous styles
  if (Number(zipVaxData[0].PERC_1PLUS) > Number(boroVax[0].PERC_1PLUS)) {
    document.getElementById("vccomp").innerHTML = "&nbsp;Higher&nbsp;";
    document.getElementById("vccomp").classList.add("lower");
  } else {
    document.getElementById("vccomp").innerHTML = "&nbsp;Lower&nbsp;";
    document.getElementById("vccomp").classList.add("higher");
  }

  // getting boro data for cumulative table
  parentBoro = zipCodeData[0].BOROUGH_GROUP;
  console.log("The parent Borough is: " + parentBoro);

  // This makes it so that filtering cityData doesn't break via "Staten Island" but causes other problems
  if (parentBoro === "Staten Island") {
    parentBoro = "StatenIsland";
  }
  boroData = cityData.filter((boro) => boro.BOROUGH_GROUP == parentBoro);

  // This affords proper display of The Bronx, and Staten Island. parentBoro is used to filter data, parentBoroDisplay is used to print HTML
  if (parentBoro === "StatenIsland") {
    parentBoroDisplay = "Staten Island";
  } else if (parentBoro === "Bronx") {
    parentBoroDisplay = "The Bronx";
  } else {
    parentBoroDisplay = parentBoro;
  }

  //getting city data for cumulative table
  cityTableData = cityData.filter((boro) => boro.BOROUGH_GROUP == "Citywide");

  //Summary paragraph
  document.getElementById("ns1").innerHTML = fullName;
  document.getElementById("yrzip").innerHTML = fullName;

  var pop = Math.floor(zipCodeData[0].POP_DENOMINATOR);
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  pop = numberWithCommas(pop);

  //ZIP Code Summary facts
  document.getElementById("pop").innerHTML = pop;
  document.getElementById("case1").innerHTML =
    "&nbsp;" + Number(zipCodeData[0].COVID_CASE_COUNT).toLocaleString("en-US"); + "&nbsp;";
  document.getElementById("death1").innerHTML =
    "&nbsp;" + zipCodeData[0].COVID_DEATH_COUNT + "&nbsp;";
  document.getElementById("crzip").innerHTML = Number(zipCodeData[0].COVID_CASE_RATE).toLocaleString("en-US");
  document.getElementById("drzip").innerHTML = zipCodeData[0].COVID_DEATH_RATE;

  // 'per capita' (1 out of every XX) assignments
  var pc1 =
    1 / (zipCodeData[0].COVID_CASE_COUNT / zipCodeData[0].POP_DENOMINATOR);
  document.getElementById("pc1").innerHTML = Math.floor(pc1);

  var pc2 =
    1 / (zipCodeData[0].COVID_DEATH_COUNT / zipCodeData[0].POP_DENOMINATOR);
  document.getElementById("pc2").innerHTML = Math.floor(pc2);

  // Case rate, ZIP to Boro:
  document.getElementById("hilo1").removeAttribute("class"); // first strip previous styles
  if (Number(zipCodeData[0].COVID_CASE_RATE) > Number(boroData[0].CASE_RATE)) {
    document.getElementById("hilo1").innerHTML = "&nbsp;Higher&nbsp;";
    document.getElementById("hilo1").classList.add("higher");
    document.getElementById("hilo1").classList.remove("lower");
  } else {
    document.getElementById("hilo1").innerHTML = "&nbsp;Lower&nbsp;";
    document.getElementById("hilo1").classList.add("lower");
    document.getElementById("hilo1").classList.remove("higher");
  }

  document.getElementById("boro1").innerHTML = parentBoroDisplay;
  document.getElementById("boro2").innerHTML = parentBoroDisplay;
  document.getElementById("bcr").innerHTML = Number(boroData[0].CASE_RATE).toLocaleString("en-US");;
  document.getElementById("nycr").innerHTML = cityTableData[0].CASE_RATE;
  document.getElementById("bdr").innerHTML = boroData[0].DEATH_RATE;
  document.getElementById("nydr").innerHTML = cityTableData[0].DEATH_RATE;

  //Case rate, ZIp to City
  document.getElementById("hilo2").removeAttribute("class"); // first strip previous styles
  if (
    Number(zipCodeData[0].COVID_CASE_RATE) > Number(cityTableData[0].CASE_RATE)
  ) {
    document.getElementById("hilo2").innerHTML = "&nbsp;Higher&nbsp;";
    document.getElementById("hilo2").classList.add("higher");
    document.getElementById("hilo2").classList.remove("lower");
  } else {
    document.getElementById("hilo2").innerHTML = "&nbsp;Lower&nbsp;";
    document.getElementById("hilo2").classList.add("lower");
    document.getElementById("hilo2").classList.remove("higher");
  }

  // Death rate, ZIP to boro
  document.getElementById("hilo3").removeAttribute("class"); // first strip previous styles
  if (
    Number(zipCodeData[0].COVID_DEATH_RATE) > Number(boroData[0].DEATH_RATE)
  ) {
    document.getElementById("hilo3").innerHTML = "&nbsp;Higher&nbsp;";
    document.getElementById("hilo3").classList.add("higher");
    document.getElementById("hilo3").classList.remove("lower");
  } else {
    document.getElementById("hilo3").innerHTML = "&nbsp;Lower&nbsp;";
    document.getElementById("hilo3").classList.add("lower");
    document.getElementById("hilo3").classList.remove("higher");
  }

  //Death rate, zip to city
  document.getElementById("hilo4").removeAttribute("class"); // first strip previous styles
  if (
    Number(zipCodeData[0].COVID_DEATH_RATE) >
    Number(cityTableData[0].DEATH_RATE)
  ) {
    document.getElementById("hilo4").innerHTML = "&nbsp;Higher&nbsp;";
    document.getElementById("hilo4").classList.add("higher");
    document.getElementById("hilo4").classList.remove("lower");
  } else {
    document.getElementById("hilo4").innerHTML = "&nbsp;Lower&nbsp;";
    document.getElementById("hilo4").classList.add("lower");
    document.getElementById("hilo4").classList.remove("higher");
  }

  // prints boro vax values to summary table
  document.getElementById("vbcomp").removeAttribute("class"); // first strip previous styles

  if (parentBoro === "Bronx") {
    document.getElementById("vboro").innerHTML = boroVax[1].PERC_1PLUS + "%";
    document.getElementById("boro3").innerHTML = "The Bronx";
    // nested IF
    if (Number(zipVaxData[0].PERC_1PLUS) > Number(boroVax[1].PERC_1PLUS)) {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Higher&nbsp;";
      document.getElementById("vbcomp").classList.add("lower");
    } else {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Lower&nbsp;";
      document.getElementById("vbcomp").classList.add("higher");
    }
  } else if (parentBoro === "Brooklyn") {
    document.getElementById("vboro").innerHTML = boroVax[2].PERC_1PLUS + "%";
    document.getElementById("boro3").innerHTML = parentBoro;
    // nested IF
    if (Number(zipVaxData[0].PERC_1PLUS) > Number(boroVax[2].PERC_1PLUS)) {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Higher&nbsp;";
      document.getElementById("vbcomp").classList.add("lower");
    } else {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Lower&nbsp;";
      document.getElementById("vbcomp").classList.add("higher");
    }
  } else if (parentBoro === "Manhattan") {
    document.getElementById("vboro").innerHTML = boroVax[3].PERC_1PLUS + "%";
    document.getElementById("boro3").innerHTML = parentBoro;
    // nested IF
    if (Number(zipVaxData[0].PERC_1PLUS) > Number(boroVax[3].PERC_1PLUS)) {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Higher&nbsp;";
      document.getElementById("vbcomp").classList.add("lower");
    } else {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Lower&nbsp;";
      document.getElementById("vbcomp").classList.add("higher");
    }
  } else if (parentBoro === "Queens") {
    document.getElementById("vboro").innerHTML = boroVax[4].PERC_1PLUS + "%";
    document.getElementById("boro3").innerHTML = parentBoro;
    // nested IF
    if (Number(zipVaxData[0].PERC_1PLUS) > Number(boroVax[4].PERC_1PLUS)) {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Higher&nbsp;";
      document.getElementById("vbcomp").classList.add("lower");
    } else {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Lower&nbsp;";
      document.getElementById("vbcomp").classList.add("higher");
    }
  } else {
    document.getElementById("vboro").innerHTML = boroVax[5].PERC_1PLUS + "%";
    document.getElementById("boro3").innerHTML = "Staten Island";
    // nested IF
    if (Number(zipVaxData[0].PERC_1PLUS) > Number(boroVax[5].PERC_1PLUS)) {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Higher&nbsp;";
      document.getElementById("vbcomp").classList.add("lower");
    } else {
      document.getElementById("vbcomp").innerHTML = "&nbsp;Lower&nbsp;";
      document.getElementById("vbcomp").classList.add("higher");
    }
  }

  // // adds trandmission stuff
  // uhfSelect = uhfList.filter((item) => item.Zipcodes.indexOf(zipCode) !== -1);
  // uhfSelectId = "UHF" + uhfSelect[0].UHF_id;
  // // now we have uhfSelectId that we can use to filter mostRecent

  // uhfTransmission = mostRecent[uhfSelectId];
  // uhfTransmission = Number(uhfTransmission);
  // document.getElementById("levelin").removeAttribute("class");

  // if (uhfTransmission < 10) {
  //   uhfLevel = "Low";
  //   document.getElementById("levelin").classList.add("low");
  // } else if (uhfTransmission > 10 && uhfTransmission < 50) {
  //   uhfLevel = "Moderate";
  //   document.getElementById("levelin").classList.add("moderate");
  // } else if (uhfTransmission > 50 && uhfTransmission < 100) {
  //   uhfLevel = "Substantial";
  //   document.getElementById("levelin").classList.add("substantial");
  // } else if (uhfTransmission > 100) {
  //   uhfLevel = "High";
  //   document.getElementById("levelin").classList.add("high");
  // } else {
  // }

  // document.getElementById("levelin").innerHTML = uhfLevel;
  // document.getElementById("levelnumin").innerHTML = uhfTransmission;
  // document.getElementById("uhfin").innerHTML = uhfSelect[0].Zipcodes;




  // Draws the chart based on the ZIP!
  chartDraw(zipString, metric);
  document.getElementById("chartzip").innerHTML =
    "&nbsp;" + zipString + "&nbsp;";
  document.getElementById("chartboro").innerHTML =
    "&nbsp;" + parentBoro + "&nbsp;";

  // Updates the distribution plot based on neighborhood
  tickSpec2.layer[1].transform[0].filter = "datum.MODZCTA == " + zipCode;

  //Draws the distribution plot
  vegaEmbed("#ticks2", tickSpec2);

  //Sending initial min, max, median, values to range chart
  document.getElementById("zrv").innerHTML = zipVaxData[0].PERC_1PLUS;
  document.getElementById("zrmv").innerHTML = vax1Median;

  testMedians(1);

  // re-set charts on neighborhood change
  vax(1);
  changeMetric(3);
}
// END CHANGENEIGHBORHOOD FUNCTION

// to rearrange buttons so Case Rate is default
changeMetric(3);

function testMedians(x) {
  perc1 = Number(zipVaxData[0].PERC_1PLUS);
  percF = Number(zipVaxData[0].PERC_FULLY);

  if (x == 1) {
    if (perc1 < vax1Median) {
      document.getElementById("medcomp").innerHTML = "Lower";
      document.getElementById("medcomp").classList.add("higher");
    } else {
      document.getElementById("medcomp").innerHTML = "Higher";
      document.getElementById("medcomp").classList.add("lower");
    }
  } else if (x == 2) {
    if (percF < vaxFullyMedian) {
      document.getElementById("medcomp").innerHTML = "Lower";
      document.getElementById("medcomp").classList.add("higher");
    } else {
      document.getElementById("medcomp").innerHTML = "Higher";
      document.getElementById("medcomp").classList.add("lower");
    }
  }
}

// this is JSON of other information about UHFs, which helps pull in isolated neighborhood names.
var uhfList = [
  {
    UHF_id: 101,
    UHF_name: "Kingsbridge - Riverdale",
    Zipcodes: "10463,10471",
    namezip: "Kingsbridge - Riverdale (10463,10471)",
    page_name: "Kingsbridge_Riverdale",
  },
  {
    UHF_id: 102,
    UHF_name: "Northeast Bronx",
    Zipcodes: "10466,10469,10475",
    namezip: "Northeast Bronx (10466,10469,10475)",
    page_name: "Northeast_Bronx",
  },
  {
    UHF_id: 103,
    UHF_name: "Fordham - Bronx Pk",
    Zipcodes: "10458,10467,10468,10470",
    namezip: "Fordham - Bronx Pk (10458,10467,10468,10470)",
    page_name: "Fordham_Bronx_Pk",
  },
  {
    UHF_id: 104,
    UHF_name: "Pelham - Throgs Neck",
    Zipcodes: "10461,10462,10464,10465,10472,10473",
    namezip: "Pelham - Throgs Neck (10461,10462,10464,10465,10472,10473)",
    page_name: "Pelham_Throgs_Neck",
  },
  {
    UHF_id: 105,
    UHF_name: "Crotona -Tremont",
    Zipcodes: "10453,10457,10460",
    namezip: "Crotona -Tremont (10453,10457,10460)",
    page_name: "Crotona_Tremont",
  },
  {
    UHF_id: 106,
    UHF_name: "High Bridge - Morrisania",
    Zipcodes: "10451,10452,10456",
    namezip: "High Bridge - Morrisania (10451,10452,10456)",
    page_name: "High_Bridge_Morrisania",
  },
  {
    UHF_id: 107,
    UHF_name: "Hunts Point - Mott Haven",
    Zipcodes: "10454,10455,10459,10474",
    namezip: "Hunts Point - Mott Haven (10454,10455,10459,10474)",
    page_name: "Hunts_Point_Mott_Haven",
  },
  {
    UHF_id: 201,
    UHF_name: "Greenpoint",
    Zipcodes: "11211,11222",
    namezip: "Greenpoint (11211,11222)",
    page_name: "Greenpoint",
  },
  {
    UHF_id: 202,
    UHF_name: "Downtown - Heights - Slope",
    Zipcodes: "11201,11205,11215,11217,11231",
    namezip: "Downtown - Heights - Slope (11201,11205,11215,11217,11231)",
    page_name: "Downtown_Heights_Slope",
  },
  {
    UHF_id: 203,
    UHF_name: "Bedford Stuyvesant - Crown Heights",
    Zipcodes: "11212,11213,11216,11233,11238",
    namezip:
      "Bedford Stuyvesant - Crown Heights (11212,11213,11216,11233,11238)",
    page_name: "Bedford_Stuyvesant_Crown_Heights",
  },
  {
    UHF_id: 204,
    UHF_name: "East New York",
    Zipcodes: "11207,11208",
    namezip: "East New York (11207,11208)",
    page_name: "East_New_York",
  },
  {
    UHF_id: 205,
    UHF_name: "Sunset Park",
    Zipcodes: "11220,11232",
    namezip: "Sunset Park (11220,11232)",
    page_name: "Sunset_Park",
  },
  {
    UHF_id: 206,
    UHF_name: "Borough Park",
    Zipcodes: "11204,11218,11219,11230",
    namezip: "Borough Park (11204,11218,11219,11230)",
    page_name: "Borough_Park",
  },
  {
    UHF_id: 207,
    UHF_name: "East Flatbush - Flatbush",
    Zipcodes: "11203,11210,11225,11226",
    namezip: "East Flatbush - Flatbush (11203,11210,11225,11226)",
    page_name: "East_Flatbush_Flatbush",
  },
  {
    UHF_id: 208,
    UHF_name: "Canarsie - Flatlands",
    Zipcodes: "11234,11236,11239",
    namezip: "Canarsie - Flatlands (11234,11236,11239)",
    page_name: "Canarsie_Flatlands",
  },
  {
    UHF_id: 209,
    UHF_name: "Bensonhurst - Bay Ridge",
    Zipcodes: "11209,11214,11228,11425",
    namezip: "Bensonhurst - Bay Ridge (11209,11214,11228,11425)",
    page_name: "Bensonhurst_Bay_Ridge",
  },
  {
    UHF_id: 210,
    UHF_name: "Coney Island - Sheepshead Bay",
    Zipcodes: "11223,11224,11229,11235",
    namezip: "Coney Island - Sheepshead Bay (11223,11224,11229,11235)",
    page_name: "Coney_Island_Sheepshead_Bay",
  },
  {
    UHF_id: 211,
    UHF_name: "Williamsburg - Bushwick",
    Zipcodes: "11206,11221,11237",
    namezip: "Williamsburg - Bushwick (11206,11221,11237)",
    page_name: "Williamsburg_Bushwick",
  },
  {
    UHF_id: 301,
    UHF_name: "Washington Heights",
    Zipcodes: "10031,10032,10033,10034,10039,10040",
    namezip: "Washington Heights (10031,10032,10033,10034,10039,10040)",
    page_name: "Washington_Heights",
  },
  {
    UHF_id: 302,
    UHF_name: "Central Harlem - Morningside Heights",
    Zipcodes: "10026,10027,10030,10037,10115",
    namezip:
      "Central Harlem - Morningside Heights (10026,10027,10030,10037,10115)",
    page_name: "Central_Harlem_Morningside_Heights",
  },
  {
    UHF_id: 303,
    UHF_name: "East Harlem",
    Zipcodes: "10029,10035",
    namezip: "East Harlem (10029,10035)",
    page_name: "East_Harlem",
  },
  {
    UHF_id: 304,
    UHF_name: "Upper West Side",
    Zipcodes: "10023,10024,10025,10069",
    namezip: "Upper West Side (10023,10024,10025,10069)",
    page_name: "Upper_West_Side",
  },
  {
    UHF_id: 305,
    UHF_name: "Upper East Side",
    Zipcodes: "10021,10028,10044,10065,10075,10128,10162",
    namezip: "Upper East Side (10021,10028,10044,10065,10075,10128,10162)",
    page_name: "Upper_East_Side",
  },
  {
    UHF_id: 306,
    UHF_name: "Chelsea - Clinton",
    Zipcodes:
      "10001,10011,10018,10019,10020,10036,10103,10110,10111,10112,10119,10199",
    namezip:
      "Chelsea - Clinton (10001,10011,10018,10019,10020,10036,10103,10110,10111,10112,10119,10199)",
    page_name: "Chelsea_Clinton",
  },
  {
    UHF_id: 307,
    UHF_name: "Gramercy Park - Murray Hill",
    Zipcodes:
      "10010,10016,10017,10022,10152,10153,10154,10165,10167,10168,10169,10170,10171,10172,10173,10174,10177",
    namezip:
      "Gramercy Park - Murray Hill (10010,10016,10017,10022,10152,10153,10154,10165,10167,10168,10169,10170,10171,10172,10173,10174,10177)",
    page_name: "Gramercy_Park_Murray_Hill",
  },
  {
    UHF_id: 308,
    UHF_name: "Greenwich Village - SoHo",
    Zipcodes: "10012,10013,10014",
    namezip: "Greenwich Village - SoHo (10012,10013,10014)",
    page_name: "Greenwich_Village_SoHo",
  },
  {
    UHF_id: 309,
    UHF_name: "Union Square - Lower East Side",
    Zipcodes: "10002,10003,10009",
    namezip: "Union Square - Lower East Side (10002,10003,10009)",
    page_name: "Union_Square_Lower_East_Side",
  },
  {
    UHF_id: 310,
    UHF_name: "Lower Manhattan",
    Zipcodes: "10005,10006,10007,10038,10271,10278,10279,10280,10282",
    namezip:
      "Lower Manhattan (10005,10006,10007,10038,10271,10278,10279,10280,10282)",
    page_name: "Lower_Manhattan",
  },
  {
    UHF_id: 401,
    UHF_name: "Long Island City - Astoria",
    Zipcodes: "11101,11102,11103,11104,11105,11106,11109",
    namezip:
      "Long Island City - Astoria (11101,11102,11103,11104,11105,11106,11109)",
    page_name: "Long_Island_City_Astoria",
  },
  {
    UHF_id: 402,
    UHF_name: "West Queens",
    Zipcodes: "11369,11370,11372,11373,11377,11378",
    namezip: "West Queens (11369,11370,11372,11373,11377,11378)",
    page_name: "West_Queens",
  },
  {
    UHF_id: 403,
    UHF_name: "Flushing - Clearview",
    Zipcodes: "11351,11354,11355,11356,11357,11358,11359,11360,11368",
    namezip:
      "Flushing - Clearview (11351,11354,11355,11356,11357,11358,11359,11360,11368)",
    page_name: "Flushing_Clearview",
  },
  {
    UHF_id: 404,
    UHF_name: "Bayside - Little Neck",
    Zipcodes: "11361,11362,11363,11364",
    namezip: "Bayside - Little Neck (11361,11362,11363,11364)",
    page_name: "Bayside_Little_Neck",
  },
  {
    UHF_id: 405,
    UHF_name: "Ridgewood - Forest Hills",
    Zipcodes: "11374,11375,11379,11385",
    namezip: "Ridgewood - Forest Hills (11374,11375,11379,11385)",
    page_name: "Ridgewood_Forest_Hills",
  },
  {
    UHF_id: 406,
    UHF_name: "Fresh Meadows",
    Zipcodes: "11365,11366,11367",
    namezip: "Fresh Meadows (11365,11366,11367)",
    page_name: "Fresh_Meadows",
  },
  {
    UHF_id: 407,
    UHF_name: "Southwest Queens",
    Zipcodes: "11414,11415,11416,11417,11418,11419,11420,11421,11424",
    namezip:
      "Southwest Queens (11414,11415,11416,11417,11418,11419,11420,11421,11424)",
    page_name: "Southwest_Queens",
  },
  {
    UHF_id: 408,
    UHF_name: "Jamaica",
    Zipcodes: "11412,11423,11432,11433,11434,11435,11436,11451",
    namezip: "Jamaica (11412,11423,11432,11433,11434,11435,11436,11451)",
    page_name: "Jamaica",
  },
  {
    UHF_id: 409,
    UHF_name: "Southeast Queens",
    Zipcodes: "11004,11005,11411,11413,11422,11426,11427,11428,11429",
    namezip:
      "Southeast Queens (11004,11005,11411,11413,11422,11426,11427,11428,11429)",
    page_name: "Southeast_Queens",
  },
  {
    UHF_id: 410,
    UHF_name: "Rockaways",
    Zipcodes: "11691,11692,11694,11697",
    namezip: "Rockaways (11691,11692,11694,11697)",
    page_name: "Rockaways",
  },
  {
    UHF_id: 501,
    UHF_name: "Port Richmond",
    Zipcodes: "10302,10303,10310",
    namezip: "Port Richmond (10302,10303,10310)",
    page_name: "Port_Richmond",
  },
  {
    UHF_id: 502,
    UHF_name: "Stapleton - St. George",
    Zipcodes: "10301,10304,10305",
    namezip: "Stapleton - St. George (10301,10304,10305)",
    page_name: "Stapleton_St_George",
  },
  {
    UHF_id: 503,
    UHF_name: "Willowbrook",
    Zipcodes: "10311,10314",
    namezip: "Willowbrook (10311,10314)",
    page_name: "Willowbrook",
  },
  {
    UHF_id: 504,
    UHF_name: "South Beach - Tottenville",
    Zipcodes: "10306,10307,10308,10309,10312",
    namezip: "South Beach - Tottenville (10306,10307,10308,10309,10312)",
    page_name: "South_Beach_Tottenville",
  },
];
