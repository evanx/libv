
const logger = Loggers.create(__filename, 'info');

function invokable(value, ...args) {
   if (lodash.isFunction(value)) {
      return value(...args);
   } else {
      return value;
   }
}

export function on(defaultValue, ...clauses) {
   const [match, result] = clauses.find(clause => clause[0]) || [];
   if (!match) {
      return invokable(defaultValue, match);
   } else {
      return invokable(result, match);
   }
}
