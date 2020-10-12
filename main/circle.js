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
var countSpec = "mapCountCircle.vl.json";
var deathCountSpec = "mapDeathCountCircle.vl.json";
var rateSpec = "mapRate.vl.json";
var deathRateSpec = "mapDeathRate.vl.json";
var percentSpec = "mapPercent.vl.json";
var deathSpec = "";
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
      if (radio.value === 'Case Rate') {
        rateMapCreate();
      } else if (radio.value === 'Case Count') {
        countMapCreate();
      } else if (radio.value === 'Death Count') {
        deathCountMapCreate();
      } else if (radio.value === 'Death Rate') {
        deathRateMapCreate();
      } else {
        percentMapCreate();
      } // for if chosenField is Percent Positive


      ;
    });
  });
} //this function creates the map


function rateMapCreate() {
  vegaEmbed('#map', rateSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}

function countMapCreate() {
  vegaEmbed('#map', countSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}

function percentMapCreate() {
  vegaEmbed('#map', percentSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}

function deathRateMapCreate() {
  vegaEmbed('#map', deathRateSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}

function deathCountMapCreate() {
  vegaEmbed('#map', deathCountSpec, opt).then(function (result) {
    // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
    viewObj = result.view;
  }).catch(console.error);
}

rateMapCreate();