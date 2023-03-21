const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require("fs");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  try {
    const place = await Place.findById(placeId);
    if (!place) {
      return next(
        HttpError("Could not found a place for the provided id.", 404)
      );
    }
    res.send(place.toObject({ getters: true }));
  } catch (error) {
    return next(
      new HttpError(
        "Something went wrong, could not find place for the provided id.",
        500
      )
    );
  }
};

const getUserPlacesById = async (req, res, next) => {
  const userId = req.params.uid;
  try {
    const user = await User.findById(userId).populate("places");
    if (user.places.length === 0) {
      return next(
        new HttpError("Could not find places for the provided user id.", 404)
      );
    }
    res.send(user.places);
  } catch (error) {
    return next(new HttpError("Fetching places by id failed, try again.", 500));
  }
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send(errors);
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    return next(
      new HttpError(
        "Creating place failed while fetching creator. Please try again.",
        500
      )
    );
  }

  if (!user) {
    return next(new HttpError("Creator is not find.", 404));
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Creating place failed, please try again.", 500));
  }
  res.status(201).send(createdPlace);
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send(errors);
  }

  try {
    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place = await Place.findById(placeId);

    if (place.creator.toString() !== req.userData.userId) {
      return next(
        new HttpError("You are not allowed to edit this place.", 401)
      );
    }

    place.title = title;
    place.description = description;
    await place.save();

    res.status(200).send(place);
  } catch (error) {
    return next(
      new HttpError("Something went wrong while updating place.", 500)
    );
  }
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    return next(
      new HttpError("Something went wrong while deleting place.", 500)
    );
  }

  if (!place) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to edit this place.", 403));
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Removing place is failed. Try again.", 500));
  }

  fs.unlink(imagePath, () => {
    console.log(`${imagePath} deleting failed.`);
  });

  return res.status(200).send({ message: "Deleted place" });
};

exports.getPlaceById = getPlaceById;
exports.getUserPlacesById = getUserPlacesById;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
