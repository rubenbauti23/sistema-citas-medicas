
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";

export const runtime = "nodejs";

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

// GET: listar doctoras.
export async function GET() {
  try {
    const acceso = await verificarAcceso();

    if (!acceso.autorizado) return acceso.respuesta;

    const doctoras = await prisma.doctora.findMany({
      orderBy: {
        idDoctora: "desc",
      },
    });

    return NextResponse.json({ doctoras });
  } catch (error) {
    console.error("Error al obtener doctoras:", error);

    return NextResponse.json(
      { mensaje: "No se pudieron obtener las doctoras." },
      { status: 500 }
    );
  }
}

// POST: registrar doctora.
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

    const numeroCelular =
      typeof datos.numeroCelular === "string"
        ? datos.numeroCelular.trim()
        : "";

    if (
      !nombre ||
      !paterno ||
      !materno ||
      !numeroCelular ||
      nombre.length > 50 ||
      paterno.length > 50 ||
      materno.length > 50 ||
      numeroCelular.length > 20
    ) {
      return NextResponse.json(
        {
          mensaje:
            "Completa todos los campos. Los nombres y apellidos admiten hasta 50 caracteres y el celular hasta 20.",
        },
        { status: 400 }
      );
    }

    const nuevaDoctora = await prisma.doctora.create({
      data: {
        nombre,
        paterno,
        materno,
        numeroCelular,
        estado: "ACTIVO",
      },
    });

    return NextResponse.json(
      {
        mensaje: "Doctora registrada correctamente.",
        doctora: nuevaDoctora,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar doctora:", error);

    return NextResponse.json(
      { mensaje: "No se pudo registrar la doctora." },
      { status: 500 }
    );
  }
}
