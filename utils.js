const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));

module.exports = {
  config: config,
};
