'use strict';

module.exports = {
    ERR_CONFIG_FACTORY_TARGET_MISSING: 'Missing "target" option. Example: {target: "http://www.2o3t.cn"}',
    ERR_CONTEXT_MATCHER_GENERIC: 'Invalid context. Expecting something like: "/api" or ["/api", "/ajax"]',
    ERR_CONTEXT_MATCHER_INVALID_ARRAY: 'Invalid context. Expecting something like: ["/api", "/ajax"] or ["/api/**", "!**.html"]',
    ERR_PATH_REWRITER_CONFIG: 'Invalid pathRewrite config. Expecting object with pathRewrite config or a rewrite function',
};
