
const logger = Loggers.create(__filename, 'info');

export function kvs(object) {
   return Object.keys(object).map(key => kv(object, key));
}

export function kv(object, key) {
   assert.equal(typeof key, 'string');
   return {key, value: object[key]};
}
