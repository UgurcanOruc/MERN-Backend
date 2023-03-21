const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const _tokenSecret = process.env["JWT_TOKEN_SECRET"];
const _tokenExpireTime = process.env["JWT_TOKEN_EXPIRE_TIME"];

const getUsers = async (req, res, next) => {
  const users = await User.find({}, "-password");
  res.send(users);
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send(errors);
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(
      new HttpError("Signing upfailed, please try again later.", 500)
    );
  }

  if (existingUser) {
    return next(new HttpError("User exists already, plese login instead", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }
  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();

    let token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      _tokenSecret,
      { expiresIn: _tokenExpireTime }
    );

    res.status(201).send({ userId: createdUser.id, email: createdUser.email, token });
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Login failed, please try again later.", 500));
  }
  if (!existingUser) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 401)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    return next(
      new HttpError(
        "Could not log you in, please chck your credentıals and try again.",
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 401)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      _tokenSecret,
      { expiresIn: _tokenExpireTime }
    );
  } catch (error) {
    return next(
      new HttpError("Fail to log you in, please try again.", 401)
    );
  }

  res.send({ userId: existingUser.id, email: existingUser.email, token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
