
// create context for Supervisor and components

// globals

global.assert = require('assert');
global.bluebird = require('bluebird');
global.bunyan = require('bunyan');
global.crypto = require('crypto');
global.fs = require('fs');
global.http = require('http');
global.lodash = require('lodash');
global.os = require('os');
global.redisLib = require('redis');

global.ApplicationError = function() {
   this.constructor.prototype.__proto__ = Error.prototype;
   Error.captureStackTrace(this, this.constructor);
   this.name = 'ApplicationError';
   var args = [].slice.call(arguments);
   if (args.length === 1) {
      this.message = args[0].toString();
   } else {
      this.message = args.toString();
   }
}

global.ValidationError = function() {
   this.constructor.prototype.__proto__ = Error.prototype;
   Error.captureStackTrace(this, this.constructor);
   this.name = 'ValidationError';
   var args = [].slice.call(arguments);
   if (args.length === 1) {
      this.message = args[0].toString();
   } else {
      this.message = args.toString();
   }
}

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

global.Loggers = require('./Loggers');
global.Asserts = require('./Asserts');
global.CsonFiles = require('./CsonFiles');
global.Metas = require('./Metas')
global.ClassPreprocessor = require('./ClassPreprocessor');

// supervisor configuration

function getSupervisorMeta() {
   if (!process.env.configModule) {
      throw 'Specify configModule e.g. configModule=./demo/config.js, or try: npm run demo';
   }
   const componentsMeta = CsonFiles.readFileSync('./components.cson');
   logger.debug('components.spec', componentsMeta.spec);
   Object.assign(config, {
      availableComponents: componentsMeta.components,
      components: require('.' + process.env.configModule) // TODO support external module
   });
   return Object.assign(CsonFiles.readFileSync('./lib/Supervisor.cson'), {config: config});
}

// supervisor instance

export async function startSupervisor() {
   const supervisorMeta = getSupervisorMeta();
   logger.debug('supervisor.spec', supervisorMeta.spec);
   logger.debug('supervisor config', JSON.stringify(supervisorMeta.config, null, 3));
   if (/\Wicp\W/.test(supervisorMeta.spec)) { // TODO babel class transform, rather than fragile regex transformation
      await ClassPreprocessor.buildSync('./lib/Supervisor.js', [
         'logger', 'context', 'config'
      ].concat(Object.keys(supervisorMeta.state)));
   }
   var Supervisor = require('../build/Supervisor').default;
   var supervisor = new Supervisor();
   Object.assign(supervisor, Object.assign({logger: logger, config: supervisorMeta.config}, supervisorMeta.state));
   try {
      await supervisor.init();
      logger.info('started pid', process.pid);
      process.on('SIGTERM', function() {
         logger.info('SIGTERM')
         supervisor.end();
      });
   } catch(err) {
      if (!err.name) {
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


