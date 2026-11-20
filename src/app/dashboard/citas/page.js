
import { exigirUsuario } from "@/lib/dal";
import CitasClient from "./CitasClient";

export default async function CitasPage() {
  await exigirUsuario();

  return <CitasClient />;
}
