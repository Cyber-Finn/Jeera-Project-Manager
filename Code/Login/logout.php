<?php
session_start(); //looks like a bug, but isn't. We're doing this to resume the session (basically to access the variables from another part of PHP)

// Unset all session variables
$_SESSION = array();

// If there's a session cookie, remove it
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session
session_destroy();

// Redirect to login page or display a logout confirmation
header("Location: index.html"); // Redirect to login/sign up page
exit;
?>
