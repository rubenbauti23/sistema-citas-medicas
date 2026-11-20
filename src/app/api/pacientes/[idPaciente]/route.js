
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
    const idPaciente = Number(parametros.idPaciente);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return NextResponse.json(
        { mensaje: "El identificador del paciente no es válido." },
        { status: 400 }
      );
    }

    const pacienteExistente = await prisma.paciente.findUnique({
      where: { idPaciente },
    });

    if (!pacienteExistente) {
      return NextResponse.json(
        { mensaje: "El paciente no existe." },
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

    const pacienteActualizado = await prisma.paciente.update({
      where: { idPaciente },
      data,
    });

    return NextResponse.json({
      mensaje: "Paciente actualizado correctamente.",
      paciente: pacienteActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar paciente:", error);

    return NextResponse.json(
      { mensaje: "No se pudo actualizar el paciente." },
      { status: 500 }
    );
  }
}
