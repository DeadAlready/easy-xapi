/**
 * Created by karl on 16/07/15.
 */

'use strict';

import fs = require('fs');
import path = require('path');
import CProcess = require('child_process');

import express = require('express');

var clusterServiceBin = path.dirname(require.resolve('cluster-service')) + '/bin/cservice ';

function getCmd(question:string, accessKey:string, port: number):string {
    return clusterServiceBin + question + ' --json --accessKey ' + accessKey + ' --port ' + port;
}

function registerRobots(app: express.Application, root: string): void {

    var robotsPath = path.join(root, 'robots.txt');
    var robots = fs.existsSync(robotsPath);
    app.use('/robots.txt', function (req, res) {
        if(robots) {
            res.sendFile(robotsPath);
            return;
        }
        res.sendStatus(404);
    });
}

export function register(app: express.Application, root: string, cluster?: any): void {

    app.use('/:var(autodiscover/autodiscover.xml|favicon.ico)', function (req, res) {
        res.sendStatus(404);
    });

    app.use('/heartbeat', function (req, res) {
        if(!cluster || !cluster.accessKey) {
            res.success('ok');
            return;
        }

        var question = req.query.info ? 'workers' : 'info';

        CProcess.exec(getCmd(question, cluster.accessKey, cluster.port), function (err, stdout, stderr) {
            if(err || stderr) {
                res.error(err || stderr.toString('utf8'));
                return;
            }
            var parsed = JSON.parse(stdout.toString('utf8'));
            res.success(parsed);
        });
    });

    registerRobots(app, root);

}