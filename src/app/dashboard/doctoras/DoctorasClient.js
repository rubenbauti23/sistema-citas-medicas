
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./doctoras.module.css";

const FORMULARIO_INICIAL = {
  nombre: "",
  paterno: "",
  materno: "",
  numeroCelular: "",
};

export default function DoctorasClient() {
  const [doctoras, setDoctoras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [doctoraEditar, setDoctoraEditar] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  const mostrarMensaje = (texto, tipo = "error") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const cargarDoctoras = useCallback(async () => {
    setCargando(true);

    try {
      const respuesta = await fetch("/api/doctoras");
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar las doctoras.");
      }

      setDoctoras(datos.doctoras || []);
    } catch (error) {
      mostrarMensaje(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDoctoras();
  }, [cargarDoctoras]);

  const estadisticas = useMemo(() => ({
    total: doctoras.length,
    activas: doctoras.filter((d) => d.estado === "ACTIVO").length,
    inactivas: doctoras.filter((d) => d.estado === "INACTIVO").length,
  }), [doctoras]);

  const doctorasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return doctoras.filter((d) => {
      const nombreCompleto =
        `${d.nombre} ${d.paterno} ${d.materno}`.toLowerCase();

      const coincideBusqueda =
        !termino ||
        nombreCompleto.includes(termino) ||
        d.numeroCelular.toLowerCase().includes(termino);

      const coincideEstado =
        filtroEstado === "TODOS" || d.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [doctoras, busqueda, filtroEstado]);

  function abrirCrear() {
    setDoctoraEditar(null);
    setFormulario(FORMULARIO_INICIAL);
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEditar(doctora) {
    setDoctoraEditar(doctora);

    setFormulario({
      nombre: doctora.nombre,
      paterno: doctora.paterno,
      materno: doctora.materno,
      numeroCelular: doctora.numeroCelular,
    });

    setMensaje("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
    setDoctoraEditar(null);
    setFormulario(FORMULARIO_INICIAL);
  }

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function guardarDoctora(evento) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      const esEdicion = Boolean(doctoraEditar);

      const respuesta = await fetch(
        esEdicion
          ? `/api/doctoras/${doctoraEditar.idDoctora}`
          : "/api/doctoras",
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
          resultado.mensaje || "No se pudo guardar la doctora."
        );
      }

      setModalAbierto(false);
      setDoctoraEditar(null);
      setFormulario(FORMULARIO_INICIAL);

      mostrarMensaje(resultado.mensaje, "exito");
      await cargarDoctoras();
    } catch (error) {
      setMensaje(error.message);
      setTipoMensaje("error");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(doctora) {
    const nuevoEstado =
      doctora.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    const accion =
      nuevoEstado === "ACTIVO" ? "activar" : "desactivar";

    const confirmado = window.confirm(
      `¿Deseas ${accion} a la Dra. ${doctora.nombre} ${doctora.paterno} ${doctora.materno}?`
    );

    if (!confirmado) return;

    try {
      const respuesta = await fetch(
        `/api/doctoras/${doctora.idDoctora}`,
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
      await cargarDoctoras();
    } catch (error) {
      mostrarMensaje(error.message, "error");
    }
  }

  return (
    <section className={styles.contenedor}>
      <div className={styles.encabezado}>
        <div>
          <span className={styles.etiqueta}>GESTIÓN DEL CONSULTORIO</span>
          <h1>Doctoras</h1>
          <p>
            Administra la información y los datos de contacto de las doctoras.
          </p>
        </div>

        <button
          type="button"
          className={styles.botonPrincipal}
          onClick={abrirCrear}
        >
          <span>＋</span> Nueva doctora
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
          <div className={styles.iconoEstadistica}>✚</div>
          <div>
            <span>Total de doctoras</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>✓</div>
          <div>
            <span>Doctoras activas</span>
            <strong>{estadisticas.activas}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>⊘</div>
          <div>
            <span>Doctoras inactivas</span>
            <strong>{estadisticas.inactivas}</strong>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelEncabezado}>
          <div>
            <h2>Directorio de doctoras</h2>
            <p>
              {doctorasFiltradas.length}{" "}
              {doctorasFiltradas.length === 1
                ? "doctora encontrada"
                : "doctoras encontradas"}
            </p>
          </div>
        </div>

        <div className={styles.filtros}>
          <div className={styles.busqueda}>
            <span>⌕</span>
            <input
              type="search"
              placeholder="Buscar por nombre o celular..."
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
            <option value="ACTIVO">Activas</option>
            <option value="INACTIVO">Inactivas</option>
          </select>
        </div>

        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Doctora</th>
                <th>Apellido paterno</th>
                <th>Apellido materno</th>
                <th>Celular</th>
                <th>Estado</th>
                <th className={styles.columnaAcciones}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" className={styles.estadoVacio}>
                    Cargando doctoras...
                  </td>
                </tr>
              ) : doctorasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.estadoVacio}>
                    No se encontraron doctoras.
                  </td>
                </tr>
              ) : (
                doctorasFiltradas.map((doctora) => (
                  <tr key={doctora.idDoctora}>
                    <td>
                      <div className={styles.usuarioCelda}>
                        <div className={styles.avatar}>
                          {doctora.nombre.trim().charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{doctora.nombre}</strong>
                          <small>ID: {doctora.idDoctora}</small>
                        </div>
                      </div>
                    </td>

                    <td>{doctora.paterno}</td>
                    <td>{doctora.materno}</td>

                    <td>
                      <span className={styles.celular}>
                        <span>☎</span>
                        {doctora.numeroCelular}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.insigniaEstado} ${
                          doctora.estado === "ACTIVO"
                            ? styles.estadoActivo
                            : styles.estadoInactivo
                        }`}
                      >
                        <span />
                        {doctora.estado === "ACTIVO"
                          ? "Activa"
                          : "Inactiva"}
                      </span>
                    </td>

                    <td>
                      <div className={styles.acciones}>
                        <button
                          type="button"
                          className={styles.botonAccion}
                          onClick={() => abrirEditar(doctora)}
                          title="Editar doctora"
                          aria-label={`Editar ${doctora.nombre}`}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className={`${styles.botonAccion} ${
                            doctora.estado === "ACTIVO"
                              ? styles.botonDesactivar
                              : styles.botonActivar
                          }`}
                          onClick={() => cambiarEstado(doctora)}
                          title={
                            doctora.estado === "ACTIVO"
                              ? "Desactivar doctora"
                              : "Activar doctora"
                          }
                          aria-label={
                            doctora.estado === "ACTIVO"
                              ? "Desactivar doctora"
                              : "Activar doctora"
                          }
                        >
                          {doctora.estado === "ACTIVO" ? "⊘" : "✓"}
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
                  {doctoraEditar ? "ACTUALIZACIÓN" : "NUEVO REGISTRO"}
                </span>

                <h2 id="titulo-modal">
                  {doctoraEditar
                    ? "Editar doctora"
                    : "Registrar doctora"}
                </h2>

                <p>
                  {doctoraEditar
                    ? "Actualiza los datos personales y de contacto."
                    : "Completa los datos para registrar una nueva doctora."}
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

            <form onSubmit={guardarDoctora}>
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

                <label>
                  Número de celular
                  <input
                    type="tel"
                    name="numeroCelular"
                    value={formulario.numeroCelular}
                    onChange={manejarCambio}
                    placeholder="Ej. 70123456"
                    maxLength={20}
                    autoComplete="tel"
                    required
                  />
                  <small>
                    Registra el número que utilizaremos para las notificaciones.
                  </small>
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
                    : doctoraEditar
                      ? "Guardar cambios"
                      : "Registrar doctora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
