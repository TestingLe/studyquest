# StudyQuest Backend Setup (XAMPP)

## Quick Setup

1. **Install XAMPP** (if not already installed)
   - Download from: https://www.apachefriends.org/
   - Install with Apache and MySQL

2. **Copy backend folder**
   - Copy the entire `backend` folder to: `C:\xampp\htdocs\studyquest\`
   - Final path should be: `C:\xampp\htdocs\studyquest\backend\`

3. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start **Apache**
   - Start **MySQL**

4. **Test the backend**
   - Open browser: http://localhost/studyquest/backend/auth.php?action=check
   - You should see a JSON response (error is OK, means it's working)

5. **Database**
   - The database `studyquest` will be created automatically on first request
   - Tables are created automatically

## API Endpoints

### Authentication
- `POST /auth.php?action=register` - Register new user
- `POST /auth.php?action=login` - Login
- `GET /auth.php?action=check` - Check session (requires token)

### Data
- `GET /data.php?action=get` - Get user study data
- `POST /data.php?action=save` - Save study data
- `GET /data.php?action=getQuizzes` - Get user quizzes
- `POST /data.php?action=saveQuizzes` - Save quizzes
- `POST /data.php?action=updateProfile` - Update profile

## Troubleshooting

**"Connection refused" error:**
- Make sure XAMPP Apache and MySQL are running

**"Access denied" error:**
- Check MySQL is using default credentials (root, no password)

**CORS errors:**
- The backend already includes CORS headers
- Make sure you're accessing via localhost

## Database Structure

```sql
-- Users table
users (id, username, email, password, display_name, avatar, created_at)

-- User data table (stores JSON)
user_data (id, user_id, data_type, data_json, updated_at)
```
