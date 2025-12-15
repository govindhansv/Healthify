/**
 * Cloudflare R2 Storage Client
 * Uses AWS S3 SDK for compatibility with R2's S3-compatible API
 */
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// R2 Configuration from environment variables
const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL, // Optional: custom domain or public bucket URL
} = process.env;

// Check for required configuration
const isConfigured =
    R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME;

if (!isConfigured) {
    console.warn(
        '[R2] R2 bucket env vars not fully set; R2 uploads disabled. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME'
    );
}

// Create S3-compatible client for R2
const r2Client = isConfigured
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    })
    : null;

/**
 * Upload a file to R2 bucket
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type of the file
 * @param {string} folder - Folder path in bucket (e.g., 'images', 'videos')
 * @returns {Promise<{url: string, key: string}>}
 */
async function uploadToR2(buffer, mimeType, folder = 'uploads') {
    if (!r2Client) {
        throw new Error('R2 is not configured. Check environment variables.');
    }

    // Generate unique filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = getExtensionFromMime(mimeType);
    const key = `${folder}/${Date.now()}-${hash}${ext}`;

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    });

    await r2Client.send(command);

    // Generate URL
    const url = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${key}`
        : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

    return { url, key };
}

/**
 * Delete a file from R2 bucket
 * @param {string} key - The file key (path) in the bucket
 */
async function deleteFromR2(key) {
    if (!r2Client) {
        throw new Error('R2 is not configured. Check environment variables.');
    }

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
}

/**
 * Get extension from MIME type
 */
function getExtensionFromMime(mimeType) {
    const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/quicktime': '.mov',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'application/pdf': '.pdf',
    };
    return mimeToExt[mimeType] || '';
}

module.exports = {
    r2Client,
    uploadToR2,
    deleteFromR2,
    isConfigured,
};
