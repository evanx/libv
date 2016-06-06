
import assert from 'assert';

function format(type, options) {
   return type + ': ' + options.toString();
}

exports = {
   hasOwnProperty(object, key) {
      if (object.hasOwnProperty(key)) throw new ValidationError(`missing: ${key}`);
      return object;
   },
   hasFunction(object, key) {
      if (object.hasOwnProperty(key)) throw new ValidationError(`missing: ${key}`);
      const value = object[key];
      if (!lodash.isFunction(value)) throw new ValidationError(`missing function: ${key}`);
      return object;
   },
   parseIntDefault(object, key, defaultValue) {
      const value = object[key];
      if (!Values.isDefined(key)) return defaultValue;
      const parsedValue = parseInt(value);
      if (parsedValue.toString() === value.toString()) {
         return parsedValue;
      }
      throw new ValidationError(`integer ${key}`);
   }
};
