import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: account.id_token }),
  }
);
const data = await res.json();
console.log('Django auth response:', res.status, data);  // ADD THIS
if (data.token) {
  token.djangoToken = data.token;
  token.user = data.user;
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // When user signs in with Google, exchange token with Django
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: account.id_token }),
            }
          );
          const data = await res.json();
          if (data.token) {
            token.djangoToken = data.token;
            token.user = data.user;
          }
        } catch (err) {
          console.error("Django auth error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.djangoToken = token.djangoToken;
      session.user = {
        ...session.user,
        ...token.user,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };