const multer = require('multer');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;

// SDK reads AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY from process env automatically
const s3 = new S3Client({ region: REGION });

// Custom multer storage engine — uploads directly to S3.
// Sets file.filename = S3 key so all controllers work unchanged
// (they call getFileUrl(req.file.filename, req) which expects a key string).
const s3Storage = {
  _handleFile(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    // Buffer into memory before uploading (safe: 5 MB limit enforced below).
    // Streaming with Body: file.stream requires ContentLength upfront — buffering avoids that.
    const chunks = [];
    file.stream.on('data', (chunk) => chunks.push(chunk));
    file.stream.on('error', cb);
    file.stream.on('end', async () => {
      const body = Buffer.concat(chunks);
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: file.mimetype,
          })
        );
        cb(null, { filename: key, size: body.length });
      } catch (err) {
        cb(err);
      }
    });
  },

  _removeFile(_req, _file, cb) {
    cb(null);
  },
};

const upload = multer({
  storage: s3Storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// The `req` parameter is kept to match the existing call signature used by all
// controllers. It is intentionally unused — the S3 URL is self-contained.
const getFileUrl = (filename, _req) =>
  `https://${BUCKET}.s3.${REGION}.amazonaws.com/${filename}`;

module.exports = { upload, getFileUrl };
