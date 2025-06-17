// lib/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

export function generateToken(payload: object, expiresIn = 7) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn,
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
