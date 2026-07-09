/**
 * Storage abstraction layer.
 *
 * All file operations go through this module. The active driver is selected
 * from the STORAGE_DRIVER env var. Business logic never imports multer or
 * the local disk path directly — only this module does.
 *
 * To swap in S3 later: implement the same interface in ./drivers/s3.js and
 * set STORAGE_DRIVER=s3 in the environment.
 */

const driver = process.env.STORAGE_DRIVER || 'local';

let impl;
if (driver === 'local') {
  impl = require('./drivers/local');
} else {
  throw new Error(`Unknown STORAGE_DRIVER: "${driver}". Supported: local`);
}

module.exports = impl;
