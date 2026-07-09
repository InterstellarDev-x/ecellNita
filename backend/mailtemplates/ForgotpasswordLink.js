exports.forgotpasswordtemplate=(email,link)=>{
    return `<DOCTYPE html>
    <html>
        <head>

        <meta charset="UTF-8">
		<title>OTP Verification Email</title>
        <style>
            
        </style>
        </head>


        <body>
            <div class='head'>This is forgot password email</div>
            <div class='sugg'>forgot password link is requested from email id ${email}</div>
            <div class='otp'>click on the link to set new password </div>
            <a href=${link}>click here ${link}</a>
        </body>
    </html>
    `
}