<?php
header('Content-Type: application/json'); //ensure that we're passing json back
require_once '../connection_details.php';
require_once '../auth.php';

$user = isAuthenticated();

try {
    // Validate input data
    if (empty($_POST['id'])) {
        echo json_encode(['message' => 'Invalid input']);
        exit;
    }

    // Prepare and execute the UPDATE query
    $stmt = $pdo->prepare('UPDATE Tasks SET complete = 1 WHERE id = ? AND user_id = ?');
    if ($stmt->execute([$_POST['id'], $user['id']])) {
        echo json_encode(['message' => 'Task marked as completed']);
    } else {
        echo json_encode(['message' => 'Failed to complete task']);
    }
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>

