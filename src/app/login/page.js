
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarLogin(event) {
    event.preventDefault();

    setMensaje("");
    setCargando(true);

    const formulario = new FormData(event.currentTarget);

    const datos = {
      usuario: formulario.get("usuario"),
      password: formulario.get("password"),
    };

    try {
      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(resultado.mensaje || "No se pudo iniciar sesión.");
        return;
      }

      // La cookie ya fue creada por el servidor.
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className={styles.contenedor}>
      <section className={styles.panelLogin}>
        <div className={styles.logo}>
          <div className={styles.logoIcono}>+</div>
          <span>MedAgenda</span>
        </div>

        <div className={styles.formularioContenedor}>
          <div className={styles.encabezado}>
            <span className={styles.etiqueta}>BIENVENIDO</span>
            <h1>Iniciar sesión</h1>
            <p>
              Ingresa tus credenciales para acceder al
              sistema de gestión de citas médicas.
            </p>
          </div>

          <form onSubmit={manejarLogin}>
            <div className={styles.campo}>
              <label htmlFor="usuario">Usuario</label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                required
                disabled={cargando}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="password">Contraseña</label>

              <div className={styles.passwordContenedor}>
                <input
                  id="password"
                  name="password"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                  disabled={cargando}
                />

                <button
                  type="button"
                  className={styles.botonMostrar}
                  onClick={() =>
                    setMostrarPassword(!mostrarPassword)
                  }
                  disabled={cargando}
                >
                  {mostrarPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.botonLogin}
              disabled={cargando}
            >
              {cargando ? "Verificando..." : "Ingresar al sistema"}
              {!cargando && <span>→</span>}
            </button>

            {mensaje && (
              <p className={styles.mensaje} role="alert">
                {mensaje}
              </p>
            )}
          </form>

          <p className={styles.pieFormulario}>
            Acceso exclusivo para personal autorizado.
          </p>
        </div>

        <footer className={styles.footer}>
          © 2026 MedAgenda. Todos los derechos reservados.
        </footer>
      </section>

      <section className={styles.panelVisual}>
        <div
          className={`${styles.decoracion} ${styles.decoracionUno}`}
        ></div>

        <div
          className={`${styles.decoracion} ${styles.decoracionDos}`}
        ></div>

        <div className={styles.contenidoVisual}>
          <div className={styles.iconoMedico}>⚕</div>

          <span className={styles.textoSuperior}>
            GESTIÓN MÉDICA INTELIGENTE
          </span>

          <h2>
            Una mejor organización
            <br />
            para una mejor atención.
          </h2>

          <p>
            Administra tus citas, organiza la información
            de tus pacientes y mantén una gestión médica
            sencilla y eficiente.
          </p>

          <div className={styles.tarjetaInformativa}>
            <div className={styles.puntoVerde}></div>

            <div>
              <strong>Todo en un solo lugar</strong>
              <span>
                Organización y control de tus citas médicas.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.textoInferior}>
          Simplificando la gestión de cada consulta.
        </div>
      </section>
    </main>
  );
}
