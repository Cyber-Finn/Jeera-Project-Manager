<?php
header('Content-Type: application/json'); // Ensure that we're passing JSON back
require_once 'connection_details.php';
require_once 'auth.php';
$user = isAuthenticated();

try {
    if (empty($_POST['id']) || empty($_POST['title']) || empty($_POST['description']) || empty($_POST['due_date'])) {
        echo json_encode(['message' => 'Invalid input']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE Tasks SET title = ?, description = ?, due_date = ? WHERE id = ? AND user_id = ?');
    if ($stmt->execute([$_POST['title'], $_POST['description'], $_POST['due_date'], $_POST['id'], $user['id']])) {
        echo json_encode(['message' => 'Task updated successfully']);
    } else {
        echo json_encode(['message' => 'Failed to update task']);
    }
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>
