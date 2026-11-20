
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";

export const runtime = "nodejs";

export async function PATCH(request, context) {
  try {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
      return NextResponse.json(
        { mensaje: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const parametros = await context.params;
    const idDoctora = Number(parametros.idDoctora);

    if (!Number.isInteger(idDoctora) || idDoctora <= 0) {
      return NextResponse.json(
        { mensaje: "El identificador de la doctora no es válido." },
        { status: 400 }
      );
    }

    const doctoraExistente = await prisma.doctora.findUnique({
      where: { idDoctora },
    });

    if (!doctoraExistente) {
      return NextResponse.json(
        { mensaje: "La doctora no existe." },
        { status: 404 }
      );
    }

    const datos = await request.json();
    const data = {};

    if (Object.hasOwn(datos, "nombre")) {
      const nombre =
        typeof datos.nombre === "string" ? datos.nombre.trim() : "";

      if (!nombre || nombre.length > 50) {
        return NextResponse.json(
          { mensaje: "El nombre es obligatorio y admite hasta 50 caracteres." },
          { status: 400 }
        );
      }

      data.nombre = nombre;
    }

    if (Object.hasOwn(datos, "paterno")) {
      const paterno =
        typeof datos.paterno === "string" ? datos.paterno.trim() : "";

      if (!paterno || paterno.length > 50) {
        return NextResponse.json(
          { mensaje: "El apellido paterno es obligatorio y admite hasta 50 caracteres." },
          { status: 400 }
        );
      }

      data.paterno = paterno;
    }

    if (Object.hasOwn(datos, "materno")) {
      const materno =
        typeof datos.materno === "string" ? datos.materno.trim() : "";

      if (!materno || materno.length > 50) {
        return NextResponse.json(
          { mensaje: "El apellido materno es obligatorio y admite hasta 50 caracteres." },
          { status: 400 }
        );
      }

      data.materno = materno;
    }

    if (Object.hasOwn(datos, "numeroCelular")) {
      const numeroCelular =
        typeof datos.numeroCelular === "string"
          ? datos.numeroCelular.trim()
          : "";

      if (!numeroCelular || numeroCelular.length > 20) {
        return NextResponse.json(
          { mensaje: "El número celular es obligatorio y admite hasta 20 caracteres." },
          { status: 400 }
        );
      }

      data.numeroCelular = numeroCelular;
    }

    if (Object.hasOwn(datos, "estado")) {
      if (!["ACTIVO", "INACTIVO"].includes(datos.estado)) {
        return NextResponse.json(
          { mensaje: "El estado seleccionado no es válido." },
          { status: 400 }
        );
      }

      data.estado = datos.estado;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { mensaje: "No se recibieron datos para actualizar." },
        { status: 400 }
      );
    }

    const doctoraActualizada = await prisma.doctora.update({
      where: { idDoctora },
      data,
    });

    return NextResponse.json({
      mensaje: "Doctora actualizada correctamente.",
      doctora: doctoraActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar doctora:", error);

    return NextResponse.json(
      { mensaje: "No se pudo actualizar la doctora." },
      { status: 500 }
    );
  }
}
