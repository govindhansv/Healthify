const express = require('express');
const multer = require('multer');
const cloudinary = require('../lib/cloudinary');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/uploads/image
// field name: file
router.post('/image', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'healthify',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Image upload failed' });
        }

        return res.status(201).json({
          url: result.secure_url || result.url,
          public_id: result.public_id,
        });
      },
    );

    stream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
