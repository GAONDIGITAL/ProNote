import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import GoogleProvider from "next-auth/providers/google";
import axios from 'axios';
import moment from 'moment';

const { v4: uuidv4 } = require('uuid');

export default NextAuth({
    secret: process.env.NEXTAUTH_SECRET,
    session: { maxAge: 3600 * 24 * 7 },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "이메일", type: "email", placeholder: "이메일" },
                password: { label: "비밀번호", type: "password", placeholder: "비밀번호를 입력하세요." },
            },
            
            async authorize(credentials) {
                if (!credentials) throw new Error("잘못된 입력값으로 인한 오류가 발생했습니다.");

                const { email, password } = credentials;
                const result = await axios.post(`${process.env.PUBLIC_URL}/api/user`, { module: 'userLogin', email: email, password: password });
                //console.log(result.data);

                if (result.data.result) {
                    return result.data.user;
                } else {
                    throw new Error(result.data.msg);
                }
            },
        }),
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
        // async jwt ({token, account}) {
        //     console.log('token', token);
        //     console.log('account', account);

        //     if (account) token.accessToken = account.access_token;

        //     return token;
        // },
        async session({ session, token }) {
            // console.log('session', session);
            // console.log('token', token);

            moment.locale('ko');
            const id         = uuidv4();
            const now        = moment();
            const fullDate   = now.format('YYYY-MM-DD HH:mm:ss');

            if (token.nick) session.user.nick = token.nick as string; else session.user.nick = token.name as string;

            const result = await axios.post(`${process.env.PUBLIC_URL}/api/user`, { module: 'findUser', email: session.user.email });
            //console.log(result.data);

            if (!result.data.length) {
                const nickResult = await axios.post(`${process.env.PUBLIC_URL}/api/user`, { module: 'findNick', nick: session.user.nick, email: session.user.email });
                
                if (nickResult.data.length) session.user.nick += fullDate;

                let axiosData = { module: 'userInsert', id: id, email: session.user.email, name: session.user.name, nick: session.user.nick, image: session.user.image, created: fullDate };
                const insertResult = await axios.post(`${process.env.PUBLIC_URL}/api/user`, axiosData);
                
                if (insertResult.data.affectedRows) {
                    session.user.id = id;
                    session.user.created = fullDate;
                    return session;
                }
            } else {
                session.user.id = result.data[0].id;
                session.user.name = result.data[0].name;
                session.user.nick = result.data[0].nick;
                session.user.image = result.data[0].image;
                session.user.created = result.data[0].created;
            }
            
            return session;
        },
    },
});