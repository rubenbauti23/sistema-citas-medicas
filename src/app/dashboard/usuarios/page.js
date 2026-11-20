
import { exigirAdministrador } from "@/lib/dal";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  await exigirAdministrador();

  return <UsuariosClient />;
}
