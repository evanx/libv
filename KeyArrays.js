
const logger = Loggers.create(__filename, 'info');

export function reduceAssign(keys, producer, initialValue) {
   return keys.reduce((object, key) => Objects.assignKey(object, key, producer(key)), initialValue);
}
