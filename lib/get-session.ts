import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";

export async function getSession() {
  return await getServerSession(authOptions);
}







