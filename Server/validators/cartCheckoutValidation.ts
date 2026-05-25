import { checkSchema } from "express-validator";

const userIDSchema = checkSchema(
  {
    userID: {
      errorMessage: "The userID must be provided",
      isInt: true,
      toInt: true,
      isLength: { options: { min: 1, max: 10 } },
      notEmpty: true,
      trim: true,
    },
  },
  ["body", "params"],
);

const paymentCreationSchema = checkSchema(
  {
    userID: {
      errorMessage: "The userID must be provided",
      isInt: true,
      toInt: true,
      isLength: { options: { min: 1, max: 10 } },
      notEmpty: true,
      trim: true,
    },
    paymentMethod: {
      errorMessage: "The payment method must be provided correctly",
      optional: true,
      isString: true,
      isLength: { options: { min: 1, max: 100 } },
      trim: true,
      escape: true,
    },
  },
  ["body"],
);

export { userIDSchema, paymentCreationSchema };
