exports.requestproduct=(buyername ,sellername, productname,  productid, quantity)=>{
    return `<!DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>Request to Sell</title>
        <style>
            
        </style>
        </head>


        <body>
            <div>
                <p>Hey ${sellername},</p>
                <p>You got a request from ${buyername} to buy your product <strong>${productname}</strong>.</p>
                <p>Quantity requested: <strong>${quantity}</strong></p>
                <p>Product id: ${productid}</p>
                <p>Kindly visit the website to review this request.</p>
            </div>
        </body>
    </html>
    `
}
