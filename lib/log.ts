/**
 * Created by karl on 16/07/15.
 */

'use strict';

import bunyan = require('bunyan');
import express = require('express');

function getLogMiddleware(log: bunyan.Logger): express.RequestHandler {
    return function (req:any, res, next) {
        //Attach log and redis
        req.log = log.child({
            req_id: req.info.rid,
            path: req.path,
            ip: req.ip,
            method: req.method,
            sid: req.info.sid
        });

        req.info.isLoggedIn = req.info.sid && req.info.uid;

        // Log request start
        req.log.debug({query: req.query}, 'Incoming request');

        var start = Date.now();
        function logRequest(){
            res.removeListener('finish', logRequest);
            res.removeListener('close', logRequest);
            req.log.info({
                request_time: Date.now() - start,
                status_code: this.statusCode
            }, 'Request end');
        }

        res.on('finish', logRequest);
        res.on('close', logRequest);

        next();
    }
}

function createLog(conf:any): bunyan.Logger {
    var clone = JSON.parse(JSON.stringify(conf));
    clone.serializers = {
        req: bunyan.stdSerializers['req'],
        error: bunyan.stdSerializers['err']
    };
    return bunyan.createLogger(clone);
}

export function init(conf: any): {log: bunyan.Logger; middleware: () => express.RequestHandler} {
    var log = createLog(conf);
    return {
        log: log,
        middleware: function () {
            return getLogMiddleware(log);
        }
    }
}