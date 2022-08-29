
getData();


/*
Pull in monkeypox total case numbers; clean the data; return elements for the data values to be added to the DOM
*/
async function getData() {
    const response = await fetch('https://raw.githubusercontent.com/nychealth/monkeypox-data/main/totals/total-daily-cases.csv');
    const data = await response.text();
    const table = data.split('\n').slice(1,2);

    table.forEach(e => {
        caseInfoArr = e.split(',');
	let pubDate = caseInfoArr[0]
        let diagnosisDate = caseInfoArr[2];
        let totalCases = caseInfoArr[1];
 

        //pull in language from active document
        let lang = document.documentElement.lang

        let mydate =  new Date(diagnosisDate); 
	let mydate2 = new Date(pubDate);
        const month = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
        let outputDate = `${month[mydate.getMonth()]} ${mydate.getDate()}`;
	let pubDate = `${month[mydate2.getMonth()]} ${mydate2.getDate()}`;
        //let outputDate = 'DOHMH: June 20, 2022; HERDS: June 21, 2022';
		
        document.getElementById("diagnosisDate").innerHTML = outputDate;
	document.getElementById("prodDate").innerHTML = pubDate;
        document.getElementById("totalCases").innerHTML = parseInt(totalCases).toLocaleString();
		
		
  })   
}

