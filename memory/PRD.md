# SchoolExpo - Product Requirements Document

## Problem Statement
Build SchoolExpo - a next-generation, full-stack school management portal for students and teachers with gamified XP system, AI-powered chatbot, comprehensive academic tracking.

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Recharts + Shadcn UI
- **Backend**: FastAPI (Python) + MongoDB
- **AI**: Gemini via Emergent Integration (LLM Chat)
- **Auth**: JWT (access + refresh tokens) + bcrypt

## User Personas
- **Student**: Track assignments, attendance, results, practice DPP quizzes, earn XP, view leaderboard
- **Teacher**: Create assignments, grade submissions, mark attendance, view analytics
- **Admin**: Full access to all features

## Core Requirements
- Dark glassmorphism UI ("Academic Dark Glass" aesthetic)
- Gamified XP system with levels and streaks
- Role-based access control (Student/Teacher/Admin)
- Real-time data with comprehensive seed data

## What's Been Implemented (March 30, 2026)
### Student Features
- [x] Login page with demo buttons
- [x] Student Dashboard (XP, streak, attendance %, avg score, schedule, assignments, announcements)
- [x] Assignments (list, filter, submit, view grades)
- [x] Attendance (circular gauge, calendar view, absent days list)
- [x] Results & Analytics (line chart, radar chart, bar chart, results table)
- [x] DPP - Daily Practice Problems (quiz mode, score review, explanations)
- [x] Leaderboard (podium, rankings, XP badges)
- [x] Todo List (CRUD, filters, importance, XP on completion)
- [x] Timeline (curriculum tracker with chapters & topics)
- [x] Profile (personal info, XP history, edit profile)
- [x] AI Chatbot (Gemini-powered, floating button, suggested prompts)
- [x] Notifications system

### Teacher Features
- [x] Teacher Dashboard (stats, class averages, top students)
- [x] Assignment Manager (create, view submissions, grade)
- [x] Attendance Manager (mark attendance with date picker)

### Backend
- [x] JWT auth with refresh tokens
- [x] All API routes with proper validation
- [x] Comprehensive seed data (10 students, 3 teachers, 5 subjects, etc.)
- [x] XP system with level calculation
- [x] AI integration via Emergent Gemini

## Prioritized Backlog
### P0 (Critical)
- All implemented and tested

### P1 (Important)
- [ ] Notes/Resources page with file upload
- [ ] Real-time chat with Socket.io
- [ ] PrepMeter (readiness radar)
- [ ] Diary page
- [ ] Payments page with invoice PDF
- [ ] Studycast (audio/video lessons)

### P2 (Nice to Have)
- [ ] Dark/Light theme toggle
- [ ] Mobile bottom tab navigation
- [ ] Forgot password flow
- [ ] File attachments on assignments
- [ ] Confetti animation on XP milestones
- [ ] Export personal data

## Next Tasks
1. Build Notes/Resources page with file management
2. Add real-time chat functionality
3. Implement PrepMeter radar chart
4. Add Diary and Payments pages
5. Mobile responsiveness improvements

## UI Redesign (March 30, 2026 - Update 2)
- Redesigned dashboard with FitSpark-style bento grid layout
- New accent color: lime-chartreuse (#c8ff00) replacing indigo
- Bento grid with varying card sizes: Study Activity (bars), XP Level (ring), Attendance (liquid fill), Daily Goals (checklist), Schedule, Deadlines, Quick Stats
- Rich hover effects added across ALL pages: hover-lift, hover-icon, hover-glow, hover-row, hover-arrow
- Updated all pages (Login, Assignments, DPP, Leaderboard, Todo, Profile, Timeline, Teacher pages) with lime accent
- Custom animations: pulse-lime, glow-ring, streak-fire, count-up, border-pulse
- Fonts: Outfit (display), DM Sans (body), JetBrains Mono (code)
