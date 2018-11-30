const createError = require('http-errors');

const getTokenFromHeader = (req) => {
  if (!req.headers || !req.headers.authorization) {
    return;
  }

  const match = req.headers.authorization.match(/^Bearer\s(.*)$/);
  if (!match) {
    return;
  }
  return match[1];
};

const methodsWithoutBody = ['GET', 'HEAD', 'DELETE'];

const getTokenFromQueryString = (req) => {
  if (req.query &&
      typeof req.query.access_token === 'string' &&
      methodsWithoutBody.includes(req.method)) {
    return req.query.access_token;
  }
};

const getFromBody = (req) => {
  if (req.body &&
      typeof req.body.access_token === 'string' &&
      !methodsWithoutBody.includes(req.method) &&
      req.headers &&
      req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    return req.body.access_token;
  }
};

module.exports = (req) => {
  const fromQuery = getTokenFromQueryString(req);
  const fromHeader = getTokenFromHeader(req);
  const fromBody = getFromBody(req);

  const hasNoToken = !fromQuery && !fromHeader && !fromBody;
  const hasMoreThanOne = [fromQuery, fromBody, fromHeader].filter(Boolean).length > 1;

  if(hasNoToken || hasMoreThanOne) {
    throw new createError(400, 'invalid request', { code: 'invalid_request'});
  }

  return fromQuery || fromBody || fromHeader;
};
