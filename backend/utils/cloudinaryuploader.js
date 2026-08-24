

const cloudinary=require("cloudinary").v2



exports.cloudinaryuploader=async (file,folder,height,quality,extraOptions={})=>{
    const options={folder,...extraOptions}
    if(height){
        options.height=height;
    }
    if(quality){
        options.quality=quality;
    }

    options.resource_type=extraOptions.resource_type || "auto";
    return await cloudinary.uploader.upload(file.tempFilePath,options)
}
