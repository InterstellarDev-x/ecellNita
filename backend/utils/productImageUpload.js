const PRODUCT_IMAGE_TRANSFORMATION = [{
    width: 1600,
    height: 1600,
    crop: "limit",
    quality: "auto:good",
}];

const productImageUploadOptions = (extraOptions = {}) => ({
    resource_type: "image",
    transformation: PRODUCT_IMAGE_TRANSFORMATION,
    ...extraOptions,
});

module.exports = { PRODUCT_IMAGE_TRANSFORMATION, productImageUploadOptions };
