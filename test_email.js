const { sendEmail } = require("./emails");

(async () => {
  await sendEmail("Test email", "Test email");
})();
