/**
 * Created by karl on 16/07/15.
 */
'use strict';
var bunyan = require('bunyan');
function getLogMiddleware(log) {
    return function (req, res, next) {
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
        req.log.debug({ query: req.query }, 'Incoming request');
        var start = Date.now();
        function logRequest() {
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
    };
}
function createLog(conf) {
    var clone = JSON.parse(JSON.stringify(conf));
    clone.serializers = {
        req: bunyan.stdSerializers['req'],
        error: bunyan.stdSerializers['err']
    };
    return bunyan.createLogger(clone);
}
function init(conf) {
    var log = createLog(conf);
    return {
        log: log,
        middleware: function () {
            return getLogMiddleware(log);
        }
    };
}
exports.init = init;
//# sourceMappingURL=log.js.map