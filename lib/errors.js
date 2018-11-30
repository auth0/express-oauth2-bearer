const createError = require('http-errors');

//Unauthorized: https://tools.ietf.org/html/rfc6750#section-3.1

module.exports = {
  createInvalidRequestError(description = 'invalid token', message = 'invalid request') {
    return new createError(400, description, {
      headers: {
        'www-authentication': `Bearer realm="api", error="invalid_request", error_description="${message}"`
      },
      code: 'invalid_request'
    });
  },
  createInvalidTokenError(description = 'invalid token', message = 'invalid token')  {
    return createError(401, description, {
      headers: {
        'www-authentication': `Bearer realm="api", error="invalid_token", error_description="${message}"`
      },
      code: 'invalid_token',
    });
  },
  createInsufficientScopeError(scopes = false, description = 'insufficient scope', message = 'insufficient scope')  {
    let header = `Bearer realm="api", error="invalid_token", error_description="${message}"`;

    if (scopes) {
      header += `, scope="${scopes.join(' ')}"`;
    }

    return createError(403, description, {
      headers: {
        'www-authentication': header
      },
      code: 'insufficient_scope',
    });
  }
};
