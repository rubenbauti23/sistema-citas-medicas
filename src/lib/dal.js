//DATA ACCESS LAYER, este archivo es para poder indentificar que tipo de usuario es el que esta logueado y 
// poder hacer las consultas a la base de datos de manera mas sencilla, sin tener que estar haciendo consultas 
// complejas en cada endpoint.


import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/session";

// Obtener el usuario autenticado y comprobar que siga activo.
export async function obtenerUsuarioActual() {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
    where: {
      idUsuario: sesion.idUsuario,
    },
    select: {
      idUsuario: true,
      nombre: true,
      usuario: true,
      rol: true,
      estado: true,
    },
  });

  if (!usuario || usuario.estado !== "ACTIVO") {
    return null;
  }

  return usuario;
}

// Exigir que exista una sesión válida.
export async function exigirUsuario() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  return usuario;
}

// Exigir que el usuario tenga rol de administrador.
export async function exigirAdministrador() {
  const usuario = await exigirUsuario();

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/dashboard");
  }

  return usuario;
}
