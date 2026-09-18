HER CARE — HOME VISIT WEBSITE WITH EMAIL + SMS NOTIFICATIONS
=============================================================

WHAT THIS VERSION ADDS
----------------------
1. Booking submissions are emailed to the HER CARE administrator.
2. Clients receive a booking acknowledgement:
   - SMS first, when the optional SMS gateway is enabled and succeeds.
   - Email automatically if SMS is disabled or fails.
3. Ask HER CARE questions are emailed to the administrator.
4. Clients receive the same SMS-first / email-fallback acknowledgement for questions.
5. A local browser copy is still kept as a backup.
6. If server delivery fails, the page clearly warns the user not to assume the request was received.

IMPORTANT: THIS VERSION MUST RUN THROUGH PHP
--------------------------------------------
Email/SMS will NOT work if index.html is opened by double-clicking it (file://...).
Run the folder through a PHP-capable server such as XAMPP, WAMP, MAMP, Laragon,
or a PHP web host.

QUICK XAMPP SETUP
-----------------
1. Copy the whole HER CARE folder into:
   C:\xampp\htdocs\her-care-notif\

2. Start Apache in XAMPP.

3. Open:
   http://localhost/her-care-notif/

4. Configure notifications in config.php before testing.

ADMIN EMAIL SETUP (REQUIRED)
----------------------------
Open config.php and change:

    'admin_email' => 'admin@example.com',

into the real HER CARE administrator email.

Also change:

    'from_email' => 'no-reply@example.com',

into an address that your mail server is allowed to send from.

EMAIL OPTION A — PHP mail()
---------------------------
config.php defaults to:

    'driver' => 'mail',

This works only when PHP mail() is properly configured by the web host/server.
A normal local XAMPP installation usually does not send internet email without
additional mail-server configuration.

EMAIL OPTION B — SMTP (RECOMMENDED FOR PROJECT TESTING)
-------------------------------------------------------
Change:

    'driver' => 'smtp',

Then configure:

    'host' => 'smtp.gmail.com',
    'port' => 587,
    'encryption' => 'tls',
    'username' => 'your-email@gmail.com',
    'password' => 'YOUR_APP_PASSWORD',

For Gmail, use an App Password where available; do not put your normal account
password into this project. Keep config.php private and never publish real
credentials/API keys to a public Git repository.

OPTIONAL SMS SETUP — SEMAPHORE (PHILIPPINES)
--------------------------------------------
SMS is OFF by default. The website works without it and falls back to email.

To enable SMS, edit config.php:

    'enabled' => true,
    'provider' => 'semaphore',
    'api_key' => 'YOUR_SEMAPHORE_API_KEY',
    'sender_name' => 'YOUR_APPROVED_SENDER_NAME',

The backend sends SMS through Semaphore's message API. Your Semaphore account
must have credits and a valid/active sender name as required by the provider.

FILES ADDED / CHANGED
---------------------
index.html        Updated booking and Ask HerCare forms with client email/contact fields.
app.js            Sends submissions to notify.php and shows delivery status.
styles.css        Notification/error-state styles.
config.php        Admin email, email driver/SMTP, and optional SMS settings.
notify.php        Server endpoint for admin email + SMS/email client acknowledgement.
smtp_mailer.php   Small SMTP sender so Composer/PHPMailer is not required.

PRIVACY / PRODUCTION NOTE
-------------------------
This is appropriate as a project/prototype foundation, but maternal-health details,
home addresses, phone numbers, and questions can be sensitive personal information.
For real deployment, use HTTPS, a proper secured database/admin portal, access controls,
retention/deletion rules, audit logs, backups, appropriate consent/privacy notices, and
professional review for applicable healthcare and Philippine data-privacy requirements.
Avoid putting detailed health information into SMS messages; this project intentionally
keeps SMS acknowledgements brief.

TEST CHECKLIST
--------------
[ ] Replace admin@example.com.
[ ] Configure working email delivery (mail or SMTP).
[ ] Submit a test booking and confirm the admin receives it.
[ ] Confirm the client receives an email when SMS is disabled.
[ ] Optional: configure SMS and confirm client receives a text.
[ ] Submit an Ask HerCare question and confirm both notification paths.
[ ] Test on mobile and desktop.
