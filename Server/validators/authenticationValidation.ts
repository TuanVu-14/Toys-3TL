import { checkSchema } from "express-validator";

const signUpSchema = checkSchema(
  {
    userName: {
      errorMessage: "Tên người dùng phải từ 4 đến 64 ký tự",
      isLength: { options: { min: 4, max: 64 } },
      escape: true,
      notEmpty: true,
      isString: true,
      trim: true,
    },
    email: {
      errorMessage: "Email không hợp lệ",
      isLength: { options: { min: 5, max: 128 } },
      escape: true,
      isEmail: { bail: true },
      matches: { options: /[@]/ },
      notEmpty: true,
      isString: true,
      trim: true,
    },
    password: {
      errorMessage: "Mật khẩu phải từ 6 đến 32 ký tự",
      isLength: { options: { min: 6, max: 32 } },
      escape: true,
      notEmpty: true,
      isString: true,
      trim: true,
    },
    mobile_number: {
      errorMessage: "Số điện thoại phải có đúng 10 chữ số",
      isLength: { options: { min: 10, max: 10 } },
      escape: true,
      notEmpty: true,
      isInt: true,
      trim: true,
    },
    dob: {
      errorMessage: "Ngày sinh phải có dạng YYYY-MM-DD",
      isLength: { options: { min: 10, max: 10 } },
      matches: { options: /^\d{4}-\d{2}-\d{2}$/ },
      escape: true,
      notEmpty: true,
      isString: true,
      isDate: true,
      trim: true,
    },
    promotional: {
      errorMessage: "Tham số promotional phải là true hoặc false",
      notEmpty: { bail: true },
      escape: true,
      isString: true,
      isIn: { options: [["true", "false"]] },
      trim: true,
    },
  },
  ["body", "params"],
);

const signInSchema = checkSchema(
  {
    email: {
      errorMessage: "Email không hợp lệ",
      escape: true,
      isLength: { options: { min: 5, max: 128 } },
      isEmail: { bail: true },
      matches: { options: /[@]/ },
      notEmpty: true,
      isString: true,
      trim: true,
    },
    password: {
      errorMessage: "Mật khẩu phải từ 6 đến 32 ký tự",
      isLength: { options: { min: 6, max: 32 } },
      escape: true,
      notEmpty: true,
      isString: true,
      trim: true,
    },
    remember: {
      errorMessage: "Tham số remember phải là true hoặc false",
      notEmpty: { bail: true },
      escape: true,
      isString: true,
      isIn: { options: [["true", "false"]] },
      trim: true,
    },
  },
  ["body", "params"],
);

const tokenSchema = checkSchema(
  {
    token: {
      errorMessage: "The token must be provided",
      notEmpty: { bail: true },
      isJWT: { bail: true },
      escape: true,
    },
  },
  ["body"],
);

const googleAuthSchema = checkSchema(
  {
    code: {
      errorMessage: "The code must be provided",
      isString: true,
      exists: true,
      trim: true,
    },
  },
  ["body"],
);

const googleAuthSchemaNative = checkSchema(
  {
    email: {
      errorMessage: "The email must be provided",
      isString: true,
      exists: true,
      trim: true,
      isEmail: true,
      matches: { options: /[@]/ },
    },
  },
  ["body"],
);

export {
  signInSchema,
  signUpSchema,
  tokenSchema,
  googleAuthSchema,
  googleAuthSchemaNative,
};
