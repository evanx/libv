
const logger = Loggers.create(__filename, 'info');

const ElementNames = ['div', 'span', 'pre', 'p'];

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

export function renderContent(content) {
   if (lodash.isArray(content)) {
      content = content.join('\n');
   } else if (lodash.isString(content)) {
   } else if (lodash.isInteger(content)) {
   } else {
      logger.warn('content type', typeof content);
   }
   return content.toString().replace(/\n\s*/g, '\n');
}

export function el(name, attributes, ...children) {
   const content = [];
   const attrs = Objects.mapEntries(attributes)
   .filter(e => e.value && e.value.toString())
   .map(e => Object.assign(e, {value: e.value.toString()}))
   .map(e => `${e.key}="${e.value}"`);
   logger.debug('el', name, attrs);
   if (attrs.length) {
      content.push(`<${name} ${attrs.join(' ')}>`);
   } else {
      content.push(`<${name}>`);
   }
   content.push(children.map(child => child.toString()));
   content.push(`</${name}>`);
   logger.debug('el', name, attrs, content);
   return lodash.flatten(content).join('\n');
}

export function styled(name, style, ...children) {
   return el(name, {style}, ...children);
}

export function createElements(x) {
   exports.styled = {};
   ElementNames.forEach(name => {
      x[name] = (...args) => el(name, ...args);
      x.styled[name] = (...args) => styled(name, ...args);
   });
}

createElements(module.exports);
