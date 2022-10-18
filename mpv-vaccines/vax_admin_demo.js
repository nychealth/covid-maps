	
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

        	let mydate = pubDate; 
        	const month = ["January", "February", "March", "April", "May", "June",
       		 "July", "August", "September", "October", "November", "December"];
     		let outputDate = `${mydate.getMonth()} ${mydate.getDate()}`;		
                document.getElementById("vaccinationDate").innerHTML = pubDate.format('mm/dd/yy');

		
		})   
		}
