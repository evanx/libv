
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
      await this.startComponents();
      await this.scheduleComponents();
      logger.info('components', Object.keys(components));
      logger.info('inited');
   }

   async startComponents() {
      logger.info('startComponents', initedComponents.length);
      for (const component of [... initedComponents]) {
         if (component.start) {
            assert(lodash.isFunction(component.start), 'start function: ' + component.name);
            logger.debug('start', component.name);
            await component.start();
         }
      }
   }

   async initComponent(componentName, componentModule, componentConfig) { // TODO support external modules
      assert(typeof componentName === 'string', 'component name');
      logger.info('initComponent', componentName, componentModule, componentConfig);
      const meta = CsonFiles.readFileSync(componentModule + '.cson'); // TODO support external modules
      componentConfig = Object.assign(Metas.getDefault(meta.config), componentConfig);
      logger.debug('config', componentName, meta.config, componentConfig);
      const errorKeys = Metas.getErrorKeys(meta.config, componentConfig);
      if (errorKeys.length) {
         throw new ValidationError('config: ' + errorKeys.join(' '));
      }
      const componentState = Object.assign({
         config: componentConfig,
         logger: Loggers.createLogger(componentName, componentConfig.loggerLevel || config.loggerLevel),
         supervisor: this,
         components: components
      }, meta.state);
      componentModule = await ClassPreprocessor.buildSync(componentModule + '.js', Object.keys(componentState));
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

   async scheduleComponents() {
      logger.debug('scheduleComponents length', Object.keys(components));
      for (const component of [... initedComponents]) {
         logger.debug('scheduleComponents component', component.name, Object.keys(component.config));
         if (component.config.scheduledTimeout) {
            this.scheduleComponentTimeout(component);
         }
         if (component.config.scheduledInterval) {
            this.scheduleComponentInterval(component);
         }
      }
   }

   scheduleComponentTimeout(component) {
      assert(component.config.scheduledTimeout > 0, 'component.config.scheduledTimeout');
      assert(lodash.isFunction(component.scheduledTimeout), 'scheduledTimeout function: ' + component.name);
      this.scheduledTimeouts[component.name] = setTimeout(async () => {
         try {
            await component.scheduledTimeout();
         } catch (err) {
            if (component.config.scheduledTimeoutWarn) {
               logger.warn(err, component.name, component.config);
            } else {
               this.error(err, component);
            }
         }
      }, component.config.scheduledTimeout);
   }

   scheduleComponentInterval(component) {
      assert(component.config.scheduledInterval > 0, 'component.config.scheduledInterval');
      assert(lodash.isFunction(component.scheduledInterval), 'scheduledInterval function: ' + component.name);
      this.scheduledIntervals[component.name] = setInterval(async () => {
         try {
            await component.scheduledInterval();
         } catch (err) {
            if (component.config.scheduledIntervalWarn) {
               logger.warn(err, component.name, component.config);
            } else {
               this.error(err, component);
            }
         }
      }, component.config.scheduledInterval);
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
