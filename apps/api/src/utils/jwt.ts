import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function signAccessToken(payload: { userId: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string; iat: number; exp: number };
}