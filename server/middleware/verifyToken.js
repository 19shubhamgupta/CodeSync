import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "../models/user.js";

let jwks;

const getJwks = () => {
  if (jwks) {
    return jwks;
  }

  if (!process.env.CLERK_JWKS_URL) {
    throw new Error("Missing CLERK_JWKS_URL in environment.");
  }

  jwks = createRemoteJWKSet(new URL(process.env.CLERK_JWKS_URL));
  return jwks;
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers["authorization"];
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    if (!process.env.CLERK_ISSUER) {
      throw new Error("Missing CLERK_ISSUER in environment.");
    }

    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: process.env.CLERK_ISSUER,
      clockTolerance: 60,
    });

    const user = await User.findOne({ clrek_user_id: payload.sub });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      ...payload,
      mongoId: user._id,
    };

    console.log("Token verified successfully for user:", payload.sub);
    next();
  } catch (err) {
    console.log("Token verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default verifyToken;
