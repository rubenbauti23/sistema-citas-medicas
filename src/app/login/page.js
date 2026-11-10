
"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function LoginPage() {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function manejarLogin(event) {
    event.preventDefault();

    setMensaje(
      "La autenticación se implementará en la siguiente etapa."
    );
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
                />

                <button
                  type="button"
                  className={styles.botonMostrar}
                  onClick={() =>
                    setMostrarPassword(!mostrarPassword)
                  }
                >
                  {mostrarPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.botonLogin}>
              Ingresar al sistema
              <span>→</span>
            </button>

            {mensaje && (
              <p className={styles.mensaje}>{mensaje}</p>
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
        <div className={`${styles.decoracion} ${styles.decoracionUno}`}></div>
        <div className={`${styles.decoracion} ${styles.decoracionDos}`}></div>

        <div className={styles.contenidoVisual}>
          <div className={styles.iconoMedico}>✚</div>

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
              <span>Organización y control de tus citas médicas.</span>
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
