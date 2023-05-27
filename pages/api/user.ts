import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';

const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db.ts');

let sql: string;

export default function user(req : NextApiRequest, res : NextApiResponse) {
    if (db.escape(req.body.module) === "'truncateNotes'") {
        sql = `DROP TABLE IF EXISTS users;
                CREATE TABLE users (
                        idx int(11) NOT NULL AUTO_INCREMENT COMMENT '유니크 키',
                        id varchar(255) NOT NULL COMMENT '코드',
                        email varchar(255) DEFAULT NULL COMMENT '이메일',
                        password varchar(255) DEFAULT NULL COMMENT '비밀번호',
                        name varchar(255) DEFAULT NULL COMMENT '이름',
                        nick varchar(255) DEFAULT NULL COMMENT '별명',
                        image varchar(1000) NOT NULL DEFAULT '' COMMENT '프로필이미지',
                        created datetime NOT NULL COMMENT '등록일시',
                    PRIMARY KEY (idx),
                    KEY id (id),
                    KEY email (email),
                    KEY name (name),
                    KEY nick (nick)
                ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='회원 테이블';`;
    } else if (db.escape(req.body.module) === "'userLogin'") {
        sql = `select email, AES_DECRYPT(UNHEX(password), '${process.env.DB_SECRET_KEY}') as password from users where email = ${db.escape(req.body.email)};`;
        //console.log(sql);

        db.query(sql,
            function (err: any, result: any) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(result);

                    if (!result[0]) {
                        res.json({ result: false, msg: `${req.body.email} 회원이 존재하지 않습니다.` });
                        return;
                    }
                    if (result[0].password !== req.body.password) {
                        res.json({ result: false, msg: `비밀번호가 일치하지 않습니다.` });
                        return;
                    }

                    res.json({ result: true, user: { email: result[0].email } });
                }
            }
        );
    } else if (db.escape(req.body.module) === "'userJoin'") {
        sql = `select id from users where email = ${db.escape(req.body.email)};
                select id from users where nick = ${db.escape(req.body.nick)};`;
        //console.log(sql);

        db.query(sql,
            function (err: any, result: any) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(result);

                    if (result[0].length) {
                        res.json({ result: false, msg: `이미 ${req.body.email} 회원이 가입되어 있습니다.` });
                        return;
                    }
                    if (result[1].length) {
                        res.json({ result: false, msg: `${req.body.nick} Nick Name은 이미 사용중 입니다.` });
                        return;
                    }

                    moment.locale('ko');
                    const now        = moment();
                    const fullDate   = now.format('YYYY-MM-DD HH:mm:ss');
                    sql = `insert into users set 
                                id               = '${uuidv4()}', 
                                email            = ${db.escape(req.body.email)}, 
                                password         = HEX(AES_ENCRYPT(${db.escape(req.body.password)}, '${process.env.DB_SECRET_KEY}')), 
                                name             = ${db.escape(req.body.name)}, 
                                nick             = ${db.escape(req.body.nick)},
                                created          = '${fullDate}';`;
                    //console.log(sql);
                    
                    db.query(sql,
                        function (err: any, result: any) {
                            if (err) {
                                console.log(err);
                            } else {
                                //console.log(result);
                                if (result.affectedRows) res.json({ result: true }); else res.json({ result: false, msg: `회원가입에 실패했습니다.` });
                            }
                        }
                    );
                }
            }
        );
    } else if (db.escape(req.body.module) === "'userUpdate'") {
        sql = `update users set 
                        email            = ${db.escape(req.body.email)}, 
                        password         = HEX(AES_ENCRYPT(${db.escape(req.body.password)}, '${process.env.DB_SECRET_KEY}')), 
                        name             = ${db.escape(req.body.name)}, 
                        nick             = ${db.escape(req.body.nick)}
                    where id = ${db.escape(req.body.id)}`;
    } else if (db.escape(req.body.module) === "'findUser'") {
        sql = `select id, email, name, nick, image, created  from users where email = ${db.escape(req.body.email)};`;
    } else if (db.escape(req.body.module) === "'findNick'") {
        sql = `select id from users where nick = ${db.escape(req.body.nick)} and email = ${db.escape(req.body.email)};`;
    } else if (db.escape(req.body.module) === "'userInsert'") {
        sql = `insert into users set 
                    id               = ${db.escape(req.body.id)}, 
                    email            = ${db.escape(req.body.email)}, 
                    name             = ${db.escape(req.body.name)}, 
                    nick             = ${db.escape(req.body.nick)},
                    image            = ${db.escape(req.body.image)},
                    created          = ${db.escape(req.body.created)};`;
    }
    //console.log(sql);

    if (db.escape(req.body.module) !== "'userLogin'" && db.escape(req.body.module) !== "'userJoin'") {
        db.query(sql,
            function (err: any, result: any) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(result);

                    res.json(result);
                }
            }
        );
    }

    //db.end();
}