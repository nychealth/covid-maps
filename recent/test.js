"use strict";

// missing forEach on NodeList for IE11
//   thanks panthony: https://github.com/miguelcobain/ember-paper/issues/1058
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

var geoDataURL = "../zcta.topo.json";
var covidDataURL = "../FakeZCTAData.csv";
var geoObj = {};
var covidObj = {};
var viewObj = {};
var testRateSpec = "recentTestRate.vl.json";
var percentPosSpec = "recentPerPos.vl.json";

var radios = [];
var opt = {
  "renderer": "svg"
};
var el = document.getElementById('#map'); // this code listens to the form with map chooser; must run after DOM loads

window.onload = listenRadios;

function listenRadios() {
  radios = document.querySelectorAll('input[type=radio][name="mapRadioGroup"]');
  radios.forEach(function (radio) {
    return radio.addEventListener('change', function () {
      if (radio.value === 'Testrate') {
        rateMapCreate();
      } else {
        percentMapCreate();
      } // for if chosenField is Percent Positive


      ;
    });
  });
} //this function creates the map


function rateMapCreate() {
  vegaEmbed('#map', testRateSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}


function percentMapCreate() {
  vegaEmbed('#map', percentPosSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}



percentMapCreate();