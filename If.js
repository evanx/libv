
const logger = Loggers.create(__filename, 'info');

export function defined(value) {
   return value !== undefined;
}

export function callable(value, ...args) {
   if (lodash.isFunction(value)) {
      return value(...args);
   } else {
      return value;
   }
}

export function thenElse(truthy, then, else_) {
   if (truthy) {
      return [true, truthy, callable(then, truthy)];
   } else {
      return [false, truthy, callable(then, truthy)];
   }
}

export function then(truthy, then) {
   if (truthy) {
      return [true, truthy, callable(then, truthy)];
   } else {
      return [false, truthy];
   }
}
