# TimeWise — Student Productivity Planner

TimeWise is a beginner-friendly full-stack web development mini-project. It helps students manage tasks, due dates, priorities, and a weekly class timetable.

## Features
- Register and log in securely (passwords are hashed with bcrypt).
- Personal dashboard with total, completed, pending tasks, and completion percentage.
- Add, view, edit, complete, search, filter, and delete tasks.
- Create and manage a weekly timetable.
- Responsive green-and-white UI for desktop and mobile.
- REST API with GET, POST, PUT, and DELETE operations.
- MongoDB data storage; each account can access only its own tasks and classes.

## Technology stack
HTML, CSS, JavaScript, Bootstrap Icons, Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Postman.

## Requirements
- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Run on Windows
1. Extract the ZIP.
2. Open the extracted `TimeWise` folder in File Explorer.
3. Copy `.env.example` and rename the copy to `.env`.
4. Open `.env` and set `MONGO_URI` to your MongoDB connection string. For local MongoDB, use `mongodb://127.0.0.1:27017/timewise`.
5. Set `JWT_SECRET` to a long random string.
6. Open Command Prompt in the project folder.
7. Run:
   ```bat
   npm install
   npm run dev
   ```
   Or run `start.bat` to install dependencies if needed and start the server.
8. Open `http://localhost:5000` in your browser.

The backend prints a successful MongoDB connection message when the database connects. If MongoDB is not running, start the MongoDB service first.

## API endpoints
All task and timetable endpoints require this header after login:
`Authorization: Bearer YOUR_TOKEN`

### Authentication
- `POST /api/auth/register` — `{ "name": "Asha Patel", "email": "asha@example.com", "password": "example123" }`
- `POST /api/auth/login` — `{ "email": "asha@example.com", "password": "example123" }`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks` — `{ "title": "Finish assignment", "description": "Prepare database practical", "dueDate": "2026-10-20", "priority": "High", "category": "Assignment" }`
- `PUT /api/tasks/:id` — send only the fields to update, e.g. `{ "completed": true }`
- `DELETE /api/tasks/:id`

### Timetable
- `GET /api/schedule`
- `POST /api/schedule` — `{ "subject": "Web Development", "day": "Monday", "startTime": "10:00", "endTime": "11:00", "location": "Lab 2" }`
- `PUT /api/schedule/:id`
- `DELETE /api/schedule/:id`

### Health check
- `GET /api/health`

## Postman testing
1. Register using `POST http://localhost:5000/api/auth/register`.
2. Copy the returned `token`.
3. For protected requests, choose **Authorization → Bearer Token** in Postman and paste the token.
4. Test task and timetable endpoints using the methods above.

## GitHub
The `.gitignore` file excludes `.env` and `node_modules`. Upload `.env.example`, not your actual `.env` file. Never commit passwords, tokens, or real secrets.

## Project limitations
This is an educational starter project. It does not sync to a calendar or send reminders. Task points or productivity claims are not automatically verified.
