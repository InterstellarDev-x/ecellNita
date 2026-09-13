const CHAT_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CHAT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const CHAT_IMAGE_TRANSFORMATION = [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good" }];
const fs = require("node:fs/promises");

const validateChatImage = (file) => {
    if (!file || Array.isArray(file)) throw Object.assign(new Error("Upload exactly one image"), { status: 400 });
    if (!CHAT_IMAGE_MIME_TYPES.has(file.mimetype)) throw Object.assign(new Error("Images must be JPG, PNG, or WebP"), { status: 400 });
    if (!file.size || file.size > CHAT_IMAGE_MAX_BYTES || !file.tempFilePath) throw Object.assign(new Error("Image must be smaller than 3MB"), { status: 400 });
    return file;
};

const validateChatImageContent = async (file) => {
    const handle = await fs.open(file.tempFilePath, "r");
    try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        const jpeg = bytesRead >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
        const png = bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        const webp = bytesRead >= 12 && header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
        const expected = file.mimetype === "image/jpeg" ? jpeg : file.mimetype === "image/png" ? png : webp;
        if (!expected) throw Object.assign(new Error("Image content does not match its file type"), { status: 400 });
        return file;
    } finally { await handle.close(); }
};

module.exports = { CHAT_IMAGE_MAX_BYTES, CHAT_IMAGE_TRANSFORMATION, validateChatImage, validateChatImageContent };
