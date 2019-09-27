const { Issuer, custom } = require('openid-client');
const memoize = require('p-memoize');
const jwt = require('jsonwebtoken');
const pkg = require('../../package.json');

const getIssuer = memoize((issuerBaseURL) => {
  return Issuer.discover(issuerBaseURL);
});

custom.setHttpOptionsDefaults({
  headers: {
    'User-Agent': `${pkg.name}/${pkg.version} (${pkg.homepage})`
  },
  timeout: 4000
});

const defaults = {
  issuerBaseURL: process.env.ISSUER_BASE_URL,
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
        .then(key => cb(null, key && key.toPEM()),
          err => cb(err));
    };

    jwt.verify(token, getKey, {
      issuer: issuer.issuer,
      audience: audiences,
      algorithms: issuer.id_token_signing_alg_values_supported,
      clockTolerance,
    }, (err, decoded) => {
      if(err) { return reject(err); }
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
* @param {string} [params.clockTolerance=5] The clock's tolerance in seconds for token verification.
* @param {string} [params.clientSecret] Key to validate tokens signed with symmetric algorithms.
* @returns {Function} the middleware
*/
module.exports = function(params) {
  params = Object.assign({}, defaults, params || {});

  if (!params.issuerBaseURL) {
    throw new Error('issuerBaseURL is required');
  }

  if (!params.allowedAudiences) {
    throw new Error('allowedAudiences is required');
  }

  return async function(token) {
    const issuer = await getIssuer(params.issuerBaseURL);
    const claims = await verifyToken(token,
      issuer,
      params.allowedAudiences,
      params.clockTolerance,
      params.clientSecret);
    return { token, claims };
  };
};
