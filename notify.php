<?php

declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'POST requests only.']);
    exit;
}

$config = require __DIR__ . '/config.php';
require_once __DIR__ . '/smtp_mailer.php';

function response_json(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_text(mixed $value, int $max = 1000): string {
    $text = trim((string)$value);
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
    return function_exists('mb_substr') ? mb_substr($text, 0, $max) : substr($text, 0, $max);
}

function valid_email(string $email): bool {
    return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
}

function valid_phone(string $phone): bool {
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    return strlen($digits) >= 10 && strlen($digits) <= 15;
}

function send_email_notice(array $config, string $to, string $subject, string $body, ?string $replyTo = null): array {
    if (!valid_email($to)) {
        return [false, 'Invalid recipient email.'];
    }

    $email = $config['email'] ?? [];
    $fromName = clean_text($email['from_name'] ?? 'HER CARE', 100);
    $fromEmail = clean_text($email['from_email'] ?? '', 200);
    if (!valid_email($fromEmail)) {
        return [false, 'The configured from_email is invalid.'];
    }

    $driver = strtolower((string)($email['driver'] ?? 'mail'));
    if ($driver === 'smtp') {
        return hercare_send_smtp($email['smtp'] ?? [], $fromEmail, $fromName, $to, $subject, $body, $replyTo);
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . str_replace(["\r", "\n"], '', $fromName) . ' <' . str_replace(["\r", "\n"], '', $fromEmail) . '>',
    ];
    if ($replyTo && valid_email($replyTo)) {
        $headers[] = 'Reply-To: <' . str_replace(["\r", "\n"], '', $replyTo) . '>';
    }
    $sent = @mail($to, $subject, $body, implode("\r\n", $headers));
    return [$sent, $sent ? 'Email accepted by PHP mail().' : 'PHP mail() could not send the message. Configure server mail or SMTP.'];
}

function send_semaphore_sms(array $config, string $number, string $message): array {
    $sms = $config['sms'] ?? [];
    if (empty($sms['enabled'])) {
        return [false, 'SMS is disabled.'];
    }
    if (($sms['provider'] ?? '') !== 'semaphore') {
        return [false, 'Unsupported SMS provider.'];
    }
    if (!function_exists('curl_init')) {
        return [false, 'PHP cURL is not enabled.'];
    }
    $apiKey = trim((string)($sms['api_key'] ?? ''));
    if ($apiKey === '') {
        return [false, 'Semaphore API key is not configured.'];
    }

    $params = [
        'apikey' => $apiKey,
        'number' => $number,
        'message' => $message,
    ];
    $senderName = trim((string)($sms['sender_name'] ?? ''));
    if ($senderName !== '') {
        $params['sendername'] = $senderName;
    }

    $ch = curl_init('https://api.semaphore.co/api/v4/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($params),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $output = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($output === false || $error !== '') {
        return [false, 'SMS request failed: ' . $error];
    }
    $decoded = json_decode($output, true);
    if ($status < 200 || $status >= 300 || !is_array($decoded)) {
        return [false, 'SMS provider returned an error.'];
    }
    // Semaphore normally returns an array of message records.
    $records = array_is_list($decoded) ? $decoded : [$decoded];
    foreach ($records as $record) {
        if (is_array($record) && strtolower((string)($record['status'] ?? '')) === 'failed') {
            return [false, 'SMS provider reported a failed message.'];
        }
    }
    return [true, 'SMS queued successfully.'];
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    response_json(400, ['ok' => false, 'message' => 'Invalid JSON request.']);
}

// Honeypot: bots often fill hidden fields that humans never see.
if (clean_text($data['website'] ?? '', 200) !== '') {
    response_json(200, ['ok' => true, 'message' => 'Received.']);
}

$type = clean_text($data['type'] ?? '', 20);
$adminEmail = clean_text($config['admin_email'] ?? '', 200);
if (!valid_email($adminEmail) || str_ends_with(strtolower($adminEmail), '@example.com')) {
    response_json(500, [
        'ok' => false,
        'code' => 'admin_email_not_configured',
        'message' => 'Admin email is not configured yet. Edit config.php and replace admin@example.com.',
    ]);
}

if ($type === 'booking') {
    $required = ['reference', 'service', 'packageName', 'date', 'time', 'midwife', 'motherName', 'contactNumber', 'clientEmail', 'homeAddress', 'motherStatus'];
    foreach ($required as $field) {
        if (clean_text($data[$field] ?? '', 2000) === '') {
            response_json(422, ['ok' => false, 'message' => "Missing required booking field: {$field}"]);
        }
    }

    $clientEmail = clean_text($data['clientEmail'], 200);
    $contactNumber = clean_text($data['contactNumber'], 50);
    if (!valid_email($clientEmail)) {
        response_json(422, ['ok' => false, 'message' => 'Please enter a valid client email address.']);
    }
    if (!valid_phone($contactNumber)) {
        response_json(422, ['ok' => false, 'message' => 'Please enter a valid contact number.']);
    }

    $reference = clean_text($data['reference'], 50);
    $adminSubject = "HER CARE booking request {$reference}";
    $adminBody = "A new HER CARE home-visit request was submitted.\n\n"
        . "Reference: {$reference}\n"
        . "Mother: " . clean_text($data['motherName'], 150) . "\n"
        . "Contact: {$contactNumber}\n"
        . "Email: {$clientEmail}\n"
        . "Status: " . clean_text($data['motherStatus'], 100) . "\n\n"
        . "Service: " . clean_text($data['service'], 200) . "\n"
        . "Package: " . clean_text($data['packageName'], 200) . "\n"
        . "Fee: " . clean_text($data['fee'] ?? '', 100) . "\n"
        . "Date: " . clean_text($data['date'], 100) . "\n"
        . "Time: " . clean_text($data['time'], 100) . "\n"
        . "Preferred midwife: " . clean_text($data['midwife'], 200) . "\n"
        . "Home address: " . clean_text($data['homeAddress'], 700) . "\n\n"
        . "Additional concerns:\n" . (clean_text($data['concerns'] ?? '', 1200) ?: 'None provided') . "\n\n"
        . "Please review availability and contact the mother to confirm the home visit.";

    [$adminSent, $adminMessage] = send_email_notice($config, $adminEmail, $adminSubject, $adminBody, $clientEmail);
    if (!$adminSent) {
        response_json(502, ['ok' => false, 'message' => 'Booking was not emailed to the admin. ' . $adminMessage]);
    }

    // Keep SMS brief and avoid including sensitive health details.
    $clientSms = "HER CARE: We received booking {$reference} for " . clean_text($data['date'], 40) . ' ' . clean_text($data['time'], 40) . ". A midwife will contact you to confirm. For emergencies, seek immediate medical care.";
    [$smsSent, $smsMessage] = send_semaphore_sms($config, $contactNumber, $clientSms);

    $clientChannel = 'sms';
    if (!$smsSent) {
        $clientSubject = "HER CARE booking received — {$reference}";
        $clientBody = "Hello " . clean_text($data['motherName'], 150) . ",\n\n"
            . "Your HER CARE home-visit request has been received.\n\n"
            . "Reference: {$reference}\n"
            . "Service: " . clean_text($data['service'], 200) . "\n"
            . "Package: " . clean_text($data['packageName'], 200) . "\n"
            . "Date: " . clean_text($data['date'], 100) . "\n"
            . "Time: " . clean_text($data['time'], 100) . "\n"
            . "Preferred midwife: " . clean_text($data['midwife'], 200) . "\n\n"
            . "A HER CARE midwife will confirm your appointment and provide further instructions.\n\n"
            . "For urgent symptoms or emergencies, seek immediate medical care rather than waiting for a HER CARE response.";
        [$emailSent, $emailMessage] = send_email_notice($config, $clientEmail, $clientSubject, $clientBody);
        if (!$emailSent) {
            response_json(207, [
                'ok' => true,
                'partial' => true,
                'message' => 'Admin was notified, but the client confirmation could not be delivered by SMS or email.',
                'adminNotified' => true,
                'clientChannel' => 'none',
                'details' => [$smsMessage, $emailMessage],
            ]);
        }
        $clientChannel = 'email';
    }

    response_json(200, [
        'ok' => true,
        'message' => 'Booking notification sent.',
        'adminNotified' => true,
        'clientChannel' => $clientChannel,
    ]);
}

if ($type === 'question') {
    $required = ['reference', 'topic', 'name', 'question', 'contactNumber', 'clientEmail'];
    foreach ($required as $field) {
        if (clean_text($data[$field] ?? '', 2000) === '') {
            response_json(422, ['ok' => false, 'message' => "Missing required question field: {$field}"]);
        }
    }

    $clientEmail = clean_text($data['clientEmail'], 200);
    $contactNumber = clean_text($data['contactNumber'], 50);
    if (!valid_email($clientEmail)) {
        response_json(422, ['ok' => false, 'message' => 'Please enter a valid email address.']);
    }
    if (!valid_phone($contactNumber)) {
        response_json(422, ['ok' => false, 'message' => 'Please enter a valid contact number.']);
    }

    $reference = clean_text($data['reference'], 50);
    $adminSubject = "HER CARE question received {$reference}";
    $adminBody = "A new Ask HER CARE question was submitted.\n\n"
        . "Reference: {$reference}\n"
        . "Name: " . clean_text($data['name'], 150) . "\n"
        . "Contact: {$contactNumber}\n"
        . "Email: {$clientEmail}\n"
        . "Topic: " . clean_text($data['topic'], 150) . "\n\n"
        . "Question:\n" . clean_text($data['question'], 1600) . "\n\n"
        . "Please review and respond through the client's supplied contact information.";

    [$adminSent, $adminMessage] = send_email_notice($config, $adminEmail, $adminSubject, $adminBody, $clientEmail);
    if (!$adminSent) {
        response_json(502, ['ok' => false, 'message' => 'Question was not emailed to the admin. ' . $adminMessage]);
    }

    $clientSms = "HER CARE: We received your question {$reference} about " . clean_text($data['topic'], 60) . ". A midwife will review it. For urgent symptoms or emergencies, seek immediate medical care.";
    [$smsSent, $smsMessage] = send_semaphore_sms($config, $contactNumber, $clientSms);
    $clientChannel = 'sms';

    if (!$smsSent) {
        $clientSubject = "HER CARE question received — {$reference}";
        $clientBody = "Hello " . clean_text($data['name'], 150) . ",\n\n"
            . "We received your Ask HER CARE question.\n\n"
            . "Reference: {$reference}\n"
            . "Topic: " . clean_text($data['topic'], 150) . "\n\n"
            . "A HER CARE midwife will review your question and follow up using the contact information you provided.\n\n"
            . "For urgent symptoms or emergencies, seek immediate medical care rather than waiting for a HER CARE response.";
        [$emailSent, $emailMessage] = send_email_notice($config, $clientEmail, $clientSubject, $clientBody);
        if (!$emailSent) {
            response_json(207, [
                'ok' => true,
                'partial' => true,
                'message' => 'Admin was notified, but the client acknowledgement could not be delivered by SMS or email.',
                'adminNotified' => true,
                'clientChannel' => 'none',
                'details' => [$smsMessage, $emailMessage],
            ]);
        }
        $clientChannel = 'email';
    }

    response_json(200, [
        'ok' => true,
        'message' => 'Question notification sent.',
        'adminNotified' => true,
        'clientChannel' => $clientChannel,
    ]);
}

response_json(422, ['ok' => false, 'message' => 'Unknown notification type.']);
