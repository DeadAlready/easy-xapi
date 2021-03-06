/**
 * Created by karl on 16/07/15.
 */

/// <reference path='typings/tsd.d.ts' />

'use strict';

import fs = require('fs');
import path = require('path');
import http = require('http');
import bunyan = require('bunyan');
import cluster = require('cluster');

import express = require('express');
import compress = require('compression');

import eJSend = require('easy-jsend');
import eXHeaders = require('easy-x-headers');

import Common = require('./lib/common');
import Log = require('./lib/log');
import Error = require('./lib/error');

var clusterService = require('cluster-service');

interface Config {
    root: string;
    xHeaderDefaults: any;
    port: number;
    name: string;
    forceRegister?: boolean;
    cluster?: {
        workers: string | Object;
        workerCount: number;
        accessKey: string;
        port?:number;
    };
    log: {
        name: string;
        level: string
    }
    mount: (app: express.Application) => void
}

var e;
export function init(config: any) {
    e = config.express || express;
    eJSend.init(config.jSend);
}

export function create(config: Config) {
    var app = express();
    var log = Log.init(config.log);

    if(config.cluster) {
        config.cluster.port = config.cluster.port || config.port + 10000;
    }

    if(!config.cluster || !cluster.isMaster || config.forceRegister) {
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
        listen: function() {

            if(config.cluster && cluster.isMaster) {
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