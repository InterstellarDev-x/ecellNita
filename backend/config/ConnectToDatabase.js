const mongoose=require("mongoose");
const logger=require("../utils/logger");
const {seedCategories}=require("./SeedCategories");
require("dotenv").config();

exports.databaseConnect=async ()=>{
   await mongoose.connect(process.env.MONGODB_URL,{
       useNewUrlParser:true,
       useUnifiedTopology:true,
   })
   .then(async ()=>{
       logger.info("database connection successful");
       await seedCategories();
   })
   .catch((err)=>{
       logger.error("database connection failed", err);
       process.exit(1);
   })
}