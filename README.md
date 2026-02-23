# Smart Area-Wise Garbage Collection System v2.0

A modern, MERN stack garbage collection management system featuring role-based workflows, live tracking, and a premium mobile-first UI.

## 🌟 Key Features

### 👤 Citizen Interface
- **Quick Action Dashboard**: Mobile-first card layout for rapid access.
- **Garbage Complaints**: Report issues with image upload support.
- **Pickup Scheduling**: Choose specific dates and time-slots (Morning, Afternoon, etc.).
- **Live Tracking**: 6-stage status flow tracking with a visual timeline.
- **Notifications**: Real-time alerts for request status updates.

### 👮 Admin Panel
- **Insight Dashboard**: Statistics on total requests, pending tasks, and completion rates.
- **Request Management**: Comprehensive table with status and area filters.
- **Worker Assignment**: Manual worker allocation to pickup requests.
- **Area/Zone Hierarchy**: Manage collection zones (City → Zone → Area).

### 👷 Worker Dashboard
- **Field Worker View**: Clear list of assigned tasks.
- **Status Workflow**: Easy one-tap status updates (Accept → On The Way → Collected → Completed).
- **Availability Toggle**: Workers can mark themselves as Available or Offline.
- **Direct Communication**: One-click call button for citizens.

## 🚀 Tech Stack
- **Frontend**: React.js, Tailwind CSS (v4), React Router
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB Atlas (with Mongoose ODM)
- **Middleware**: Multer (File uploads), JWT (Authentication)

## 🛠️ Setup Instructions

### Backend
1. `cd backend`
2. Create `.env` file with `MONGO_URI`, `JWT_SECRET`, and `PORT`.
3. `npm install`
4. `npm run seed` (to populate initial areas and test data)
5. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 📊 Status Flow (6 Stages)
1. **Requested**: Citizen submits a request.
2. **Assigned**: Admin assigns a worker.
3. **Accepted**: Worker accepts the task.
4. **On The Way**: Worker is traveling to pickup.
5. **Picked Up**: Garbage collected from site.
6. **Completed**: Task finished.

---
*Developed for College Project/Viva showcase.*
