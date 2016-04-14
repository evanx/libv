
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
global.redisl = require('redis');

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

var config = {
   loggerName: 'supervisor',
   loggerLevel: 'info'
};
if (process.env.loggerLevel) {
   config.loggerLevel = process.env.loggerLevel;
} else if (process.env.NODE_ENV === 'development') {
   config.loggerLevel = 'debug';
}

global.loggerLevel = config.loggerLevel;

var logger = global.bunyan.createLogger({name: config.loggerName, level: config.loggerLevel})

// redis

bluebird.promisifyAll(redisl.RedisClient.prototype);
bluebird.promisifyAll(redisl.Multi.prototype);
redisl.RedisClient.prototype.multiExecAsync = function(fn) {
   var multi = this.multi();
   fn(multi);
   return multi.execAsync();
};

// babel

require('babel-polyfill');
require('babel-core/register');
logger.debug('babel registered');

// dependencies

global.Loggers = require('./Loggers');
global.Asserts = require('./Asserts');
global.CsonFiles = require('./CsonFiles');
global.Metas = require('./Metas')
global.ClassPreprocessor = require('./ClassPreprocessor');

// supervisor configuration

if (!process.env.configModule) {
   throw 'Specify configModule e.g. configModule=./demo/config.js, or try: npm run demo';
}

function getComponents(config) {
   logger.debug('components.spec', config.spec);
   return config.components;
}

Object.assign(config, {
   availableComponents: getComponents(CsonFiles.readFileSync('./components.cson')),
   components: require('.' + process.env.configModule) // TODO support external module
});

var supervisorMeta = Object.assign(CsonFiles.readFileSync('./lib/Supervisor.cson'), {config: config});

logger.debug('supervisor.spec', supervisorMeta.spec);
logger.debug('supervisor config', JSON.stringify(supervisorMeta.config, null, 3));

// supervisor instance

if (/\Wicp\W/.test(supervisorMeta.spec)) { // TODO babel class transform, rather than fragile regex transformation
   ClassPreprocessor.buildSync('./lib/Supervisor.js', [
      'logger', 'context', 'config'
   ].concat(Object.keys(supervisorMeta.state)));
}

var Supervisor = require('../build/Supervisor').default;
var supervisor = new Supervisor();
Object.assign(supervisor, Object.assign({logger: logger, config: supervisorMeta.config}, supervisorMeta.state));
module.exports = supervisor.init().then(function() {
   logger.info('started pid', process.pid);
   process.on('SIGTERM', function() {
      logger.info('SIGTERM')
      supervisor.end();
   });
   return supervisor;
}).catch(function(err) {
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
});
