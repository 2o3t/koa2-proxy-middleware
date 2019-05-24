'use strict';

const _ = require('lodash');
const logger = require('./logger');

module.exports = {
    getTarget,
};

function getTarget(req, config) {
    let newTarget;
    const router = config.router;

    if (_.isPlainObject(router)) {
        newTarget = getTargetFromProxyTable(req, router);
    } else if (_.isFunction(router)) {
        newTarget = router(req);
    }

    return newTarget;
}

function getTargetFromProxyTable(req, table) {
    let result;
    const host = req.headers.host;
    const path = req.url;

    const hostAndPath = host + path;

    _.forIn(table, function(value, key) {
        if (containsPath(key)) {
            if (hostAndPath.indexOf(key) > -1) {
                // match 'localhost:3000/api'
                result = table[key];
                logger.system('[Proxy] Router table match: "%s"', key);
                return false;
            }
        } else {
            if (key === host) {
                // match 'localhost:3000'
                result = table[key];
                logger.system('[Proxy] Router table match: "%s"', host);
                return false;
            }
        }
    });

    return result;
}

function containsPath(v) {
    return v.indexOf('/') > -1;
}
