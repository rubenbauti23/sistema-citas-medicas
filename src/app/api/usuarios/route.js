
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";

export const runtime = "nodejs";

// Verifica que la solicitud pertenezca a un administrador.
async function verificarAdministrador() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return {
      autorizado: false,
      respuesta: NextResponse.json(
        { mensaje: "Debes iniciar sesión." },
        { status: 401 }
      ),
    };
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    return {
      autorizado: false,
      respuesta: NextResponse.json(
        { mensaje: "No tienes permisos para realizar esta acción." },
        { status: 403 }
      ),
    };
  }

  return { autorizado: true, usuario };
}

// GET: listar usuarios.
export async function GET() {
  try {
    const acceso = await verificarAdministrador();

    if (!acceso.autorizado) return acceso.respuesta;

    const usuarios = await prisma.usuario.findMany({
      select: {
        idUsuario: true,
        nombre: true,
        usuario: true,
        rol: true,
        estado: true,
      },
      orderBy: {
        idUsuario: "desc",
      },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error("Error al listar usuarios:", error);

    return NextResponse.json(
      { mensaje: "No se pudieron obtener los usuarios." },
      { status: 500 }
    );
  }
}

// POST: registrar un usuario.
export async function POST(request) {
  try {
    const acceso = await verificarAdministrador();

    if (!acceso.autorizado) return acceso.respuesta;

    const datos = await request.json();

    const nombre =
      typeof datos.nombre === "string" ? datos.nombre.trim() : "";

    const usuario =
      typeof datos.usuario === "string"
        ? datos.usuario.trim().toLowerCase()
        : "";

    const password = datos.password;
    const rol = datos.rol;

    if (!nombre || nombre.length > 100) {
      return NextResponse.json(
        { mensaje: "El nombre es obligatorio y no debe superar los 100 caracteres." },
        { status: 400 }
      );
    }

    if (!usuario || usuario.length > 50) {
      return NextResponse.json(
        { mensaje: "El nombre de usuario es obligatorio y no debe superar los 50 caracteres." },
        { status: 400 }
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        { mensaje: "La contraseña debe tener al menos 8 caracteres y no superar los 72 bytes." },
        { status: 400 }
      );
    }

    if (!["ADMINISTRADOR", "SECRETARIA"].includes(rol)) {
      return NextResponse.json(
        { mensaje: "El rol seleccionado no es válido." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        usuario,
        passwordHash,
        rol,
        estado: "ACTIVO",
      },
      select: {
        idUsuario: true,
        nombre: true,
        usuario: true,
        rol: true,
        estado: true,
      },
    });

    return NextResponse.json(
      {
        mensaje: "Usuario registrado correctamente.",
        usuario: nuevoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { mensaje: "Ese nombre de usuario ya está registrado." },
        { status: 409 }
      );
    }

    console.error("Error al registrar usuario:", error);

    return NextResponse.json(
      { mensaje: "No se pudo registrar el usuario." },
      { status: 500 }
    );
  }
}
