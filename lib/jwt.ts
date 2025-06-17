// lib/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';
console.log(JWT_SECRET);

export function generateToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET , {
    expiresIn:"7d"
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET , {
    maxAge:"7d"
  });
}
