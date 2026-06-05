import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { applyCanonicalSiteUrl } from "@/lib/site-url";

applyCanonicalSiteUrl();

export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };







