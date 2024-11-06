<?php
require_once 'connection_details.php';

function isAuthenticated() {
    if (!isset($_SERVER['PHP_AUTH_USER'])) { //user needs to log in
        header('WWW-Authenticate: Basic realm="Restricted Area"');
        header('HTTP/1.0 401 Unauthorized');
        echo json_encode(['message' => 'Unauthorized']);
        exit;
    } else { //user has logged in, so we need to verify their info (this happens any time they do anything, to prevent session hijacking)
        try {
            global $pdo; //this seems a bit counter intuitive to why I'd ref it as global when we're importing the definition, but remember that this is inside a function. PHP variables that are declared outside a function ALWAYS HAVE TO be referenced as global
            $username = $_SERVER['PHP_AUTH_USER'];
            $password = $_SERVER['PHP_AUTH_PW'];
    
            $stmt = $pdo->prepare('SELECT * FROM Users WHERE username = ? limit 1');
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            //debug only
            // echo "Password hash from DB: " . $user["password_hash"] . "<br>";
            // $hash = password_hash("TestPassword123", PASSWORD_BCRYPT);
            // echo "Password hash from calculation: ". $hash. "<br>";
            // echo "Password: " . $password . "<br>";

            //loading users will be a bit tricky, because the pword hash changes every time due to random salting
            if (!$user || !password_verify($password, $user['password_hash'])) { //if pword doesn't match or there is no user loaded
                echo json_encode(['message' => 'Unauthorized']);
                exit;
            }
            return $user;
        } catch (Exception $e) {
            echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
            exit;
        }
    }
}
?>