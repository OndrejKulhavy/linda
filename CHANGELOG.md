# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2024-12-27]

### Added
- Comprehensive session and attendance tracking system ([c5580bf](https://github.com/OndrejKulhavy/linda/commit/c5580bf))
  - SessionAttendancePanel for managing attendance with status, late type, and notes
  - SessionCalendar for displaying and navigating sessions in calendar format
  - Attendance page with comprehensive statistics and reporting
  - AttendanceSummary component to display session details, stats, and issues
  - QuickAttendancePanel for quick attendance management
  - API routes for sessions and attendance records with full CRUD operations
  - Database migrations for sessions, attendance records, and new tracking fields
  - Utility functions for formatting and determining attendance/session types
- Google Calendar API integration ([c5580bf](https://github.com/OndrejKulhavy/linda/commit/c5580bf))
  - Functions for fetching events and parsing event types
  - Setup documentation with environment variables and configuration steps
- Attendance line chart and enhanced bar chart visualizations ([db8b82b](https://github.com/OndrejKulhavy/linda/commit/db8b82b))
- Support for excused/unexcused absences with absence reasons ([ef40493](https://github.com/OndrejKulhavy/linda/commit/ef40493))
- Excuse Teams URL field for attendance records ([c967f58](https://github.com/OndrejKulhavy/linda/commit/c967f58))
- Late tracking fields in attendance records ([3f771fa](https://github.com/OndrejKulhavy/linda/commit/3f771fa))
- Legacy attendance data migration to new structure with aggregation ([440f7c9](https://github.com/OndrejKulhavy/linda/commit/440f7c9))
- Dialog for session details in calendar view ([c1f08ee](https://github.com/OndrejKulhavy/linda/commit/c1f08ee))

### Enhanced
- Mobile support for calendar and attendance components ([ca2bfef](https://github.com/OndrejKulhavy/linda/commit/ca2bfef))
- Attendance summary display with absence reasons and excuse links ([f800b5f](https://github.com/OndrejKulhavy/linda/commit/f800b5f))
- Attendance statistics and reporting with improved sorting and data handling ([b50b610](https://github.com/OndrejKulhavy/linda/commit/b50b610))
- Attendance chart with separate data for team meetings and training sessions ([76f29b8](https://github.com/OndrejKulhavy/linda/commit/76f29b8))
- Chart tooltip displays and visual clarity ([76f29b8](https://github.com/OndrejKulhavy/linda/commit/76f29b8))
- SessionCalendar to show attendance stats and issues visually ([3f771fa](https://github.com/OndrejKulhavy/linda/commit/3f771fa))
- QuickAttendancePanel layout and user experience ([c1f08ee](https://github.com/OndrejKulhavy/linda/commit/c1f08ee))

### Fixed
- Attendance link visibility to always display for better accessibility ([177fec2](https://github.com/OndrejKulhavy/linda/commit/177fec2))

### Changed
- Attendance handling to differentiate between excused and unexcused absences ([ef40493](https://github.com/OndrejKulhavy/linda/commit/ef40493))
- Chart display to use stacked bars for present and absent data ([ab00074](https://github.com/OndrejKulhavy/linda/commit/ab00074))
- Issue record filtering logic for improved accuracy ([ef40493](https://github.com/OndrejKulhavy/linda/commit/ef40493))
- Comments for protected routes handling in middleware ([662568d](https://github.com/OndrejKulhavy/linda/commit/662568d))

## [2024-12-06]

### Added
- Changelog system with API endpoint and interactive dialog ([271919a](https://github.com/OndrejKulhavy/linda/commit/271919a))
  - API route to fetch and parse CHANGELOG.md content
  - ChangelogDialog component with categorized change display
  - "What's New" badge on homepage to highlight recent updates
  - localStorage tracking to show badge only for new changes
- Prompt template for updating changelog with git commit analysis ([40789c8](https://github.com/OndrejKulhavy/linda/commit/40789c8))
- CHANGELOG.md file to document all project updates and notable changes ([5eabddf](https://github.com/OndrejKulhavy/linda/commit/5eabddf))
- Comprehensive project overview, features, and setup instructions in README ([665b04f](https://github.com/OndrejKulhavy/linda/commit/665b04f))
- Highlight feature for hours below 40 in UserHoursTreemap ([8dcf8c3](https://github.com/OndrejKulhavy/linda/commit/8dcf8c3))
- Clockify report link generation in UserHoursTreemap ([ee74793](https://github.com/OndrejKulhavy/linda/commit/ee74793))
- Mobile-friendly drawer and task filtering to UserHoursTreemap ([5591fd1](https://github.com/OndrejKulhavy/linda/commit/5591fd1))
- Late Arrivals page and chart for tracking attendance ([832bac7](https://github.com/OndrejKulhavy/linda/commit/832bac7))
  - Bulk attendance API route
  - Attendance API route with full CRUD operations
  - Auth signout route
  - Attendance add page
  - Auth callback route
  - Login and signup pages
  - AttendanceForm component
  - AuthButton component
  - LateArrivalsChart component
  - Supabase client, middleware, and server utilities
  - Team members configuration
  - Attendance types
- Copilot instructions for structured development process and user consent ([3376e0f](https://github.com/OndrejKulhavy/linda/commit/3376e0f))

### Enhanced
- CustomTreemapContent for improved text display and responsiveness ([0e93b6f](https://github.com/OndrejKulhavy/linda/commit/0e93b6f))
- Active project selection and task display styling in UserHoursTreemap ([9b03c07](https://github.com/OndrejKulhavy/linda/commit/9b03c07))
- Task display in UserHoursTreemap with enhanced styling and layout ([d0238fb](https://github.com/OndrejKulhavy/linda/commit/d0238fb))
- Task handling in UserHoursTreemap and API route for improved data aggregation ([9ac313c](https://github.com/OndrejKulhavy/linda/commit/9ac313c))

### Updated
- Dependencies to latest versions for improved performance and security ([e7f93ae](https://github.com/OndrejKulhavy/linda/commit/e7f93ae))
- react-day-picker and react-hook-form to latest versions ([3fccc5b](https://github.com/OndrejKulhavy/linda/commit/3fccc5b))

## [2024-12-01]

### Added
- CompetitionPage with 40-hour challenge and reading competition features ([ad652b3](https://github.com/OndrejKulhavy/linda/commit/ad652b3))
- Theme toggle functionality across various components ([ea26a3e](https://github.com/OndrejKulhavy/linda/commit/ea26a3e))
- User details dialog in UserHoursTreemap with date range support ([1929b34](https://github.com/OndrejKulhavy/linda/commit/1929b34))
- Clockify API integration with total hours endpoint ([da9bb1c](https://github.com/OndrejKulhavy/linda/commit/da9bb1c))
- UI components and hooks for enhanced user experience ([e315f95](https://github.com/OndrejKulhavy/linda/commit/e315f95))
- Initial project setup and structure ([8c1fed7](https://github.com/OndrejKulhavy/linda/commit/8c1fed7))

### Enhanced
- CompetitionPage card layout for better responsiveness ([b2f90c8](https://github.com/OndrejKulhavy/linda/commit/b2f90c8))
- Layout structure for improved responsiveness and overflow handling ([f5c437a](https://github.com/OndrejKulhavy/linda/commit/f5c437a))
- Global styles and layout for improved UI consistency ([ddc5034](https://github.com/OndrejKulhavy/linda/commit/ddc5034))
- ProjectsPage with improved PieChart dimensions and tooltip styling ([a073549](https://github.com/OndrejKulhavy/linda/commit/a073549))
- Animation duration for UserHoursTreemap and WorkHoursChart components ([aec2de4](https://github.com/OndrejKulhavy/linda/commit/aec2de4))
- Layout and styling across various components for better responsiveness ([88e188e](https://github.com/OndrejKulhavy/linda/commit/88e188e))
- Home component layout with improved card interactions and animations ([64a3965](https://github.com/OndrejKulhavy/linda/commit/64a3965))
- WorkHoursChart with total hours and goal calculations ([207bbfd](https://github.com/OndrejKulhavy/linda/commit/207bbfd))
- Work hours chart with user goals and Clockify integration ([da9bb1c](https://github.com/OndrejKulhavy/linda/commit/da9bb1c))

### Changed
- Replaced BarChart with PieChart for project hours visualization ([9d2ec2d](https://github.com/OndrejKulhavy/linda/commit/9d2ec2d))
- Refactored date input UI for projects, user hours, and work hours pages ([c27f409](https://github.com/OndrejKulhavy/linda/commit/c27f409))
- Updated Home component text content and titles ([bf31d21](https://github.com/OndrejKulhavy/linda/commit/bf31d21))

