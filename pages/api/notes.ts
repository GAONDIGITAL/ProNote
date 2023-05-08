import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db.ts');
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(import('react-quill'), { ssr: false });

let sql: string;

export default function tags(req : NextApiRequest, res : NextApiResponse) {
    if (db.escape(req.body.module) === "'truncateNotes'") {
        sql = `DROP TABLE IF EXISTS notes;
                CREATE TABLE notes (
                        idx int(11) NOT NULL AUTO_INCREMENT COMMENT '유니크 키',
                        id varchar(255) NOT NULL COMMENT '코드',
                        tags varchar(255) NOT NULL COMMENT 'TAGS',
                        title varchar(255) DEFAULT NULL COMMENT '제목',
                        description longtext DEFAULT NULL COMMENT '내용',
                        user varchar(255) NOT NULL DEFAULT '' COMMENT '유저',
                        created datetime NOT NULL COMMENT '등록일시',
                    PRIMARY KEY (idx),
                    KEY id (id),
                    KEY title (title),
                    KEY user (user)
                ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='NOTES 테이블';`;
    } else if (db.escape(req.body.module) === "'tagsLoad'") {
        sql = `select id, title, color from tags 
                    where category = ${db.escape(req.body.category)} and user = ${db.escape(req.body.user)} 
                    order by seq asc, idx asc`;
    } else if (db.escape(req.body.module) === "'tagAdd'") {
        moment.locale('ko');
        const now        = moment();
        const fullDate   = now.format('YYYY-MM-DD HH:mm:ss');
        sql = `insert into tags set 
                    category = ${db.escape(req.body.category)}, 
                    id     = '${uuidv4()}', 
                    user     = ${db.escape(req.body.user)}, 
                    title    = ${db.escape(req.body.title)}, 
                    color    = ${db.escape(req.body.color)}, 
                    seq      = ${db.escape(req.body.seq)},
                    created  = '${fullDate}'`;
    } else if (db.escape(req.body.module) === "'tagsSort'") {
        let sqlArray: string[] = [];

        req.body.tagsIdList.map((id: string, index: number) => {
            //console.log(id);
            sqlArray.push(`update tags set seq = '${index}' where id = ${db.escape(id)}`);
        });

        sql = sqlArray.join(';');
    } else if (db.escape(req.body.module) === "'tagUpdate'") {
        sql = `update tags set 
                        color = ${db.escape(req.body.color)},
                        title = ${db.escape(req.body.title)}
                    where id = ${db.escape(req.body.id)}`;
    } else if (db.escape(req.body.module) === "'tagDelete'") {
        sql = `delete from tags where id = ${db.escape(req.body.id)}`;
    }
    //console.log(sql);

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

    //db.end();
}