const logger=require("../utils/logger");

const sendSms=async (to,body)=>{
    const accountSid=process.env.TWILIO_ACCOUNT_SID;
    const authToken=process.env.TWILIO_AUTH_TOKEN;
    const from=process.env.TWILIO_PHONE_NUMBER;
    if(!accountSid || !authToken || !from){
        const error=new Error("SMS verification is not configured");
        error.code="SMS_NOT_CONFIGURED";
        throw error;
    }

    const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,{
        method:"POST",
        headers:{
            Authorization:`Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type":"application/x-www-form-urlencoded",
        },
        body:new URLSearchParams({To:to,From:from,Body:body}),
    });
    if(!response.ok){
        const providerResponse=await response.text();
        logger.error("SMS provider rejected the verification message: %s",providerResponse.slice(0,500));
        throw new Error("Could not send the verification code");
    }
};

module.exports={sendSms};
