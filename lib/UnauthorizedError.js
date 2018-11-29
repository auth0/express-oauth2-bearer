function UnauthorizedError (code, message) {
  this.name = "UnauthorizedError";
  this.message = message;
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.code = code;
  this.status = 401;
}

UnauthorizedError.prototype = Object.create(Error.prototype);
UnauthorizedError.prototype.constructor = UnauthorizedError;

module.exports = UnauthorizedError;
