const express = require('express');
const multer = require('multer');
const cloudinary = require('../lib/cloudinary');
const { uploadToR2, isConfigured: r2Configured } = require('../lib/r2');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

const router = express.Router();

// Configure multer with file size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
  },
});

/**
 * POST /api/uploads/image
 * Upload an image file. Uses R2 if configured, otherwise Cloudinary.
 */
router.post('/image', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if R2 is configured and use it
    if (r2Configured) {
      const result = await uploadToR2(req.file.buffer, req.file.mimetype, 'images');
      return res.status(201).json({
        url: result.url,
        key: result.key,
        storage: 'r2',
      });
    }

    // Fallback to Cloudinary
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
          storage: 'cloudinary',
        });
      },
    );

    stream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/uploads/video
 * Upload a video file. Uses R2 if configured, otherwise Cloudinary.
 */
router.post('/video', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if R2 is configured and use it
    if (r2Configured) {
      const result = await uploadToR2(req.file.buffer, req.file.mimetype, 'videos');
      return res.status(201).json({
        url: result.url,
        key: result.key,
        storage: 'r2',
      });
    }

    // Fallback to Cloudinary for videos
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'healthify/videos',
        resource_type: 'video',
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary video upload error:', error);
          return res.status(500).json({ error: 'Video upload failed' });
        }

        return res.status(201).json({
          url: result.secure_url || result.url,
          public_id: result.public_id,
          storage: 'cloudinary',
        });
      },
    );

    stream.end(req.file.buffer);
  } catch (err) {
    console.error('Video upload route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/uploads/storage-info
 * Get info about configured storage provider
 */
router.get('/storage-info', protect, isAdmin, (req, res) => {
  res.json({
    r2Configured,
    cloudinaryConfigured: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
    preferredStorage: r2Configured ? 'r2' : 'cloudinary',
  });
});

module.exports = router;

