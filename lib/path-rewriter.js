'use strict';

const ERRORS = require('./errors');
const utility = require('2o3t-utility');
const isFunction = utility.is.function;
const logger = require('./logger');

module.exports = {
    create: createPathRewriter,
};

/**
 * Create rewrite function, to cache parsed rewrite rules.
 *
 * @param {Object} rewriteConfig config
 * @return {Function} Function to rewrite paths; This function should accept `path` (request.url) as parameter
 */
function createPathRewriter(rewriteConfig) {

    if (!isValidRewriteConfig(rewriteConfig)) {
        return;
    }

    if (isFunction(rewriteConfig)) {
        const customRewriteFn = rewriteConfig;
        return customRewriteFn;
    }

    const rulesCache = parsePathRewriteRules(rewriteConfig);

    return rewritePath;

    function rewritePath(path) {
        let result = path;

        rulesCache.forEach(function(rule) {
            if (rule.regex.test(path)) {
                result = result.replace(rule.regex, rule.value);
                logger.system('Rewriting path from "%s" to "%s"', path, result);
                return false;
            }
        });

        return result;
    }
}

function isValidRewriteConfig(rewriteConfig) {
    if (isFunction(rewriteConfig)) {
        return true;
    } else if (!utility.isEmpty(rewriteConfig) && utility.isPlainObject(rewriteConfig)) {
        return true;
    } else if (utility.isUndefined(rewriteConfig) ||
            utility.isNull(rewriteConfig) ||
            utility.isEqual(rewriteConfig, {})) {
        return false;
    }
    throw new Error(ERRORS.ERR_PATH_REWRITER_CONFIG);

}

function parsePathRewriteRules(rewriteConfig) {
    const rules = [];

    if (utility.isPlainObject(rewriteConfig)) {

        for (const key in rewriteConfig) {
            if (rewriteConfig.hasOwnProperty(key)) {

                rules.push({
                    regex: new RegExp(key),
                    value: rewriteConfig[key],
                });

                logger.system('Proxy rewrite rule created: "%s" ~> "%s"', key, rewriteConfig[key]);
            }
        }
    }

    return rules;
}
