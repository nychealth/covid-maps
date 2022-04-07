
getData();


function roundDecimal(num, decimals) {
    return Number(Math.round(num + "e" + decimals) + "e-" + decimals);
}

/*
Designate Color depending on alert level status
*/
function setColor(d) {
    return d == "Low" ? '#33A532' :
         d == 'Medium' ? '#FAC74D' :
            d == 'High' ? '#F28A2E':
                          '#F22929'; //make this very high and add as a forced argument
  
}

/*
Pull in alert level data; clean the data; return elements for the data values to be added to the DOM
*/
async function getData() {
    const response = await fetch('https://raw.githubusercontent.com/nychealth/coronavirus-data/master/alert-levels/nyc_alert_levels.csv');
    const data = await response.text();
    const table = data.split('\n').slice(1,2);

    table.forEach(e => {
        indicatorVal = e.split(',');
        let lastUpdateDate = indicatorVal[0];
        let caseRate7DayTotal = indicatorVal[1];
        let admissionsPer100k = indicatorVal[2];
        let bedsOccupiedByCovidPatients = indicatorVal[3]*100;
        let alertLevel = indicatorVal[4];
        alertLevel = alertLevel.replace(/\s+/g, '')


        let mydate =  new Date(lastUpdateDate); 
        const month = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
        let outputDate = `${month[mydate.getMonth()]} ${mydate.getDate()+1}, ${mydate.getFullYear()}`;

        document.getElementById("caseRate").innerHTML = roundDecimal(caseRate7DayTotal,2);
        document.getElementById("admissionsPer100").innerHTML = roundDecimal(admissionsPer100k,1)
        document.getElementById("bedsOccupied").innerHTML = roundDecimal(bedsOccupiedByCovidPatients, 2);
        //dates
        // document.getElementById("herdsLastUpdatedDate").innerHTML = lastUpdateDate;
        // document.getElementById("bedOccupancyDate").innerHTML = lastUpdateDate;

        document.getElementById("caseRateDate").innerHTML = outputDate;

        let x = document.querySelectorAll(".grid-item")
        console.log(x)
        for (let i = 3; i < x.length; i++) {
            x[i].style.background = setColor(alertLevel)
        }
  })   
}


