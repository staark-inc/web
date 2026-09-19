import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "staark_hub_session";

const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 zile

type SessionPayload = {
  userId: string;
  email: string;
  role: "ADMIN";
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

/**
 * Hash pentru parola administratorului.
 */
export async function hashPassword(
  password: string
): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifică parola introdusă cu hash-ul din DB.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Creează JWT-ul folosit pentru sesiunea Hub.
 */
export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

/**
 * Salvează sesiunea într-un cookie HttpOnly.
 */
export async function createSession(
  payload: SessionPayload
) {
  const token = await createSessionToken(payload);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

/**
 * Verifică și decodează un JWT.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSecret()
    );

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      payload.role !== "ADMIN"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: "ADMIN",
    };
  } catch {
    return null;
  }
}

/**
 * Returnează sesiunea curentă.
 */
export async function getSession(): Promise<
  SessionPayload | null
> {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE
  )?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Șterge sesiunea la logout.
 */
export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}