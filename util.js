// return a randomly generated string containing numbers or letters.
const generateRandomString = () => {
  // Math.random generates a random decimal, toString with radix converts to base 36 (allows us to have numbers and letters),
  // take substring after decimal point.
  return Math.random().toString(36).substring(2, 8);
};

module.exports = {
  generateRandomString
};