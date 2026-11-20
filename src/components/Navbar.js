
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar({ usuario }) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuMovil, setMenuMovil] = useState(false);
  const [menuPerfil, setMenuPerfil] = useState(false);
  const [notificaciones, setNotificaciones] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const esAdministrador = usuario.rol === "ADMINISTRADOR";

  const nombreRol = esAdministrador
    ? "Administrador"
    : "Secretaria";

  const inicial = usuario.nombre
    ?.trim()
    .charAt(0)
    .toUpperCase() || "U";

  const enlaces = [
    {
      nombre: "Inicio",
      ruta: "/dashboard",
      icono: "⌂",
    },
    {
      nombre: "Citas",
      ruta: "/dashboard/citas",
      icono: "▦",
    },
    {
      nombre: "Doctoras",
      ruta: "/dashboard/doctoras",
      icono: "✚",
    },
    {
      nombre: "Pacientes",
      ruta: "/dashboard/pacientes",
      icono: "♙",
    },
  ];

  if (esAdministrador) {
    enlaces.push({
      nombre: "Usuarios",
      ruta: "/dashboard/usuarios",
      icono: "♧",
    });
  }

  function esActivo(ruta) {
    if (ruta === "/dashboard") {
      return pathname === ruta;
    }

    return pathname.startsWith(ruta);
  }

  function cerrarMenus() {
    setMenuMovil(false);
    setMenuPerfil(false);
    setNotificaciones(false);
  }

  async function manejarCerrarSesion() {
    setCerrandoSesion(true);

    try {
      const respuesta = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo cerrar la sesión.");
      }

      cerrarMenus();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setCerrandoSesion(false);
    }
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.contenedor}>
        <Link
          href="/dashboard"
          className={styles.logo}
          onClick={cerrarMenus}
        >
          <div className={styles.logoIcono}>+</div>
          <span>MedAgenda</span>
        </Link>

        <nav
          className={`${styles.navegacion} ${
            menuMovil ? styles.navegacionAbierta : ""
          }`}
        >
          {enlaces.map((enlace) => (
            <Link
              key={enlace.ruta}
              href={enlace.ruta}
              onClick={cerrarMenus}
              className={`${styles.enlace} ${
                esActivo(enlace.ruta)
                  ? styles.enlaceActivo
                  : ""
              }`}
            >
              <span className={styles.iconoEnlace}>
                {enlace.icono}
              </span>

              {enlace.nombre}
            </Link>
          ))}
        </nav>

        <div className={styles.acciones}>
          <div className={styles.accionContenedor}>
            <button
              type="button"
              className={styles.botonIcono}
              aria-label="Notificaciones"
              onClick={() => {
                setNotificaciones(!notificaciones);
                setMenuPerfil(false);
              }}
            >
              ♧
              <span className={styles.indicador}></span>
            </button>

            {notificaciones && (
              <div className={styles.panelFlotante}>
                <strong>Notificaciones</strong>
                <p>No tienes notificaciones nuevas.</p>
              </div>
            )}
          </div>

          <div className={styles.accionContenedor}>
            <button
              type="button"
              className={styles.perfil}
              onClick={() => {
                setMenuPerfil(!menuPerfil);
                setNotificaciones(false);
              }}
            >
              <div className={styles.avatar}>
                {inicial}
              </div>

              <div className={styles.infoPerfil}>
                <strong>{usuario.nombre}</strong>
                <span>{nombreRol}</span>
              </div>

              <span className={styles.flecha}>⌄</span>
            </button>

            {menuPerfil && (
              <div className={styles.panelPerfil}>
                <strong>{usuario.nombre}</strong>
                <span>{usuario.usuario}</span>
                <span>{nombreRol}</span>

                <div className={styles.separador}></div>

                <button
                  type="button"
                  onClick={manejarCerrarSesion}
                  disabled={cerrandoSesion}
                >
                  {cerrandoSesion
                    ? "Cerrando sesión..."
                    : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.botonMovil}
            aria-label="Abrir menú"
            aria-expanded={menuMovil}
            onClick={() => setMenuMovil(!menuMovil)}
          >
            {menuMovil ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}
