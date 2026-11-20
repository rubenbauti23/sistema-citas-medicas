
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";

export const runtime = "nodejs";

// Comprueba que exista un usuario autenticado.
async function verificarAcceso() {
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

  return { autorizado: true, usuario };
}

// GET: obtener pacientes.
export async function GET() {
  try {
    const acceso = await verificarAcceso();

    if (!acceso.autorizado) return acceso.respuesta;

    const pacientes = await prisma.paciente.findMany({
      orderBy: {
        idPaciente: "desc",
      },
    });

    return NextResponse.json({ pacientes });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);

    return NextResponse.json(
      { mensaje: "No se pudieron obtener los pacientes." },
      { status: 500 }
    );
  }
}

// POST: registrar paciente.
export async function POST(request) {
  try {
    const acceso = await verificarAcceso();

    if (!acceso.autorizado) return acceso.respuesta;

    const datos = await request.json();

    const nombre =
      typeof datos.nombre === "string" ? datos.nombre.trim() : "";

    const paterno =
      typeof datos.paterno === "string" ? datos.paterno.trim() : "";

    const materno =
      typeof datos.materno === "string" ? datos.materno.trim() : "";

    if (
      !nombre ||
      !paterno ||
      !materno ||
      nombre.length > 50 ||
      paterno.length > 50 ||
      materno.length > 50
    ) {
      return NextResponse.json(
        {
          mensaje:
            "Debes completar los nombres y apellidos. Cada campo admite hasta 50 caracteres.",
        },
        { status: 400 }
      );
    }

    const nuevoPaciente = await prisma.paciente.create({
      data: {
        nombre,
        paterno,
        materno,
        estado: "ACTIVO",
      },
    });

    return NextResponse.json(
      {
        mensaje: "Paciente registrado correctamente.",
        paciente: nuevoPaciente,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar paciente:", error);

    return NextResponse.json(
      { mensaje: "No se pudo registrar el paciente." },
      { status: 500 }
    );
  }
}
