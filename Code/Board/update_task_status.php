<?php
    header('Content-Type: application/json'); // Ensure that we're passing JSON back
    require_once '../connection_details.php';
    require_once '../auth.php';
    require_once '../sanitization.php';
    $user = isAuthenticated();

    try {
        // Ensure valid input
        if (empty($_POST['id']) || empty($_POST['status_id'])) {
            echo json_encode(['message' => 'Invalid input']);
            exit;
        }

        // Sanitize inputs
        $taskId = sanitizeSql($_POST['id']);
        $statusId = sanitizeSql($_POST['status_id']);

        // Prepare and execute the SQL statement
        $stmt = $pdo->prepare('UPDATE Tasks SET status_id = ? WHERE id = ?');
        if ($stmt->execute([$statusId, $taskId])) {
            if ($stmt->rowCount() > 0) {
                echo json_encode(['message' => 'Task updated successfully']);
            } else {
                echo json_encode(['message' => 'No rows affected']);
            }
        } else {
            echo json_encode(['message' => 'Failed to update task status']);
        }
    } catch (Exception $e) {
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
?>
