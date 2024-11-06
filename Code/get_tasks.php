<?php
header('Content-Type: application/json'); // Ensure that we're passing JSON back
require_once 'connection_details.php';
require_once 'auth.php';
$user = isAuthenticated();

try {
    $stmt = $pdo->prepare('SELECT Tasks.id, Tasks.title, Tasks.description, Tasks.due_date, Statuses.description AS status 
                           FROM Tasks 
                           JOIN Statuses ON Tasks.status_id = Statuses.id 
                           WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $tasks = $stmt->fetchAll();

    echo json_encode(['tasks' => $tasks]);
} catch (Exception $e) {
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>
