
import fs from 'fs';
import mkdirpf from 'mkdirp';
import * as Promises from './Promises';

export function mkdirp(directory) {
   return Promises.promisify(callback => {
      mkdirpf(directory, callback);
   });
}

export function readFile(file) {
   return Promises.promisify(callback => fs.readFile(file, callback));
}
