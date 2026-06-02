import bcrypt from "bcryptjs";
import { getAuth } from "firebase-admin/auth";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";

// Handles local and Firebase-based authentication flows.
const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

const firebaseSchema = z.object({
  idToken: z.string().min(20)
});

// Creates the signed session token returned by auth endpoints.
function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Creates a local email/password account.
export async function signup(req, res, next) {
  try {
    const input = signupSchema.parse(req.body);
    const exists = await User.findOne({ email: input.email.toLowerCase() });

    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      authProvider: "local"
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Validates local credentials and returns a session token.
export async function login(req, res, next) {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Use Google sign-in for this account" });
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}

// Exchanges a Firebase ID token for an app session token.
export async function firebaseAuth(req, res, next) {
  try {
    const { idToken } = firebaseSchema.parse(req.body);

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    if (!decodedToken.email || !decodedToken.uid) {
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    const email = decodedToken.email.toLowerCase();
    const name = (decodedToken.name || decodedToken.email.split("@")[0] || "Traveler").trim();
    const avatarUrl = decodedToken.picture || "";

    let user = await User.findOne({ email });

    if (!user) {
      // Omit passwordHash for social/Firebase users so validators don't enforce local-password rules
      user = await User.create({
        name,
        email,
        authProvider: "firebase",
        googleId: decodedToken.uid,
        avatarUrl
      });
    } else {
      user.authProvider = "firebase";
      if (!user.name || !user.name.trim()) user.name = name;
      user.googleId = user.googleId || decodedToken.uid;
      if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || "Invalid input" });
    }
    return next(error);
  }
}
