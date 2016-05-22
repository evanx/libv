
const logger = Loggers.create(module.filename, 'info');

const IntegerKeys = ['lineHeight'];

export function renderStyles(object) {
   return Objects.translate(object, {}, (key, value) => {
      return {key, value: renderKeys(value)};
   });
}

export function renderKeys(object) {
   return Object.keys(object).map(key => {
      return {key: renderKey(key), value: renderKeyValue(key, object[key])};
   }).map(entry => {
      return `${entry.key}:${entry.value}`
   }).join(';');
}

function renderKey(key) {
   return lodash.kebabCase(key);
}

function renderKeyValue(key, value) {
   if (Values.isInteger(value)) {
      if (IntegerKeys.includes(key)) {
         return value.toString();
      } else {
         return `${value}px`;
      }
   } else if (lodash.isArray(value)) {
      return value.map(v => renderKeyValue(key, v)).join(' ');
   }
   return value;
}
