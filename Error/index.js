const customAPIError = require("./CustomAPIError");
const NotFoundError = require("./not-found");
const BadRequestError = require("./BadRequest");
const UnauthenticatedError = require("./Unauthanticated");

module.exports = {
  customAPIError,
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
};
