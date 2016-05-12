

export function matches(string, regex) {
   const match = string.match(regex);
   if (!match) {
      return [];
   } else {
      return match.slice(1);
   }
}
