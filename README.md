Authentication middleware for express.js that validate access tokens following [RFC 6750](https://tools.ietf.org/html/rfc6750).

[![Build Status](https://travis-ci.org/auth0/express-openid-jwt.svg?branch=master)](https://travis-ci.org/auth0/express-openid-jwt)

The purpose of this library is to protect oauth2 resources.

## Installation

```
npm i express-oauth2-bearer --save
```

## Usage

If the access token received by your API is a token signed in the same way than OpenID Connect id_token, you can use the openid strategy as follows:

```javascript
const { auth, strategies, requiredScopes } = require('express-oauth2-bearer');

app.use(auth(strategies.openid({
  issuerBaseURL: 'https://foobar.auth0.com',
  allowedAudiences: 'https://api.mysite.com'
})));

app.get('/products',
  requiredScopes('read:products'),
  (req, res) => {
    console.dir(req.auth.claims);
    res.sendStatus(200);
  });
```

The OpenID strategy is the default strategy and you can configure the parameters with the variables `ISSUER_BASE_URL` and `ALLOWED_AUDIENCES`. The above code is equal to this:

```javascript
const { auth, requiredScopes } = require('express-oauth2-bearer');

app.use(auth());

app.get('/products',
  requiredScopes('read:products'),
  (req, res) => {
    console.dir(req.auth.claims);
    res.sendStatus(200);
  });
```

If your access tokens are not signed OpenID Connect id_tokens, you need to add the `auth` middleware with a callback to validate as follows:

```javascript
const { auth, requiredScopes } = require('express-oauth2-bearer');

const validateAccesToken = async (token) => {
  const token = await db.tokens.find(token);
  if (token.expired) { return; }
  return token;
};

app.use(auth(validateAcessToken)));

app.get('/products',
  requiredScopes('read:products'),
  (req, res) => {
    console.dir(req.auth.claims);
    res.sendStatus(200);
  });
```


## Parameters

`jwt.auth` accepts an asynchronous function receiving a token and returning a set of claims.

`jwt.strategies.openid` accepts the following parameters:


| Name                | Default                         | Description                                                                    |
|---------------------|---------------------------------|--------------------------------------------------------------------------------|
| issuerBaseURL       | `env.ISSUER_BASE_URL`           | The url address for the token issuer.                                          |
| allowedAudiences    | `env.ALLOWED_AUDIENCES.split(',')`       | The allowed audiences for the token.                                           |
| clockTolerance      | `5`                             | The clock's tolerance in seconds for token verification.                       |
| clientSecret        | `env.CLIENT_SECRET`             | The client secret, only required if you need to validate tokens signed with symmetric algorithms. |

`jwt.requiredScopes` accepts either an string or an array of strings.

## License

MIT 2018 - Auth0 Inc.
