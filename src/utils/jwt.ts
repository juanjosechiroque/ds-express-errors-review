import jwt from "jsonwebtoken";
const { sign, verify } = jwt;

import { JWT_SECRET, JWT_EXPIRATION_TIME } from "../config.js";

export type JwtPayload = {
    sub: string;
    email: string;
};

export const generateToken = (payload: JwtPayload): string => {
    return sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION_TIME as NonNullable<jwt.SignOptions["expiresIn"]>,
        algorithm: "HS256",
    });
};

export const verifyToken = (token: string): JwtPayload => {
   return verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
};
