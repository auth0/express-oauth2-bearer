const { assert, expect } = require('chai');
const getToken = require('../lib/getToken');

describe('get token from request', function() {

  describe('when token is provided in the authorization header', function() {
    let expected, actual;

    before(function() {
      expected = '1234';
      actual = getToken({
        headers: {
          'authorization': `Bearer ${expected}`
        }
      });
    });

    it('should return the token', function() {
      assert.equal(actual, expected);
    });
  });

  describe('when the authorization header is not Bearer', function() {
    let expected = '1234';

    it('should throw an error', function() {
      expect(() => {
        getToken({
          headers: {
            'authorization': `Boring ${expected}`
          }
        });
      }).to.throw(/bearer token is missing/)
        .which.deep.contain({
          statusCode: 400,
          headers: {
            'www-authentication': 'Bearer realm="api", error="invalid_request", error_description="invalid request"'
          }
        });
    });
  });


  describe('when token is provided in the body', function() {
    let expected, actual;

    describe('if is form encoded', function() {
      before(function() {
        expected = '1234';
        actual = getToken({
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          body: {
            'access_token': expected
          }
        });
      });

      it('should return the token', function() {
        assert.equal(actual, expected);
      });
    });

    describe('if is encoded in a different way', function() {
      it('should throws', function() {
        expect(() => getToken({
          method: 'POST',
          body: {
            'access_token': expected
          }
        })).to.throw(/bearer token is missing/)
          .which.deep.contain({
            statusCode: 400,
            headers: {
              'www-authentication': 'Bearer realm="api", error="invalid_request", error_description="invalid request"'
            }
          });
      });
    });

    describe('if body is not expected', function() {
      it('should throws', function() {
        expect(() => getToken({
          method: 'GET',
          headers: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          body: {
            'access_token': expected
          }
        })).to.throw(/bearer token is missing/)
          .which.deep.contain({
            statusCode: 400,
            headers: {
              'www-authentication': 'Bearer realm="api", error="invalid_request", error_description="invalid request"'
            }
          });
      });
    });
  });



  describe('when token is provided in the query', function() {
    let expected, actual;

    describe('if the method does not accept body', function() {
      before(function() {
        expected = '1234';
        actual = getToken({
          method: 'GET',
          query: {
            'access_token': expected
          }
        });
      });

      it('should return the token', function() {
        assert.equal(actual, expected);
      });
    });

    describe('if the method accepts body', function() {
      it('should throws', function() {
        expect(() => getToken({
          method: 'POST',
          query: {
            'access_token': expected
          }
        })).to.throw(/bearer token is missing/)
          .which.deep.contain({
            statusCode: 400,
            headers: {
              'www-authentication': 'Bearer realm="api", error="invalid_request", error_description="invalid request"'
            }
          });
      });
    });
  });


  describe('when the token is sent in header and query', function() {

    it('should throws', function() {
      expect(() => getToken({
        method: 'GET',
        query: {
          'access_token': '123'
        },
        headers: {
          'authorization': 'Bearer 123'
        }
      })).to.throw(/more than one method used for authentication/)
        .which.deep.contain({
          statusCode: 400,
          headers: {
            'www-authentication': 'Bearer realm="api", error="invalid_request", error_description="invalid request"'
          }
        });
    });
  });
});
