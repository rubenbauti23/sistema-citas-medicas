
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const estados = {
  PROGRAMADA: "Programada",
  REPROGRAMADA: "Reprogramada",
  CANCELADA: "Cancelada",
  ATENDIDA: "Atendida",
};

export default function DashboardClient({
  usuario,
  fecha,
  citas,
  doctoras,
  proximaCita,
  estadisticas,
}) {
  const router = useRouter();
  const [filtroDoctora, setFiltroDoctora] = useState("TODAS");
  const [actualizando, iniciarActualizacion] = useTransition();

  const citasFiltradas = useMemo(() => {
    if (filtroDoctora === "TODAS") return citas;

    return citas.filter(
      (cita) => cita.idDoctora === Number(filtroDoctora)
    );
  }, [citas, filtroDoctora]);

  const nombre = usuario.nombre?.trim().split(" ")[0] || "Usuario";

  const saludo = (() => {
    const hora = Number(
      new Intl.DateTimeFormat("es-BO", {
        timeZone: "America/La_Paz",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date())
    );

    if (hora < 12) return "¡Buenos días";
    if (hora < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  })();

  function actualizarDashboard() {
    iniciarActualizacion(() => {
      router.refresh();
    });
  }

  function obtenerEstado(estado) {
    return styles[`estado${estado.charAt(0) + estado.slice(1).toLowerCase()}`];
  }

  return (
    <div className={styles.dashboard}>
      {/* ENCABEZADO */}
      <section className={styles.encabezado}>
        <div>
          <span className={styles.fecha}>{fecha}</span>

          <h1>
            {saludo}, {nombre}!
          </h1>

          <p>
            Este es el resumen de actividad del consultorio.
          </p>
        </div>

        <div className={styles.accionesEncabezado}>
          <button
            type="button"
            className={styles.botonActualizar}
            onClick={actualizarDashboard}
            disabled={actualizando}
          >
            <span className={actualizando ? styles.girando : ""}>↻</span>
            {actualizando ? "Actualizando..." : "Actualizar"}
          </button>

          <Link
            href="/dashboard/citas"
            className={styles.botonNuevaCita}
          >
            <span>+</span>
            Nueva cita
          </Link>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className={styles.estadisticas}>
        <article className={styles.tarjeta}>
          <div className={styles.tarjetaSuperior}>
            <span>Citas de hoy</span>
            <div className={`${styles.iconoTarjeta} ${styles.verde}`}>
              ▦
            </div>
          </div>
          <strong className={styles.cantidad}>
            {estadisticas.total}
          </strong>
          <span className={styles.descripcion}>
            Total de citas registradas para hoy
          </span>
        </article>

        <article className={styles.tarjeta}>
          <div className={styles.tarjetaSuperior}>
            <span>Por atender</span>
            <div className={`${styles.iconoTarjeta} ${styles.azul}`}>
              ◷
            </div>
          </div>
          <strong className={styles.cantidad}>
            {estadisticas.pendientes}
          </strong>
          <span className={styles.descripcion}>
            Citas programadas y reprogramadas
          </span>
        </article>

        <article className={styles.tarjeta}>
          <div className={styles.tarjetaSuperior}>
            <span>Atendidas</span>
            <div className={`${styles.iconoTarjeta} ${styles.naranja}`}>
              ✓
            </div>
          </div>
          <strong className={styles.cantidad}>
            {estadisticas.atendidas}
          </strong>
          <span className={styles.descripcion}>
            Consultas completadas hoy
          </span>
        </article>

        <article className={styles.tarjeta}>
          <div className={styles.tarjetaSuperior}>
            <span>Canceladas</span>
            <div className={`${styles.iconoTarjeta} ${styles.rojo}`}>
              ×
            </div>
          </div>
          <strong className={styles.cantidad}>
            {estadisticas.canceladas}
          </strong>
          <span className={styles.descripcion}>
            Citas canceladas durante el día
          </span>
        </article>
      </section>

      {/* PRÓXIMA CITA */}
      <section className={styles.proximaSeccion}>
        <div className={styles.proximaIcono}>◷</div>

        <div className={styles.proximaInformacion}>
          <span className={styles.proximaEtiqueta}>
            PRÓXIMA CITA PENDIENTE
          </span>

          {proximaCita ? (
            <>
              <h2>{proximaCita.paciente}</h2>
              <p>
                Dra. {proximaCita.doctora} · {proximaCita.motivo}
              </p>
            </>
          ) : (
            <>
              <h2>No hay citas próximas</h2>
              <p>
                No tienes consultas pendientes para el resto del día.
              </p>
            </>
          )}
        </div>

        {proximaCita && (
          <div className={styles.proximaHora}>
            <span>Hora</span>
            <strong>{proximaCita.hora}</strong>
          </div>
        )}
      </section>

      {/* AGENDA */}
      <section className={styles.seccionAgenda}>
        <div className={styles.encabezadoSeccion}>
          <div>
            <h2>Agenda del día</h2>
            <p>
              Consulta y organiza las citas programadas para hoy.
            </p>
          </div>

          <Link
            href="/dashboard/citas"
            className={styles.verTodo}
          >
            Gestionar agenda →
          </Link>
        </div>

        <div className={styles.controlesAgenda}>
          <div className={styles.resumenAgenda}>
            <span className={styles.puntoVerde}></span>
            {citasFiltradas.length}{" "}
            {citasFiltradas.length === 1 ? "cita encontrada" : "citas encontradas"}
          </div>

          <select
            className={styles.filtroDoctora}
            value={filtroDoctora}
            onChange={(e) => setFiltroDoctora(e.target.value)}
          >
            <option value="TODAS">Todas las doctoras</option>

            {doctoras.map((doctora) => (
              <option
                key={doctora.idDoctora}
                value={doctora.idDoctora}
              >
                Dra. {doctora.nombre} {doctora.paterno}
              </option>
            ))}
          </select>
        </div>

        {citasFiltradas.length > 0 ? (
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Doctora</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {citasFiltradas.map((cita) => (
                  <tr key={cita.idCita}>
                    <td className={styles.hora}>
                      {cita.hora}
                    </td>

                    <td className={styles.paciente}>
                      {cita.paciente}
                    </td>

                    <td>Dra. {cita.doctora}</td>

                    <td className={styles.motivo}>
                      {cita.motivo}
                    </td>

                    <td>
                      <span
                        className={`${styles.insigniaEstado} ${obtenerEstado(cita.estado)}`}
                      >
                        {estados[cita.estado] || cita.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.estadoVacio}>
            <div>▦</div>
            <h3>No hay citas para mostrar</h3>
            <p>
              {filtroDoctora === "TODAS"
                ? "Todavía no se registraron citas para hoy."
                : "La doctora seleccionada no tiene citas registradas para hoy."}
            </p>

            <Link
              href="/dashboard/citas"
              className={styles.botonVacio}
            >
              Registrar una cita
            </Link>
          </div>
        )}

        {estadisticas.reprogramadas > 0 && (
          <div className={styles.avisoReprogramadas}>
            <span>↻</span>
            Hay {estadisticas.reprogramadas}{" "}
            {estadisticas.reprogramadas === 1
              ? "cita reprogramada"
              : "citas reprogramadas"}{" "}
            para hoy.
          </div>
        )}
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className={styles.accesosRapidos}>
        <div className={styles.encabezadoAccesos}>
          <h2>Accesos rápidos</h2>
          <p>Gestiona fácilmente la información del consultorio.</p>
        </div>

        <div className={styles.gridAccesos}>
          <Link href="/dashboard/citas" className={styles.acceso}>
            <span className={`${styles.accesoIcono} ${styles.iconoCita}`}>
              +
            </span>
            <div>
              <strong>Registrar cita</strong>
              <span>Agendar una nueva consulta</span>
            </div>
            <b>→</b>
          </Link>

          <Link href="/dashboard/pacientes" className={styles.acceso}>
            <span className={`${styles.accesoIcono} ${styles.iconoPaciente}`}>
              ♙
            </span>
            <div>
              <strong>Pacientes</strong>
              <span>Consultar y registrar pacientes</span>
            </div>
            <b>→</b>
          </Link>

          <Link href="/dashboard/doctoras" className={styles.acceso}>
            <span className={`${styles.accesoIcono} ${styles.iconoDoctora}`}>
              ♡
            </span>
            <div>
              <strong>Doctoras</strong>
              <span>Consultar el personal médico</span>
            </div>
            <b>→</b>
          </Link>
        </div>
      </section>

      {/* PIE */}
      <section className={styles.pieDashboard}>
        <div>
          <strong>MedAgenda</strong>
          <p>Gestión sencilla y organizada de tus citas médicas.</p>
        </div>
        <span>Panel de gestión · {usuario.rol}</span>
      </section>
    </div>
  );
}
