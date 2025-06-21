const cloudinary = require('cloudinary');
const streamifier = require('streamifier');
const fs = require('fs').promises; // Sử dụng fs.promises để đọc file bất đồng bộ
const dotenv = require('dotenv');

dotenv.config();

// Sử dụng v2 của Cloudinary
const cloudinaryV2 = cloudinary.v2;
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Hàm upload buffer lên Cloudinary
const uploadToCloudinary = (buffer, folderName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) {
          console.error('Upload error:', error);
          reject(error);
        } else {
          console.log(`Upload success - Public ID: ${result.public_id}, URL: ${result.secure_url}`);
          resolve(result.secure_url); // Trả về URL để sử dụng
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Hàm upload từ file (tùy chọn, nếu cần đọc từ đĩa)
const uploadFileToCloudinary = async (filePath, folderName) => {
  try {
    const buffer = await fs.readFile(filePath);
    return await uploadToCloudinary(buffer, folderName);
  } catch (err) {
    console.error('Error reading file:', err);
    throw err;
  }
};

module.exports = {
  CloudinaryProvider: {
    uploadToCloudinary,
    uploadFileToCloudinary,
  },
};