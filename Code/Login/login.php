<?php
    header('Content-Type: application/json');
    require_once '../connection_details.php';
    require_once '../sanitization.php';

    ini_set('session.cookie_httponly', 1);
    // ini_set('session.cookie_secure', 1); // Ensure this is only set if using HTTPS (your site is behind a DNS) -> I've also tested with Mobile, this is a huge blocker for mobile devices on local networks

    try {
        if (empty($_POST['username']) || empty($_POST['password'])) {
            echo json_encode(['message' => 'Invalid input']);
            exit;
        }

        // Sanitize inputs
        $username = sanitizeSql($_POST['username']);
        $password = sanitizeSql($_POST['password']);

        $stmt = $pdo->prepare('SELECT * FROM Users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(['message' => 'Invalid username or password', 'redirect' => true]);
            exit;
        }

        if ($user && password_verify($password, $user['password_hash'])) {
            if (session_status() == PHP_SESSION_NONE) {
                session_start();
            }
            session_regenerate_id(true); // Regenerate session ID to prevent session fixation
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR']; // Store user's IP address
            $_SESSION['last_activity'] = time(); // Store the current timestamp

            echo json_encode(['message' => 'Login successful', 'redirect' => false]);
        } else {
            echo json_encode(['message' => 'Invalid username or password', 'redirect' => true]);
        }
    } catch (Exception $e) {
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
?>
