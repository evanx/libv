
const logger = Loggers.create(__filename, 'info');

const SelfClosingElementNames = Strings.splitSpace(`
   area base basefont br hr input img link meta
   `
);

const ElementNames = Strings.splitSpace(`
   html head meta link script body
   header footer nav section article aside
   h1 h2 h3 h4 h5 h6
   table thead tbody th tr td
   div span pre p a hr br img i b tt
   `
);


// experimental

class Element {

   constructor({name, attributes, children}) {
   }

}

class HtmlElement {

   constructor({name, attributes, children}) {
   }

   toString() {
      return '';
   }
}


// html template literal function

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


// element renderer

export function element(name, attributes, ...args) {
   const content = [];
   if (!attributes) {
      return ['<', name, '/>'].join('');
   }
   const children = lodash.compact(lodash.flatten(args));
   if (!lodash.isObject(attributes)) {
      throw {message: 'attributes: ' + typeof attributes, context: {name, attributes, children}};
   }
   const attrs = Objects.kvs(attributes)
   .filter(kv => kv.key !== 'meta')
   .filter(kv => kv.value && kv.value.toString())
   .map(kv => ({key: kv.key, value: kv.value.toString()}))
   .map(kv => `${kv.key}="${kv.value}"`);
   logger.debug('element', name, attrs);
   return renderElements(name, attributes, attrs, children);
}

function renderElements(name, attributes, attrs, children) {
   if (isMeta(attributes, 'repeat')) {
      if (!children.length) {
         return '';
      } else if (!lodash.isArray(children)) {
         throw {message: 'children type: ' + typeof children, name, attributes, children};
      } else if (lodash.isEmpty(children)) {
         return '';
      } else {
         return lodash.flatten(children).map(child => {
            return renderElementChildren(name, attributes, attrs, child);
         }).join('\n');
      }
   } else {
      return renderElementChildren(name, attributes, attrs, children);
   }
}

function renderElementChildren(name, attributes, attrs, ...children) {
   const content = [];
   children = lodash.flatten(children);
   if (!attrs.length && !children.length) {
      if (isMeta(attributes, 'optional')) {
      } else {
         if (SelfClosingElementNames.includes(name)) {
            return `<${name}/>`;
         } else {
            return `<${name}></${name}>`;
         }
      }
   } else if (attrs.length && children.length) {
      content.push(`<${name} ${attrs.join(' ')}>`);
      content.push(joinContent(name, attributes, children));
      content.push(`</${name}>`);
   } else if (attrs.length) {
      if (SelfClosingElementNames.includes(name)) {
         content.push(`<${name} ${attrs.join(' ')}/>`);
      } else {
         content.push(`<${name} ${attrs.join(' ')}></${name}>`);
      }
   } else {
      content.push(`<${name}>`);
      content.push(joinContent(name, attributes, children));
      content.push(`</${name}>`);
   }
   return joinContent(name, attributes, content);
}

function isMeta(attributes, metaName) {
   if (!attributes.meta) {
      return false;
   } else if (lodash.isString(attributes.meta)) {
      return attributes.meta === metaName;
   } else if (lodash.isArray(attributes.meta)) {
      return attributes.meta.includes(metaName);
   } else {
      throw {message: 'Meta type: ' + typeof attributes.meta, attributes};
   }
}

function joinContent(name, attributes, ...children) {
   children = lodash.flatten(children);
   if (name === 'pre') {
      return children.join('\n');
   } else {
      return children.join('');
   }
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

export function createMetaElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (meta, attributes, ...args) => element(name, Object.assign({meta}, attributes), ...args);
      return result;
   }, {});
}

export function createMetaStyleElements(meta) {
   return ElementNames.reduce((result, name) => {
      result[name] = (style, ...args) => element(name, {meta, style}, ...args);
      return result;
   }, {});
}

export function createMetaContentElements(meta) {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => element(name, {meta}, ...args);
      return result;
   }, {});
}


export function createContentElements() {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => _content(name, ...args);
      return result;
   }, {});
}

// util

export function onClick(url) {
   const parts = [`document.body.style.opacity=.4`];
   if (!url) {
      logger.debug('onClick empty');
   } else if (/^https?:\/\//.test(url)) {
      return renderScript(
         ...parts,
         `window.location='${renderPath(url)}'`
      );
   } else if (url[0] === '/') {
      return renderScript(
         ...parts,
         `window.location.pathname='${renderPath(url)}'`
      );
   } else {
      return renderScript(
         ...parts,
         `window.location.pathname='/${renderPath(url)}'`
      );
   }
}

export function renderScript(...lines) {
   return lodash.compact(lines).join(';');
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

// util

export function ms(meta, style) {
   return {meta, style};
}

//

export function assignDeps(g) {
   g.He = createElements();
   g.Hs = createStyleElements();
   g.Hm = createMetaElements();
   g.Hso = createMetaStyleElements('optional');
   g.Hc = createContentElements();
   g.Hco = createMetaContentElements('optional');
   g.Hx = module.exports;
   g.html = html;
}
