exports.checktransactiontemplate=(productname,otp)=>{
    return `<DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>Verify transaction</title>
        <style>
            
        </style>
        </head>


        <body>
            <div class='head'>Confirm your Campus Recycle transaction</div>
            <div class='sugg'>To confirm the pickup of ${productname}, enter the one-time code ${otp}. This code expires in five minutes and should not be shared with the seller.</div>
        </body>
    </html>
    `
}
