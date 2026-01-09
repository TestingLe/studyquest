<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        handleRegister();
        break;
    case 'login':
        handleLogin();
        break;
    case 'check':
        handleCheckSession();
        break;
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}

function handleRegister() {
    global $conn;
    $input = getJsonInput();
    
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $displayName = trim($input['displayName'] ?? $username);
    
    // Validation
    if (strlen($username) < 3) {
        sendResponse(['error' => 'Username must be at least 3 characters'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email address'], 400);
    }
    if (strlen($password) < 6) {
        sendResponse(['error' => 'Password must be at least 6 characters'], 400);
    }
    
    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        sendResponse(['error' => 'Username or email already exists'], 400);
    }
    
    // Create user
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $username, $email, $hashedPassword, $displayName);
    
    if ($stmt->execute()) {
        $userId = $conn->insert_id;
        
        // Create initial user data
        $initialData = json_encode([
            'subjects' => [],
            'sessions' => [],
            'totalXP' => 0,
            'level' => 1,
            'streak' => 0,
            'achievements' => [],
            'preferences' => [
                'pomodoroLength' => 25,
                'shortBreak' => 5,
                'longBreak' => 15,
                'studyGoal' => 120,
                'theme' => 'light'
            ]
        ]);
        
        $dataType = 'studyData';
        $stmt = $conn->prepare("INSERT INTO user_data (user_id, data_type, data_json) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $userId, $dataType, $initialData);
        $stmt->execute();
        
        // Create token (simple base64 for demo - use JWT in production)
        $token = base64_encode($userId . ':' . time() . ':' . bin2hex(random_bytes(16)));
        
        sendResponse([
            'success' => true,
            'user' => [
                'id' => $userId,
                'username' => $username,
                'email' => $email,
                'displayName' => $displayName,
                'avatar' => '🎓'
            ],
            'token' => $token
        ]);
    } else {
        sendResponse(['error' => 'Registration failed'], 500);
    }
}

function handleLogin() {
    global $conn;
    $input = getJsonInput();
    
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    
    $stmt = $conn->prepare("SELECT id, username, email, password, display_name, avatar FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'Invalid username or password'], 401);
    }
    
    $user = $result->fetch_assoc();
    
    if (!password_verify($password, $user['password'])) {
        sendResponse(['error' => 'Invalid username or password'], 401);
    }
    
    $token = base64_encode($user['id'] . ':' . time() . ':' . bin2hex(random_bytes(16)));
    
    sendResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
            'avatar' => $user['avatar']
        ],
        'token' => $token
    ]);
}

function handleCheckSession() {
    global $conn;
    
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $token);
    
    if (empty($token)) {
        sendResponse(['error' => 'No token provided'], 401);
    }
    
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    
    if (count($parts) < 2) {
        sendResponse(['error' => 'Invalid token'], 401);
    }
    
    $userId = (int)$parts[0];
    
    $stmt = $conn->prepare("SELECT id, username, email, display_name, avatar FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['error' => 'User not found'], 401);
    }
    
    $user = $result->fetch_assoc();
    
    sendResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'displayName' => $user['display_name'],
            'avatar' => $user['avatar']
        ]
    ]);
}
?>
