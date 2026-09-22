const multer = require('multer');
const ApiError = require('../utils/apiError');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Images are held in memory so sharp can resize them before anything touches disk.
const image = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (request, file, done) => {
    if (file.mimetype.startsWith('image/')) return done(null, true);
    done(new ApiError(400, 'Only image files are allowed'));
  },
});

// Wraps multer so its errors flow through the normal error handler.
exports.singleImage = (field) => (request, response, next) =>
  image.single(field)(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new ApiError(400, error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : error.message));
    }
    next(error);
  });
