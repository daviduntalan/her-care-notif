<?php
/**
 * HER CARE notification configuration.
 *
 * IMPORTANT:
 * 1) Change admin_email before deploying.
 * 2) For local XAMPP, PHP mail() usually needs mail-server configuration.
 *    You can instead set email.driver to 'smtp' and enter SMTP credentials below.
 * 3) Never commit real SMTP passwords or SMS API keys to a public repository.
 */
return [
    'admin_email' => 'aimgforces@gmail.com',

    'email' => [
        // 'mail' uses PHP mail(); 'smtp' uses the small SMTP client bundled with this project.
        'driver' => 'smtp',
        'from_name' => 'HER CARE',
        'from_email' => 'aimgforces@gmail.com',

        // Used only when driver = 'smtp'. Example for Gmail: smtp.gmail.com / 587 / tls.
        'smtp' => [
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls', // tls, ssl, or none
            'username' => 'aimgforces@gmail.com',
            // 'password' => 'hwqs bbmg vpjf hooi', // For Gmail, use an App Password rather than your normal password.
            'password' => 'ehya orox ayuq slvp', // For Gmail, use an App Password rather than your normal password.
            'timeout' => 15,
        ],
    ],

    'sms' => [
        // Optional Philippine SMS delivery through Semaphore.
        // When disabled or if SMS delivery fails, HER CARE falls back to the client's email.
        'enabled' => false,
        'provider' => 'semaphore',
        'api_key' => '',
        'sender_name' => '', // Must be an active sender name on your provider account.
    ],
];
