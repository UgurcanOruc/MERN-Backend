const express = require("express");
const { check } = require("express-validator");
const fileUpload = require('../middleware/file-upload');

const placesController = require("../controllers/places-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:pid", placesController.getPlaceById);

router.get("/user/:uid", placesController.getUserPlacesById);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single('image'),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesController.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesController.updatePlace
);

router.delete("/:pid", placesController.deletePlace);

module.exports = router;
