import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_AUTH_KEY as string;

interface AuthenticatedRequest extends Request {
  user?: any;
}

function parseCookie(cookieHeader: string) {
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=").map((item) => item.trim());
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}

function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const sessionHeader = req.headers["session"];
  const tokenFromAuthHeader = authHeader?.toString().split(" ")[1];
  const tokenFromSessionHeader = sessionHeader?.toString().split(" ")[1];
  const cookieToken = parseCookie(req.headers.cookie?.toString() || "")[
    "sessionhold"
  ];
  const token = tokenFromAuthHeader || tokenFromSessionHeader || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

export default authenticateToken;
