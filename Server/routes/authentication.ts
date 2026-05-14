import express, { Request, Response } from "express";
import { client } from "../data/DB";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { googleAuth } from "../controller/auth-controller";
import {
  signInSchema,
  signUpSchema,
  tokenSchema,
  googleAuthSchema,
  googleAuthSchemaNative,
} from "../validators/authenticationValidation";
import { matchedData, validationResult } from "express-validator";

const saltRounds = 10;
const router = express.Router();
const userTable = "users";
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;
const JWT_EXPIRATION = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_ENCRYPTION_KEY environment variable is not set");
}

interface JwtPayload {
  userID: number;
  iat: number;
  exp: number;
}

const makeUserData = (user: any) => ({
  userName: user.fullname ?? user.username ?? user.userName,
  userID: user.userid,
  email: user.email,
  mobile_number: user.mobile_number,
  dob: user.dateofbirth ?? user.dob,
  role: user.role ?? "customer",
  isverified: user.isverified ?? true,
});

router.post(
  "/user/signup/:promotional",
  signUpSchema,
  async (req: Request, res: Response) => {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
      return res.status(400).json({
        message: "Validation error",
        errors: validation.array(),
      });
    }

    const data = matchedData(req);
    const userID = Math.round(Math.random() * 1000 * 1000 * 1000);
    const creationIP = req.ip ?? "::1";
    const { userName, email, password, mobile_number, dob, promotional } = data;
    const dbPromotional = promotional !== "false";

    try {
      const checkQuery = `
        SELECT userid, email, mobile_number
        FROM public."${userTable}"
        WHERE email = $1 OR mobile_number = $2;
      `;
      const checkResult = await client.query(checkQuery, [
        email,
        mobile_number,
      ]);

      if (checkResult.rows.length > 0) {
        return res.status(409).json({
          error: "Email hoặc số điện thoại đã tồn tại",
        });
      }

      const hash = await bcrypt.hash(password, saltRounds);

      // Database lego4.sql dùng các cột:
      // userid, fullname, email, password, mobile_number, dateofbirth,
      // registrationip, role, createdat, updatedat, lastloginip, isverified
      const insertQuery = `
  INSERT INTO public."${userTable}" (
      userid,
      username,
      email,
      password,
      mobile_number,
      dob,
      creation_ip,
      role,
      update_ip,
      promotional
  )
  VALUES (
      $1, $2, $3, $4, $5,
      $6, $7::inet, 'customer', $8, $9
  )
  RETURNING *;
`;

const insertValues = [
  userID,
  userName,
  email,
  hash,
  mobile_number,
  dob,
  creationIP,
  creationIP,
  dbPromotional,
];
      const insertResult = await client.query(insertQuery, insertValues);
      const user = insertResult.rows[0];

      const token = jwt.sign(
        { userID: user.userid, role: user.role ?? "customer" },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION },
      );

      return res.status(201).json({
        message: "User registered successfully",
        token,
        userData: makeUserData(user),
        promotional: dbPromotional,
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      return res.status(500).json({
        error: "Server error",
        detail: error?.message,
      });
    }
  },
);

router.post(
  "/user/signin/:remember",
  signInSchema,
  async (req: Request, res: Response) => {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
      return res
        .status(400)
        .json({ error: "Validation Error", errors: validation.array() });
    }

    const { email, password, remember } = matchedData(req);

    try {
      const query = `SELECT * FROM public."${userTable}" WHERE email = $1;`;
      const result = await client.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Email does not exist" });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      const expiresIn = remember !== "false" ? JWT_EXPIRATION : "1d";
      const token = jwt.sign(
        { userID: user.userid, role: user.role ?? "customer" },
        JWT_SECRET,
        { expiresIn },
      );

      return res.status(200).json({
        message: "Sign-in successful",
        token,
        userData: makeUserData(user),
      });
    } catch (error: any) {
      console.error("Signin error:", error);
      return res
        .status(500)
        .json({ error: "Server error", detail: error?.message });
    }
  },
);

router.post(
  "/user/session-check",
  tokenSchema,
  async (req: Request, res: Response) => {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: validation.array() });
    }

    const { token } = matchedData(req);

    try {
      const decodedJWT = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const userID = decodedJWT.userID;
      const query = `SELECT * FROM public."${userTable}" WHERE userid = $1;`;
      const result = await client.query(query, [userID]);
      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Sign-in successful",
        userData: makeUserData(user),
      });
    } catch (error: any) {
      console.error("Session check error:", error);
      return res
        .status(500)
        .json({ message: "Internal Server Error", detail: error?.message });
    }
  },
);

router.post(
  "/auth/google",
  googleAuthSchema,
  async (req: Request, res: Response) => {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: validation.array() });
    }

    const { code } = matchedData(req);

    try {
      const user = await googleAuth(code);
      if (!user) {
        return res.status(404).json({ error: "Email does not exist" });
      }

      const token = jwt.sign(
        { userID: user.userid, role: user.role ?? "customer" },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION },
      );

      return res.status(200).json({
        message: "Sign-in successful",
        token,
        userData: makeUserData(user),
      });
    } catch (error: any) {
      console.error("Google auth error:", error);
      return res
        .status(500)
        .json({ message: "Server Error", detail: error?.message });
    }
  },
);

router.post(
  "/native/auth/google",
  googleAuthSchemaNative,
  async (req: Request, res: Response) => {
    const validation = validationResult(req);

    if (!validation.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: validation.array() });
    }

    const { email } = matchedData(req);

    try {
      const query = `SELECT * FROM public."${userTable}" WHERE email = $1;`;
      const result = await client.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Email does not exist" });
      }

      const user = result.rows[0];
      const token = jwt.sign(
        { userID: user.userid, role: user.role ?? "customer" },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION },
      );

      return res.status(200).json({
        message: "Sign-in successful",
        token,
        userData: makeUserData(user),
      });
    } catch (error: any) {
      console.error("Native google auth error:", error);
      return res
        .status(500)
        .json({ message: "Server Error", detail: error?.message });
    }
  },
);

export default router;
