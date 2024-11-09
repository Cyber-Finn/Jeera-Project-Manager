<?php
require_once 'connection_details.php';
require_once 'auth.php';

// Authenticate user -> we don't really do anything with the $user object after this in this php file, but it's still good to make them auth upfront
//  we also then (on every consecutive request) automatically pass this info through to the other pages
// I redo this in every other function to prevent session hijacking, that way, we always verify the username and pword when they load a page or try to insert something
$user = isAuthenticated();

// Handle requests
$action = $_GET['action'] ?? '';
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
