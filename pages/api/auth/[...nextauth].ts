import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    })
  ],
  secret: process.env.SECRET
}

export default NextAuth(authOptions);