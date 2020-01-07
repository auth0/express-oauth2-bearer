const { JWT, JWK } = require('jose');
const crypto = require('crypto');
const server = require('./fixture/server');
const { assert } = require('chai');
const { auth, strategies } = require('./..');
const cert = require('./fixture/cert');
const request = require('request-promise-native').defaults({
  simple: false,
  resolveWithFullResponse: true
});

const issuer = 'https://flosser.auth0.com/';
const audience = 'https://flosser.example.com/api';
const symmetricKey = crypto.randomBytes(64).toString('hex');
const key = JWK.asKey(cert.key, { kid: cert.kid });

describe('integration tests', function() {
  let address;

  before(async function() {
    address = await server.create(auth(strategies.openid({
      issuerBaseURL: issuer,
      allowedAudiences: [ audience ],
      clientSecret: symmetricKey
    })));
  });

  describe('when the token is valid', function() {
    let res;
    let token = JWT.sign({
      'iss': issuer,
      'aud': audience,
      'iat': Math.round(Date.now() / 1000),
      'exp': Math.round(Date.now() / 1000) + 60000,
      'fifi': 'tutu',
      'scope': 'read:products'
    }, key, { algorithm: 'RS256' });

    before(async function() {
      res = await request.get({
        url: `${address}/test`,
        json: true,
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
    });

    it('should work', function() {
      assert.equal(res.statusCode, 200);
    });

    it('should work for an endpoint expecting the scope', async function() {
      const res = await request.get({
        url: `${address}/products`,
        json: true,
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      assert.equal(res.statusCode, 200);
    });

    it('should not work for an endpoint expecting a different scope', async function() {
      const res = await request.get({
        url: `${address}/orders`,
        json: true,
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      assert.equal(res.statusCode, 403);
    });

    it('should put the claims in the req object', function() {
      assert.ok(res.body);
      assert.ok(res.body.claims.fifi, 'tutu');
    });
  });

  describe('when the token has a different audience', function() {
    let res;
    let token = JWT.sign({
      'iss': issuer,
      'aud': 'fioireas',
      'iat': Math.round(Date.now() / 1000),
      'exp': Math.round(Date.now() / 1000) + 60000,
      'fifi': 'tutu'
    }, key, { algorithm: 'RS256' });

    before(async function() {
      res = await request.get({
        url: `${address}/test`,
        json: true,
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
    });

    it('should return 401', async function() {
      assert.equal(res.statusCode, 401);
    });
  });


  describe('when the token is valid and signed with a symmetric key', function() {
    let res;
    let token = JWT.sign({
      'iss': issuer,
      'aud': audience,
      'iat': Math.round(Date.now() / 1000),
      'exp': Math.round(Date.now() / 1000) + 60000,
      'fifi': 'tutu'
    }, symmetricKey, { algorithm: 'HS256' });

    before(async function() {
      res = await request.get({
        url: `${address}/test`,
        json: true,
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
    });

    it('should work', async function() {
      assert.equal(res.statusCode, 200);
    });

    it('should put the claims in the req object', async function() {
      assert.ok(res.body);
      assert.ok(res.body.claims.fifi, 'tutu');
    });
  });
});
