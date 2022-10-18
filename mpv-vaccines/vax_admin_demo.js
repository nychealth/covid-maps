	
		getData();


		/*
			Pull in monkeypox total vaccine numbers; clean the data; return elements for the data values to be added to the DOM
		*/
		async function getData() {
		const response = await fetch('https://raw.githubusercontent.com/nychealth/covid-maps/main/mpv-vaccines/IDT_MPXV_doses_given_2022-10-17.csv');
		const data = await response.text();
		const table = data.split('\n').slice(-2,-1);
		table.forEach(e => {
		vaxInfoArr = e.split(',');
		let pubDate = new Date(vaxInfoArr[0]);
		pubDate = new Date(pubDate.getTime() - pubDate.getTimezoneOffset() * -60000); 
		console.log(pubDate);
        //let vaccinationDate = ;
        let totalVaccines = vaxInfoArr[6];
 

        let mydate = pubDate; 
		//let mydate2 = pubDate;
        const month = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
        let outputDate = `${month[mydate.getMonth()]} ${mydate.getDate()}`;
		let productionDate = `${month[mydate.getMonth()]} ${mydate.getDate()+3}`;
		
        document.getElementById("vaccinationDate").innerHTML = outputDate;
		document.getElementById("prodDate").innerHTML = productionDate;
        #document.getElementById("totalVaccines").innerHTML = parseInt(totalVaccines).toLocaleString();
		
		
		})   
		}
