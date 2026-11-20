
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/dal";
import {
  convertirFecha,
  convertirHora,
  obtenerFechaTexto,
  obtenerHoraTexto,
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

// PATCH: editar una cita o actualizar su estado
export async function PATCH(request, context) {
  try {
    const acceso = await verificarAcceso();
    if (acceso.error) return acceso.error;

    const parametros = await context.params;
    const idCita = Number(parametros.idCita);

    if (!Number.isInteger(idCita) || idCita <= 0) {
      return NextResponse.json(
        { mensaje: "El identificador de la cita no es válido." },
        { status: 400 }
      );
    }

    const citaActual = await prisma.cita.findUnique({
      where: { idCita },
    });

    if (!citaActual) {
      return NextResponse.json(
        { mensaje: "No se encontró la cita solicitada." },
        { status: 404 }
      );
    }

    const datos = await request.json();
    const actualizacion = {};

    // Fecha
    const fechaFinal = Object.hasOwn(datos, "fecha")
      ? convertirFecha(datos.fecha)
      : citaActual.fecha;

    if (Object.hasOwn(datos, "fecha") && !fechaFinal) {
      return NextResponse.json(
        { mensaje: "La fecha proporcionada no es válida." },
        { status: 400 }
      );
    }

    // Hora
    const horaFinal = Object.hasOwn(datos, "hora")
      ? convertirHora(datos.hora)
      : citaActual.hora;

    if (Object.hasOwn(datos, "hora") && !horaFinal) {
      return NextResponse.json(
        { mensaje: "La hora proporcionada no es válida." },
        { status: 400 }
      );
    }

    // Motivo
    if (Object.hasOwn(datos, "motivo")) {
      if (
        typeof datos.motivo !== "string" ||
        !datos.motivo.trim()
        ) {
        return NextResponse.json(
            { mensaje: "El motivo de la cita no es válido." },
            { status: 400 }
        );
        }

      actualizacion.motivo = datos.motivo.trim();
    }

    // Doctora
    const doctoraId = Object.hasOwn(datos, "idDoctora")
      ? Number(datos.idDoctora)
      : citaActual.idDoctora;

    if (
      Object.hasOwn(datos, "idDoctora") &&
      (!Number.isInteger(doctoraId) || doctoraId <= 0)
    ) {
      return NextResponse.json(
        { mensaje: "La doctora seleccionada no es válida." },
        { status: 400 }
      );
    }

    if (doctoraId !== citaActual.idDoctora) {
      const doctora = await prisma.doctora.findUnique({
        where: { idDoctora: doctoraId },
      });

      if (!doctora || doctora.estado !== "ACTIVO") {
        return NextResponse.json(
          { mensaje: "La doctora seleccionada no existe o está inactiva." },
          { status: 400 }
        );
      }

      actualizacion.idDoctora = doctoraId;
    }

    // Paciente
    const pacienteId = Object.hasOwn(datos, "idPaciente")
      ? Number(datos.idPaciente)
      : citaActual.idPaciente;

    if (
      Object.hasOwn(datos, "idPaciente") &&
      (!Number.isInteger(pacienteId) || pacienteId <= 0)
    ) {
      return NextResponse.json(
        { mensaje: "El paciente seleccionado no es válido." },
        { status: 400 }
      );
    }

    if (pacienteId !== citaActual.idPaciente) {
      const paciente = await prisma.paciente.findUnique({
        where: { idPaciente: pacienteId },
      });

      if (!paciente || paciente.estado !== "ACTIVO") {
        return NextResponse.json(
          { mensaje: "El paciente seleccionado no existe o está inactivo." },
          { status: 400 }
        );
      }

      actualizacion.idPaciente = pacienteId;
    }

    // Comprobar si cambió la fecha, la hora o la doctora.
    const cambioHorario =
      fechaFinal.getTime() !== citaActual.fecha.getTime() ||
      obtenerHoraTexto(horaFinal) !== obtenerHoraTexto(citaActual.hora) ||
      doctoraId !== citaActual.idDoctora;

    // Estado
    if (Object.hasOwn(datos, "estado")) {
      if (!ESTADOS_VALIDOS.includes(datos.estado)) {
        return NextResponse.json(
          { mensaje: "El estado proporcionado no es válido." },
          { status: 400 }
        );
      }

      actualizacion.estado = datos.estado;
    }

    // Si se modifica la programación, pasa a REPROGRAMADA.
    // Excepto cuando se cancela o se marca como atendida.
    if (
      cambioHorario &&
      actualizacion.estado !== "CANCELADA" &&
      actualizacion.estado !== "ATENDIDA"
    ) {
      actualizacion.estado = "REPROGRAMADA";
    }

    // Validar disponibilidad si la cita seguirá activa.
    const estadoFinal = actualizacion.estado || citaActual.estado;

    if (estadoFinal !== "CANCELADA") {
      const conflicto = await prisma.cita.findFirst({
        where: {
          idDoctora: doctoraId,
          fecha: fechaFinal,
          hora: horaFinal,
          estado: { not: "CANCELADA" },
          idCita: { not: idCita },
        },
      });

      if (conflicto) {
        return NextResponse.json(
          {
            mensaje: "La doctora ya tiene otra cita en esa fecha y hora.",
          },
          { status: 409 }
        );
      }
    }

    actualizacion.fecha = fechaFinal;
    actualizacion.hora = horaFinal;

    const citaActualizada = await prisma.cita.update({
      where: { idCita },
      data: actualizacion,
      include: {
        Paciente: true,
        Doctora: true,
      },
    });

    return NextResponse.json({
      mensaje: "La cita fue actualizada correctamente.",
      cita: citaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar cita:", error);

    return NextResponse.json(
      { mensaje: "Ocurrió un error al actualizar la cita." },
      { status: 500 }
    );
  }
}
