const faker = require("faker");

module.exports = () => {
  const data = { users: [] };
  // Create 1000 users
  for (let i = 0; i < 100; i++) {
    data.users.push({
      id: i,
      name: faker.name.findName(),
      email: faker.internet.email()
    });
  }
  return data;
};
