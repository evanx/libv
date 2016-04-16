
export function getRoutes(expressApp) {
   return expressApp._router.stack
   .filter(middleware => middleware.route)
   .map(middleware => middleware.route.path);
}

export function listen(expressApp, port) {
   return Promises.promisify(callback => expressApp.listen(port, callback));
}
