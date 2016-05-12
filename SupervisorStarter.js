
// create context for Supervisor and components

// globals

function assignLibs(g) {
   g.assert = require('assert');
   g.bluebird = require('bluebird');
   g.bunyan = require('bunyan');
   g.crypto = require('crypto');
   g.fs = require('fs');
   g.http = require('http');
   g.lodash = require('lodash');
   g.os = require('os');
   g.redisLib = require('redis');
}

function assignErrors(g) {
   g.ApplicationError = function() {
      this.constructor.prototype.__proto__ = Error.prototype;
      Error.captureStackTrace(this, this.constructor);
      this.name = 'ApplicationError';
      var args = [].slice.call(arguments);
      if (args.length === 1) {
         this.message = args[0].toString();
      } else {
         this.message = args.toString();
      }
   };
   g.ValidationError = function() {
      this.constructor.prototype.__proto__ = Error.prototype;
      Error.captureStackTrace(this, this.constructor);
      this.name = 'ValidationError';
      var args = [].slice.call(arguments);
      if (args.length === 1) {
         this.message = args[0].toString();
      } else {
         this.message = args.toString();
      }
   };
}

assignLibs(global);
assignErrors(global);

// logging

const config = {
   loggerName: 'supervisor',
   loggerLevel: 'info'
};
if (process.env.loggerLevel) {
   config.loggerLevel = process.env.loggerLevel;
} else if (process.env.NODE_ENV === 'development') {
   config.loggerLevel = 'debug';
}

global.loggerLevel = config.loggerLevel;
if (process.env.loggerUrl) {
   global.loggerUrl = process.env.loggerUrl;
}

const logger = global.bunyan.createLogger({name: config.loggerName, level: config.loggerLevel})

// redis

bluebird.promisifyAll(redisLib.RedisClient.prototype);
bluebird.promisifyAll(redisLib.Multi.prototype);
redisLib.RedisClient.prototype.multiExecAsync = function(fn) {
   var multi = this.multi();
   fn(multi);
   return multi.execAsync();
};

// dependencies

function assignDeps(g) {
   g.Loggers = require('./Loggers');
   g.Asserts = require('./Asserts');
   g.ClassPreprocessor = require('./ClassPreprocessor');
   g.CsonFiles = require('./CsonFiles');
   g.Metas = require('./Metas');
   g.Millis = require('./Millis');
   g.Promises = require('./Promises');
   g.Requests = require('./Requests');
   g.Strings = require('./Strings');
   g.Values = require('./Values');
}

assignDeps(global);

// supervisor configuration

function getComponentsConfig() {
   if (!process.env.configModule) {
      throw 'Specify configModule e.g. configModule=./demo/config.js, or try: npm run demo';
   }
   const config = require('.' + process.env.configModule);
   Object.keys(config).forEach(name => {
      const componentConfig = config[name];
      Object.keys(componentConfig).forEach(key => {
         const envKey = name + '_' + key;
         if (process.env[envKey]) {
            componentConfig[key] = process.env[envKey];
         }
      });
   });
   return config;
}

function getSupervisorMeta() {
   logger.debug('getSupervisorMeta');
   const componentsConfig = getComponentsConfig();
   const componentsMeta = CsonFiles.readFileSync('./components.cson');
   logger.debug('components.spec', componentsMeta.spec);
   if (!Metas.isSpecType(componentsMeta, 'components')) {
      throw {message: 'components.cson spec: ' + componentsMeta.spec};
   }
   Object.assign(config, {
      availableComponents: componentsMeta.components,
      components: componentsConfig // TODO support external module
   });
   return Object.assign(CsonFiles.readFileSync('./lib/Supervisor.cson'), {config: config});
}

// supervisor instance

async function createSupervisor(supervisorMeta) {
   if (/\Wicp\W/.test(supervisorMeta.spec)) { // TODO babel class transform, rather than fragile regex transformation
      logger.debug('createSupervisor', supervisorMeta.spec);
      await ClassPreprocessor.buildSync('./lib/Supervisor.js', [
         'logger', 'context', 'config'
      ].concat(Object.keys(supervisorMeta.state)));
   }
   const Supervisor = require('../build/Supervisor').default;
   return new Supervisor();
}

export async function startSupervisor() {
   logger.debug('startSupervisor');
   const supervisorMeta = getSupervisorMeta();
   logger.debug('supervisor.spec', supervisorMeta.spec);
   logger.debug('supervisor config', JSON.stringify(supervisorMeta.config, null, 3));
   const supervisor = await createSupervisor(supervisorMeta);
   assert(lodash.isFunction(supervisor.init), 'supervisor.init');
   Object.assign(supervisor, Object.assign({logger: logger, config: supervisorMeta.config}, supervisorMeta.state));
   try {
      await supervisor.init();
      logger.info('started pid', process.pid);
      process.on('SIGTERM', function() {
         logger.info('SIGTERM')
         supervisor.end();
      });
   } catch(err) {
      if (err.errno) {
         logger.error({err: err.message, errno: err.errno});
      } else if (err.code) {
         logger.error({err: err.message, code: err.code});
      } else if (!err.name) {
         logger.error(err);
      } else if (lodash.includes(['TypeError'], err.name)) {
         logger.error(err);
      } else if (lodash.includes(['ValidationError', 'ApplicationError', 'AssertionError'], err.name)) {
         logger.error(err.message);
      } else {
         logger.error(err);
      }
      supervisor.end();
   }
}
