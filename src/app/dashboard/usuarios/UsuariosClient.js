
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./usuarios.module.css";

const FORMULARIO_INICIAL = {
  nombre: "",
  usuario: "",
  password: "",
  rol: "SECRETARIA",
};

export default function UsuariosClient() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  const mostrarMensaje = (texto, tipo = "error") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    try {
      const respuesta = await fetch("/api/usuarios");
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar los usuarios.");
      }

      setUsuarios(datos.usuarios || []);
    } catch (error) {
      mostrarMensaje(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const estadisticas = useMemo(() => {
    return {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.estado === "ACTIVO").length,
      administradores: usuarios.filter(
        (u) => u.rol === "ADMINISTRADOR"
      ).length,
      secretarias: usuarios.filter(
        (u) => u.rol === "SECRETARIA"
      ).length,
    };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return usuarios.filter((u) => {
      const coincideBusqueda =
        !termino ||
        u.nombre.toLowerCase().includes(termino) ||
        u.usuario.toLowerCase().includes(termino);

      const coincideRol =
        filtroRol === "TODOS" || u.rol === filtroRol;

      const coincideEstado =
        filtroEstado === "TODOS" || u.estado === filtroEstado;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  function abrirCrear() {
    setUsuarioEditar(null);
    setFormulario(FORMULARIO_INICIAL);
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEditar(usuario) {
    setUsuarioEditar(usuario);
    setFormulario({
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      password: "",
      rol: usuario.rol,
    });
    setMensaje("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
    setUsuarioEditar(null);
    setFormulario(FORMULARIO_INICIAL);
  }

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function guardarUsuario(evento) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje("");

    try {
      const esEdicion = Boolean(usuarioEditar);

      const datos = {
        nombre: formulario.nombre,
        usuario: formulario.usuario,
        rol: formulario.rol,
      };

      if (!esEdicion || formulario.password) {
        datos.password = formulario.password;
      }

      const respuesta = await fetch(
        esEdicion
          ? `/api/usuarios/${usuarioEditar.idUsuario}`
          : "/api/usuarios",
        {
          method: esEdicion ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datos),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo guardar el usuario.");
      }

      setModalAbierto(false);
      setUsuarioEditar(null);
      setFormulario(FORMULARIO_INICIAL);

      mostrarMensaje(resultado.mensaje, "exito");
      await cargarUsuarios();
    } catch (error) {
      setMensaje(error.message);
      setTipoMensaje("error");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(usuario) {
    const nuevoEstado =
      usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    const accion =
      nuevoEstado === "ACTIVO" ? "activar" : "desactivar";

    const confirmado = window.confirm(
      `¿Estás seguro de que deseas ${accion} la cuenta de ${usuario.nombre}?`
    );

    if (!confirmado) return;

    try {
      const respuesta = await fetch(
        `/api/usuarios/${usuario.idUsuario}`,
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
        throw new Error(resultado.mensaje || "No se pudo cambiar el estado.");
      }

      mostrarMensaje(resultado.mensaje, "exito");
      await cargarUsuarios();
    } catch (error) {
      mostrarMensaje(error.message, "error");
    }
  }

  return (
    <section className={styles.contenedor}>
      <div className={styles.encabezado}>
        <div>
          <span className={styles.etiqueta}>ADMINISTRACIÓN</span>
          <h1>Gestión de usuarios</h1>
          <p>
            Administra las cuentas que tienen acceso a MedAgenda.
          </p>
        </div>

        <button
          type="button"
          className={styles.botonPrincipal}
          onClick={abrirCrear}
        >
          <span>＋</span> Nuevo usuario
        </button>
      </div>

      {mensaje && !modalAbierto && (
        <div
          className={`${styles.alerta} ${
            tipoMensaje === "exito" ? styles.alertaExito : styles.alertaError
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
            <span>Total de usuarios</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>✓</div>
          <div>
            <span>Cuentas activas</span>
            <strong>{estadisticas.activos}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>♔</div>
          <div>
            <span>Administradores</span>
            <strong>{estadisticas.administradores}</strong>
          </div>
        </div>

        <div className={styles.tarjetaEstadistica}>
          <div className={styles.iconoEstadistica}>♧</div>
          <div>
            <span>Secretarias</span>
            <strong>{estadisticas.secretarias}</strong>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelEncabezado}>
          <div>
            <h2>Usuarios registrados</h2>
            <p>
              {usuariosFiltrados.length}{" "}
              {usuariosFiltrados.length === 1
                ? "usuario encontrado"
                : "usuarios encontrados"}
            </p>
          </div>
        </div>

        <div className={styles.filtros}>
          <div className={styles.busqueda}>
            <span>⌕</span>
            <input
              type="search"
              placeholder="Buscar por nombre o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="TODOS">Todos los roles</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="SECRETARIA">Secretaria</option>
          </select>

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
                <th>Usuario</th>
                <th>Nombre de acceso</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className={styles.columnaAcciones}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" className={styles.estadoVacio}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.estadoVacio}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.idUsuario}>
                    <td>
                      <div className={styles.usuarioCelda}>
                        <div className={styles.avatar}>
                          {usuario.nombre.trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{usuario.nombre}</strong>
                          <small>ID: {usuario.idUsuario}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={styles.nombreUsuario}>
                        @{usuario.usuario}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.insigniaRol} ${
                          usuario.rol === "ADMINISTRADOR"
                            ? styles.rolAdmin
                            : styles.rolSecretaria
                        }`}
                      >
                        {usuario.rol === "ADMINISTRADOR"
                          ? "Administrador"
                          : "Secretaria"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.insigniaEstado} ${
                          usuario.estado === "ACTIVO"
                            ? styles.estadoActivo
                            : styles.estadoInactivo
                        }`}
                      >
                        <span />
                        {usuario.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className={styles.acciones}>
                        <button
                          type="button"
                          className={styles.botonAccion}
                          onClick={() => abrirEditar(usuario)}
                          title="Editar usuario"
                          aria-label={`Editar ${usuario.nombre}`}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className={`${styles.botonAccion} ${
                            usuario.estado === "ACTIVO"
                              ? styles.botonDesactivar
                              : styles.botonActivar
                          }`}
                          onClick={() => cambiarEstado(usuario)}
                          title={
                            usuario.estado === "ACTIVO"
                              ? "Desactivar usuario"
                              : "Activar usuario"
                          }
                          aria-label={
                            usuario.estado === "ACTIVO"
                              ? `Desactivar ${usuario.nombre}`
                              : `Activar ${usuario.nombre}`
                          }
                        >
                          {usuario.estado === "ACTIVO" ? "⊘" : "✓"}
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
                  {usuarioEditar ? "ACTUALIZACIÓN" : "NUEVA CUENTA"}
                </span>
                <h2 id="titulo-modal">
                  {usuarioEditar ? "Editar usuario" : "Registrar usuario"}
                </h2>
                <p>
                  {usuarioEditar
                    ? "Modifica los datos de acceso de esta cuenta."
                    : "Completa los datos para crear una nueva cuenta."}
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

            <form onSubmit={guardarUsuario}>
              <div className={styles.campos}>
                <label>
                  Nombre completo
                  <input
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    placeholder="Ej. María Fernanda López"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Nombre de usuario
                  <input
                    name="usuario"
                    type="text"
                    value={formulario.usuario}
                    onChange={manejarCambio}
                    placeholder="Ej. maria.lopez"
                    maxLength={50}
                    autoComplete="off"
                    required
                  />
                </label>

                <label>
                  {usuarioEditar
                    ? "Nueva contraseña (opcional)"
                    : "Contraseña"}
                  <input
                    name="password"
                    type="password"
                    value={formulario.password}
                    onChange={manejarCambio}
                    placeholder={
                      usuarioEditar
                        ? "Dejar vacío para conservar la actual"
                        : "Mínimo 8 caracteres"
                    }
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required={!usuarioEditar}
                  />
                  <small>
                    {usuarioEditar
                      ? "Solo completa este campo si deseas cambiar la contraseña."
                      : "La contraseña debe tener al menos 8 caracteres."}
                  </small>
                </label>

                <label>
                  Rol del usuario
                  <select
                    name="rol"
                    value={formulario.rol}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="SECRETARIA">Secretaria</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
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
                    : usuarioEditar
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
