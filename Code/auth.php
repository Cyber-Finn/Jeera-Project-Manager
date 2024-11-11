<?php
require_once 'connection_details.php';

function isAuthenticated() {
    if (session_status() == PHP_SESSION_NONE) { //was needed because the session would echo a warning/notice, which caused our JS to fail
        session_start(); // Start or resume the session if it's not already started
    }

    // Set the session timeout duration (e.g., 1800 seconds = 30 minutes) 
    $timeout_duration = 1800; 
    // Check if the session has timed out 
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $timeout_duration) { 
        session_unset(); 
        session_destroy(); 
        echo json_encode(['message' => 'Session timed out', 'redirect' => true]); 
        exit; 
    } 
    // Update last activity time stamp 
    $_SESSION['last_activity'] = time();

    // Check if the session IP address matches the user's current IP address
    if (isset($_SESSION['ip_address']) && $_SESSION['ip_address'] !== $_SERVER['REMOTE_ADDR']) {
        session_unset();
        session_destroy();
        echo json_encode(['message' => 'Session terminated due to IP address change', 'redirect' => true]);
        exit;
    }

    // Check if user is logged in by verifying session variable
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['message' => 'Unauthorized', 'redirect' => true]);
        exit;
    }

    try {
        global $pdo; // Reference global $pdo variable
        $user_id = $_SESSION['user_id'];

        $stmt = $pdo->prepare('SELECT * FROM Users WHERE id = ? LIMIT 1');
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { // If user does not exist
            echo json_encode(['message' => 'Unauthorized', 'redirect' => true]);
            exit;
        }
        return $user;
    } catch (Exception $e) {
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
        exit;
    }
}
?>
