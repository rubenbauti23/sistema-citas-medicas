
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";

export const runtime = "nodejs";

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

// PATCH: editar los datos de un usuario.
export async function PATCH(request, context) {
  try {
    const acceso = await verificarAdministrador();

    if (!acceso.autorizado) return acceso.respuesta;

    // En Next.js actual, params es una promesa.
    const parametros = await context.params;
    const idUsuario = Number(parametros.idUsuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json(
        { mensaje: "El identificador del usuario no es válido." },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { idUsuario },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { mensaje: "El usuario que intentas modificar no existe." },
        { status: 404 }
      );
    }

    const datos = await request.json();
    const data = {};

    // Nombre.
    if (Object.hasOwn(datos, "nombre")) {
      const nombre =
        typeof datos.nombre === "string" ? datos.nombre.trim() : "";

      if (!nombre || nombre.length > 100) {
        return NextResponse.json(
          { mensaje: "El nombre es obligatorio y no debe superar los 100 caracteres." },
          { status: 400 }
        );
      }

      data.nombre = nombre;
    }

    // Nombre de usuario.
    if (Object.hasOwn(datos, "usuario")) {
      const usuario =
        typeof datos.usuario === "string"
          ? datos.usuario.trim().toLowerCase()
          : "";

      if (!usuario || usuario.length > 50) {
        return NextResponse.json(
          { mensaje: "El nombre de usuario es obligatorio y no debe superar los 50 caracteres." },
          { status: 400 }
        );
      }

      data.usuario = usuario;
    }

    // Rol.
    if (Object.hasOwn(datos, "rol")) {
      if (!["ADMINISTRADOR", "SECRETARIA"].includes(datos.rol)) {
        return NextResponse.json(
          { mensaje: "El rol seleccionado no es válido." },
          { status: 400 }
        );
      }

      data.rol = datos.rol;
    }

    // Estado.
    if (Object.hasOwn(datos, "estado")) {
      if (!["ACTIVO", "INACTIVO"].includes(datos.estado)) {
        return NextResponse.json(
          { mensaje: "El estado seleccionado no es válido." },
          { status: 400 }
        );
      }

      data.estado = datos.estado;
    }

    // Contraseña opcional.
    if (Object.hasOwn(datos, "password")) {
      const password = datos.password;

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

      data.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { mensaje: "No se recibieron datos para actualizar." },
        { status: 400 }
      );
    }

    // Evitar que el administrador cierre su propio acceso administrativo.
    const esMiCuenta = idUsuario === acceso.usuario.idUsuario;
    const nuevoRol = data.rol ?? usuarioExistente.rol;
    const nuevoEstado = data.estado ?? usuarioExistente.estado;

    if (
      esMiCuenta &&
      (nuevoRol !== "ADMINISTRADOR" || nuevoEstado !== "ACTIVO")
    ) {
      return NextResponse.json(
        { mensaje: "No puedes quitarte tu propio rol de administrador ni desactivar tu cuenta." },
        { status: 400 }
      );
    }

    // No permitir que el sistema se quede sin administradores activos.
    const dejaDeSerAdminActivo =
      usuarioExistente.rol === "ADMINISTRADOR" &&
      usuarioExistente.estado === "ACTIVO" &&
      (nuevoRol !== "ADMINISTRADOR" || nuevoEstado !== "ACTIVO");

    if (dejaDeSerAdminActivo) {
      const otrosAdministradores = await prisma.usuario.count({
        where: {
          rol: "ADMINISTRADOR",
          estado: "ACTIVO",
          NOT: { idUsuario },
        },
      });

      if (otrosAdministradores === 0) {
        return NextResponse.json(
          { mensaje: "No puedes desactivar o cambiar el rol del último administrador activo." },
          { status: 400 }
        );
      }
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { idUsuario },
      data,
      select: {
        idUsuario: true,
        nombre: true,
        usuario: true,
        rol: true,
        estado: true,
      },
    });

    return NextResponse.json({
      mensaje: "Usuario actualizado correctamente.",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { mensaje: "Ese nombre de usuario ya está registrado." },
        { status: 409 }
      );
    }

    console.error("Error al actualizar usuario:", error);

    return NextResponse.json(
      { mensaje: "No se pudo actualizar el usuario." },
      { status: 500 }
    );
  }
}
