<?php
    // Database connection details
    $servername = "localhost"; //the machine that the DB is running on. if you're using the PHP on the same server as your mySQL database, this will be localhost
    $username = "root";
    $password = "mysql"; //ensure that password is correct. I kept mine default for this example
    $dbname = "TaskManagement";
    $port = "3306"; //ensure that port is correct here. The default would likely be 3306 if you just did a generic install of MySQL
    $dsn = "mysql:host=$servername;port=$port;dbname=$dbname";
    $options = [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false,];
    $pdo;
    try { 
        $pdo = new PDO($dsn, $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        //echo json_encode(['message' => 'Connection failed: ' . $e->getMessage()]);
        exit();
    }
?>