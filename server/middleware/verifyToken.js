const { createRemoteJWKSet, jwtVerify } = require("jose");

const jwks = createRemoteJWKSet(new URL(process.env.CLERK_JWKS_URL));

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
    const { payload } = await jwtVerify(token, jwks, {
      issuer: process.env.CLERK_ISSUER,
    });
    req.user = payload;
    next();
  } catch (err) {
    console.log("Token verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
