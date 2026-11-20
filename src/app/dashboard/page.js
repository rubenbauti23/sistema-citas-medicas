
import Link from "next/link";
import styles from "./page.module.css";

const estadisticas = [
  {
    titulo: "Citas de hoy",
    cantidad: "12",
    descripcion: "Total de citas registradas",
    icono: "▦",
    color: "verde",
  },
  {
    titulo: "Programadas",
    cantidad: "28",
    descripcion: "Citas pendientes de atención",
    icono: "◷",
    color: "azul",
  },
  {
    titulo: "Atendidas",
    cantidad: "08",
    descripcion: "Consultas completadas",
    icono: "✓",
    color: "naranja",
  },
  {
    titulo: "Canceladas",
    cantidad: "02",
    descripcion: "Citas canceladas",
    icono: "×",
    color: "rojo",
  },
];

const citas = [
  {
    hora: "09:00",
    paciente: "María Fernández",
    doctora: "Dra. Andrea López",
    estado: "PROGRAMADA",
  },
  {
    hora: "10:30",
    paciente: "Carlos Mendoza",
    doctora: "Dra. Gabriela Rojas",
    estado: "PROGRAMADA",
  },
  {
    hora: "11:30",
    paciente: "Lucía Vargas",
    doctora: "Dra. Andrea López",
    estado: "ATENDIDA",
  },
  {
    hora: "14:00",
    paciente: "Pedro Salinas",
    doctora: "Dra. Gabriela Rojas",
    estado: "PROGRAMADA",
  },
];

export default function DashboardPage() {
  const fecha = new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/La_Paz",
  }).format(new Date());

  return (
    <div className={styles.dashboard}>
      <section className={styles.encabezado}>
        <div>
          <span className={styles.fecha}>{fecha}</span>
          <h1>¡Bienvenido a MedAgenda!</h1>
          <p>
            Aquí tienes un resumen de la actividad de tu consultorio.
          </p>
        </div>

        <Link
          href="/dashboard/citas"
          className={styles.botonNuevaCita}
        >
          <span>+</span>
          Nueva cita
        </Link>
      </section>

      <section className={styles.estadisticas}>
        {estadisticas.map((item) => (
          <article className={styles.tarjeta} key={item.titulo}>
            <div className={styles.tarjetaSuperior}>
              <span>{item.titulo}</span>
              <div className={`${styles.iconoTarjeta} ${styles[item.color]}`}>
                {item.icono}
              </div>
            </div>

            <strong className={styles.cantidad}>
              {item.cantidad}
            </strong>

            <span className={styles.descripcion}>
              {item.descripcion}
            </span>
          </article>
        ))}
      </section>

      <section className={styles.seccionAgenda}>
        <div className={styles.encabezadoSeccion}>
          <div>
            <h2>Agenda del día</h2>
            <p>Resumen de las próximas consultas.</p>
          </div>

          <Link href="/dashboard/citas" className={styles.verTodo}>
            Ver todas las citas →
          </Link>
        </div>

        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Doctora</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {citas.map((cita, index) => (
                <tr key={index}>
                  <td className={styles.hora}>{cita.hora}</td>
                  <td>{cita.paciente}</td>
                  <td>{cita.doctora}</td>
                  <td>
                    <span
                      className={
                        cita.estado === "ATENDIDA"
                          ? styles.estadoAtendida
                          : styles.estadoProgramada
                      }
                    >
                      {cita.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.pieDashboard}>
        <div>
          <strong>MedAgenda</strong>
          <p>Gestión sencilla y organizada de tus citas médicas.</p>
        </div>
        <span>Panel de administración</span>
      </section>
    </div>
  );
}
