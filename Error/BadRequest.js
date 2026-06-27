const CustomAPIError = require("./CustomAPIError");
const { StatusCodes } = require("http-status-codes");
class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message || "Bad Request");
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
