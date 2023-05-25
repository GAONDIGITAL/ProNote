import type { NextApiRequest, NextApiResponse } from "next";
import formidable from 'formidable';
import path from "path";
import fs from 'fs';
import moment from 'moment';

const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db.ts');
 
export const config = {
    api: {
        bodyParser: false,
    },
}
 
export const upload = async (req: NextApiRequest, res: NextApiResponse) => {
    const images = ['jpg', 'jpeg', 'png', 'gif'];
    const storagePath = 'public/upload';
    const uploadDir = `${storagePath}/tmp`;
    let sql: string;

    const fileData = await new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm({
            uploadDir: uploadDir,
            //maxFileSize: 5 * 1024 * 1024,
            keepExtensions: true,
            multiples: true,
        });

        form.parse(req, (err: any, fields: any, files: any) => {
            if (err) {
                res.json({ result: false, msg: `${err}` });
                //res.status(500).json({ result: err });
            }

            //console.log(err, fields, files);
            
            const dir = `public/upload/${fields.user}`;
            !fs.existsSync(dir) && fs.mkdirSync(dir);

            moment.locale('ko');
            const now        = moment();
            const fullDate   = now.format('YYYY-MM-DD HH:mm:ss');
            let sqlArray: string[] = [];

            files.files.map((file: any) => {
                //console.log(file);
                /*_events: [Object: null prototype],
                _eventsCount: 1,
                _maxListeners: undefined,
                lastModifiedDate: 2023-05-23T12:13:45.258Z,
                filepath: 'C:\\Users\\MCS\\AppData\\Local\\Temp\\1af391f67db9ef4a0b8a6ca09.hwp',
                newFilename: '1af391f67db9ef4a0b8a6ca09.hwp',
                originalFilename: '근접전투술진도표.hwp',
                mimetype: 'application/haansofthwp',
                hashAlgorithm: false,
                size: 19456,
                _writeStream: [WriteStream],
                hash: null,
                [Symbol(kCapture)]: false*/

                const tmpPath = `${uploadDir}/${file.newFilename}`;
                const newPath = `${dir}/${file.newFilename}`;
                fs.renameSync(tmpPath, newPath);

                const fileName = file.newFilename.split('.');
                const fileExtension = fileName[fileName.length - 1];
                
                sqlArray.push(`('${uuidv4()}', '${fields.parentId}', '${file.originalFilename}', '${file.newFilename}', '${fileExtension}', '${file.size}', '${fullDate}', '${fields.user}')`);
            });

            sql = `insert into files (id, parent_id, source_name, name, extension, size, created, user) values ${sqlArray.join(',')};`;

            db.query(sql,
                function (err: any, result: any) {
                    if (err) {
                        console.log(err);
                    } else {
                        //console.log(result);
                        sql = `select id, source_name as sourceName, name, extension, size, download_count as downloadCount, created from files where user = '${fields.user}' and parent_id = '${fields.parentId}'`;

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
                }
            );
        });
    });
};
 
export default upload;