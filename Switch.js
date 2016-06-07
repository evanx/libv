
const logger = Loggers.create(__filename, 'info');

export function on(defaultValue, ...clauses) {
   const [match, result] = clauses.find(clause => clause[0]) || [];
   if (!match) {
      return If.callable(defaultValue, match);
   } else {
      return If.callable(result, match);
   }
}
