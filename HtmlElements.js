
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

export const MessageTagRegex = /<\/?(b|tt|i|code|pre)>/g;

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

export function render(name, attributes, ...children) { // TODO
   const content = [];
   if (!attributes) {
      return ['<', name, '/>'].join('');
   }
   children = lodash.compact(lodash.flatten(children));
   if (!lodash.isObject(attributes)) {
      throw {message: 'attributes: ' + typeof attributes, context: {name, attributes, children}};
   }
   const attrs = renderAttributes(attributes);
   logger.debug('render', name, attrs);
   return renderChildrenRepeat(name, attributes, attrs, children);
}

function renderAttributes(attributes) {
   return Object.keys(attributes)
   .filter(key => !['meta'].includes(key))
   .filter(key => attributes[key])
   .map(key => `${key}="${attributes[key].toString()}"`);
}

function renderChildrenRepeat(name, attributes, attrs, children) {
   if (isMeta(attributes, 'repeat')) {
      if (!children.length) {
         return '';
      } else if (!lodash.isArray(children)) {
         throw {message: 'children type: ' + typeof children, name, attributes, children};
      } else if (lodash.isEmpty(children)) {
         return '';
      } else {
         return lodash.flatten(children).map(child => {
            return renderChildren(name, attributes, attrs, child);
         }).join('\n');
      }
   } else {
      return renderChildren(name, attributes, attrs, children);
   }
}

function renderChildren(name, attributes, attrs, children) {
   const content = [];
   children = lodash.flatten(children);
   if (!children.length) {
      if (isMeta(attributes, 'optional')) {
         return '';
      }
   }
   if (!attrs.length && !children.length) {
      if (SelfClosingElementNames.includes(name)) {
         return `<${name}/>`;
      } else {
         return `<${name}></${name}>`;
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
   logger.debug('isMeta', attributes, metaName);
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

export function renders(fn) {
   return ElementNames.reduce((result, name) => {
      result[name] = (...args) => fn(name, ...args);
      return result;
   }, {});
}

// util

export function onClick({href, target}) {
   let parts = [];
   if (!target) {
      parts.push(`document.body.style.opacity=.4`);
   }
   if (!href) {
      logger.debug('onClick empty');
   } else if (/^https?:\/\//.test(href)) {
      return renderScript(
         ...parts,
         `window.location='${renderPath(href)}'`
      );
   } else if (href[0] === '/') {
      return renderScript(
         ...parts,
         `window.location.pathname='${renderPath(href)}'`
      );
   } else {
      return renderScript(
         ...parts,
         `window.location.pathname='/${renderPath(href)}'`
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

// plain

export function plain(name, attributes, content) {
   if (['style'].includes(name)) {
      return '';
   }
   if (lodash.isEmpty(content)) {
      return '';
   }
   if (lodash.isString(content)) {
      if (name === 'a') {
         assert(attributes.href, 'href');
         return [content, '  ' + attributes.href].join('\n');
      }
      return content;
   }
   if (lodash.isArray(content)) {
      if (['pre'].includes(name)) {
         return content.map(element => plain({}, content)).join('\n');
      } else {
         return content.map(element => plain({}, content)).join('\n');
      }
   }
   if (lodash.isObject(element)) {
      if (element.url && element.content) {
         return [element.content, element.url].join('\n');
      } else {
         logger.debug('render object', typeof element);
         return '';
      }
   }
   return content.toString();
}

//

function assignElements($, delegate) {
   Object.assign($, renders((name, ...args) => delegate(name, ...args)));
   return $;
}

export function assignDeps(g) {
   g.He = assignElements({}, render);
   g.Hp = assignElements({}, plain);
   g.Hs = renders((name, style, ...children) => {
      logger.debug('_style', name, style, children);
      if (typeof style !== 'string') {
         throw {message: 'style type: ' + typeof style, name, style, children};
      } else {
         return render(name, {style}, ...children);
      }
   });
   g.Hm = renders((name, meta, attributes, ...args) => render(name, Object.assign({meta}, attributes), args));
   g.Hso = renders((name, style, ...args) => render(name, Object.assign({meta: 'optional', style}), args));
   g.Hms = renders((name, meta, style, ...args) => render(name, Object.assign({meta, style}), args));
   g.Hc = renders((name, ...args) => render(name, {}, args));
   g.Hmc = renders((name, meta, ...args) => render(name, {meta}, args));
   g.Hco = renders((name, ...args) => render(name, {meta: 'optional'}, args));
   g.Hx = module.exports;
   g.html = html;
}
