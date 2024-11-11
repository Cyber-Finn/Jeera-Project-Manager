<?php
header('Content-Type: application/json'); // Ensure that we're passing JSON back
require_once '../connection_details.php';
require_once '../auth.php';
$user = isAuthenticated();

try {
    if (empty($_POST['id']) || empty($_POST['status_id'])) {
        echo json_encode(['message' => 'Invalid input']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE Tasks SET status_id = ? WHERE id = ? AND user_id = ?');
    if ($stmt->execute([$_POST['status_id'], $_POST['id'], $user['id']])) {
        echo json_encode(['message' => 'Task updated successfully']);
    } else {
        echo json_encode(['message' => 'Failed to update task status']);
    }
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>
