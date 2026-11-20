
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";
import {
  convertirFecha,
  convertirHora,
} from "@/lib/validaciones-citas";

const ESTADOS_VALIDOS = [
  "PROGRAMADA",
  "REPROGRAMADA",
  "CANCELADA",
  "ATENDIDA",
];

async function verificarAcceso() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return {
      error: NextResponse.json(
        { mensaje: "No tienes autorización para realizar esta acción." },
        { status: 401 }
      ),
    };
  }

  return { usuario };
}

// GET: consultar citas
export async function GET(request) {
  try {
    const acceso = await verificarAcceso();
    if (acceso.error) return acceso.error;

    const { searchParams } = new URL(request.url);

    const fecha = searchParams.get("fecha");
    const estado = searchParams.get("estado");
    const idDoctora = searchParams.get("idDoctora");
    const buscar = searchParams.get("buscar")?.trim();

    const filtros = {};

    if (fecha) {
      const fechaConvertida = convertirFecha(fecha);

      if (!fechaConvertida) {
        return NextResponse.json(
          { mensaje: "La fecha proporcionada no es válida." },
          { status: 400 }
        );
      }

      filtros.fecha = fechaConvertida;
    }

    if (estado) {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return NextResponse.json(
          { mensaje: "El estado proporcionado no es válido." },
          { status: 400 }
        );
      }

      filtros.estado = estado;
    }

    if (idDoctora) {
      const id = Number(idDoctora);

      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
          { mensaje: "El identificador de la doctora no es válido." },
          { status: 400 }
        );
      }

      filtros.idDoctora = id;
    }

    if (buscar) {
      filtros.OR = [
        {
          Paciente: {
            nombre: { contains: buscar, mode: "insensitive" },
          },
        },
        {
          Paciente: {
            paterno: { contains: buscar, mode: "insensitive" },
          },
        },
        {
          Paciente: {
            materno: { contains: buscar, mode: "insensitive" },
          },
        },
        {
          Doctora: {
            nombre: { contains: buscar, mode: "insensitive" },
          },
        },
        {
          Doctora: {
            paterno: { contains: buscar, mode: "insensitive" },
          },
        },
      ];
    }

    const citas = await prisma.cita.findMany({
      where: filtros,
      include: {
        Paciente: {
          select: {
            idPaciente: true,
            nombre: true,
            paterno: true,
            materno: true,
            estado: true,
          },
        },
        Doctora: {
          select: {
            idDoctora: true,
            nombre: true,
            paterno: true,
            materno: true,
            numeroCelular: true,
            estado: true,
          },
        },
      },
      orderBy: [
        { fecha: "asc" },
        { hora: "asc" },
      ],
    });

    return NextResponse.json({ citas });
  } catch (error) {
    console.error("Error al consultar citas:", error);

    return NextResponse.json(
      { mensaje: "Ocurrió un error al consultar las citas." },
      { status: 500 }
    );
  }
}

// POST: registrar una cita
export async function POST(request) {
  try {
    const acceso = await verificarAcceso();
    if (acceso.error) return acceso.error;

    const datos = await request.json();

    const {
      fecha,
      hora,
      motivo,
      idDoctora,
      idPaciente,
    } = datos;

    if (!fecha || !hora || !motivo?.trim() || !idDoctora || !idPaciente) {
      return NextResponse.json(
        { mensaje: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    if (
        typeof motivo !== "string" ||
        !motivo.trim()
    ) {
    return NextResponse.json(
        { mensaje: "El motivo de la cita es obligatorio." },
        { status: 400 }
    );
    }

    const fechaConvertida = convertirFecha(fecha);
    const horaConvertida = convertirHora(hora);

    if (!fechaConvertida || !horaConvertida) {
      return NextResponse.json(
        { mensaje: "La fecha o la hora proporcionada no es válida." },
        { status: 400 }
      );
    }

    const doctoraId = Number(idDoctora);
    const pacienteId = Number(idPaciente);

    if (
      !Number.isInteger(doctoraId) || doctoraId <= 0 ||
      !Number.isInteger(pacienteId) || pacienteId <= 0
    ) {
      return NextResponse.json(
        { mensaje: "El paciente o la doctora seleccionados no son válidos." },
        { status: 400 }
      );
    }

    const [doctora, paciente] = await Promise.all([
      prisma.doctora.findUnique({
        where: { idDoctora: doctoraId },
      }),
      prisma.paciente.findUnique({
        where: { idPaciente: pacienteId },
      }),
    ]);

    if (!doctora || doctora.estado !== "ACTIVO") {
      return NextResponse.json(
        { mensaje: "La doctora seleccionada no existe o está inactiva." },
        { status: 400 }
      );
    }

    if (!paciente || paciente.estado !== "ACTIVO") {
      return NextResponse.json(
        { mensaje: "El paciente seleccionado no existe o está inactivo." },
        { status: 400 }
      );
    }

    // Comprobar que la doctora no tenga otra cita en ese horario.
    const citaExistente = await prisma.cita.findFirst({
      where: {
        idDoctora: doctoraId,
        fecha: fechaConvertida,
        hora: horaConvertida,
        estado: {
          not: "CANCELADA",
        },
      },
    });

    if (citaExistente) {
      return NextResponse.json(
        {
          mensaje: "La doctora ya tiene una cita programada en esa fecha y hora.",
        },
        { status: 409 }
      );
    }

    const nuevaCita = await prisma.cita.create({
      data: {
        fecha: fechaConvertida,
        hora: horaConvertida,
        motivo: motivo.trim(),
        idDoctora: doctoraId,
        idPaciente: pacienteId,
        estado: "PROGRAMADA",
      },
      include: {
        Paciente: true,
        Doctora: true,
      },
    });

    return NextResponse.json(
      {
        mensaje: "La cita fue registrada correctamente.",
        cita: nuevaCita,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar cita:", error);

    return NextResponse.json(
      { mensaje: "Ocurrió un error al registrar la cita." },
      { status: 500 }
    );
  }
}
