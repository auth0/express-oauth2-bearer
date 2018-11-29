const UnauthorizedError = require('./lib/UnauthorizedError');
const openid = require('./lib/strategies/openid');

const getToken = (req) => {
  if (!req.headers.authorization) {
    throw new UnauthorizedError('credentials_bad_format',
      'Format is Authorization: Bearer [token]'
    );
  }

  const match = req.headers.authorization.match(/^Bearer\s(.*)$/);

  if (!match) {
    throw new UnauthorizedError('credentials_bad_scheme',
      'Format is Authorization: Bearer [token]'
    );
  }

  return match[1];
};


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
        return next(new UnauthorizedError('invalid_token', 'Invalid token'));
      }
      next();
    } catch(err) {
      next(new UnauthorizedError('validation_error', err.message));
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
      return next(new UnauthorizedError('missing_openid_context', {
        message: 'The requiredScopes middleware need the auth middleware first.'
      }));
    }

    if (!req.auth.claims.scope) {
      return next(new UnauthorizedError('missing_scope_claim', {
        message: 'The JWT does not contain an scope claim.'
      }));
    }

    const tokenScopes = req.auth.claims.scope.split(' ');
    const missingScopes = expectedScopes.filter(s => !tokenScopes.includes(s));
    if (missingScopes.length > 0) {
      return next(new UnauthorizedError('missing_scopes', {
        message: 'Missing scopes: ' + missingScopes.join(' ')
      }));
    }

    next();
  };
};
