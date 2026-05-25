import { checkSchema } from "express-validator";

const productIDSchema = checkSchema({
  productID: {
    in: ["params"],
    errorMessage: "The productid must be provided correctly",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
});

const createReviewSchema = checkSchema({
  userID: {
    in: ["body"],
    errorMessage: "The userID must be provided",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    isNumeric: true,
    trim: true,
    escape: true,
  },
  productID: {
    in: ["body"],
    errorMessage: "The productid must be provided correctly",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
  rating: {
    in: ["body"],
    isFloat: true,
    toFloat: true,
    errorMessage: "Rating must be between 1 and 5",
    custom: {
      options: (value) => Number(value) >= 1 && Number(value) <= 5,
      errorMessage: "Rating must be between 1 and 5",
    },
  },
  title: {
    in: ["body"],
    isString: true,
    notEmpty: true,
    trim: true,
    isLength: { options: { min: 2, max: 50 } },
    escape: true,
    errorMessage: "Title must be between 2 and 50 characters",
  },
  comment: {
    in: ["body"],
    isString: true,
    notEmpty: true,
    trim: true,
    isLength: { options: { min: 2, max: 500 } },
    escape: true,
    errorMessage: "Comment must be between 2 and 500 characters",
  },
});

const editReviewSchema = checkSchema({
  reviewID: {
    in: ["body"],
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
  userID: {
    in: ["body"],
    errorMessage: "The userID must be provided",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    isNumeric: true,
    trim: true,
    escape: true,
  },
  productID: {
    in: ["body"],
    errorMessage: "The productid must be provided correctly",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
  rating: {
    in: ["body"],
    isFloat: true,
    toFloat: true,
    errorMessage: "Rating must be between 1 and 5",
    custom: {
      options: (value) => Number(value) >= 1 && Number(value) <= 5,
      errorMessage: "Rating must be between 1 and 5",
    },
  },
  title: {
    in: ["body"],
    isString: true,
    notEmpty: true,
    trim: true,
    isLength: { options: { min: 2, max: 50 } },
    errorMessage: "Title must be between 2 and 50 characters",
    escape: true,
  },
  comment: {
    in: ["body"],
    isString: true,
    notEmpty: true,
    trim: true,
    isLength: { options: { min: 2, max: 500 } },
    errorMessage: "Comment must be between 2 and 500 characters",
    escape: true,
  },
});

const deleteReviewSchema = checkSchema({
  reviewID: {
    in: ["body"],
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
  userID: {
    in: ["body"],
    errorMessage: "The userID must be provided",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    isNumeric: true,
    trim: true,
    escape: true,
  },
  productID: {
    in: ["body"],
    errorMessage: "The productid must be provided correctly",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
});

const getReviewSchema = checkSchema({
  productID: {
    in: ["params"],
    errorMessage: "The productid must be provided correctly",
    isInt: true,
    toInt: true,
    isLength: { options: { min: 1, max: 10 } },
    notEmpty: true,
    trim: true,
    escape: true,
  },
});

export {
  getReviewSchema,
  deleteReviewSchema,
  editReviewSchema,
  createReviewSchema,
  productIDSchema,
};
