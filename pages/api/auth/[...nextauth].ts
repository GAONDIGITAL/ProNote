import NextAuth from "next-auth/next";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
    providers: [
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID as string,
            clientSecret: process.env.KAKAO_CLIENT_SECRET_KEY as string,
        }),
        NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID as string,
            clientSecret: process.env.NAVER_CLIENT_SECRET_KEY as string,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY as string,
        }),
    ],
    callbacks: {
        async session({ session, token, user }) {
            session.user.id = token.sub as string;
            console.log(session, token, user);
            return session;
        },
    },
});