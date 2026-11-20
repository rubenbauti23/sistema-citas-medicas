
import { exigirUsuario } from "@/lib/dal";
import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

export default async function DashboardLayout({ children }) {
//con esta funcion "exigirUsuario" se asegura que el usuario esté autenticado antes de renderizar el layout del dashboard. 
// Si no está autenticado, se redirige al login.
  const usuario = await exigirUsuario();

  return (
    <div className={styles.aplicacion}>
      <Navbar usuario={usuario} />

      <main className={styles.contenido}>
        {children}
      </main>
    </div>
  );
}
