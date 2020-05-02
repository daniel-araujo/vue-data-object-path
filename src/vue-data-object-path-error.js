/**
 * Base class for every documented error thrown from this module.
 */
exports.VueDataObjectPathError = class VueDataObjectPathError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VueDataObjectPathError';
  }
}