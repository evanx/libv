// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redexutil/LICENSE

import requestf from 'request';

const logger = Loggers.create(__filename, 'debug');

export function json(options) {
   options = processOptions(options);
   options.json = true;
   logger.debug('json', options.url);
   return request(options);
}

export function request(options) {
   options = processOptions(options);
   logger.ndebug('request', options);
   let startTime = new Date().getTime();
   return new Promise((resolve, reject) => {
      requestf(options, (err, response, content) => {
         let duration = Millis.getElapsedDuration(startTime);
         logger.debug('response', options.url || options, err || response.statusCode, Millis.formatDuration(duration));
         if (err) {
            err.options = options;
            err.duration = duration;
            reject(err);
         } else if (response.statusCode !== 200) {
            reject({options: options, statusCode: response.statusCode});
         } else {
            if (duration > options.slow) {
               logger.warn('request slow', Millis.formatDuration(duration), options.url);
            }
            resolve(content);
         }
      });
   });
}

export function response(options) {
   options = processOptions(options);
   logger.debug('request', options);
   let startTime = new Date().getTime();
   return new Promise((resolve, reject) => {
      requestf(options, (err, response, content) => {
         let duration = Millis.getElapsedDuration(startTime);
         if (duration > options.slow) {
            logger.warn('request slow', options.url, err || response.statusCode, Millis.formatDuration(duration));
         } else {
            logger.debug('response', options, err || response.statusCode, Millis.formatDuration(duration));
         }
         if (err) {
            reject(err);
         } else if (response.statusCode === 200) {
            resolve([response, content]);
         } else {
            resolve([response]);
         }
      });
   });
}

export function head(options) {
   options = processOptions(options);
   options.method = 'HEAD';
   logger.debug('head', options);
   return new Promise((resolve, reject) => {
      requestf(options, (err, response) => {
         logger.debug('response', options.url, err || response.statusCode);
         if (err) {
            reject(err);
         } else {
            resolve(response);
         }
      });
   });
}

function processOptions(options) {
   if (typeof options === 'string') {
      return {url: options, slow: 8000};
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
      return options;
   } else {
      throw {message: 'Invalid request options'};
   }
}
