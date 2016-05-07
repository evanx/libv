

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

export function map(values, fn) {
   return Promise.all(values.map(fn));
}

export function delay(millis) {
   return new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve();
      }, millis);
   });
}

export function timeout(timeout, reason, promise) {
   if (timeout) {
      return new Promise((resolve, reject) => {
         logger.error('timeout', typeof promise); // TODO
         promise.then(resolve, reject);
         setTimeout(() => {
            reject(`${reason} (${timeout}ms)`);
         }, timeout);
      });
   } else {
      return promise;
   }
}
