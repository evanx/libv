
const logger = Loggers.create(__filename, 'info');

export function thenElse(truthy, thenValue, elseValue) {
   if (truthy) {
      return thenValue;
   } else {
      return elseValue;
   }
}

export function elseFn(truthy, elseValue, then) {
   if (!truthy) {
      return value;
   } else {
      return then(truthy);
   }
}
