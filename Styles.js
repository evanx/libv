
const logger = Loggers.create(module.filename, 'info');

const IntegerKeys = ['lineHeight'];
const CssKeys = Strings.splitSpace(`
   color background
   width height
   cursor
   display position float clear
   textDecoration
   `
);
const CssKeyPrefixes = Strings.splitSpace(`
   text
   margin padding border
   font background min
   `
);

const CssKeyRegex = new RegExp(createCssKeyRegexString());

function test() {
   logger.debug('CssKeys', CssKeys.join('|'));
   logger.debug('CssKeyRegex', createCssKeyRegexString());
}

if (process.env.NODE_ENV !== 'production') {
   test();
}

function createCssKeyRegexString() {
   const prefixes = CssKeys.concat(CssKeyPrefixes);
   return ['^(', prefixes.join('|'), ')'].join('');
}

// exports

export function renderStyles(object) {
   const styles = renderKeys(object, 'root');
   logger.debug('styles', styles);
   return styles;
}

export function renderStyleSheet(object) {
   return Object.keys(object)
   .map(key => Objects.kv(object, key))
   .filter(kv => lodash.isString(kv.value))
   .map(kv => [kv.key, '{',  kv.value, '}'].join(' '))
   .join('\n');
}

const userAgentCache = new Map();

function getUserAgentType(key, ua) {
   if (ua.match(/Mobile/)) {
      return 'm';
   } else {
      return 'o';
   }
}

export function getCachedUserAgentStyleSheet(options) {
   const {styles, key, ua} = options;
   assert.equal(typeof styles[key], 'object', 'css stylesheet object');
   options.uaType = getUserAgentType(key, ua);
   options.uaKey = [options.uaType, key].join(':');
   const entry = userAgentCache.get(options.uaKey);
   if (entry) {
      if (entry.expire && entry.expire < new Date().getTime()) {
      } else if (entry.value) {
         return entry.value;
      }
   }
   return setUserAgentStyleSheet(options);
}

export function setUserAgentStyleSheet({styles, key, uaKey, uaType}) {
   const entry = {expire: 0};
   entry.value = getUserAgentStyleSheet(styles[key]);
   if (uaType === 'o') {
      const mediaKey = '_768';
      const mediaStyles = styles[mediaKey];
      if (mediaStyles) {
         const styleSheet = mediaStyles[key];
         if (!styleSheet) {
            logger.debug('stylesheet empty', key, mediaKey);
         } else {
            entry.value += getUserAgentStyleSheet(styleSheet);
         }
      }
   }
   userAgentCache.set(uaKey, entry);
   return entry.value;
}

export function getUserAgentStyleSheet(object) {
   return Object.keys(object)
   .map(key => Objects.kv(object, key))
   .filter(kv => lodash.isString(kv.value))
   .map(kv => [kv.key, '{',  kv.value, '}'].join(' '))
   .join('\n');
}

export function renderUserAgentStylesheet(userAgent, object) {
   return Object.keys(object)
   .map(key => Objects.kv(object, key))
   .filter(kv => lodash.isString(kv.value))
   .map(kv => [kv.key, '{',  kv.value, '}'].join(' '))
   .join('\n');
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
   } else if (lodash.isNumber(value)) {
      return value.toString();
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
