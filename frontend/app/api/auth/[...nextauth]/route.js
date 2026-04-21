import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google" && account.id_token) {
        try {
          console.log("Exchanging Google token with Django...");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: account.id_token }),
            }
          );
          console.log("Django response status:", res.status);
          const data = await res.json();
          console.log("Django response body:", JSON.stringify(data));
          if (data.token) {
            token.djangoToken = data.token;
            token.user = data.user;
            console.log("Django token stored in JWT");
          } else {
            console.error("No token in Django response:", data);
          }
        } catch (err) {
          console.error("Django auth error:", err.message);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.djangoToken = token.djangoToken;
      session.user = { ...session.user, ...token.user };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };