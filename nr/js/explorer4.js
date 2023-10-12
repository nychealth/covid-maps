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
let vaxBivalentMedArray = [];
var vax1Median;
var vaxFullyMedian;
var vax1PlusMin;
var vax1PlusMax;
var vaxFullyMin;
var vaxFullyMax;
let vaxBivalentMax;
let vaxBivalentMedian;
let vaxBivalentMin;
var zipVaxData;
var perc1;
var percF;
let percB
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
  console.log(boroVax);

  // for summary page
  document.getElementById("vnyc-1plus").innerHTML = Number(boroVax[0].COUNT_1PLUS_CUMULATIVE).toLocaleString("en-US");;
  document.getElementById("vnyc-perc1plus").innerHTML = boroVax[0].PERC_1PLUS + "%";
  document.getElementById("vnyc-full").innerHTML = Number(boroVax[0].COUNT_FULLY_CUMULATIVE).toLocaleString("en-US");;
  document.getElementById("vnyc-percfull").innerHTML = boroVax[0].PERC_FULLY + "%";
  //document.getElementById("vnyc-date").innerHTML = boroVax[6].BOROUGH.slice(12,20);

  let boroughTemp = boroVax.slice(1,6);

  for (let i = 0; i < boroughTemp.length; i++) {
    boroughTemp[i].PERC_1PLUS = Number(boroughTemp[i].PERC_1PLUS);
  }

//   const max = boroughTemp.reduce((prev, current) => {
//     return (prev.PERC_1PLUS > current.PERC_1PLUS) ? prev : current
// }) 

    let max = getMax(boroughTemp, "PERC_1PLUS");
  //  console.log(max)
   const min = getMin(boroughTemp, "PERC_1PLUS");
    //console.log(min);
   // let min1plus= ((min.PERC_1PLUS  > 100) ? 99 : min.PERC_1PLUS );
    let max1plus = ((max.PERC_1PLUS  > 100) ? 99 : max.PERC_1PLUS );



    document.getElementById("vnyc-borough-max").innerHTML = max.BOROUGH[0].toUpperCase() + max.BOROUGH.slice(1).toLowerCase();
    document.getElementById("vnyc-borough-max-1plus").innerHTML = max1plus + "%";
    document.getElementById("vnyc-borough-min").innerHTML = min.BOROUGH[0].toUpperCase() + min.BOROUGH.slice(1).toLowerCase();
    document.getElementById("vnyc-borough-min-1plus").innerHTML = min.PERC_1PLUS + "%";

});

// pulls in Transmission data.
d3.csv(
  "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/latest/7day-transmission-rate.csv"
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
    vaxData[i].PERC_BIVALENT_ADDITIONAL = Number(vaxData[i].PERC_BIVALENT_ADDITIONAL);

  }

  vaxData.sort(function (a, b) {
    return a.PERC_1PLUS - b.PERC_1PLUS;
  });

  // hard-stopping values that are over 100%
  for (let i = 0; i < vaxData.length; i++) {
    if (vaxData[i].PERC_1PLUS > 100) {
      vaxData[i].PERC_1PLUS = 99;
    }
    if (vaxData[i].PERC_FULLY > 100) {
      vaxData[i].PERC_FULLY = 99;
    }
    if (vaxData[i].PERC_BIVALENT_ADDITIONAL > 100) {
        vaxData[i].PERC_BIVALENT_ADDITIONAL = 99;
      }
  }

  vax1PlusMin = getMin(vaxData, "PERC_1PLUS");
  vax1PlusMax = getMax(vaxData, "PERC_1PLUS");
  vaxFullyMin = getMin(vaxData, "PERC_FULLY");
  vaxFullyMax = getMax(vaxData, "PERC_FULLY");
  vaxBivalentMin = getMin(vaxData, "PERC_BIVALENT_ADDITIONAL");
  vaxBivalentMax = getMax(vaxData, "PERC_BIVALENT_ADDITIONAL");
  console.log(vaxBivalentMax.PERC_BIVALENT_ADDITIONAL, vaxBivalentMin)

  //document.getElementById("lozip").innerHTML = vax1PlusMin.PERC_1PLUS;
  //document.getElementById("hizip").innerHTML = '99.9';

  // Getting medians

  // 1plus
  for (let i = 0; i < vaxData.length; i++) {
    vax1MedArray.push(vaxData[i].PERC_1PLUS);
  }

  vax1MedArray.sort(function (a, b) {
    return a - b;
  }); // sorts in ascending order
  vax1MedArray.splice(0, 88); // removes first 88 of 177 modzctas.
  vax1Median = Number(vax1MedArray[0]); // assigns this median value to your variable


  // Fully Vaccinated
  for (let i = 0; i < vaxData.length; i++) {
    vaxFullyMedArray.push(vaxData[i].PERC_FULLY);
  }
  vaxFullyMedArray.sort(function (a, b) {
    return a - b;
  }); // sorts in ascending order
  vaxFullyMedArray.splice(0, 88); // removes first 88 of 177 modzctas.
  vaxFullyMedian = Number(vaxFullyMedArray[0]); // assigns this median value to your variable

  // Bivalent Dose
  for (let i = 0; i < vaxData.length; i++) {
    vaxBivalentMedArray.push(vaxData[i].PERC_BIVALENT_ADDITIONAL);
  }

  vaxBivalentMedArray.sort(function (a, b) {
      return a - b;
  });
  vaxBivalentMedArray.splice(0,88);
  vaxBivalentMedian = Number(vaxBivalentMedArray[0]);


});

// CHANGE BAR CHART BETWEEN 1+ AND FULLY VACCINATED
function vax(x) {
  document.getElementById("vb1").classList.remove("highlight");
  document.getElementById("vb2").classList.remove("highlight");
  document.getElementById("vb3").classList.remove("highlight");

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
    document.getElementById("hizip").innerHTML = '99.9';
    document.getElementById("zrv").innerHTML = zipVaxData[0].PERC_1PLUS;
    document.getElementById("metrictext").innerHTML =
      "have had at least 1 dose.";
    document.getElementById("zrmv").innerHTML = vax1Median + "%";
    testMedians(1);
    vegaEmbed("#ticks2", tickSpec2).then((res) =>
      res.view.insert("tickData", vaxData).run()
    );
  } else if (x == 2) {
    document.getElementById("vb2").classList.add("highlight");
    tickSpec2.layer[0].encoding.y.field = "PERC_FULLY";
    tickSpec2.layer[1].encoding.y.field = "PERC_FULLY";
    tickSpec2.layer[0].encoding.tooltip[1].field = "PERC_FULLY";
    tickSpec2.layer[0].encoding.tooltip[1].title = "Percent completed primary series";
    tickSpec2.layer[1].encoding.tooltip[1].field = "PERC_FULLY";
    tickSpec2.layer[1].encoding.tooltip[1].title = "Percent completed primary series";
    tickSpec2.layer[0].encoding.x.sort.field = "PERC_FULLY";
    tickSpec2.layer[1].encoding.x.sort.field = "PERC_FULLY";
    document.getElementById("lozip").innerHTML = vaxFullyMin.PERC_FULLY;
    document.getElementById("hizip").innerHTML = '99.9';
    document.getElementById("zrv").innerHTML = zipVaxData[0].PERC_FULLY;
    document.getElementById("metrictext").innerHTML = "have completed the primary vaccination series.";
    document.getElementById("zrmv").innerHTML = vaxFullyMedian  + "%";
    testMedians(2);
    vegaEmbed("#ticks2", tickSpec2).then((res) =>
      res.view.insert("tickData", vaxData).run()
    );
  }
  else if (x == 3) {
    document.getElementById("vb3").classList.add("highlight");
    tickSpec2.layer[0].encoding.y.field = "PERC_BIVALENT_ADDITIONAL";
    tickSpec2.layer[1].encoding.y.field = "PERC_BIVALENT_ADDITIONAL";
    tickSpec2.layer[0].encoding.tooltip[1].field = "PERC_BIVALENT_ADDITIONAL";
    tickSpec2.layer[0].encoding.tooltip[1].title = "Percent bivalent dose";
    tickSpec2.layer[1].encoding.tooltip[1].field = "PERC_BIVALENT_ADDITIONAL";
    tickSpec2.layer[1].encoding.tooltip[1].title = "Percent bivalent dose";
    tickSpec2.layer[0].encoding.x.sort.field = "PERC_BIVALENT_ADDITIONAL";
    tickSpec2.layer[1].encoding.x.sort.field = "PERC_BIVALENT_ADDITIONAL";
    document.getElementById("lozip").innerHTML = vaxBivalentMin.PERC_BIVALENT_ADDITIONAL;
    document.getElementById("hizip").innerHTML = vaxBivalentMax.PERC_BIVALENT_ADDITIONAL;
    document.getElementById("zrv").innerHTML = zipVaxData[0].PERC_BIVALENT_ADDITIONAL;
    document.getElementById("metrictext").innerHTML = "have received a bivalent dose.";
    document.getElementById("zrmv").innerHTML = vaxBivalentMedian  + "%";
    testMedians(3);
    vegaEmbed("#ticks2", tickSpec2).then((res) =>
      res.view.insert("tickData", vaxData).run()
    );
  }

}




// function getMax1(arr, _prop) {
//     arr.reduce((prev, current) => {
//         return (prev.prop > current.prop) ? prev : current;
//     });
// }

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


