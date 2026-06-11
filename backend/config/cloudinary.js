const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration is automatically picked up from process.env.CLOUDINARY_URL
// If not present, we can explicitly configure it, but the URL is best practice.

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studypilot_syllabuses',
    format: async (req, file) => 'pdf', // supports promises as well
    resource_type: 'raw', // Crucial for PDFs in Cloudinary
  },
});

const uploadCloud = multer({ storage: storage });

module.exports = { cloudinary, uploadCloud };
