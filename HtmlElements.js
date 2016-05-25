
const logger = Loggers.create(__filename, 'info');

const SelfClosingElementNames = Strings.splitSpace(`
   area base basefont br hr input img link meta
   `
);

const ElementNames = Strings.splitSpace(`
   html head meta link script body
   header nav h1 h2 h3 h4 h5 h6
   section article aside
   table thead tbody th tr td
   div span pre p hr br img i b tt
   `
);

class Element {

   constructor({name, attributes, children}) {
   }

}

class HtmlElement {

   constructor({name, attributes, children}) {
   }

   render() {
      return '';
   }
}

export function html(strings, ...values) {
   strings = strings.map(string => string.replace(/^\s*\n\s*/, ''));
   logger.debug('html', strings, values);
   let previousString = strings[0];
   return values.reduce((result, value, index) => {
      const nextString = strings[index + 1];
      if (!Values.isDefined(value)) {
         value = '';
      }
      try {
         if (lodash.endsWith(previousString, '=')) {
            if (/^["']/.test(nextString)) {
               throw {message: 'quotes'};
            } else if (lodash.isString(value)) {
               value = '"' + value + '"';
            } else {
               throw {message: typeof value};
            }
         }
         if (lodash.endsWith(previousString, '=\'')) {
            if (!/^'/.test(nextString)) {
               throw {message: 'missing closing single quote'};
            } else if (lodash.isString(value)) {
            } else {
               throw {message: typeof value};
            }
         }
         if (lodash.endsWith(previousString, '=\"')) {
            if (!/^"/.test(nextString)) {
               throw {message: 'missing closing double quote'};
            } else if (lodash.isString(value)) {
            } else {
               throw {message: typeof value};
            }
         }
         if (lodash.isArray(value)) {
            value = lodash.flatten(value).join('\n');
         } else if (lodash.isString(value)) {
         } else {
            throw {message: 'value type: ' + typeof value};
         }
      } catch (err) {
         logger.error('html', err.message, {previousString, value, nextString});
         throw err;
      }
      previousString = nextString;
      return result + value + nextString;
   }, previousString);
}

export function renderPath(path) {
   if (lodash.isArray(path)) {
      return ['', ...path].join('/');
   } else if (lodash.isString(path)) {
      return path;
   } else {
      return '/routes';
      logger.warn('path type', typeof path);
   }
}

export function element(name, attributes, ...args) {
   const content = [];
   if (!attributes) {
      content.push(`<${name}/>`);
   } else {
      assert(lodash.isObject(attributes), 'attributes: ' + name);
      const children = lodash.compact(lodash.flatten(args));
      const attrs = Objects.kvs(attributes)
      .filter(kv => kv.key !== 'meta')
      .filter(kv => kv.value && kv.value.toString())
      .map(kv => ({key: kv.key, value: kv.value.toString()}))
      .map(kv => `${kv.key}="${kv.value}"`);
      logger.debug('element', name, attrs);
      if (attrs.length) {
         if (children.length) {
            content.push(`<${name} ${attrs.join(' ')}>`);
            content.push(lodash.flatten(children));
            content.push(`</${name}>`);
         } else {
            content.push(`<${name} ${attrs.join(' ')}/>`);
         }
      } else {
         if (children.length) {
            content.push(`<${name}>`);
            content.push(lodash.flatten(children));
            content.push(`</${name}>`);
         } else if (attributes.meta === 'optional') {
         } else {
            content.push(`<${name}/>`);
         }
      }
   }
   return lodash.flatten(content).join('');
}

function _style(name, style, ...children) {
   logger.debug('_style', name, style, children);
   if (typeof style !== 'string') {
      throw {message: 'style type: ' + typeof style, name, style, children};
   } else {
      return element(name, {style}, ...children);
   }
}

function _content(name, ...children) {
   return element(name, {}, ...children);
}

export function createElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => element(name, ...args);
      return result;
   }, {});
}

export function createStyleElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => _style(name, ...args);
      return result;
   }, {});
}

export function createOptionalStyleElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (style, ...args) => element(name, {meta: 'optional', style}, ...args);
      return result;
   }, {});
}

export function createOptionalContentElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => element(name, {meta: 'optional'}, ...args);
      return result;
   }, {});
}


export function createContentElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => _content(name, ...args);
      return result;
   }, {});
}

export function assignDeps(g) {
   g.He = createElements();
   g.Hs = createStyleElements();
   g.Hso = createOptionalStyleElements();
   g.Hc = createContentElements();
   g.Hco = createOptionalContentElements();
   g.Hx = module.exports;
   g.html = html;
}
