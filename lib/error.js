/**
 * Created by karl on 16/07/15.
 */
'use strict';
var cluster = require('cluster');
var logMock = {
    error: function (data, msg) {
        console.error(JSON.stringify(data), msg);
    }
};
function getErrorHandler(server) {
    return function errorHandler(err, req, res, next) {
        var friendly = {
            message: err.message,
            stack: err.stack
        };
        if (!req.log) {
            req.log = logMock;
        }
        req.log.error({ error: friendly }, 'Something went wrong');
        if (cluster.isMaster) {
            res.error(err.message);
            return;
        }
        try {
            // make sure we close down within 30 seconds
            var killtimer = setTimeout(function () {
                process.exit(1);
            }, 30000);
            // But don't keep the process open just for that!
            killtimer.unref();
            // stop taking new requests.
            server.close();
            // Let the master know we're dead.  This will trigger a
            // 'disconnect' in the cluster master, and then it will fork
            // a new worker.
            if (cluster.worker) {
                cluster.worker.disconnect();
            }
            // try to send an error to the request that triggered the problem
            res.error(err.message);
        }
        catch (err2) {
            // oh well, not much we can do at this point.
            var friendly2 = {
                message: err2.message,
                stack: err2.stack
            };
            req.log.error({ error: friendly2 }, 'Error sending 500!');
            res.end();
        }
    };
}
exports.getErrorHandler = getErrorHandler;
//# sourceMappingURL=error.js.map