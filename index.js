const getToken = require('./lib/getToken');
const openid = require('./lib/strategies/openid');
const errors = require('./lib/errors');

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
    params.strategy = openid(params);
  }

  return async (req, res, next) => {
    try {
      const token = params.getToken(req);
      req.auth =  await params.strategy(token);
      if (!req.auth) {
        return next(errors.createInvalidTokenError());
      }
      next();
    } catch(err) {
      return next(errors.createInvalidTokenError(err.message));
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
      return next(errors.createInvalidTokenError());
    }

    const tokenScopes = req.auth.claims && typeof req.auth.claims.scope ===  'string' ?
      req.auth.claims.scope.split(' ') :
      [];

    const hasExpectedScopes = expectedScopes.every(s => tokenScopes.includes(s));
    if (!hasExpectedScopes) {
      return next(errors.createInsufficientScopeError(expectedScopes));
    }

    next();
  };
};
