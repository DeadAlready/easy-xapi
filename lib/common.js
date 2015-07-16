/**
 * Created by karl on 16/07/15.
 */
'use strict';
var fs = require('fs');
var path = require('path');
function registerRobots(app, root) {
    var robotsPath = path.join(root, 'robots.txt');
    var robots = fs.existsSync(robotsPath);
    app.use('/robots.txt', function (req, res) {
        if (robots) {
            res.sendfile(robotsPath);
            return;
        }
        res.sendStatus(404);
    });
}
function register(app, root) {
    app.use('/:var(autodiscover/autodiscover.xml|favicon.ico)', function (req, res) {
        res.sendStatus(404);
    });
    app.use('/heartbeat', function (req, res) {
        res.success('ok');
    });
    registerRobots(app, root);
}
exports.register = register;
//# sourceMappingURL=common.js.map