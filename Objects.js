
const logger = Loggers.create(__filename, 'info');

export function translate(object, fn) {
   let result = {};
   Object.keys(object).forEach(key => {
      const entry = fn(key, object[key], result);
      if (!entry) {
      } else if (entry.result) {
         result = entry.result;
      } else if (entry.key !== undefined) {
         if (entry.value !== undefined) {
            result[entry.key] = entry.value;
         }
      } else {
      }
   });
   return result;
}
