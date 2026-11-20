
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { crearSesion } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const datos = await request.json();

    const usuario = datos.usuario?.trim().toLowerCase();
    const password = datos.password;

    if (
      typeof usuario !== "string" ||
      typeof password !== "string" ||
      !usuario ||
      !password ||
      usuario.length > 50 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { mensaje: "Usuario o contraseña incorrectos." },
        { status: 401 } //401 es para indicar que no está autorizado, es más seguro que 400 (bad request) para no dar pistas a un atacante.
      );
    }

    // Buscar el usuario en la base de datos.
    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: {
        usuario,
      },
    });

    // Comprobar que exista y esté activo.
    if (
      !usuarioEncontrado ||
      usuarioEncontrado.estado !== "ACTIVO"
    ) {
      return NextResponse.json(
        { mensaje: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // Comparar la contraseña con el hash almacenado.
    const passwordValida = await bcrypt.compare(
      password,
      usuarioEncontrado.passwordHash
    );

    if (!passwordValida) {
      return NextResponse.json(
        { mensaje: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // Crear la sesión.
    await crearSesion(usuarioEncontrado.idUsuario);

    // Devolver solamente información segura.
    return NextResponse.json({
      mensaje: "Inicio de sesión exitoso.",
      usuario: {
        idUsuario: usuarioEncontrado.idUsuario,
        nombre: usuarioEncontrado.nombre,
        usuario: usuarioEncontrado.usuario,
        rol: usuarioEncontrado.rol,
      },
    });
  } catch (error) {
    console.error("Error en inicio de sesión:", error);

    return NextResponse.json(
      { mensaje: "Ocurrió un error al iniciar sesión." },
      { status: 500 }
    );
  }
}
