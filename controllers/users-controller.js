const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const User = require("../models/user");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Ugurcan Oruc",
    email: "test@test.com",
    password: "testers",
  },
];

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

  const createdUser = new User({
    name,
    email,
    image:
      "https://www.artmajeur.com/medias/standard/l/o/locutart/artwork/6954958_dressup247-anime-avatar.jpg",
    password,
    places: [],
  });

  try {
    await createdUser.save();
    res.status(201).send(createdUser);
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
  if (!existingUser || existingUser.password !== password) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 401)
    );
  }
  res.send(existingUser);
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
