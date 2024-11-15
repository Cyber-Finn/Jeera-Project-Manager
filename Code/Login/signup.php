<?php
    require_once '../connection_details.php';
    require_once '../sanitization.php';
    header('Content-Type: application/json'); // Ensure that we're passing JSON back

    try {
        if (empty($_POST['username']) || empty($_POST['password'])) {
            echo json_encode(['message' => 'Invalid input']);
            exit;
        }

        // Sanitize inputs
        $username = sanitizeSql($_POST['username']);
        $password = sanitizeSql($_POST['password']);
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
