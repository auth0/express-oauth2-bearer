Authentication middleware for Express.js that validates access tokens following [RFC 6750](https://tools.ietf.org/html/rfc6750). The purpose of this library is to protect OAuth 2.0 resources.

**Please Note:** This library is currently in pre-release status and has not had a complete security review. We **do not** recommend using this library in production yet. As we move towards early access, please be aware that releases may contain breaking changes. We will be monitoring the Issues queue here for feedback and questions. PRs and comments on existing PRs are welcome!

## Table of Contents
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fauth0%2Fexpress-oauth2-bearer.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fauth0%2Fexpress-oauth2-bearer?ref=badge_shield)


- [Installation](#installation)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Support + Feedback](#support--feedback)
- [Vulnerability Reporting](#vulnerability-reporting)
- [What is Auth0](#what-is-auth0)
- [License](#license)

## Installation

This library is installed with [npm](https://npmjs.org/package/express-oauth2-bearer):

```
npm i express-oauth2-bearer --save
```

## Getting Started

The library needs the following values to authroize requests:

- **Issuer Base URL**: The base URL of the authorization server. If you're using Auth0, this is your tenant **Domain** pre-pended with `https://` (like `https://tenant.auth0.com`) found on the **Settings** tab for your Application in the [Auth0 dashboard](https://manage.auth0.com).
- **Allowed Audiences**: Audience identifier (or multiple separated by a comma) allowed for the access token. If you're using Auth0, this is the **Identifier** found on the **Settings** tab for your API in the [Auth0 dashboard](https://manage.auth0.com/#/apis).

These can be configured in a `.env` file in the root of your application:

```text
# .env

ISSUER_BASE_URL=https://YOUR_DOMAIN
ALLOWED_AUDIENCES=https://api.yourapplication.com
```

... or in your application code:

```js
app.use(auth({
  issuerBaseURL: 'https://tenant.auth0.com',
  allowedAudiences: 'https://api.yourapplication.com'
}));
```

The OpenID strategy is the default strategy for token validation. With the configuration values set in the `.env` file, the following code will restrict requests to all proceeding routes to ones that have a valid access token with the `https://api.yourapplication.com` audience and the `read:products` scope:

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

If access tokens are not expected to be signed like OpenID Connect ID tokens, add the `auth` middleware with a callback to validate as follows:

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

### API Documentation:

`auth()` accepts an asynchronous function receiving an access token and returning a set of claims.

`requiredScopes()` accepts either a string or an array of strings.

`strategies.openid` accepts the following parameters:


| Name                | Default                            | Description                                                          |
|---------------------|------------------------------------|----------------------------------------------------------------------|
| issuerBaseURL       | `env.ISSUER_BASE_URL`              | URL for the token issuer.                                            |
| allowedAudiences    | `env.ALLOWED_AUDIENCES.split(',')` | Allowed audiences for the token.                                     |
| clockTolerance      | `5`                                | Clock tolerance in seconds for token verification, aka leeway.       |
| clientSecret        | `env.CLIENT_SECRET`                | Client secret, required for tokens signed with symmetric algorithms. |

## Contributing

We appreciate feedback and contribution to this repo! Before you get started, please see the following:

- [Auth0's general contribution guidelines](https://github.com/auth0/.github/blob/master/CONTRIBUTING.md)
- [Auth0's code of conduct guidelines](https://github.com/auth0/open-source-template/blob/master/CODE-OF-CONDUCT.md)

Contributions can be made to this library through PRs to fix issues, improve documentation or add features. Please fork this repo, create a well-named branch, and submit a PR with a complete template filled out.

Code changes in PRs should be accompanied by tests covering the changed or added functionality. Tests can be run for this library with:

```bash
npm install
npm test
```

When you're ready to push your changes, please run the lint command first:

```bash
npm run lint
```

## Support + Feedback

Please use the [Issues queue](https://github.com/auth0/express-oauth2-bearer/issues) in this repo for questions and feedback.

## Vulnerability Reporting

Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## What is Auth0?

Auth0 helps you to easily:

- implement authentication with multiple identity providers, including social (e.g., Google, Facebook, Microsoft, LinkedIn, GitHub, Twitter, etc), or enterprise (e.g., Windows Azure AD, Google Apps, Active Directory, ADFS, SAML, etc.)
- log in users with username/password databases, passwordless, or multi-factor authentication
- link multiple user accounts together
- generate signed JSON Web Tokens to authorize your API calls and flow the user identity securely
- access demographics and analytics detailing how, when, and where users are logging in
- enrich user profiles from other data sources using customizable JavaScript rules

[Why Auth0?](https://auth0.com/why-auth0)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fauth0%2Fexpress-oauth2-bearer.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fauth0%2Fexpress-oauth2-bearer?ref=badge_large)