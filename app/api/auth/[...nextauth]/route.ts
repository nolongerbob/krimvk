import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { applyCanonicalSiteUrl } from "@/lib/site-url";

applyCanonicalSiteUrl();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };







