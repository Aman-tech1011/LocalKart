const fs = require('fs/promises');
const path = require('path');

const detectImageExtension = async (filePath) => {
  const file = await fs.open(filePath, 'r');
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await file.read(header, 0, header.length, 0);

    if (bytesRead >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return '.jpg';
    if (bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
    if (
      bytesRead >= 12
      && header.toString('ascii', 0, 4) === 'RIFF'
      && header.toString('ascii', 8, 12) === 'WEBP'
    ) return '.webp';

    return null;
  } finally {
    await file.close();
  }
};

const removeUploadedFiles = async (files) => {
  await Promise.all(files.map(async (file) => {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }));
};

const validateUploadedImages = async (req, res, next) => {
  const files = req.files || [];

  try {
    for (const file of files) {
      const extension = await detectImageExtension(file.path);
      if (!extension) {
        await removeUploadedFiles(files);
        return res.status(400).json({ message: 'Every upload must be a valid JPG, PNG, or WEBP image.' });
      }

      const filename = `${path.parse(file.filename).name}${extension}`;
      const filePath = path.join(path.dirname(file.path), filename);
      if (filePath !== file.path) {
        await fs.rename(file.path, filePath);
        file.filename = filename;
        file.path = filePath;
      }
    }

    return next();
  } catch (error) {
    try {
      await removeUploadedFiles(files);
    } catch (cleanupError) {
      return next(cleanupError);
    }
    return next(error);
  }
};

module.exports = validateUploadedImages;
