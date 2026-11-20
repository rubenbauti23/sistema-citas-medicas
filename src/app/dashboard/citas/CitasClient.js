
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./citas.module.css";

const formularioInicial = {
  fecha: new Date().toLocaleDateString("en-CA"),
  hora: "09:00",
  motivo: "",
  idDoctora: "",
  idPaciente: "",
};

const pacienteInicial = {
  nombre: "",
  paterno: "",
  materno: "",
};

function fechaTexto(fecha) {
  return new Date(fecha).toISOString().slice(0, 10);
}

function horaTexto(hora) {
  const fecha = new Date(hora);
  return `${String(fecha.getUTCHours()).padStart(2, "0")}:${String(
    fecha.getUTCMinutes()
  ).padStart(2, "0")}`;
}

function nombreCompleto(persona) {
  return `${persona.nombre} ${persona.paterno} ${persona.materno}`.trim();
}

function fechaLegible(fecha) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function obtenerEstado(estado) {
  const estados = {
    PROGRAMADA: "Programada",
    REPROGRAMADA: "Reprogramada",
    CANCELADA: "Cancelada",
    ATENDIDA: "Atendida",
  };

  return estados[estado] || estado;
}

export default function CitasClient() {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctoras, setDoctoras] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("calendario");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroDoctora, setFiltroDoctora] = useState("");

  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [mesActual, setMesActual] = useState(() => {
    const fecha = new Date();
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarPacienteNuevo, setMostrarPacienteNuevo] = useState(false);
  const [citaEditando, setCitaEditando] = useState(null);

  const [formulario, setFormulario] = useState(formularioInicial);
  const [nuevoPaciente, setNuevoPaciente] = useState(pacienteInicial);

  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);

      const [respuestaCitas, respuestaPacientes, respuestaDoctoras] =
        await Promise.all([
          fetch("/api/citas"),
          fetch("/api/pacientes"),
          fetch("/api/doctoras"),
        ]);

      if (
        !respuestaCitas.ok ||
        !respuestaPacientes.ok ||
        !respuestaDoctoras.ok
      ) {
        throw new Error("No se pudieron cargar los datos de la agenda.");
      }

      const [datosCitas, datosPacientes, datosDoctoras] =
        await Promise.all([
          respuestaCitas.json(),
          respuestaPacientes.json(),
          respuestaDoctoras.json(),
        ]);

      setCitas(datosCitas.citas || []);
      setPacientes(datosPacientes.pacientes || []);
      setDoctoras(datosDoctoras.doctoras || []);
    } catch (error) {
      setError(error.message || "Ocurrió un error al cargar los datos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const citasFiltradas = useMemo(() => {
    return citas.filter((cita) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        !texto ||
        nombreCompleto(cita.Paciente).toLowerCase().includes(texto) ||
        nombreCompleto(cita.Doctora).toLowerCase().includes(texto) ||
        cita.motivo.toLowerCase().includes(texto);

      const coincideEstado =
        !filtroEstado || cita.estado === filtroEstado;

      const coincideDoctora =
        !filtroDoctora ||
        String(cita.idDoctora) === filtroDoctora;

      return coincideBusqueda && coincideEstado && coincideDoctora;
    });
  }, [citas, busqueda, filtroEstado, filtroDoctora]);

  const citasDelDia = useMemo(() => {
    return citasFiltradas.filter(
      (cita) => fechaTexto(cita.fecha) === fechaSeleccionada
    );
  }, [citasFiltradas, fechaSeleccionada]);

  const estadisticas = useMemo(() => ({
    total: citas.length,
    programadas: citas.filter(
      (cita) => cita.estado === "PROGRAMADA" ||
                cita.estado === "REPROGRAMADA"
    ).length,
    atendidas: citas.filter(
      (cita) => cita.estado === "ATENDIDA"
    ).length,
    canceladas: citas.filter(
      (cita) => cita.estado === "CANCELADA"
    ).length,
  }), [citas]);

  function abrirNuevaCita() {
    setCitaEditando(null);
    setFormulario({
      ...formularioInicial,
      fecha: fechaSeleccionada,
    });
    setNuevoPaciente(pacienteInicial);
    setMostrarPacienteNuevo(false);
    setError("");
    setMostrarModal(true);
  }

  function abrirEdicion(cita) {
    setCitaEditando(cita);

    setFormulario({
      fecha: fechaTexto(cita.fecha),
      hora: horaTexto(cita.hora),
      motivo: cita.motivo,
      idDoctora: String(cita.idDoctora),
      idPaciente: String(cita.idPaciente),
    });

    setMostrarPacienteNuevo(false);
    setError("");
    setMostrarModal(true);
  }

  function cerrarModal() {
    if (cargandoGuardar) return;

    setMostrarModal(false);
    setMostrarPacienteNuevo(false);
    setCitaEditando(null);
    setError("");
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function cambiarPaciente(evento) {
    const { name, value } = evento.target;

    setNuevoPaciente((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function registrarPacienteRapido(evento) {
    evento.preventDefault();
    setError("");

    try {
      const respuesta = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoPaciente),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo registrar el paciente.");
      }

      const pacienteCreado = resultado.paciente;

      if (!pacienteCreado?.idPaciente) {
        throw new Error("El paciente se registró, pero no se recibió su identificador.");
      }

      setPacientes((anteriores) => [...anteriores, pacienteCreado]);

      setFormulario((anterior) => ({
        ...anterior,
        idPaciente: String(pacienteCreado.idPaciente),
      }));

      setNuevoPaciente(pacienteInicial);
      setMostrarPacienteNuevo(false);
      setExito("Paciente registrado y seleccionado correctamente.");

    } catch (error) {
      setError(error.message);
    }
  }

  async function guardarCita(evento) {
    evento.preventDefault();
    setError("");
    setExito("");

    if (
      !formulario.fecha ||
      !formulario.hora ||
      !formulario.motivo.trim() ||
      !formulario.idDoctora ||
      !formulario.idPaciente
    ) {
      setError("Completa todos los campos de la cita.");
      return;
    }

    try {
      setCargandoGuardar(true);

      const url = citaEditando
        ? `/api/citas/${citaEditando.idCita}`
        : "/api/citas";

      const respuesta = await fetch(url, {
        method: citaEditando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulario,
          idDoctora: Number(formulario.idDoctora),
          idPaciente: Number(formulario.idPaciente),
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo guardar la cita.");
      }

      await cargarDatos();

      setFechaSeleccionada(formulario.fecha);
      setMesActual(
        new Date(
          Number(formulario.fecha.slice(0, 4)),
          Number(formulario.fecha.slice(5, 7)) - 1,
          1
        )
      );

      setMostrarModal(false);
      setCitaEditando(null);
      setExito(resultado.mensaje);
    } catch (error) {
      setError(error.message);
    } finally {
      setCargandoGuardar(false);
    }
  }

  async function cambiarEstado(cita, nuevoEstado) {
    const acciones = {
      CANCELADA: "cancelar esta cita",
      ATENDIDA: "marcar esta cita como atendida",
    };

    if (!window.confirm(`¿Deseas ${acciones[nuevoEstado]}?`)) return;

    setError("");
    setExito("");

    try {
      const respuesta = await fetch(`/api/citas/${cita.idCita}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo actualizar la cita.");
      }

      await cargarDatos();
      setExito(resultado.mensaje);
    } catch (error) {
      setError(error.message);
    }
  }

  function cambiarMes(direccion) {
    setMesActual((anterior) =>
      new Date(
        anterior.getFullYear(),
        anterior.getMonth() + direccion,
        1
      )
    );
  }

  const calendario = useMemo(() => {
    const anio = mesActual.getFullYear();
    const mes = mesActual.getMonth();

    const primerDia = new Date(anio, mes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const cantidadDias = new Date(anio, mes + 1, 0).getDate();

    return Array.from(
      { length: Math.ceil((desplazamiento + cantidadDias) / 7) * 7 },
      (_, indice) => {
        const dia = indice - desplazamiento + 1;

        if (dia < 1 || dia > cantidadDias) return null;

        const fecha = [
          anio,
          String(mes + 1).padStart(2, "0"),
          String(dia).padStart(2, "0"),
        ].join("-");

        const cantidad = citasFiltradas.filter(
          (cita) => fechaTexto(cita.fecha) === fecha
        ).length;

        return { dia, fecha, cantidad };
      }
    );
  }, [mesActual, citasFiltradas]);

  const pacientesActivos = pacientes.filter(
    (paciente) => paciente.estado === "ACTIVO"
  );

  const doctorasActivas = doctoras.filter(
    (doctora) => doctora.estado === "ACTIVO"
  );

  return (
    <div className={styles.contenedor}>
      <div className={styles.encabezado}>
        <div>
          <span className={styles.etiqueta}>GESTIÓN MÉDICA</span>
          <h1>Agenda de citas</h1>
          <p>Administra y organiza las consultas del consultorio.</p>
        </div>

        <button
          className={styles.botonPrincipal}
          onClick={abrirNuevaCita}
        >
          + Nueva cita
        </button>
      </div>

      {error && !mostrarModal && (
        <div className={styles.alertaError}>{error}</div>
      )}

      {exito && (
        <div className={styles.alertaExito}>
          {exito}
          <button onClick={() => setExito("")}>×</button>
        </div>
      )}

      <div className={styles.estadisticas}>
        <TarjetaEstadistica titulo="Total de citas" valor={estadisticas.total} />
        <TarjetaEstadistica titulo="Pendientes" valor={estadisticas.programadas} />
        <TarjetaEstadistica titulo="Atendidas" valor={estadisticas.atendidas} />
        <TarjetaEstadistica titulo="Canceladas" valor={estadisticas.canceladas} />
      </div>

      <section className={styles.panel}>
        <div className={styles.panelEncabezado}>
          <div>
            <h2>Agenda del consultorio</h2>
            <p>Consulta y administra las citas registradas.</p>
          </div>

          <div className={styles.selectorVistas}>
            <button
              className={vista === "calendario" ? styles.vistaActiva : ""}
              onClick={() => setVista("calendario")}
            >
              ▦ Calendario
            </button>
            <button
              className={vista === "tabla" ? styles.vistaActiva : ""}
              onClick={() => setVista("tabla")}
            >
              ☷ Tabla
            </button>
          </div>
        </div>

        <div className={styles.filtrosCitas}>
          <input
            className={styles.busqueda}
            placeholder="Buscar paciente, doctora o motivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            value={filtroDoctora}
            onChange={(e) => setFiltroDoctora(e.target.value)}
          >
            <option value="">Todas las doctoras</option>
            {doctoras.map((doctora) => (
              <option key={doctora.idDoctora} value={doctora.idDoctora}>
                {nombreCompleto(doctora)}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="REPROGRAMADA">Reprogramada</option>
            <option value="ATENDIDA">Atendida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        {cargando ? (
          <div className={styles.estadoVacio}>Cargando agenda...</div>
        ) : vista === "calendario" ? (
          <div className={styles.calendario}>
            <div className={styles.calendarioEncabezado}>
              <button onClick={() => cambiarMes(-1)}>‹</button>
              <h3>
                {mesActual.toLocaleDateString("es-BO", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button onClick={() => cambiarMes(1)}>›</button>
            </div>

            <div className={styles.diasSemana}>
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => (
                <div key={dia}>{dia}</div>
              ))}
            </div>

            <div className={styles.diasCalendario}>
              {calendario.map((dia, indice) => (
                <button
                  key={indice}
                  disabled={!dia}
                  className={`${styles.diaCalendario} ${
                    dia?.fecha === fechaSeleccionada ? styles.diaSeleccionado : ""
                  }`}
                  onClick={() => dia && setFechaSeleccionada(dia.fecha)}
                >
                  {dia && (
                    <>
                      <span>{dia.dia}</span>
                      {dia.cantidad > 0 && (
                        <small>{dia.cantidad} cita{dia.cantidad !== 1 ? "s" : ""}</small>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.citasDia}>
              <div className={styles.citasDiaEncabezado}>
                <div>
                  <h3>Citas del día</h3>
                  <p>{fechaLegible(fechaSeleccionada)}</p>
                </div>
                <button
                  className={styles.botonSecundario}
                  onClick={abrirNuevaCita}
                >
                  + Agregar cita
                </button>
              </div>

              {citasDelDia.length === 0 ? (
                <div className={styles.estadoVacio}>
                  No hay citas registradas para este día.
                </div>
              ) : (
                <div className={styles.listaCitas}>
                  {citasDelDia
                    .slice()
                    .sort((a, b) => horaTexto(a.hora).localeCompare(horaTexto(b.hora)))
                    .map((cita) => (
                      <TarjetaCita
                        key={cita.idCita}
                        cita={cita}
                        onEditar={abrirEdicion}
                        onEstado={cambiarEstado}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Paciente</th>
                  <th>Doctora</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={styles.estadoVacio}>
                      No se encontraron citas.
                    </td>
                  </tr>
                ) : (
                  citasFiltradas.map((cita) => (
                    <tr key={cita.idCita}>
                      <td>
                        <strong>{fechaLegible(fechaTexto(cita.fecha))}</strong>
                        <small className={styles.horaTabla}>{horaTexto(cita.hora)}</small>
                      </td>
                      <td>{nombreCompleto(cita.Paciente)}</td>
                      <td>{nombreCompleto(cita.Doctora)}</td>
                      <td>{cita.motivo}</td>
                      <td>
                        <InsigniaEstado estado={cita.estado} />
                      </td>
                      <td>
                        <div className={styles.accionesCita}>
                          {cita.estado !== "CANCELADA" &&
                           cita.estado !== "ATENDIDA" && (
                            <>
                              <button onClick={() => abrirEdicion(cita)}>
                                Editar
                              </button>
                              <button onClick={() => cambiarEstado(cita, "ATENDIDA")}>
                                Atendida
                              </button>
                              <button
                                className={styles.accionCancelar}
                                onClick={() => cambiarEstado(cita, "CANCELADA")}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mostrarModal && (
        <div className={styles.fondoModal} onMouseDown={cerrarModal}>
          <div
            className={styles.modal}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.modalEncabezado}>
              <div>
                <h2>{citaEditando ? "Editar cita" : "Nueva cita médica"}</h2>
                <p>Completa la información de la consulta.</p>
              </div>
              <button className={styles.cerrarModal} onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form onSubmit={guardarCita}>
              <div className={styles.campos}>
                <label>
                  Paciente
                  <select
                    name="idPaciente"
                    value={formulario.idPaciente}
                    onChange={cambiarCampo}
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {pacientesActivos.map((paciente) => (
                      <option key={paciente.idPaciente} value={paciente.idPaciente}>
                        {nombreCompleto(paciente)}
                      </option>
                    ))}
                  </select>
                </label>

                {!mostrarPacienteNuevo && (
                  <button
                    type="button"
                    className={styles.botonAgregarPaciente}
                    onClick={() => {
                      setError("");
                      setMostrarPacienteNuevo(true);
                    }}
                  >
                    + Registrar paciente nuevo
                  </button>
                )}

                {mostrarPacienteNuevo && (
                  <div className={styles.nuevoPaciente}>
                    <div className={styles.nuevoPacienteEncabezado}>
                      <strong>Registro rápido de paciente</strong>
                      <button
                        type="button"
                        onClick={() => setMostrarPacienteNuevo(false)}
                      >
                        Cerrar
                      </button>
                    </div>

                    <label>
                      Nombre
                      <input
                        name="nombre"
                        value={nuevoPaciente.nombre}
                        onChange={cambiarPaciente}
                        maxLength={50}
                        required
                      />
                    </label>

                    <label>
                      Apellido paterno
                      <input
                        name="paterno"
                        value={nuevoPaciente.paterno}
                        onChange={cambiarPaciente}
                        maxLength={50}
                        required
                      />
                    </label>

                    <label>
                      Apellido materno
                      <input
                        name="materno"
                        value={nuevoPaciente.materno}
                        onChange={cambiarPaciente}
                        maxLength={50}
                        required
                      />
                    </label>

                    <button
                      type="button"
                      className={styles.botonPrincipal}
                      onClick={registrarPacienteRapido}
                    >
                      Guardar y seleccionar paciente
                    </button>
                  </div>
                )}

                <label>
                  Doctora
                  <select
                    name="idDoctora"
                    value={formulario.idDoctora}
                    onChange={cambiarCampo}
                    required
                  >
                    <option value="">Seleccionar doctora</option>
                    {doctorasActivas.map((doctora) => (
                      <option key={doctora.idDoctora} value={doctora.idDoctora}>
                        {nombreCompleto(doctora)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.camposFechaHora}>
                  <label>
                    Fecha
                    <input
                      type="date"
                      name="fecha"
                      value={formulario.fecha}
                      onChange={cambiarCampo}
                      required
                    />
                  </label>

                  <label>
                    Hora
                    <input
                      type="time"
                      name="hora"
                      value={formulario.hora}
                      onChange={cambiarCampo}
                      required
                    />
                  </label>
                </div>

                <label>
                  Motivo de consulta
                  <textarea
                    name="motivo"
                    value={formulario.motivo}
                    onChange={cambiarCampo}
                    rows={3}
                    placeholder="Describe brevemente el motivo de la consulta..."
                    required
                  />
                </label>
              </div>

              {error && <div className={styles.errorModal}>{error}</div>}

              <div className={styles.modalAcciones}>
                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={cerrarModal}
                  disabled={cargandoGuardar}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.botonPrincipal}
                  disabled={cargandoGuardar}
                >
                  {cargandoGuardar
                    ? "Guardando..."
                    : citaEditando
                      ? "Guardar cambios"
                      : "Registrar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaEstadistica({ titulo, valor }) {
  return (
    <div className={styles.tarjetaEstadistica}>
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function InsigniaEstado({ estado }) {
  const clase = {
    PROGRAMADA: styles.estadoProgramada,
    REPROGRAMADA: styles.estadoReprogramada,
    CANCELADA: styles.estadoCancelada,
    ATENDIDA: styles.estadoAtendida,
  }[estado];

  return (
    <span className={`${styles.insigniaEstado} ${clase || ""}`}>
      {obtenerEstado(estado)}
    </span>
  );
}

function TarjetaCita({ cita, onEditar, onEstado }) {
  const finalizada =
    cita.estado === "CANCELADA" || cita.estado === "ATENDIDA";

  return (
    <div className={styles.tarjetaCita}>
      <div className={styles.horaCita}>
        {horaTexto(cita.hora)}
      </div>

      <div className={styles.detalleCita}>
        <strong>{nombreCompleto(cita.Paciente)}</strong>
        <span>Dra. {nombreCompleto(cita.Doctora)}</span>
        <small>{cita.motivo}</small>
      </div>

      <InsigniaEstado estado={cita.estado} />

      {!finalizada && (
        <div className={styles.accionesCita}>
          <button onClick={() => onEditar(cita)}>Editar</button>
          <button onClick={() => onEstado(cita, "ATENDIDA")}>Atendida</button>
          <button
            className={styles.accionCancelar}
            onClick={() => onEstado(cita, "CANCELADA")}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
