
getData();

const statusTR = [
  {
    lang: 'en',
    val: [
      {status: 'Stable', trans: 'Stable'},
      {status: 'Increasing', trans: 'Increasing'},
      {status: 'Decreasing', trans: 'Decreasing'}
    ]
  },
    {
      lang: 'sp',
      val: [
        {status: 'Stable', trans: 'Estable'},
        {status: 'Increasing', trans: 'Aumento'},
        {status: 'Decreasing', trans: 'Disminución'}
      ]
    },
  
    {
      lang: 'ru',
      val: [
        {status: 'Stable', trans: 'Стабильный'},
        {status: 'Increasing', trans: 'Возрастающий'},
        {status: 'Decreasing', trans: 'Понижающий'}
      ]
    },
    {
       lang: 'tc',
        val: [
        {status: 'Stable', trans: '穩定'},
        {status: 'Increasing', trans: '增加'},
        {status: 'Decreasing', trans: '減少'}
      ]
    },
    
    {
       lang: 'sc',
        val: [
        {status: 'Stable', trans: '稳定'},
        {status: 'Increasing', trans: '增加'},
        {status: 'Decreasing', trans: '減少'}
      ]
    }
  ]



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
Designate Alert Level Trend and comparison language
*/
function setAlertStatus(l, s) {
  let langArray = ['en', 'sp', 'ru', 'tc', 'sc'];
  let statusArray = ['Stable', 'Increasing', 'Decreasing'];
  
  return statusTR[langArray.indexOf(l)].val[statusArray.indexOf(s)].trans;    
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
        alertLevel = alertLevel.replace(/\s+/g, '');
        let caseRate7DayTotalStatus = indicatorVal[5];
        let admissionsPer100kStatus = indicatorVal[6];
        let bedsOccupiedByCovidPatientsStatus = indicatorVal[7];

        //pull in language from active document
        let lang = document.documentElement.lang

        let mydate =  new Date(lastUpdateDate); 
        const month = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
        let outputDate = `${month[mydate.getMonth()]} ${mydate.getDate()}, ${mydate.getFullYear()}`;
        //let outputDate = 'DOHMH: June 20, 2022; HERDS: June 21, 2022';
        document.getElementById("caseRate").innerHTML = roundDecimal(caseRate7DayTotal,2);
        document.getElementById("admissionsPer100").innerHTML = roundDecimal(admissionsPer100k,1)
        document.getElementById("bedsOccupied").innerHTML = roundDecimal(bedsOccupiedByCovidPatients, 2);

        

        document.getElementById("caseRateDate").innerHTML = outputDate;

        //Trend Status
        document.getElementById("caseRateStatus").innerHTML = setAlertStatus(lang, caseRate7DayTotalStatus);
        document.getElementById("admissionsPer100Status").innerHTML = setAlertStatus(lang, admissionsPer100kStatus);
        document.getElementById("bedsOccupiedStatus").innerHTML = setAlertStatus(lang, bedsOccupiedByCovidPatientsStatus);

        let x = document.querySelectorAll(".grid-item")
        console.log(x)
        for (let i = 3; i < 6; i++) {
            x[i].style.background = setColor(alertLevel)
        }
  })   
}


