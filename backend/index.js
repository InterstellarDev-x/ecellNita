const express=require("express");
const app=express();
require("dotenv").config();
const logger=require("./utils/logger");
const PORT= process.env.PORT ?? 4000
const cors=require("cors");
const fileupload=require("express-fileupload");
const cookieparser=require("cookie-parser");
const {databaseConnect}=require("./config/ConnectToDatabase");
const {cloudinaryConnect}=require("./config/ConnectToCloudinary");
//
const authroutes=require("./routes/auth");
const userroutes=require("./routes/user");
const productroutes=require("./routes/product");
const categoryroutes=require("./routes/category");
const conversationroutes=require("./routes/conversation");
const transactionroutes=require("./routes/checktransaction");
const ratingandreviewsroutes=require("./routes/ratingandreviews");
//

logger.info("Frontend URL: %s", process.env.HOST);

// HTTP request logger
app.use((req, _res, next) => {
    logger.debug("%s %s", req.method, req.url);
    next();
});

// Add request timeout middleware
app.use((req, res, next) => {
    // Set timeout to 60 seconds for all requests
    req.setTimeout(60000, () => {
        res.status(408).json({
            success: false,
            message: "Request timeout"
        });
    });
    next();
});

app.use(express.json())
app.use(cookieparser());
const allowedOrigins = process.env.HOST
    ? process.env.HOST.split(",").map(o => o.trim())
    : ["http://localhost:3000"];

app.use(cors())
app.use(fileupload({
    useTempFiles:true,
    tempFileDir:'/tmp/',
}))
databaseConnect();
cloudinaryConnect();
//
app.use("/api/v1/auth",authroutes);
app.use("/api/v1/user",userroutes);
app.use("/api/v1/product",productroutes);
app.use("/api/v1/category",categoryroutes);
app.use("/api/v1/conversation",conversationroutes);
app.use("/api/v1/transaction",transactionroutes);
app.use("/api/v1/ratingandreviews", ratingandreviewsroutes);

//
app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"Server is Up and Running.....",
    })
})

// Health check endpoint for Render
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString()
    });
});


if (process.env.VERCEL !== "1") {
    app.listen(PORT,()=>{
        logger.info("server running on port %d", PORT);
    })
}

module.exports = app;