// lib/jwt.js
const jwt = require('jsonwebtoken');

function signToken(payload = {}, secret, expiresIn = '7d') {
  if (!secret) throw new Error('JWT_SECRET required');
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token, secret) {
  if (!secret) throw new Error('JWT_SECRET required');
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
