
getData();


/*
Pull in monkeypox total case numbers; clean the data; return elements for the data values to be added to the DOM
*/
async function getData() {
    const response = await fetch('https://raw.githubusercontent.com/nychealth/covid-maps/main/mpv-vaccines/demographics-at-risk-summary.csv');
    const data = await response.text();
    const table = data.split('\n').slice(1,2);

    table.forEach(e => {
        caseInfoArr = e.split(',');
        let percDoses = caseInfoArr[5];
 
        document.getElementById("diagnosisDate").innerHTML = outputDate;
        document.getElementById("perc_doses").innerHTML = parseInt(percDoses).toLocaleString();
		
		
  })   
}
