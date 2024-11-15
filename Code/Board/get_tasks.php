<?php
    //Note: we don't need to sanitize anything here because we're only getting stuff from the DB - which was already sanitized

    header('Content-Type: application/json'); // Ensure that we're passing JSON back
    require_once '../connection_details.php';
    require_once '../auth.php';
    $user = isAuthenticated();

    try {
        $stmt = $pdo->prepare('SELECT Tasks.id, Tasks.title, Tasks.description, Tasks.due_date, Statuses.description AS status, Users.username AS user 
                            FROM Tasks 
                            JOIN Statuses ON Tasks.status_id = Statuses.id 
                            JOIN Users ON Tasks.user_id = Users.id');
        $stmt->execute();
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['tasks' => $tasks]);
    } catch (Exception $e) {
        echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
    }
?>