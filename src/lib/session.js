
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const NOMBRE_COOKIE = "medagenda_session";
const DURACION_SESION = 60 * 60; // 1 hora 

function obtenerClave() {
  const secreto = process.env.SESSION_SECRET;

  if (!secreto || secreto.length < 32) {
    throw new Error(
      "SESSION_SECRET no está configurada correctamente."
    );
  }

  return new TextEncoder().encode(secreto);
}

// Crear una sesión para el usuario autenticado.
export async function crearSesion(idUsuario) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(idUsuario))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(obtenerClave());

  const cookieStore = await cookies();

  cookieStore.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION,
  });
}

// Obtener y verificar la sesión actual.
export async function obtenerSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      obtenerClave(),
      {
        algorithms: ["HS256"],
      }
    );

    const idUsuario = Number(payload.sub);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return null;
    }

    return { idUsuario };
  } catch {
    return null;
  }
}

// Cerrar la sesión.
export async function eliminarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(NOMBRE_COOKIE);
}
