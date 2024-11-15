<?php
    header('Content-Type: application/json'); // Ensure that we're passing JSON back
    require_once '../connection_details.php';
    require_once '../auth.php';
    require_once '../sanitization.php';
    $user = isAuthenticated();

    try {
        if (empty($_POST['id']) || empty($_POST['title']) || empty($_POST['description']) || empty($_POST['due_date'])) {
            echo json_encode(['message' => 'Invalid input']);
            exit;
        }

        // Sanitize inputs
        $taskId = sanitizeSql($_POST['id']);
        $title = sanitizeSql($_POST['title']);
        $description = sanitizeSql($_POST['description']);
        $dueDate = sanitizeSql($_POST['due_date']);

        $stmt = $pdo->prepare('UPDATE Tasks SET title = ?, description = ?, due_date = ? WHERE id = ?');
        if ($stmt->execute([$title, $description, $dueDate, $taskId])) {
            echo json_encode(['message' => 'Task updated successfully']);
        } else {
            echo json_encode(['message' => 'Failed to update task']);
        }
    } catch (Exception $e) {
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
?>
