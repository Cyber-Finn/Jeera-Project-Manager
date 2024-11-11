<?php
header('Content-Type: application/json'); // Ensure that we're passing JSON back
require_once '../connection_details.php';

ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Ensure this is only set if using HTTPS

try {
    if (empty($_POST['username']) || empty($_POST['password'])) {
        echo json_encode(['message' => 'Invalid input']);
        exit;
    }

    $username = $_POST['username'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare('SELECT * FROM Users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if(!$user){
        echo json_encode(['message' => 'no user']);
    }

    if ($user && password_verify($password, $user['password_hash'])) {
        session_start();
        session_regenerate_id(true); // Regenerate session ID to prevent session fixation
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR']; // Store user's IP address
        $_SESSION['last_activity'] = time(); // Store the current timestamp (this is to manage the timeout of their session)
        echo json_encode(['message' => 'Login successful']);
    } else {
        echo json_encode(['message' => 'Invalid username or password']);
    }
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>
