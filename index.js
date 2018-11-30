const createError = require('http-errors');
const getToken = require('./lib/getToken');
const openid = require('./lib/strategies/openid');

module.exports.strategies = {
  'openid': openid
};

/**
* Returns a router with two routes /login and /callback
*
* @param {Object} [params] The parameters object
* @param {string} [params.getToken] A function receiving the req object and returning the token. Defaults to Authorization header.
* @param {string} [params.strategy] A function validating the token.
* @returns {Function} the middleware
*/
module.exports.auth = function(params) {
  if (typeof params === 'undefined') {
    params = {};
  } else if(typeof params === 'function') {
    params = { strategy: params, getToken: getToken };
  } else if(typeof params !== 'object') {
    throw new Error('expected object or function');
  }

  if(!params.getToken) {
    params.getToken = getToken;
  }

  if(!params.strategy) {
    params.strategy = openid();
  }

  return async (req, res, next) => {
    try {
      const token = params.getToken(req);
      req.auth =  await params.strategy(token);
      if (!req.auth) {
        //Unauthorized: https://tools.ietf.org/html/rfc6750#section-3.1
        return next(createError(401, 'invalid token', { code: 'invalid_token'}));
      }
      next();
    } catch(err) {
      //Unauthorized: https://tools.ietf.org/html/rfc6750#section-3.1
      return next(createError(401, err.message, { code: 'invalid_token'}));
    }
  };
};

/**
* Returns a router with two routes /login and /callback
*
* @param {Array|String} scopes The required scopes.
*
* @returns {Function} the middleware
*/
module.exports.requiredScopes = function(...scopes) {
  const expectedScopes = Array.prototype.concat(...scopes);

  expectedScopes
    .filter(es => typeof es !== 'string')
    .forEach(es => {
      throw new Error('expected string got ' + typeof es);
    });

  return (req, res, next) => {
    if (!req.auth) {
      //Unauthorized: https://tools.ietf.org/html/rfc6750#section-3.1
      return next(createError(401, 'invalid token', { code: 'invalid_token'}));
    }

    if (!req.auth.claims.scope) {
      //Forbidden: https://tools.ietf.org/html/rfc6750#section-3.1
      return next(createError(403, 'insufficient scopes', { code: 'insufficient_scope'}));
    }

    const tokenScopes = req.auth.claims.scope.split(' ');
    const missingScopes = expectedScopes.filter(s => !tokenScopes.includes(s));
    if (missingScopes.length > 0) {
      //Forbidden: https://tools.ietf.org/html/rfc6750#section-3.1
      return next(createError(403, 'insufficient scopes', { code: 'insufficient_scope'}));
    }

    next();
  };
};
