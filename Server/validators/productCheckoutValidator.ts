import { checkSchema } from "express-validator";
import type { Location } from "express-validator";

const idBody = {
  in: ["body"] as Location[],
  isInt: true,
  toInt: true,
  isLength: { options: { min: 1, max: 10 } },
  notEmpty: true,
  trim: true,
};

const idParam = {
  in: ["params"] as Location[],
  isInt: true,
  toInt: true,
  isLength: { options: { min: 1, max: 15 } },
  notEmpty: true,
  trim: true,
};

const orderCreationSchema = checkSchema({
  userid: { ...idBody, errorMessage: "The userID must be provided" },
  productid: { ...idBody, errorMessage: "The productid must be provided correctly" },
  colorid: { ...idBody, errorMessage: "The colorid must be provided correctly" },
  sizeid: { ...idBody, errorMessage: "The sizeid must be provided correctly" },
  quantity: {
    in: ["body"] as Location[],
    optional: true,
    isInt: { options: { min: 1, max: 999 } },
    toInt: true,
  },
});

const orderCreationSchema2 = checkSchema({
  userid: { ...idBody, errorMessage: "The userID must be provided" },
  productid: { ...idBody, errorMessage: "The productid must be provided correctly" },
  colorid: { ...idBody, errorMessage: "The colorid must be provided correctly" },
  sizeid: { ...idBody, errorMessage: "The sizeid must be provided correctly" },
  quantity: {
    in: ["body"] as Location[],
    optional: true,
    isInt: { options: { min: 1, max: 999 } },
    toInt: true,
  },
  paymentMethod: {
    in: ["body"] as Location[],
    optional: true,
    isString: true,
    isLength: { options: { min: 1, max: 100 } },
    trim: true,
    escape: true,
  },
});

const OrderIDSchema = checkSchema({
  orderID: { ...idParam, errorMessage: "The orderID must be provided correctly" },
});

const checkoutSchema = checkSchema({
  productid: { ...idParam, errorMessage: "The productid must be provided correctly" },
  sizeid: { ...idParam, errorMessage: "The sizeid must be provided correctly" },
  colorid: { ...idParam, errorMessage: "The colorid must be provided correctly" },
});

const createPaymentIntent = checkSchema({
  item: { ...idBody, errorMessage: "The productid must be provided correctly" },
  userID: { ...idBody, errorMessage: "The userID must be provided" },
});

export { orderCreationSchema, orderCreationSchema2, checkoutSchema, OrderIDSchema, createPaymentIntent };
