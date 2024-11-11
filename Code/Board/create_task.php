<?php
header('Content-Type: application/json'); // Ensure that we're passing JSON back
require_once '../connection_details.php';
require_once '../auth.php';
$user = isAuthenticated();

try {
    if (empty($_POST['title']) || empty($_POST['description']) || empty($_POST['due_date'])) {
        echo json_encode(['message' => 'Invalid input']);
        exit;
    }

    // Set the initial status_id to "To Do" (assuming ID 1 is "To Do")
    $status_id = 1;

    $stmt = $pdo->prepare('INSERT INTO Tasks (title, description, due_date, status_id, user_id) VALUES (?, ?, ?, ?, ?)');
    if ($stmt->execute([$_POST['title'], $_POST['description'], $_POST['due_date'], $status_id, $user['id']])) {
        echo json_encode(['message' => 'Task created successfully']);
    } else {
        echo json_encode(['message' => 'Failed to create task']);
    }
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>
