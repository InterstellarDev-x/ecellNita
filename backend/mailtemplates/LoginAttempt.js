exports.loginattempt=(email)=>{
    return `<DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>OTP Verification Email</title>
        <style>
            
        </style>
        </head>


        <body>
            <div class='head'>This is login attempt warining</div>
            <div class='sugg'>There is an login attempt with email id ${email} </div>
            <div class='otp'>If not by you then kindly login to your account and change password</div>
        </body>
    </html>
    `
}