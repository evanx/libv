// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redexutil/LICENSE


import requestf from 'request';

const logger = Loggers.create(__filename, 'debug');

function statusCode(err, response) {
   return err || response.statusCode;
}

function createPromise(options) {
   const startTime = new Date().getTime();
   return new Promise((resolve, reject) => {
      requestf(options, (err, response, content) => {
         let duration = Millis.getElapsedDuration(startTime);
         if (duration > options.slow) {
            logger.warn('request slow', options.url, statusCode(err, response), Millis.formatDuration(duration));
         } else {
            logger.debug('response', options, statusCode(err, response), Millis.formatDuration(duration));
         }
         if (err) {
            err.options = options;
            err.duration = duration;
            reject(err);
         } else if (response.statusCode === 200) {
            resolve([response, content]);
         } else {
            resolve([response]);
         }
      });
   });
}

export async function content(options) {
   return contentOptions(processOptions(options));
}

export function json(options) {
   return contentOptions(processOptions(options), {json: true});
}

async function contentOptions(options) {
   let [response, content] = await createPromise(options);
   if (response.statusCode !== 200) {
      throw {options: options, statusCode: response.statusCode};
   }
   return content;
}

export async function head(options) {
   const [response] = await createPromise(options);
   return response;
}

function processOptions(options, assign) {
   if (typeof options === 'string') {
      options = {url: options, slow: 8000};
   } else if (typeof options === 'object') {
      assert(options.url, 'url');
      options.headers = options.headers || {};
      if (options.lastModified) {
         Object.assign(options.headers, {'If-Modified-Since': options.lastModified});
      }
      if (options.username && options.password) {
         let auth = 'Basic ' + new Buffer(options.username + ':' + options.password).toString('base64');
         Object.assign(options.headers, {'Authorization': auth});
      }
      if (!options.slow) {
         options.slow = 8000;
      }
   } else {
      throw {message: 'Invalid request options'};
   }
   if (assign) {
      return Object.assign(options, assign);
   }
   return options;
}
