// Copyright (c) 2015, Evan Summers (twitter.com/evanxsummers)
// ISC license, see http://github.com/evanx/redexutil/LICENSE

const logger = Loggers.create(__filename, 'info');

const factors = {
   s: 1,
   m: 60,
   h: 60*60,
   d: 60*60*24
};

const that = {
   factors: factors,
   format(seconds) {
      if (seconds < factors.m) {
         return '' + seconds + 's';
      } else if (seconds < factors.h) {
         return '' + parseInt(seconds/factors.m) + 'm';
      } else if (seconds < factors.d) {
         return '' + parseInt(seconds/factors.h) + 'h';
      } else {
         return '' + parseInt(seconds/factors.d) + 'd';
      }
   },
   parse(string, defaultValue) {
      const [value, factorKey] = string.match(/^([0-9]+)([a-z]?)$/) || [];
      if (!Values.isDefined(value)) {
         throw new ValidationError(`invalid seconds`);
      } else if (factorKey) {
         const factor = factors[factorKey];
         if (!factor) {
            throw new ValidationError(`invalid seconds factor key: ${factorKey}`);
         }
         return value * factor;
      } else {
         return value;
      }
   },
   parsePropDefault(object, key, defaultValue) {
      try {
         return that.parse(object[key], defaultValue);
      } catch (err) {
         throw new ValidationError(`${key}: ${err.message}`);
      }
   },
   parseOptionalKeyDefault(object, key, defaultValue) {
      if (!object) return defaultValue;
      return that.parsePropDefault(object, key, defaultValue);
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
   assert(seconds, message) {
      message = message + ': ' + seconds;
      assert(seconds, message);
      let value = that.parse(seconds, -1);
      assert(value >= 0, message + ': ' + value);
      return value;
   }
};

function getMessage(seconds, message) {
   return message + ': ' + seconds;
}

module.exports = that;
