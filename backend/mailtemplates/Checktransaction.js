exports.checktransactiontemplate=(productid, otp)=>{
    return `<DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>Verify transaction</title>
        <style>
            
        </style>
        </head>


        <body>
            <div class='head'>This is to verify transacion</div>
            <div class='sugg'> To verify transaction for your product id ${productid} , enter the otp ${otp} </div>
        </body>
    </html>
    `
}