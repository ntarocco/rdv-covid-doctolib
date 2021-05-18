# COVID 2021 - Rendez-vous Doctolib for vaccination

Find an available slot for vaccination on Doctolib.fr and get an e-mail notification.

I created this script to find any available "chronodose", the doses that at the end of the day are not used or spare ones and can given to any person, without age limitation or other criteria.

## How it works

It uses [Playwright](https://playwright.dev/) to open a browser, search for the vaccination centres that you are interested to (matching configured name and address) and check if there is any available slot. It can detect if Doctolib is queueing users (when there are too many users trying to access the website).

It will send an e-mail when an available slot is found or in case of error using [Nodemailer](https://nodemailer.com/).

Works best when run as cron job.

## Setup

Install NodeJS and NPM first.

```console
$ cd rdv-covid-doctolib
$ npm i
```

Create the config file:

```console
$ cp config.sample.json config.json
```

Edit the config file:

1. Go to https://www.doctolib.fr/vaccination-covid-19 and choose your category for the vaccination

<a href="https://github.com/ntarocco/rdv-covid-doctolib/blob/main/screenshots/doctolib1.png">
    <img src="https://raw.githubusercontent.com/ntarocco/rdv-covid-doctolib/main/screenshots/doctolib1.png" width="600" alt="Doctolib choose category" />
</a>

2. Search for city where you live or where you want to have the vaccination

<a href="https://github.com/ntarocco/rdv-covid-doctolib/blob/main/screenshots/doctolib2.png">
    <img src="https://raw.githubusercontent.com/ntarocco/rdv-covid-doctolib/main/screenshots/doctolib2.png" width="600" alt="Doctolib find centre" />
</a>

3. Copy the URL, for example <https://www.doctolib.fr/vaccination-covid-19/lyon?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2>. Notice the presence of the name of the city in URL and `ids` of the category you have chosen.
4. Copy the name of the centre and the first line of the address that the script should find and paste it in the `config.json`:

```json
{
  "centres": [
    {
      "URL": "https://www.doctolib.fr/vaccination-covid-19/lyon?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2",
      "name": "Hospices Civils de Lyon (HCL) - Vaccination COVID-19",
      "addressFirstLine": "136 Rue Commandant Charcot"
    }
  ],
}
```

### Setup emails

The current version supports Gmail only, but you can modify the code use any other mail server. See [Node Mailer SMTP transport](https://nodemailer.com/smtp/) for more information.
With Gmail, you can create an [App Password](https://support.google.com/mail/answer/185833) to avoid to use your Google Account credentials.

Change the `config.json`:

```json
{
  "centres": [
    ...
  ],
  "nodemailer": {
    "enabled": true,
    "user": "<username>",
    "password": "<password>",
    "from": "<myemail@domain.com>",
    "to": "<myemail@domain.com>"
  }
}
```

To test the email, simply run:

```console
$ npm run test-email
```

### Cron setup

Ideally, you would setup a cron to check slots availability every X minutes. **Please be nice and do not run it every second!**

Be aware that `Doctolib.fr` has a queue system that will block access when too many users are trying to access the website.

If you want to run it every 30 minutes:

```console
*/30 * * * * /bin/bash -c "cd /<my-path>/rdv-covid-doctolib && /<path-to-node>/bin/node ." > /tmp/rdv-covid-doctolib.log 2>&1
```

## Run

To run and test it locally:

```console
$ cd rdv-covid-doctolib
$ node .

Checking Hospices Civils de Lyon (HCL) - Vaccination COVID-19
No available slots at Hospices Civils de Lyon (HCL) - Vaccination COVID-19
```

If the scripts fails, it will send you an e-mail with the error. Errors are sent every 2 hours (to avoid mail spam in case there is an error on each run).

## Debug

To debug:

```console
$ cd rdv-covid-doctolib
$ npm run debug
```

In debug mode, you will see the browser opening and search for available slots. Please refer to the [Playwright debug guide](https://playwright.dev/docs/debug) for more info.
