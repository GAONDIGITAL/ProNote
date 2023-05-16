import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';

const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db.ts');
//const db_secret_key = process.env.DB_SECRET_KEY as string;

let sql: string;
let totalCount: number;
let totalPage:number;
const rows = 24;

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
        let page = Number(req.body.page);

        sql = `select id, email, AES_DECRYPT(UNHEX(password), '${process.env.DB_SECRET_KEY}') as password, name, nick, image, created  from users where email = ${db.escape(req.body.email)};`;
        //console.log(sql);

        db.query(sql,
            function (err: any, result: any) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(result);
                    if (!result[0]) {
                        res.json({ result: false, msg: `${req.body.email} 회원이 존재하지 않습니다.`});
                    }
                    if (result[0].password !== req.body.email) {
                        res.json({ result: false, msg: `비밀번호가 일치하지 않습니다.`});
                    }

                    // totalCount = Number(result[0].cnt);
                    // totalPage = Math.ceil(totalCount / rows);
                    // if (page < 1) page = 1;
                    // const from_record = (page - 1) * rows;

                    // sql = `select id, tags, title, description, created from notes 
                    //             where user = ${db.escape(req.body.user)} 
                    //             order by idx desc
                    //             limit ${from_record}, ${rows};
                    //         select id, title, color from tags 
                    //             where category = 'note' and user = ${db.escape(req.body.user)} 
                    //             order by seq asc, idx asc;
                    //         select ${totalCount} as totalCount, ${totalPage} as totalPage;`;
                    // //console.log(sql);
                    
                    // db.query(sql,
                    //     function (err: any, result: any) {
                    //         if (err) {
                    //             console.log(err);
                    //         } else {
                    //             //console.log(result);
            
                    //             res.json(result);
                    //         }
                    //     }
                    // );
                }
            }
        );
    } else if (db.escape(req.body.module) === "'noteUpdate'") {
        if (db.escape(req.body.id) === "''") {
            moment.locale('ko');
            const now        = moment();
            const fullDate   = now.format('YYYY-MM-DD HH:mm:ss');
            sql = `insert into notes set 
                        id               = '${uuidv4()}', 
                        tags             = ${db.escape(req.body.tags)}, 
                        title            = ${db.escape(req.body.title)}, 
                        description      = ${db.escape(req.body.description)}, 
                        user             = ${db.escape(req.body.user)},
                        created          = '${fullDate}';`;
        } else {
            sql = `update notes set 
                            tags             = ${db.escape(req.body.tags)}, 
                            title            = ${db.escape(req.body.title)}, 
                            description      = ${db.escape(req.body.description)}
                        where id = ${db.escape(req.body.id)};`;
        }
    } else if (db.escape(req.body.module) === "'notegDelete'") {
        sql = `delete from notes where id = ${db.escape(req.body.id)}`;
    }
    //console.log(sql);

    if (db.escape(req.body.module) !== "'notesLoad'") {
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