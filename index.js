/**
 * Created by karl on 16/07/15.
 */
/// <reference path='typings/tsd.d.ts' />
'use strict';
var http = require('http');
var cluster = require('cluster');
var express = require('express');
var compress = require('compression');
var eJSend = require('easy-jsend');
var eXHeaders = require('easy-x-headers');
var Common = require('./lib/common');
var Log = require('./lib/log');
var Error = require('./lib/error');
var clusterService = require('cluster-service');
var e;
function init(config) {
    e = config.express || express;
    eJSend.init(config.jSend);
}
exports.init = init;
function create(config) {
    var app = express();
    var log = Log.init(config.log);
    if (config.cluster) {
        config.cluster.port = config.cluster.port || config.port + 10000;
    }
    if (!config.cluster || !cluster.isMaster) {
        Common.register(app, config.root, config.cluster);
        app.use(compress());
        app.set('trust proxy', true);
        app.use(eXHeaders.getMiddleware(config.xHeaderDefaults));
        app.use(log.middleware());
        config.mount(app);
        app.all('*', function (req, res, next) {
            res.fail('Not found', 404);
        });
        var server = http.createServer(app);
        app.use(Error.getErrorHandler(server));
    }
    return {
        express: express,
        app: app,
        log: log.log,
        server: server,
        listen: function () {
            if (config.cluster && cluster.isMaster) {
                config.cluster.workers = process['mainModule'].filename;
                clusterService.start(config.cluster);
                return;
            }
            server.listen(config.port, function () {
                log.log.info('%s listening on %d', config.name, config.port);
            });
        }
    };
}
exports.create = create;
//# sourceMappingURL=index.js.map