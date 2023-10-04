const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('#getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(testUsers, "user@example.com");
    const expectedUserID = testUsers['userRandomID'];
    assert.deepEqual(user, expectedUserID);
  });

  it('should return null for email that is not contained in database', () => {
    const nullUser = getUserByEmail(testUsers, 'nothing');
    assert.isNull(nullUser);
  });

  it('should throw error when returning undefined database', () => {
    assert.throws(() => getUserByEmail(undefined, 'something'), 'getUserByEmail requires valid users and email.');
  });

  it('should throw error when returning undefined arguments', () => {
    assert.throws(() => getUserByEmail(testUsers, undefined), 'getUserByEmail requires valid users and email.');
  });

  it('should throw error if database is array', () => {
    assert.throws(() => getUserByEmail([testUsers], 'user@example.com'), 'getUserByEmail requires valid users and email.');
  });
});