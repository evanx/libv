
export function getRoutes(expressApp) {
   return expressApp._router.stack
   .filter(middleware => middleware.route)
   .map(middleware => middleware.route.path);
}
