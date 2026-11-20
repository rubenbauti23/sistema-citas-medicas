
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/dal";
import DashboardClient from "./DashboardClient";

function obtenerFechaBolivia() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo) =>
    Number(partes.find((parte) => parte.type === tipo).value);

  const anio = obtener("year");
  const mes = obtener("month");
  const dia = obtener("day");

  return new Date(Date.UTC(anio, mes - 1, dia));
}

function obtenerHoraBolivia() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/La_Paz",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hora = Number(
    partes.find((parte) => parte.type === "hour").value
  );

  const minuto = Number(
    partes.find((parte) => parte.type === "minute").value
  );

  return hora * 60 + minuto;
}

function convertirHora(hora) {
  return `${String(hora.getUTCHours()).padStart(2, "0")}:${String(
    hora.getUTCMinutes()
  ).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const usuario = await exigirUsuario();

  const fechaHoy = obtenerFechaBolivia();
  const minutosActuales = obtenerHoraBolivia();

  const [citasHoy, doctoras] = await Promise.all([
    prisma.cita.findMany({
      where: {
        fecha: fechaHoy,
      },
      include: {
        Paciente: true,
        Doctora: true,
      },
      orderBy: {
        hora: "asc",
      },
    }),

    prisma.doctora.findMany({
      where: {
        estado: "ACTIVO",
      },
      select: {
        idDoctora: true,
        nombre: true,
        paterno: true,
        materno: true,
      },
      orderBy: {
        nombre: "asc",
      },
    }),
  ]);

  const totalCitas = citasHoy.length;

  const pendientes = citasHoy.filter(
    (cita) =>
      cita.estado === "PROGRAMADA" ||
      cita.estado === "REPROGRAMADA"
  ).length;

  const atendidas = citasHoy.filter(
    (cita) => cita.estado === "ATENDIDA"
  ).length;

  const canceladas = citasHoy.filter(
    (cita) => cita.estado === "CANCELADA"
  ).length;

  const reprogramadas = citasHoy.filter(
    (cita) => cita.estado === "REPROGRAMADA"
  ).length;

  const citas = citasHoy.map((cita) => ({
    idCita: cita.idCita,
    hora: convertirHora(cita.hora),
    motivo: cita.motivo,
    estado: cita.estado,

    paciente: [
      cita.Paciente.nombre,
      cita.Paciente.paterno,
      cita.Paciente.materno,
    ]
      .filter(Boolean)
      .join(" "),

    doctora: [
      cita.Doctora.nombre,
      cita.Doctora.paterno,
      cita.Doctora.materno,
    ]
      .filter(Boolean)
      .join(" "),

    idDoctora: cita.idDoctora,
  }));

  const proximaCita = citas.find((cita) => {
    const [hora, minuto] = cita.hora.split(":").map(Number);
    const minutosCita = hora * 60 + minuto;

    return (
      (cita.estado === "PROGRAMADA" ||
        cita.estado === "REPROGRAMADA") &&
      minutosCita >= minutosActuales
    );
  }) || null;

  const fechaTexto = new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/La_Paz",
  }).format(new Date());

  return (
    <DashboardClient
      usuario={usuario}
      fecha={fechaTexto}
      citas={citas}
      doctoras={doctoras}
      proximaCita={proximaCita}
      estadisticas={{
        total: totalCitas,
        pendientes,
        atendidas,
        canceladas,
        reprogramadas,
      }}
    />
  );
}
