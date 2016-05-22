
const logger = Loggers.create(__filename, 'info');

export function isDefined(value) {
   return value !== undefined;
}

export function isInteger(value) {
   return parseInt(value) === value;
}
