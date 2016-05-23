
const logger = Loggers.create(module.filename, 'debug');

const IntegerKeys = ['lineHeight'];
const CssKeys = Strings.splitSpace(`
color background
width height
display position cursor
`);
const CssKeyPrefixes = Strings.splitSpace(`
margin padding border
font background min
`);
const CssKeyRegex = new RegExp(createCssKeyRegexString());

function createCssKeyRegexString() {
   const prefixes = CssKeys.concat(CssKeyPrefixes);
   return ['^(', prefixes.join('|'), ')'].join();
}

export function renderStyles(object) {
   const styles = renderKeys(object, 'root');
   logger.debug('styles', styles);
   return styles;
}

export function renderKeys(object, key) {
   if (Object.keys(object).filter(key => isCssKey(key)).length) {
      return lodash.compact(Object.keys(object).map(key => {
         return {key: renderKey(key), value: renderValue(object[key], key)};
      }).map(entry => {
         if (entry.key && lodash.isString(entry.value)) {
            return `${entry.key}:${entry.value}`
         } else {
            logger.warn('renderKeys', entry.key, typeof entry.value);
         }
      })).join(';');
   } else {
      return Object.keys(object).reduce((result, key) => {
         result[key] = renderValue(object[key], key);
         return result;
      }, {});
   }
}

export function renderValue(value, key) {
   if (!Values.isDefined(value)) {
      logger.debug('renderValue empty', key);
      return '';
   } else if (Values.isInteger(value)) {
      if (IntegerKeys.includes(key)) {
         return value.toString();
      } else {
         return `${value}px`;
      }
   } else if (lodash.isString(value)) {
      return value;
   } else if (lodash.isArray(value)) {
      return value.map(v => renderValue(v, key)).join(' ');
   } else if (lodash.isObject(value)) {
      return renderKeys(value);
   } else {
      throw {message: 'Unsupported type: ' + typeof value, key};
   }
}

function renderKey(key) {
   return lodash.kebabCase(key);
}

function isCssKey(key) {
   return IntegerKeys.includes(key)
   || key.match(CssKeyRegex);
}
