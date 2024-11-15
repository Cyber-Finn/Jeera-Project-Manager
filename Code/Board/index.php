<?php
    require_once '../connection_details.php';
    require_once '../auth.php';
    require_once '../sanitization.php';

    // Authenticate user -> at this point, we no longer auth them upfront, but we do maintain the session from here and check certain session vars for every request
    // I redo this in every other function to prevent session fixation. That way, we always verify the username, IP and pword when they load a page or try to insert something
    $user = isAuthenticated();

    // Handle requests
    $action = sanitizeSql($_GET['action'] ?? ''); // Sanitize the action parameter
    switch ($action) {
        case 'create_task':
            require_once 'create_task.php';
            break;
        case 'get_tasks':
            require_once 'get_tasks.php';
            break;
        case 'update_task_details':
            require_once 'update_task_details.php';
            break;
        case 'update_task_status':
            require_once 'update_task_status.php';
            break;
        case 'complete_task':
            require_once 'complete_task.php';
            break;
        case 'delete_task':
            require_once 'delete_task.php';
            break;
        default:
            respondNotFound();
            break;
    }

    function respondNotFound() {
        header("HTTP/1.0 404 Not Found");
        echo json_encode(['message' => 'Not found']);
    }
?>
