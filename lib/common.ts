/**
 * Created by karl on 16/07/15.
 */

'use strict';

import fs = require('fs');
import path = require('path');

import express = require('express');

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

export function register(app: express.Application, root: string): void {

    app.use('/:var(autodiscover/autodiscover.xml|favicon.ico)', function (req, res) {
        res.sendStatus(404);
    });

    app.use('/heartbeat', function (req, res) {
        res.success('ok');
    });

    registerRobots(app, root);

}