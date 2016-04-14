
export default class Supervisor {

   constructor() {
   }

   async init() {
      logger.info('config.components', config.components.length);
      for (const componentName in config.components) {
         const componentConfig = config.components[componentName];
         if (componentConfig) {
            const componentModule = config.availableComponents[componentName];
            assert(componentModule, 'componentModule: ' + componentName);
            await this.initComponent(componentName, componentModule, componentConfig);
         } else {
            logger.warn('config.component', componentName);
         }
      }
      logger.info('initedComponents', initedComponents.length);
      for (const component of [... initedComponents]) {
         if (component.start) {
            assert(lodash.isFunction(component.start), 'start function: ' + component.name);
            logger.debug('start', component.name);
            await component.start();
         }
      }
      logger.info('components', Object.keys(components));
      logger.info('inited');
   }

   async initComponent(componentName, componentModule, componentConfig) { // TODO support external modules
      assert(typeof componentName === 'string', 'component name');
      logger.info('initComponent', componentName, componentModule, componentConfig);
      const meta = CsonFiles.readFileSync(componentModule + '.cson'); // TODO support external modules
      componentConfig = Object.assign(Metas.getDefault(meta.config), componentConfig);
      const componentState = Object.assign({
         components: components,
         config: componentConfig,
         logger: Loggers.createLogger(componentName, componentConfig.loggerLevel || config.loggerLevel)
      }, meta.state);
      componentModule = ClassPreprocessor.buildSync(componentModule + '.js', Object.keys(componentState));
      const componentClass = require('.' + componentModule).default; // TODO support external modules
      const component = new componentClass();
      logger.info('initComponents state', componentName, Object.keys(componentState));
      Object.assign(component, {name: componentName}, componentState);
      if (component.init) {
         assert(lodash.isFunction(component.init), 'init function: ' + componentName);
         await component.init();
      }
      initedComponents.push(component);
      components[componentName] = component;
      logger.info('initComponents components', componentName, Object.keys(components));
   }

   async start() {
      logger.info('start components', Object.keys(components));
      for (const component of components) {
         await component.start();
      }
      logger.info('started');
   }

   async error(err, component) {
      if (!ended) {
         logger.error(err, component.name);
         if (err.stack) {
            logger.error(err.stack);
         }
         if (components.metrics) {
            if (components.metrics !== component) {
               await components.metrics.count('error', component.name);
            }
         }
         this.end();
      } else {
         logger.warn(component.name, err);
      }
   }

   async endComponents() {
      if (initedComponents.length) {
         initedComponents.reverse();
         for (const component of initedComponents) {
            try {
               await component.end();
               logger.info('end component', component.name);
            } catch (err) {
               logger.error('end component', component.name, err.stack);
            }
         }
      }
   }

   async end() {
      await this.endComponents();
      if (this.redisClient) {
         await this.redisClient.quitAsync();
      }
      process.exit(0);
   }
}
