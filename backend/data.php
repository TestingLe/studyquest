<?php
require_once 'config.php';

// Get user ID from token
function getUserIdFromToken() {
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
    
    return (int)$parts[0];
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get':
        handleGetData();
        break;
    case 'save':
        handleSaveData();
        break;
    case 'getQuizzes':
        handleGetQuizzes();
        break;
    case 'saveQuizzes':
        handleSaveQuizzes();
        break;
    case 'updateProfile':
        handleUpdateProfile();
        break;
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}

function handleGetData() {
    global $conn;
    $userId = getUserIdFromToken();
    
    $stmt = $conn->prepare("SELECT data_json FROM user_data WHERE user_id = ? AND data_type = 'studyData'");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Return default data
        sendResponse([
            'success' => true,
            'data' => [
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
            ]
        ]);
    }
    
    $row = $result->fetch_assoc();
    sendResponse([
        'success' => true,
        'data' => json_decode($row['data_json'], true)
    ]);
}

function handleSaveData() {
    global $conn;
    $userId = getUserIdFromToken();
    $input = getJsonInput();
    
    $dataJson = json_encode($input['data']);
    $dataType = 'studyData';
    
    $stmt = $conn->prepare("INSERT INTO user_data (user_id, data_type, data_json) VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE data_json = ?");
    $stmt->bind_param("isss", $userId, $dataType, $dataJson, $dataJson);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true]);
    } else {
        sendResponse(['error' => 'Failed to save data'], 500);
    }
}

function handleGetQuizzes() {
    global $conn;
    $userId = getUserIdFromToken();
    
    $stmt = $conn->prepare("SELECT data_json FROM user_data WHERE user_id = ? AND data_type = 'quizzes'");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(['success' => true, 'data' => []]);
    }
    
    $row = $result->fetch_assoc();
    sendResponse([
        'success' => true,
        'data' => json_decode($row['data_json'], true)
    ]);
}

function handleSaveQuizzes() {
    global $conn;
    $userId = getUserIdFromToken();
    $input = getJsonInput();
    
    $dataJson = json_encode($input['data']);
    $dataType = 'quizzes';
    
    $stmt = $conn->prepare("INSERT INTO user_data (user_id, data_type, data_json) VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE data_json = ?");
    $stmt->bind_param("isss", $userId, $dataType, $dataJson, $dataJson);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true]);
    } else {
        sendResponse(['error' => 'Failed to save quizzes'], 500);
    }
}

function handleUpdateProfile() {
    global $conn;
    $userId = getUserIdFromToken();
    $input = getJsonInput();
    
    $displayName = trim($input['displayName'] ?? '');
    $avatar = $input['avatar'] ?? '🎓';
    
    $stmt = $conn->prepare("UPDATE users SET display_name = ?, avatar = ? WHERE id = ?");
    $stmt->bind_param("ssi", $displayName, $avatar, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true]);
    } else {
        sendResponse(['error' => 'Failed to update profile'], 500);
    }
}
?>
