import { checkSchema } from "express-validator";

const orderCreationSchema = checkSchema({
  userid: {
    in: ["body"],
    errorMessage: "The userid must be provided",
    isInt: true,
    toInt: true,
    notEmpty: true,
  },
  productid: {
    in: ["body"],
    errorMessage: "The productid must be provided",
    isInt: true,
    toInt: true,
    notEmpty: true,
  },
  quantity: {
    in: ["body"],
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    toInt: true,
  },
});

const orderCreationSchema2 = checkSchema({
  userid: {
    in: ["body"],
    errorMessage: "The userid must be provided",
    isInt: true,
    toInt: true,
    notEmpty: true,
  },
  productid: {
    in: ["body"],
    errorMessage: "The productid must be provided",
    isInt: true,
    toInt: true,
    notEmpty: true,
  },
  quantity: {
    in: ["body"],
    optional: true,
    isInt: {
      options: { min: 1 },
    },
    toInt: true,
  },
  paymentMethod: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
  },
});

const checkoutSchema = checkSchema({
  productid: {
    in: ["params"],
    errorMessage: "The productid must be provided",
    isInt: true,
    toInt: true,
    notEmpty: true,
  },
});

const OrderIDSchema = checkSchema({
  orderID: {
    in: ["params"],
    errorMessage: "The orderID must be provided",
    isInt: true,
    toInt: true,
    notEmpty: true,
  },
});

export { orderCreationSchema, orderCreationSchema2, checkoutSchema, OrderIDSchema };
