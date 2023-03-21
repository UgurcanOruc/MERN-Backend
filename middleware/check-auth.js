const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

const _tokenSecret = process.env["JWT_TOKEN_SECRET"];

module.exports = (req, res, next) => {
if (req.method === 'OPTIONS') {
    return next();
}
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed.");
    }
    const decodedToken = jwt.verify(token, _tokenSecret);
    req.userData = {
      userId: decodedToken.userId,
    };
    next();
  } catch (error) {
    return next(new HttpError("Token could not found.", 403));
  }
};
