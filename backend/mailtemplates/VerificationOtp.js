exports.otptemplate=(otp)=>{
    return `<DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>OTP Verification Email</title>
        <style>
            
        </style>
        </head>


        <body>
            <div class='head'>This is OTP verification mail</div>
            <div class='sugg'>Type the OTP to verify</div>
            <div class='otp'>OTP is ${otp}</div>
            <div>
            
            </div>
            
        </body>
    </html>
    `
}