
import { exigirAdministrador } from "@/lib/dal";
import ModuloPendiente from "@/components/ModuloPendiente";

export default async function UsuariosPage() {
  await exigirAdministrador();

  return (
    <ModuloPendiente
      titulo="Gestión de usuarios"
      descripcion="Administra las cuentas de acceso al sistema."
    />
  );
}
