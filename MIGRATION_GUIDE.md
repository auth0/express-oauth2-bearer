# Migrating to express-oauth2-jwt-bearer

Our recommended middleware for protecting Express APIs is now [express-oauth2-jwt-bearer](https://github.com/auth0/express-oauth2-jwt-bearer). This guide demonstrates how to migrate from `express-oauth2-bearer` to `express-oauth2-jwt-bearer`.

## Basic setup

### Before

```bash
# .env

ISSUER_BASE_URL=https://YOUR_DOMAIN
ALLOWED_AUDIENCES=https://api.yourapplication.com
```

```javascript
const { auth } = require('express-oauth2-bearer');

app.use(auth());
```

Or in your application code:

```javascript
const { auth } = require('express-oauth2-bearer');

app.use(auth({
  issuerBaseURL: 'https://tenant.auth0.com',
  allowedAudiences: 'https://api.yourapplication.com'
}));
```

### After

```bash
# .env

ISSUER_BASE_URL=https://YOUR_ISSUER_DOMAIN
AUDIENCE=https://my-api.com
```

```javascript
const { auth } = require('express-oauth2-jwt-bearer');

app.use(auth());
```

Or in your application code:

```javascript
const { auth } = require('express-oauth2-jwt-bearer');

app.use(auth({
  issuerBaseURL: 'https://YOUR_ISSUER_DOMAIN',
  audience: 'https://my-api.com'
}));
```

## JWTs signed with symmetric algorithms (eg HS256)

### Before

```javascript
const { auth } = require('express-oauth2-bearer');

app.use(auth({
  issuerBaseURL: 'https://tenant.auth0.com',
  allowedAudiences: 'https://api.yourapplication.com',
  clientSecret: 'YOUR SECRET'
}));
```

### After

```javascript
const { auth } = require('express-oauth2-jwt-bearer');

app.use(auth({
  issuer: 'https://YOUR_ISSUER_DOMAIN',
  audience: 'https://my-api.com',
  secret: 'YOUR SECRET',
  tokenSigningAlg: 'HS256'
}));
```

## Require scopes

### Before

```javascript
const { auth, requiredScopes } = require('express-oauth2-bearer');

app.use(auth());

app.get('/products',
  requiredScopes('read:products'),
  (req, res) => {
    res.sendStatus(200);
  });
```

### After (same API)

```javascript
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

app.use(auth());

app.get('/products',
  requiredScopes('read:products'),
  (req, res) => {
    res.sendStatus(200);
  });
```

## Inspect token

### Before

```javascript
const { auth } = require('express-oauth2-bearer');

app.use(auth());

app.get('/products',
  (req, res) => {
    const auth = req.auth;
    auth.claims;  // The decoded JWT payload.
    auth.token; // The raw JWT token.
    res.sendStatus(200);
  });
```

### After

```javascript
const { auth } = require('express-oauth2-jwt-bearer');

app.use(auth());

app.get('/products',
  (req, res) => {
    const auth = req.auth;
    auth.header; // The decoded JWT header.
    auth.payload;  // The decoded JWT payload.
    auth.token; // The raw JWT token.
    res.sendStatus(200);
  });
 ```
 