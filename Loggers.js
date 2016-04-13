
export function createLogger(filename, level) {
   let name = filename;
   const nameMatch = filename.match(/([^\/\\]+)\.[a-z0-9]+/);
   if (nameMatch) {
      name = nameMatch[1];
   }
   const logger = bunyan.createLogger({name: name, level: level || global.loggerLevel});
   logger.debug('createLogger', name, level);
   return Object.assign(logger, {
      ndebug: () => {
      }
   });
};
