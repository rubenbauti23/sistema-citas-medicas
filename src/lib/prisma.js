// TODO ESTO ES PARA PODER USAR UNA CONEXION REUTILIZABLE A LA BASE DE DATOS EN DESARROLLO, 
// YA QUE SI NO SE HACE ESTO, CADA VEZ QUE SE RECARGA EL SERVIDOR SE CREA UNA NUEVA CONEXION Y ESO 
// PUEDE LLEVAR A PROBLEMAS DE CONEXION Y SOBRE CARGA DE RECURSOS.

import { PrismaClient } from "../generated/prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
//recupera la conexion buscando entre esas 2 variables de entorno 
const connectionString =
  process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
// si no se logro encontrar la conexion lanza un error
if (!connectionString) {
  throw new Error("No se encontró la conexión a Neon");
}
// el adaptador sirve para que Prisma pueda conectarse a Neon, ya que Neon no es compatible de forma nativa con Prisma
const adapter = new PrismaNeon({
  connectionString,
});

// esta variable global sirve para que Prisma no cree una nueva instancia cada vez que 
// se recargue el servidor en desarrollo, evitando así problemas de conexión y sobrecarga de recursos.
const globalForPrisma = globalThis;

// aca se crea la instancia de PrismaClient, que es la que se va a usar para interactuar con la base de datos.
// se pone || porque si ya existe una instancia en globalForPrisma.prisma, se usa esa en lugar de crear una nueva.
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });

// y aqui se pregunta si es que no estamos en producción, 
// para que en desarrollo se use la misma instancia de PrismaClient y 
// no se creen nuevas conexiones cada vez que se recarga el servidor.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
