import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db.ts');

let sql: string;

export default function tags(req : NextApiRequest, res : NextApiResponse) {
    if (db.escape(req.body.module) === "'tagsLoad'") {
        sql = `select code, title, color from tags 
                    where category = ${db.escape(req.body.category)} and user = ${db.escape(req.body.user)} 
                    order by seq asc, idx asc`;
    } else if (db.escape(req.body.module) === "'tagAdd'") {
        moment.locale('ko');
        const now        = moment();
        const fullDate   = now.format('YYYY-MM-DD HH:mm:ss');
        const code = 'AAAAAAAAAA';
        sql = `insert into tags set 
                    category = ${db.escape(req.body.category)}, 
                    code     = '${uuidv4()}', 
                    user     = ${db.escape(req.body.user)}, 
                    title    = ${db.escape(req.body.title)}, 
                    color    = ${db.escape(req.body.color)}, 
                    seq      = ${db.escape(req.body.seq)},
                    created  = '${fullDate}'`;
    } else if (db.escape(req.body.module) === "'tagsSort'") {
        let sqlArray: string[] = [];

        req.body.tagsIdList.map((id: string, index: number) => {
            //console.log(id);
            sqlArray.push(`update tags set seq = '${index}' where code = ${db.escape(id)}`);
        });

        sql = sqlArray.join(';');
    } else if (db.escape(req.body.module) === "'tagUpdate'") {
        sql = `update tags set 
                        color = ${db.escape(req.body.color)},
                        title = ${db.escape(req.body.title)}
                    where code = ${db.escape(req.body.code)}`;
    } else if (db.escape(req.body.module) === "'tagDelete'") {
        sql = `delete from tags where code = ${db.escape(req.body.code)}`;
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