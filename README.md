# Linda 🌟

**Linda** is a brilliant team performance tracking dashboard for the Tuuli team. The name "Linda" means "beautiful" in multiple languages, and she lives up to her name by providing beautiful insights into team productivity, attendance, and project time allocation.

## 🎯 Overview

Linda integrates with Clockify time tracking and Supabase authentication to provide comprehensive analytics and visualization of team performance. Track work hours, monitor attendance, analyze project distributions, and identify trends—all in one elegant dashboard.

## ✨ Features

### 📊 Analytics & Visualizations
- **User Hours Treemap**: Interactive visualization of individual work hours with task-level details
  - Click on team members to view detailed task breakdowns
  - Mobile-friendly drawer interface
  - Direct links to Clockify reports
  - Highlights team members with less than 40 hours
- **Work Hours Chart**: Timeline visualization of accumulated work hours across the team
- **Projects Distribution**: Pie chart showing time allocation across different projects
- **Late Arrivals Chart**: Track and visualize attendance patterns
- **Competition View**: Compare team members' performance metrics
- **Individual Performance Dashboard**: NEW! Detailed metrics for each team member
  - Weekly/monthly performance trends
  - Personal metrics cards (avg hours, project distribution, consistency)
  - Comparison with team averages
  - Project distribution and activity breakdown charts
- **Team Productivity Trends**: NEW! Multi-week team analysis
  - Team velocity metrics and trend indicators
  - Active member tracking
  - Goal achievers monitoring
  - Project trends over time
- **Performance Leaderboard**: NEW! Gamified team rankings
  - Top 3 podium display
  - Full ranking table with detailed statistics
  - Multiple sorting options (total hours, average, consistency)
  - Achievement badges and indicators

### 🔐 Authentication & Access Control
- Secure authentication powered by Supabase
- Sign up, login, and sign out functionality
- Protected routes with middleware
- Session management

### ⏰ Attendance Tracking
- Record daily attendance with arrival times
- Bulk attendance operations
- Late arrival monitoring and analytics
- Team member management

### 🎨 User Experience
- Dark/light theme support with seamless transitions
- Fully responsive design for mobile and desktop
- Modern UI components built with Radix UI
- Smooth animations and interactions

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Time Tracking**: Clockify API integration
- **Runtime**: Bun (recommended) or Node.js
- **Form Management**: React Hook Form with Zod validation

## 📋 Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+
- Clockify account with API access
- Supabase project with authentication enabled

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/OndrejKulhavy/linda.git
cd linda
```

2. **Install dependencies**
```bash
bun install
# or
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Clockify API Configuration
CLOCKIFY_API_KEY=your_clockify_api_key
CLOCKIFY_WORKSPACE_ID=your_clockify_workspace_id
```

4. **Set up Supabase database**

Create an `attendance` table in your Supabase project with the following schema:

```sql
create table attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  arrival_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## 🏃 Running the Application

**Development mode:**
```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production build:**
```bash
bun run build
bun run start
# or
npm run build
npm run start
```

## 📱 Usage

### Dashboard Sections

- **Družstevníci (Team Members)**: View individual work hours in an interactive treemap visualization
- **Čtyřicethodin (40-Hour Week)**: Track accumulated hours against the weekly target
- **Koláček (Projects Pie)**: See time distribution across different projects
- **Soutěž (Competition)**: Compare team member performance
- **Výkon (Performance)**: NEW! Individual performance dashboard with detailed metrics and trends
- **Trendy (Trends)**: NEW! Team productivity trends and multi-week analysis
- **Žebříček (Leaderboard)**: NEW! Performance rankings and gamified view of team achievements
- **Docházka (Attendance)**: Calendar and attendance tracking with statistics

### Using the New Analytics Features

**Individual Performance Dashboard**:
1. Navigate to `/charts/performance`
2. Select a team member from the dropdown
3. Choose time period (4, 8, or 12 weeks)
4. View detailed metrics including weekly trends, project distribution, and activity breakdown

**Team Trends**:
1. Navigate to `/charts/trends`
2. Automatically displays the last 8 weeks of team data
3. View team-wide metrics, trends, and project evolution
4. Use trend indicators to identify improvements or concerns

**Performance Leaderboard**:
1. Navigate to `/charts/leaderboard`
2. Select time period and sorting criteria
3. View podium display of top 3 performers
4. Explore full rankings and detailed statistics table

### Adding Attendance

Navigate to `/attendance/add` to record daily attendance for team members.

## 🔧 Configuration

### Team Members

Team members are configured in `lib/team-members.ts`. Update this file to reflect your team composition.

### Clockify Integration

The application fetches data from Clockify API endpoints:
- `/api/clockify/users` - Get workspace users
- `/api/clockify/users/details` - Get detailed time entries with tasks
- `/api/clockify/projects` - Get project information
- `/api/clockify/total` - Get total hours for the current week

## 📦 Project Structure

```
linda/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── attendance/        # Attendance management
│   └── charts/            # Visualization pages
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── utils/                 # Helper utilities
└── public/               # Static assets
```

## 📝 Changelog

### [2025-12-06]

#### Added
- **User Hours Highlighting**: Team members with less than 40 hours are now highlighted in the User Hours Treemap for quick identification
- **Enhanced Treemap Display**: Improved text display and responsiveness in the custom treemap content component
- **Clockify Report Links**: Added direct link generation to Clockify reports from the User Hours Treemap
- **Task Filtering & Display**: Enhanced active project selection with improved task display styling and layout
- **Task Aggregation**: Improved task handling in UserHoursTreemap component with enhanced data aggregation in the API route
- **Mobile-Friendly Drawer**: Added responsive drawer interface for task details on mobile devices with filtering capabilities
- **Attendance System**: Complete attendance tracking system with:
  - Late arrivals tracking and visualization
  - Bulk attendance operations API
  - Attendance form component
  - Auth integration with Supabase
  - Team members management
- **Authentication Pages**: Login, signup, and callback routes with AuthButton component
- **Supabase Integration**: Full authentication and database setup with middleware
- **GitHub Copilot Instructions**: Added structured development process guidelines for consistent code quality

#### Updated
- **Dependencies**: Updated all major dependencies to latest versions:
  - React 19.2.1
  - Next.js 16.0.7
  - react-day-picker 9.12.0
  - react-hook-form 7.68.0
  - Tailwind CSS 4.1.17
  - lucide-react 0.555.0
  - Various Radix UI components to latest versions
- **DevDependencies**: Updated TypeScript (5.9.3), ESLint (9.39.1), and related packages

#### Enhanced
- User Hours Treemap component with multiple improvements for better UX
- API routes for improved Clockify data handling
- Overall application stability and performance

---

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

**Ondřej Kulhavý**

---

Built with ❤️ for the Tuuli team
