
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const doctoras = await prisma.doctora.findMany({
      select: {
        idDoctora: true,
        nombre: true,
        paterno: true,
        materno: true,
        estado: true,
      },
    });

    return Response.json({
      success: true,
      mensaje: "Conexión con Neon exitosa",
      total: doctoras.length,
      doctoras: doctoras,
    });

  } catch (error) {
    console.error("Error al consultar doctoras:", error);

    return Response.json(
      {
        success: false,
        mensaje: "No se pudo consultar la base de datos",
      },
      { status: 500 }
    );
  }
}
