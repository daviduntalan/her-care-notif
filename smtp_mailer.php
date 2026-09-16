<?php

declare(strict_types=1);

/**
 * Minimal SMTP sender for simple project deployments without Composer.
 * Returns [bool $ok, string $message].
 */
function hercare_send_smtp(array $smtp, string $fromEmail, string $fromName, string $toEmail, string $subject, string $body, ?string $replyTo = null): array
{
    $host = trim((string)($smtp['host'] ?? ''));
    $port = (int)($smtp['port'] ?? 587);
    $encryption = strtolower(trim((string)($smtp['encryption'] ?? 'tls')));
    $username = trim((string)($smtp['username'] ?? ''));
    $password = (string)($smtp['password'] ?? '');
    $timeout = (int)($smtp['timeout'] ?? 15);

    if ($host === '' || $username === '' || $password === '') {
        return [false, 'SMTP is selected but host/username/password is incomplete.'];
    }

    $remote = ($encryption === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
    $errno = 0;
    $errstr = '';
    $socket = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        return [false, "SMTP connection failed: {$errstr} ({$errno})"];
    }
    stream_set_timeout($socket, $timeout);

    $read = static function () use ($socket): string {
        $data = '';
        while (($line = fgets($socket, 515)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };

    $expect = static function (array $codes) use ($read): array {
        $response = $read();
        $code = (int)substr($response, 0, 3);
        return [in_array($code, $codes, true), trim($response)];
    };

    $send = static function (string $command) use ($socket): void {
        fwrite($socket, $command . "\r\n");
    };

    [$ok, $msg] = $expect([220]);
    if (!$ok) { fclose($socket); return [false, 'SMTP greeting failed: ' . $msg]; }

    $hostname = gethostname() ?: 'localhost';
    $send('EHLO ' . $hostname);
    [$ok, $msg] = $expect([250]);
    if (!$ok) { fclose($socket); return [false, 'SMTP EHLO failed: ' . $msg]; }

    if ($encryption === 'tls') {
        $send('STARTTLS');
        [$ok, $msg] = $expect([220]);
        if (!$ok) { fclose($socket); return [false, 'SMTP STARTTLS failed: ' . $msg]; }
        $cryptoOk = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if (!$cryptoOk) { fclose($socket); return [false, 'Could not enable TLS encryption.']; }
        $send('EHLO ' . $hostname);
        [$ok, $msg] = $expect([250]);
        if (!$ok) { fclose($socket); return [false, 'SMTP EHLO after TLS failed: ' . $msg]; }
    }

    $send('AUTH LOGIN');
    [$ok, $msg] = $expect([334]);
    if (!$ok) { fclose($socket); return [false, 'SMTP AUTH LOGIN rejected: ' . $msg]; }
    $send(base64_encode($username));
    [$ok, $msg] = $expect([334]);
    if (!$ok) { fclose($socket); return [false, 'SMTP username rejected: ' . $msg]; }
    $send(base64_encode($password));
    [$ok, $msg] = $expect([235]);
    if (!$ok) { fclose($socket); return [false, 'SMTP authentication failed: ' . $msg]; }

    $safeFromEmail = str_replace(["\r", "\n"], '', $fromEmail);
    $safeToEmail = str_replace(["\r", "\n"], '', $toEmail);
    $send('MAIL FROM:<' . $safeFromEmail . '>');
    [$ok, $msg] = $expect([250]);
    if (!$ok) { fclose($socket); return [false, 'SMTP MAIL FROM failed: ' . $msg]; }

    $send('RCPT TO:<' . $safeToEmail . '>');
    [$ok, $msg] = $expect([250, 251]);
    if (!$ok) { fclose($socket); return [false, 'SMTP RCPT TO failed: ' . $msg]; }

    $send('DATA');
    [$ok, $msg] = $expect([354]);
    if (!$ok) { fclose($socket); return [false, 'SMTP DATA failed: ' . $msg]; }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $safeFromName = str_replace(["\r", "\n"], '', $fromName);
    $headers = [
        'From: ' . $safeFromName . ' <' . $safeFromEmail . '>',
        'To: <' . $safeToEmail . '>',
        'Subject: ' . $encodedSubject,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'Date: ' . date(DATE_RFC2822),
    ];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: <' . str_replace(["\r", "\n"], '', $replyTo) . '>';
    }

    // Dot-stuff lines beginning with a dot per SMTP protocol.
    $normalizedBody = str_replace(["\r\n", "\r"], "\n", $body);
    $normalizedBody = preg_replace('/^\./m', '..', $normalizedBody) ?? $normalizedBody;
    $message = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $normalizedBody) . "\r\n.";
    fwrite($socket, $message . "\r\n");
    [$ok, $msg] = $expect([250]);
    if (!$ok) { fclose($socket); return [false, 'SMTP message rejected: ' . $msg]; }

    $send('QUIT');
    $expect([221]);
    fclose($socket);
    return [true, 'Email accepted by SMTP server.'];
}
