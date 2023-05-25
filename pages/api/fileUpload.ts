import type { NextApiRequest, NextApiResponse } from "next";
import formidable from 'formidable';
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

            if (files.files.length === 2 && files.files[0].originalFilename === files.files[1].originalFilename) {
                const tmpPath = `${uploadDir}/${files.files[0].newFilename}`;
                const newPath = `${dir}/${files.files[0].newFilename}`;
                fs.renameSync(tmpPath, newPath);

                const fileName = files.files[0].newFilename.split('.');
                const fileExtension = fileName[fileName.length - 1];
                
                sqlArray.push(`('${uuidv4()}', '${fields.parentId}', '${files.files[0].originalFilename}', '${files.files[0].newFilename}', '${fileExtension}', '${files.files[0].size}', '${fullDate}', '${fields.user}')`);

                fs.unlinkSync(`${uploadDir}/${files.files[1].newFilename}`);
            } else {
                files.files.map((file: any) => {
                    //console.log(file);

                    const tmpPath = `${uploadDir}/${file.newFilename}`;
                    const newPath = `${dir}/${file.newFilename}`;
                    fs.renameSync(tmpPath, newPath);

                    const fileName = file.newFilename.split('.');
                    const fileExtension = fileName[fileName.length - 1];
                    
                    sqlArray.push(`('${uuidv4()}', '${fields.parentId}', '${file.originalFilename}', '${file.newFilename}', '${fileExtension}', '${file.size}', '${fullDate}', '${fields.user}')`);
                });
            }

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