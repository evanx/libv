// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redexutil/LICENSE

const logger = Loggers.create(__filename, 'info');

function getMessage(millis, message) {
   return message + ': ' + millis;
}

const factors = {
   ms: 1,
   s: 1000,
   m: 1000*60,
   h: 1000*60*60,
   d: 1000*60*60*24
};

var that = {
   format(millis) { // TODO deprecate
      return that.formatDuration(millis);
   },
   formatTimestamp(epoch) {
      return new Date(epoch).toISOString();
   },
   formatDuration(millis) {
      if (millis < factors.s) {
         return '' + millis + 'ms';
      } else if (millis < factors.m) {
         return '' + parseInt(millis/factors.s) + 's';
      } else if (millis < factors.h) {
         return '' + parseInt(millis/factors.m) + 'm';
      } else if (millis < factors.d) {
         return '' + parseInt(millis/factors.h) + 'h';
      } else {
         return '' + parseInt(millis/factors.d) + 'd';
      }
   },
   fromSeconds(seconds) {
      return seconds * factors.s;
   },
   fromMinutes(minutes) {
      return minutes * factors.m;
   },
   fromHours(hours) {
      return hours * factors.h;
   },
   fromDays(days) {
      return days * factors.d;
   },
   time(date) {
      if (date) {
         return data.getTime();
      } else {
         return new Date().getTime();
      }
   },
   getElapsedDuration(time, currentTime) {
      if (!currentTime) {
         currentTime = new Date().getTime();
      }
      if (currentTime > time) {
         return currentTime - time;
      } else {
         return 0;
      }
   },
   isElapsed(time, duration, currentTime) {
      if (!currentTime) {
         currentTime = new Date().getTime();
      }
      if (duration) {
         return currentTime - time > duration;
      } else {
         return currentTime > time;
      }
   },
   formatElapsed(time) {
      let currentTime = new Date().getTime();
      if (time > currentTime) {
         return that.formatDuration(time - currentTime);
      } else {
         return '0ms';
      }
   },
   parse(millis, defaultValue) {
      if (lodash.isNumber(millis)) {
         return millis;
      } else if (!lodash.isString(millis)) {
         logger.warn('parse typeof: ' + typeof millis);
         return defaultValue;
      }
      if (/^[0-9]+$/.test(millis)) {
         return parseInt(millis);
      }
      let match = millis.match(/^([0-9]+)([a-z]*)$/);
      if (match.length === 3) {
         assert(factors[match[2]], 'factor: ' + match[2]);
         let value = parseInt(match[1]);
         let factor = factors[match[2]];
         return value * factor;
      }
      return defaultValue;
   },
   assert(millis, message) {
      message = message + ': ' + millis;
      assert(millis, message);
      let value = that.parse(millis, -1);
      assert(value >= 0, message + ': ' + value);
      return value;
   }
}

module.exports = that;
