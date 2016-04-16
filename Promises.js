

export function promisify(fn) {
   return new Promise((resolve, reject) => {
      fn((err, result) => {
         if (err) {
            reject(err);
         } else {
            resolve(result);
         }
      });
   });
}

export function delay(millis) {
   return new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve();
      }, millis);
   });
}
