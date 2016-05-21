
const logger = Loggers.create(__filename, 'info');

export function isDefined(value) {
   return value !== undefined;
}

export function filterKeys(object, other, fn) {
   return Object.keys(object).filter(key => {
      return fn(key, object[key], other[key]);
   });
}
