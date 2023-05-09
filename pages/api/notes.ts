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
                        tags text DEFAULT NULL COMMENT 'TAGS',
                        title varchar(255) DEFAULT NULL COMMENT '제목',
                        description longtext DEFAULT NULL COMMENT '내용',
                        user varchar(255) NOT NULL DEFAULT '' COMMENT '유저',
                        created datetime NOT NULL COMMENT '등록일시',
                    PRIMARY KEY (idx),
                    KEY id (id),
                    KEY title (title),
                    KEY user (user)
                ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='NOTES 테이블';`;
    } else if (db.escape(req.body.module) === "'notesLoad'") {
        sql = `select id, tags, title, description, created from notes 
                    where user = ${db.escape(req.body.user)} 
                    order by idx desc;
                select id, title, color from tags 
                    where category = 'note' and user = ${db.escape(req.body.user)} 
                    order by seq asc, idx asc;`;
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
                        created          = '${fullDate}'`;
        } else {
            sql = `update notes set 
                            tags             = ${db.escape(req.body.tags)}, 
                            title            = ${db.escape(req.body.title)}, 
                            description      = ${db.escape(req.body.description)}
                        where id = ${db.escape(req.body.id)}`;
        }
    } else if (db.escape(req.body.module) === "'tagDelete'") {
        sql = `delete from notes where id = ${db.escape(req.body.id)}`;
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