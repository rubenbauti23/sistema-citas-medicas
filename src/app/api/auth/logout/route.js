
import { NextResponse } from "next/server";
import { eliminarSesion } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await eliminarSesion();

    return NextResponse.json({
      mensaje: "Sesión cerrada correctamente.",
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);

    return NextResponse.json(
      { mensaje: "No se pudo cerrar la sesión." },
      { status: 500 }
    );
  }
}
