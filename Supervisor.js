
export default class Supervisor {

   constructor() {
   }

   async init() {
      this.logger.info('config.components', Object.keys(this.config.components));
      for (const componentName in this.config.components) {
         const componentConfig = this.config.components[componentName];
         if (componentConfig) {
            const componentModule = this.config.availableComponents[componentName];
            assert(componentModule, 'componentModule: ' + componentName);
            await this.initComponent(componentName, componentModule, componentConfig);
         } else {
            this.logger.warn('config.component', componentName);
         }
      }
      await this.startComponents();
      await this.scheduleComponents();
      this.logger.info('components', Object.keys(this.components));
      this.logger.info('inited');
   }

   async initComponent(componentName, componentModule, componentConfig) { // TODO support external modules
      assert(lodash.isString(componentName), 'component name');
      this.logger.info('initComponent', componentName, componentModule, componentConfig);
      const meta = require(`./${componentModule}.config`);
      this.logger.debug('meta', componentModule, meta);
      assert(meta, 'meta: ' + componentModule);
      this.logger.debug('meta', componentModule, meta, Object.keys(meta));
      assert(meta.config, 'meta.config: ' + componentModule);
      componentConfig = Object.assign(Metas.getDefault(meta.config), componentConfig);
      componentConfig = Object.assign(componentConfig, Metas.getEnv(meta.config, componentName, process.env));
      this.logger.debug('config', componentName, meta.config, componentConfig);
      const errorKeys = Metas.getErrorKeys(meta.config, componentConfig);
      if (errorKeys.length) {
         throw new ValidationError('config: ' + errorKeys.join(' '));
      }
      const componentState = Object.assign({
         config: componentConfig,
         logger: Loggers.create(componentName, componentConfig.loggerLevel || this.config.loggerLevel),
         supervisor: this,
         components: this.components
      }, meta.state);
      this.componentStates[componentName] = componentState;
      this.logger.debug('componentModule', componentModule);
      if (Metas.isSpecType(meta, 'icp')) {
         componentModule = await ClassPreprocessor.buildSync(componentModule + '.js', Object.keys(componentState));
      }
      if (meta.singleton) {
         global[meta.singleton.key] = {};
      }
      let componentClass = require('./' + componentModule);
      if (componentClass.default) {
         componentClass = componentClass.default;
      }
      let component;
      if (componentClass.start) {
         component = componentClass;
         component.config = componentConfig;
      } else {
         component = new componentClass();
         this.logger.info('initComponents state', componentName, Object.keys(componentState));
         Object.assign(component, {name: componentName}, componentState);
      }
      component.name = componentName;
      this.validateComponent(component);
      if (component.init) {
         assert(lodash.isFunction(component.init), 'init function: ' + componentName);
         await component.init(componentState);
      }
      if (meta.singleton) {
         Object.assign(global[meta.singleton.key], lodash.pick(component, meta.singleton.pick));
      }
      this.initedComponents.push(component);
      this.components[componentName] = component;
      this.logger.info('initComponents components', componentName, Object.keys(this.components));
   }

   validateComponent(component) {
      assert(component.name, 'component.name');
      assert(lodash.isFunction(component.start), 'start function: ' + component.name);
   }

   async startComponents() {
      this.logger.info('startComponents', this.initedComponents.length);
      for (const component of [... this.initedComponents]) {
         if (component.start) {
            assert(lodash.isFunction(component.start), 'start function: ' + component.name);
            assert(lodash.isString(component.name), 'name type: ' + typeof component.name);
            this.logger.debug('start', component.name);
            await component.start(this.componentStates[component.name]);
         }
      }
   }

   async scheduleComponents() {
      this.logger.debug('scheduleComponents length', Object.keys(this.components));
      for (const component of [... this.initedComponents]) {
         this.logger.debug('scheduleComponents component', component.name);
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
               this.logger.warn(err, component.name, component.config);
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
               this.logger.warn(err, component.name, component.config);
            } else {
               this.error(err, component);
            }
         }
      }, component.config.scheduledInterval);
   }

   async start() {
      this.logger.info('start components', Object.keys(this.components));
      for (const component of this.components) {
         await component.start();
      }
      this.logger.info('started');
   }

   async error(err, component) {
      if (!this.ended) {
         this.logger.error(err, component.name);
         if (err.stack) {
            this.logger.error(err.stack);
         }
         if (this.components.metrics) {
            if (this.components.metrics !== component) {
               await this.components.metrics.count('error', component.name);
            }
         }
         this.end();
      } else {
         this.logger.warn(component.name, err);
      }
   }

   async endComponents() {
      if (this.initedComponents.length) {
         this.initedComponents.reverse();
         for (const component of this.initedComponents) {
            try {
               await component.end();
               this.logger.info('end component', component.name);
            } catch (err) {
               this.logger.error('end component', component.name, err.stack);
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
