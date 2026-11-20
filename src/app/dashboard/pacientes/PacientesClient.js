
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./pacientes.module.css";

const FORMULARIO_INICIAL = {
  nombre: "",
  paterno: "",
  materno: "",
};

export default function PacientesClient() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditar, setPacienteEditar] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  const mostrarMensaje = (texto, tipo = "error") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const cargarPacientes = useCallback(async () => {
    setCargando(true);

    try {
      const respuesta = await fetch("/api/pacientes");
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar los pacientes.");
      }

      setPacientes(datos.pacientes || []);
    } catch (error) {
      mostrarMensaje(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const estadisticas = useMemo(() => ({
    total: pacientes.length,
    activos: pacientes.filter((p) => p.estado === "ACTIVO").length,
    inactivos: pacientes.filter((p) => p.estado === "INACTIVO").length,
  }), [pacientes]);

  const pacientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return pacientes.filter((p) => {
      const nombreCompleto =
        `${p.nombre} ${p.paterno} ${p.materno}`.toLowerCase();

      const coincideBusqueda =
        !termino || nombreCompleto.includes(termino);

      const coincideEstado =
        filtroEstado === "TODOS" || p.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [pacientes, busqueda, filtroEstado]);

  function abrirCrear() {
    setPacienteEditar(null);
    setFormulario(FORMULARIO_INICIAL);
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEditar(paciente) {
    setPacienteEditar(paciente);

    setFormulario({
      nombre: paciente.nombre,
      paterno: paciente.paterno,
      materno: paciente.materno,
    });

    setMensaje("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
    setPacienteEditar(null);
    setFormulario(FORMULARIO_INICIAL);
  }

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function guardarPaciente(evento) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      const esEdicion = Boolean(pacienteEditar);

      const respuesta = await fetch(
        esEdicion
          ? `/api/pacientes/${pacienteEditar.idPaciente}`
          : "/api/pacientes",
        {
          method: esEdicion ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulario),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || "No se pudo guardar el paciente."
        );
      }

      setModalAbierto(false);
      setPacienteEditar(null);
      setFormulario(FORMULARIO_INICIAL);

      mostrarMensaje(resultado.mensaje, "exito");
      await cargarPacientes();
    } catch (error) {
      setMensaje(error.message);
      setTipoMensaje("error");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(paciente) {
    const nuevoEstado =
      paciente.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    const accion =
      nuevoEstado === "ACTIVO" ? "activar" : "desactivar";

    const confirmado = window.confirm(
      `¿Deseas ${accion} a ${paciente.nombre} ${paciente.paterno} ${paciente.materno}?`
    );

    if (!confirmado) return;

    try {
      const respuesta = await fetch(
        `/api/pacientes/${paciente.idPaciente}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || "No se pudo cambiar el estado."
        );
      }

      mostrarMensaje(resultado.mensaje, "exito");
      await cargarPacientes();
    } catch (error) {
      mostrarMensaje(error.message, "error");
    }
  }

  return (
    <section className={styles.contenedor}>
      <div className={styles.encabezado}>
        <div>
          <span className={styles.etiqueta}>GESTIÓN DEL CONSULTORIO</span>
          <h1>Pacientes</h1>
          <p>
            Registra y administra la información de los pacientes.
          </p>
        </div>

        <button
          type="button"
          className={styles.botonPrincipal}
          onClick={abrirCrear}
        >
          <span>＋</span> Nuevo paciente
        </button>
      </div>

      {mensaje && !modalAbierto && (
        <div
          className={`${styles.alerta} ${
            tipoMensaje === "exito"
              ? styles.alertaExito
              : styles.alertaError
          }`}
          role="status"
        >
          <span>{tipoMensaje === "exito" ? "✓" : "!"}</span>
          {mensaje}

          <button
            type="button"
            onClick={() => setMensaje("")}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.estadisticas}>
        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>♙</div>
          <div>
            <span>Total de pacientes</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>✓</div>
          <div>
            <span>Pacientes activos</span>
            <strong>{estadisticas.activos}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>⊘</div>
          <div>
            <span>Pacientes inactivos</span>
            <strong>{estadisticas.inactivos}</strong>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelEncabezado}>
          <div>
            <h2>Listado de pacientes</h2>
            <p>
              {pacientesFiltrados.length}{" "}
              {pacientesFiltrados.length === 1
                ? "paciente encontrado"
                : "pacientes encontrados"}
            </p>
          </div>
        </div>

        <div className={styles.filtros}>
          <div className={styles.busqueda}>
            <span>⌕</span>
            <input
              type="search"
              placeholder="Buscar por nombre o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>

        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Apellido paterno</th>
                <th>Apellido materno</th>
                <th>Estado</th>
                <th className={styles.columnaAcciones}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" className={styles.estadoVacio}>
                    Cargando pacientes...
                  </td>
                </tr>
              ) : pacientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.estadoVacio}>
                    No se encontraron pacientes.
                  </td>
                </tr>
              ) : (
                pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.idPaciente}>
                    <td>
                      <div className={styles.usuarioCelda}>
                        <div className={styles.avatar}>
                          {paciente.nombre.trim().charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{paciente.nombre}</strong>
                          <small>ID: {paciente.idPaciente}</small>
                        </div>
                      </div>
                    </td>

                    <td>{paciente.paterno}</td>
                    <td>{paciente.materno}</td>

                    <td>
                      <span
                        className={`${styles.insigniaEstado} ${
                          paciente.estado === "ACTIVO"
                            ? styles.estadoActivo
                            : styles.estadoInactivo
                        }`}
                      >
                        <span />
                        {paciente.estado === "ACTIVO"
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className={styles.acciones}>
                        <button
                          type="button"
                          className={styles.botonAccion}
                          onClick={() => abrirEditar(paciente)}
                          title="Editar paciente"
                          aria-label={`Editar ${paciente.nombre}`}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className={`${styles.botonAccion} ${
                            paciente.estado === "ACTIVO"
                              ? styles.botonDesactivar
                              : styles.botonActivar
                          }`}
                          onClick={() => cambiarEstado(paciente)}
                          title={
                            paciente.estado === "ACTIVO"
                              ? "Desactivar paciente"
                              : "Activar paciente"
                          }
                          aria-label={
                            paciente.estado === "ACTIVO"
                              ? "Desactivar paciente"
                              : "Activar paciente"
                          }
                        >
                          {paciente.estado === "ACTIVO" ? "⊘" : "✓"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div
          className={styles.fondoModal}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal"
          >
            <div className={styles.modalEncabezado}>
              <div>
                <span className={styles.etiqueta}>
                  {pacienteEditar ? "ACTUALIZACIÓN" : "NUEVO REGISTRO"}
                </span>

                <h2 id="titulo-modal">
                  {pacienteEditar
                    ? "Editar paciente"
                    : "Registrar paciente"}
                </h2>

                <p>
                  {pacienteEditar
                    ? "Actualiza los datos personales del paciente."
                    : "Completa los datos personales para registrar al paciente."}
                </p>
              </div>

              <button
                type="button"
                className={styles.cerrarModal}
                onClick={cerrarModal}
                disabled={guardando}
                aria-label="Cerrar ventana"
              >
                ×
              </button>
            </div>

            <form onSubmit={guardarPaciente}>
              <div className={styles.campos}>
                <label>
                  Nombre(s)
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    placeholder="Ej. María Fernanda"
                    maxLength={50}
                    required
                  />
                </label>

                <label>
                  Apellido paterno
                  <input
                    type="text"
                    name="paterno"
                    value={formulario.paterno}
                    onChange={manejarCambio}
                    placeholder="Ej. López"
                    maxLength={50}
                    required
                  />
                </label>

                <label>
                  Apellido materno
                  <input
                    type="text"
                    name="materno"
                    value={formulario.materno}
                    onChange={manejarCambio}
                    placeholder="Ej. García"
                    maxLength={50}
                    required
                  />
                </label>
              </div>

              {mensaje && modalAbierto && (
                <div className={styles.errorModal} role="alert">
                  {mensaje}
                </div>
              )}

              <div className={styles.modalAcciones}>
                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.botonPrincipal}
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : pacienteEditar
                      ? "Guardar cambios"
                      : "Registrar paciente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
