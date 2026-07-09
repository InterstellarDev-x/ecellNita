const nodemailer=require("nodemailer");
const logger=require("./logger");
require("dotenv").config();

exports.mailsender=async (email,title,body)=>{
    try{
        const mailPort = Number(process.env.MAIL_PORT || 465);
        const mailSecure = process.env.MAIL_SECURE
            ? process.env.MAIL_SECURE === "true"
            : mailPort === 465;
        const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER;
        const fromName = process.env.MAIL_FROM_NAME || "NITASPACE";

        let transporter=nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            port: mailPort,
            secure: mailSecure,
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS,
            },
            
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000,
            pool: true,
            maxConnections: 5,
            maxMessages: 10,
        })

        await transporter.verify();
        
        // Send email with increased timeout
        const info = await Promise.race([
            transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: `${email}`,
                subject: `${title}`,
                html: `${body}`
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email sending timeout after 45 seconds')), 45000)
            )
        ]);
        
        logger.info("email sent: %s", info.messageId);
        return info;
    }
    catch(err){
        logger.error("Cannot send email for verification");
        logger.error("email error: %s", err.message);
        
        // More specific error handling
        if (err.code === 'ECONNREFUSED') {
            throw new Error('SMTP server connection refused. Check your email configuration.');
        } else if (err.code === 'EAUTH') {
            throw new Error('SMTP authentication failed. Check your email credentials.');
        } else if (err.message.includes('timeout')) {
            throw new Error('Email service timeout. Please try again later.');
        }
        
        throw err; // Re-throw the error so it can be handled upstream
    }
}
