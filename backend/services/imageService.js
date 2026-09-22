const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const config = require('../config');
const ApiError = require('../utils/apiError');

const AVATAR_SIZE = 256;

// Resizes an uploaded image to a square WebP avatar and returns its public URL path.
exports.saveAvatar = async (buffer, userId) => {
  const dir = path.join(config.uploadsDir, 'avatars');
  const fileName = `${userId}-${Date.now()}.webp`;
  await fs.mkdir(dir, { recursive: true });

  try {
    await sharp(buffer)
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
      .webp({ quality: 82 })
      .toFile(path.join(dir, fileName));
  } catch (error) {
    throw new ApiError(400, 'The uploaded file is not a valid image');
  }
  return `/uploads/avatars/${fileName}`;
};

exports.removeUpload = async (publicPath) => {
  if (!publicPath?.startsWith('/uploads/')) return;
  await fs.rm(path.join(config.uploadsDir, publicPath.slice('/uploads/'.length)), { force: true });
};
