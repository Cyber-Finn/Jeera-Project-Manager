<?php
    header('Content-Type: application/json'); // Ensure that we're passing JSON back
    require_once '../connection_details.php';
    require_once '../auth.php';
    require_once '../sanitization.php'; // Include the sanitization file

    $user = isAuthenticated();

    try {
        // Validate input data
        if (empty($_POST['id'])) {
            echo json_encode(['message' => 'Invalid input']);
            exit;
        }

        // Sanitize inputs
        $taskId = sanitizeSql($_POST['id']);

        // Prepare and execute the UPDATE query
        $stmt = $pdo->prepare('UPDATE Tasks SET complete = 1 WHERE id = ? AND user_id = ?');
        if ($stmt->execute([$taskId, $user['id']])) {
            echo json_encode(['message' => 'Task marked as completed']);
        } else {
            echo json_encode(['message' => 'Failed to complete task']);
        }
    } catch (Exception $e) {
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
?>
