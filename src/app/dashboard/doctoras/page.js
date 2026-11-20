
import { exigirUsuario } from "@/lib/dal";
import DoctorasClient from "./DoctorasClient";

export default async function DoctorasPage() {
  await exigirUsuario();

  return <DoctorasClient />;
}
