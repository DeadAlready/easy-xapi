/**
 * Created by karl on 16/07/15.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var CProcess = require('child_process');
var clusterServiceBin = path.dirname(require.resolve('cluster-service')) + '/bin/cservice ';
function getCmd(question, accessKey, port) {
    return clusterServiceBin + question + ' --json --accessKey ' + accessKey + ' --port ' + port;
}
function registerRobots(app, root) {
    var robotsPath = path.join(root, 'robots.txt');
    var robots = fs.existsSync(robotsPath);
    app.use('/robots.txt', function (req, res) {
        if (robots) {
            res.sendFile(robotsPath);
            return;
        }
        res.sendStatus(404);
    });
}
function register(app, root, cluster) {
    app.use('/:var(autodiscover/autodiscover.xml|favicon.ico)', function (req, res) {
        res.sendStatus(404);
    });
    app.use('/heartbeat', function (req, res) {
        if (!cluster || !cluster.accessKey) {
            res.success('ok');
            return;
        }
        var question = req.query.info ? 'workers' : 'info';
        CProcess.exec(getCmd(question, cluster.accessKey, cluster.port), function (err, stdout, stderr) {
            if (err || stderr) {
                res.error(err || stderr.toString('utf8'));
                return;
            }
            var parsed = JSON.parse(stdout.toString('utf8'));
            res.success(parsed);
        });
    });
    registerRobots(app, root);
}
exports.register = register;
//# sourceMappingURL=common.js.map