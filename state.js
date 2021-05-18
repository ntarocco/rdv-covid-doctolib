const fs = require("fs");

const PATH = "./state.json";

hasState = () => fs.existsSync(PATH);

readState = () =>
  hasState() ? JSON.parse(fs.readFileSync(PATH, "UTF-8")) : {};

persistState = (state) =>
  fs.writeFileSync(PATH, JSON.stringify(state), "UTF-8");

module.exports = {
  readState: readState,
  persistState: persistState,
};
