
import fs from 'fs';

export function readFile(file) {
   return new Promise((resolve, reject) => {
      fs.readFile(file, (err, content) => {
         if (err) {
            reject(err);
         } else {
            resolve(content);
         }
      });
   });
}
