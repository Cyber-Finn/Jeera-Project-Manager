<?php
header('Content-Type: application/json'); // Ensure that we're passing JSON back
require_once '../connection_details.php';

try {
    if (empty($_POST['username']) || empty($_POST['password'])) {
        echo json_encode(['message' => 'Invalid input']);
        exit;
    }

    $username = $_POST['username'];
    $password = $_POST['password'];
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT); // Hash the password

    $stmt = $pdo->prepare('INSERT INTO Users (username, password_hash, role) VALUES (?, ?, \'user\')');
    if ($stmt->execute([$username, $hashedPassword])) {
        echo json_encode(['message' => 'User created successfully']);
    } else {
        echo json_encode(['message' => 'Failed to create user']);
    }
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>
