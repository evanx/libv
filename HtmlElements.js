
const logger = Loggers.create(__filename, 'info');

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

export function div(attr, ...children) {
   return el('div', attr, ...children);
}

export function styled(name, style, ...children) {
   return el(name, {style}, ...children);
}
