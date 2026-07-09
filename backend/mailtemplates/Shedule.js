exports.shedulevenue=(buyername ,sellername, productname, productid, venue, date, time)=>{
    return `<DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>Shedule Venue</title>
        <style>
            
        </style>
        </head>


        <body>
            <div>
                Hey ${buyername}  
            </div>
            <div>
                Your request to purchase product from ${sellername} approved.
                You request for product ${productname}
                Product id is ${productid}
                
            </div>
            <div> 
                Metting has been sheduled at ${venue} by ${date} ${time}
            </div>
        </body>

    </html>
    `
}