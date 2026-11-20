
import { exigirUsuario } from "@/lib/dal";
import PacientesClient from "./PacientesClient";

export default async function PacientesPage() {
  await exigirUsuario();

  return <PacientesClient />;
}
