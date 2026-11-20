
import styles from "./ModuloPendiente.module.css";

export default function ModuloPendiente({ titulo, descripcion }) {
  return (
    <section className={styles.contenedor}>
      <span className={styles.etiqueta}>MEDAGENDA</span>
      <h1>{titulo}</h1>
      <p>{descripcion}</p>

      <div className={styles.tarjeta}>
        <div className={styles.icono}>✚</div>
        <strong>Módulo preparado</strong>
        <span>
          En esta sección desarrollaremos las funcionalidades
          correspondientes.
        </span>
      </div>
    </section>
  );
}
