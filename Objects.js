
const logger = Loggers.create(__filename, 'info');

export function kvs(object) {
   return Object.keys(object).map(key => kv(object, key));
}

export function kv(object, key) {
   assert.equal(typeof key, 'string');
   return {key, value: object[key]};
}

export function translate(object, other, fn) {
   Object.keys(object).forEach(key => {
      const entry = fn(key, object[key], other);
      if (!entry) {
      } else if (!Values.isDefined(entry.key)) {
      } else if (!Values.isDefined(entry.value)) {
      } else {
         other[entry.key] = entry.value;
      }
   });
   return other;
}
