import type { NextApiRequest, NextApiResponse } from 'next';
const db = require('../../config/db.ts');

export default function test(req : NextApiRequest, res : NextApiResponse) {
    const sql = "SELECT * FROM movie";

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