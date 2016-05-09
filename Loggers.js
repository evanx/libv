
import irequest from 'request';

const config = {
   errorLimit: 30000
};

// promises

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

export function request(options) {
   return promisify(callback => irequest(options, callback));
}

export function delay(millis) {
   return new Promise((resolve, reject) => {
      setTimeout(() => {
         resolve();
      }, millis);
   });
}

//

class Logger {

   constructor(options) {
      Object.assign(options, {level: global.loggerLevel});
      Object.assign(this, options);
      this.logger = bunyan.createLogger({name: this.name, level: this.level});
      this.logger.info('create', global.loggerLevel, options);
   }

   ndebug() {
   }

   dwarn(...args) {
      if (global.loggerLevel === 'debug') {
         this.logger.warn('DEBUG', ...args);
      }
   }

   debug(...args) {
      this.logger.debug(...args);
   }

   info(...args) {
      this.logger.info(...args);
   }

   warn(...args) {
      this.logger.warn(...args);
   }

   async error(...args) {
      this.logger.error(...args);
      const now = new Date().getTime();
      if (this.errorTime && now - this.errorTime > config.errorLimit) {
         this.errorTime = now;
         const loggingUrl = global.loggingUrl;
         if (loggingUrl) {
            const message = JSON.stringify(this.map(...args));
            const url = [loggingUrl, 'lpushtrim', message, 100].join('/');
            try {
               await request({url, method: 'head'});
            } catch (err) {
               logger.warn('remote', loggingUrl, err);
            }
         }
      }
   }

   map(...args) {
      return args.map(arg => {
         if (arg === undefined) {
         } else if (arg === null) {
         } else if (arg === '') {
         } else if (typeof arg === 'string') {
         } else if (typeof arg === 'number') {
         } else if (lodash.isArray(arg)) {
         } else if (arg.message) {
            arg = arg.message;
         } else if (arg.constructor) {
            if (arg.constructor.name) {
               arg = '@' + arg.constructor.name;
            } else {
               arg = '?object';
            }
         } else {
            arg = '?' + typeof arg;
         }
         return arg;
      });
   }
}

export function create(filename, level) {
   let name = filename;
   const nameMatch = filename.match(/([^\/\\]+)\.[a-z0-9]+/);
   if (nameMatch) {
      name = nameMatch[1];
   }
   return new Logger({name, level});
};
