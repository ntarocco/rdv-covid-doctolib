const { sendEmail } = require("./emails");
const { chromium } = require("playwright");
const { config } = require("./utils");
const { readState, persistState } = require("./state");

// send error email every 2 hours to avoid email spam
const HOURS_2_MS = 2 * 60 * 60 * 1000;

init = async () => {
  const browser = await chromium.launch({
    headless: true,
    slowMo: 50,
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
  });
  await context.clearCookies();
  const page = await context.newPage();
  return [browser, page];
};

sendSuccessNotification = (results) => {
  let text = "";
  for (const result of results) {
    text += `${result.name} (${result.URL})\n`;
    text += `${result.slots.join("\n")}\n`;
    text += "\n\n";
  }

  const subject = `[BOT] - RDV COVID - New slots available!`;
  const body = `
Hey,
script run at ${new Date().toUTCString()}. Availability:

${text}

Have a nice day!
`;
  sendEmail(subject, body);
};

sendErrorNotification = (error) => {
  const subject = `[BOT] - RDV COVID - error`;
  const body = `
Hey,
something went wrong during the last run at ${new Date().toUTCString()}:

${error}

Have a nice day!
`;
  sendEmail(subject, body);
};

isQueueActivated = async (page) => {
  const isQueueUp = await page.$("text=file d'attente");
  return isQueueUp ? true : false;
};

checkRDV = async (centreName, element) => {
  const noRDV = await element.$("text=Aucun rendez-vous de vaccination");
  let slotsTitles = [];
  if (!noRDV) {
    const slotsElements = await element.$$(".availabilities-slot");
    slotsTitles = slotsElements.map(
      async (el) => await el.getAttribute("title")
    );
    console.log(`Available slots at ${centreName}!`, slotsTitles.join(", "));
  } else {
    console.log(`No available slots at ${centreName}`);
  }
  return slotsTitles;
};

findCentreByName = async (page, name, addressFirstLine) => {
  const centre = await page.$(`*css=.dl-search-result >> text=${name}`);
  if (!centre) {
    throw Error(`${name} element not found.`);
  }

  const address = await centre.$(`text=${addressFirstLine}`);
  if (!address) {
    throw Error(`${name} element with address ${addressFirstLine} not found.`);
  }

  return centre;
};

go = async (page) => {
  let results = [];
  for (const centre of config.centres) {
    console.log(`Checking ${centre.name}`);

    await page.goto(centre.URL);
    await page.waitForLoadState("load");

    const isQueueUp = await isQueueActivated(page);
    if (isQueueUp) {
      console.log(
        "Too many users on the website, queue is activated, exiting..."
      );
      return [];
    }

    const centreElement = await findCentreByName(
      page,
      centre.name,
      centre.addressFirstLine
    );
    const slots = await checkRDV(centre.name, centreElement);
    if (slots.length) {
      results.push({
        name: centre.name,
        URL: centre.URL,
        slots: slots,
      });
    }
  }
  return results;
};

shouldSendError = () => {
  const state = readState();
  const hasLastError = state.hasOwnProperty("lastError");
  const now = new Date();
  if (!hasLastError) {
    persistState({
      lastError: now.toUTCString(),
    });
    return true;
  } else {
    const lastError = new Date(state["lastError"]);
    const diffInMs = Math.abs(now - lastError);
    if (diffInMs > HOURS_2_MS) {
      persistState({
        lastError: now.toUTCString(),
      });
      return true;
    }
  }
  return false;
};

(async () => {
  const [browser, page] = await init();

  try {
    const results = await go(page);
    if (results.length) {
      await sendSuccessNotification(results);
    }
  } catch (e) {
    console.error(e);
    if (shouldSendError()) {
      await sendErrorNotification(e);
    }
  }
  await browser.close();
})();
