
import fs from 'fs';
import mkdirpf from 'mkdirp';
import * as Promises from './Promises';

export function mkdirp(directory) {
   return Promises.promisify(callback => {
      mkdirpf(directory, callback);
   });
}

export function stat(file) {
   return Promises.promisify(callback => fs.stat(file, callback));
}

export function existsFile(file) {
   return stat(file).then(stats => stats.isFile()).catch(err => {
      return false;
   });
}

export function readFile(file) {
   return Promises.promisify(callback => fs.readFile(file, callback));
}

export function writeFile(file, content) {
   return Promises.promisify(callback => fs.writeFile(file, content, callback));
}
