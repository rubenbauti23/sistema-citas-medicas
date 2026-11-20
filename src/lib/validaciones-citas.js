
export function convertirFecha(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    resultado.getUTCFullYear() !== anio ||
    resultado.getUTCMonth() !== mes - 1 ||
    resultado.getUTCDate() !== dia
  ) {
    return null;
  }

  return resultado;
}

export function convertirHora(hora) {
  if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return null;
  }

  return new Date(`1970-01-01T${hora}:00.000Z`);
}

export function obtenerFechaTexto(fecha) {
  return fecha.toISOString().slice(0, 10);
}

export function obtenerHoraTexto(hora) {
  return `${String(hora.getUTCHours()).padStart(2, "0")}:${String(
    hora.getUTCMinutes()
  ).padStart(2, "0")}`;
}
