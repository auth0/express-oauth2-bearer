const { Issuer } = require('openid-client');
const memoize = require('p-memoize');
const jwt = require('jsonwebtoken');
const UnauthorizedError = require('./lib/UnauthorizedError');
const pkg = require('./package.json');

const getIssuer = memoize((issuerBaseURL) => {
  return Issuer.discover(issuerBaseURL);
});

Issuer.defaultHttpOptions = {
  headers: {
    'User-Agent': `${pkg.name}/${pkg.version} (${pkg.homepage})`
  },
  timeout: 4000
};

Issuer.useRequest();

const getToken = (req) => {
  if (!req.headers.authorization) {
    throw new UnauthorizedError('credentials_bad_format', {
      message: 'Format is Authorization: Bearer [token]'
    });
  }

  const match = req.headers.authorization.match(/^Bearer\s(.*)$/);
  if (!match) {
    throw new UnauthorizedError('credentials_bad_scheme', { message: 'Format is Authorization: Bearer [token]' });
  }

  return match[1];
};

const defaults = {
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  getToken,
  clockTolerance: 5,
  allowedAudiences: process.env.ALLOWED_AUDIENCES && process.env.ALLOWED_AUDIENCES.split(',')
};

function verifyToken(token, issuer, audiences, clockTolerance, clientSecret) {
  return new Promise((resolve, reject) => {
    const getKey = (header, cb) => {
      if (header.alg.startsWith('HS')) {
        return cb(null, clientSecret);
      }
      issuer.key(header)
        .then(key => {
          cb(null, key && key.toPEM())
        }, err => cb(err));
    };

    jwt.verify(token, getKey, {
      issuer: issuer.issuer,
      audience: audiences,
      algorithms: issuer.id_token_signing_alg_values_supported,
      clockTolerance,
    }, (err, decoded) => {
      if (err) { return reject(new UnauthorizedError('jwt_error', err)); }
      resolve(decoded);
    });
  });
}

/**
* Returns a router with two routes /login and /callback
*
* @param {Object} [params] The parameters object
* @param {string} [params.issuerBaseURL] The url address for the token issuer.
* @param {string} [params.allowedAudiences] The allowed audiences for the token.
* @param {Function} [params.getToken] Read the token from the request object.
* @param {string} [params.clockTolerance=5] The clock's tolerance in seconds for token verification.
* @param {string} [params.clientSecret] Key to validate tokens signed with symmetric algorithms.
* @returns {Function} the middleware
*/
module.exports.auth = function(params) {
  params = Object.assign({}, defaults, params || {});
  if (!params.issuerBaseURL) {
    throw new Error('issuerBaseURL is required');
  }

  if (!params.allowedAudiences) {
    throw new Error('allowedAudiences is required');
  }

  return async (req, res, next) => {
    try {
      const token = params.getToken(req);
      const issuer = await getIssuer(params.issuerBaseURL);
      const claims = await verifyToken(token,
          issuer,
          params.allowedAudiences,
          params.clockTolerance,
          params.clientSecret);
      req.openid = { token, claims };
      next();
    } catch(err) {
      next(err);
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
module.exports.requireScopes = function(scopes) {
  if (typeof scopes === 'string') {
    scopes = [scopes];
  } else if(!Array.isArray(scopes)) {
    throw new Error('scopes is required');
  }

  return (req, res, next) => {
    if (!req.openid) {
      return next(new UnauthorizedError('missing_openid_context', {
        message: 'The requiresScopes middleware need the auth middleware first.'
      }));
    }

    if (!req.openid.claims.scope) {
      return next(new UnauthorizedError('missing_scope_claim', {
        message: 'The JWT does not contain an scope claim.'
      }));
    }

    const tokenScopes = req.openid.claims.scope.split(' ');
    const missingScopes = scopes.filter(s => !tokenScopes.includes(s));
    if (missingScopes.length > 0) {
      return next(new UnauthorizedError('missing_scopes', {
        message: 'Missing scopes: ' + missingScopes.join(' ')
      }));
    }

    next();
  };
};
