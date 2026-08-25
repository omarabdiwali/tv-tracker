import Users from "@/models/Users";
import dbConnect from "@/utils/dbConnect";
import { IUser } from "@/utils/types";
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          image: profile.picture,
          email: profile.email
        }
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.providerAccountId) {
        await dbConnect();
        const incomingEmail = user?.email || token?.email;
        let dbUser: IUser | null = await Users.findOne({ googleId: account.providerAccountId });

        if (dbUser && (incomingEmail && dbUser.email != incomingEmail)) {
          dbUser.email = incomingEmail;
          await dbUser.save();
        } else if (!dbUser) {
          dbUser = await Users.create({ googleId: account.providerAccountId, email: incomingEmail, movies: [], shows: [] });
        }
        
        token.userId = dbUser?._id.toString();
      }
      
      return token;
    },
    async session({ session, token } : { session: any, token: any }) {
      if (session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  secret: process.env.SECRET
}

export default NextAuth(authOptions);