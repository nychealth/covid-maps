let geoDataURL = "../zcta.topo.json";
let geoObj = {};
let covidObj = {};
let viewObj = {};

let countSpec = "jsonspec/mapCountCircle.vl.json";
let deathCountSpec = "jsonspec/mapDeathCountCircle.vl.json";
let rateSpec = "jsonspec/mapRate.vl.json";
let deathRateSpec = "jsonspec/mapDeathRate.vl.json";
let percentSpec = "jsonspec/mapPercent.vl.json";

let totalCount = "jsonspec/totalCount.vl.json";
let totalPct = "jsonspec/totalPct.vl.json";
let testRate = "jsonspec/testrate.vl.json";

let iggCount= "jsonspec/iggCount.vl.json";
let igmCount = "jsonspec/igmCount.vl.json";
let abCount = "jsonspec/abCount.vl.json";
let iggPct = "jsonspec/iggPct.vl.json";
let igmPct = "jsonspec/igmPct.vl.json";
let abPct = "jsonspec/abPct.vl.json";


let deathSpec = "";
let radios ;


const opt = {"renderer":"svg"};
const el = document.getElementById('map');

// this code listens to the form with map chooser; must run after DOM loads
window.onload =listenRadios;

function listenRadios() {
  radios = document.querySelectorAll('input[type=radio][name="mapRadioGroup"]');
  radios.forEach(radio => radio.addEventListener('change', () => {
    if (radio.value==='totalcount') {totalcountMapCreate()}
    else if (radio.value==='testrate') {testrateMapCreate()}
    else {totalpctMapCreate()}  // for if chosenField is Percent Positive
    ;
  }));
}

//this function creates the map
function totalcountMapCreate() {
  vegaEmbed('#map', totalCount, opt).then(function(result) {
      // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
      viewObj = result.view;
    }).catch(console.error);
  }

  //this function creates the map
function testrateMapCreate() {
  vegaEmbed('#map', testRate, opt).then(function(result) {
      // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
      viewObj = result.view;
    }).catch(console.error);
  }


  
//this function creates the map
function totalpctMapCreate() {
  vegaEmbed('#map', totalPct, opt).then(function(result) {
      // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
      viewObj = result.view;
    }).catch(console.error);
  }



  totalcountMapCreate();
