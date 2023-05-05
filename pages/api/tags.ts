import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db.ts');

export default function tags(req : NextApiRequest, res : NextApiResponse) {
    let sql;

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
                    code = '${uuidv4()}', 
                    user = ${db.escape(req.body.user)}, 
                    title = ${db.escape(req.body.title)}, 
                    color = ${db.escape(req.body.color)}, 
                    created = '${fullDate}'`;
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