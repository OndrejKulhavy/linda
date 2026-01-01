# New Analytics Features Documentation

## Overview
This document describes the new analytics visualizations added to the Linda dashboard to provide deeper insights into team performance and individual productivity.

## New Analytics Pages

### 1. Individual Performance Dashboard (`/charts/performance`)

**Purpose**: Provides detailed performance metrics for individual team members over a selected time period.

**Features**:
- **Time Period Selection**: Choose between 4, 8, or 12 weeks of historical data
- **User Selection**: Dropdown to select any team member
- **Key Metrics Cards**:
  - Total hours worked in the selected period
  - Average hours per week with trend indicator vs. team average
  - Consistency score (how close to 40h/week target)
  - Number of active projects
- **Weekly Trend Chart**: Line chart showing total hours and breakdown by project type (Reading, Practice, Training)
- **Project Distribution**: Pie chart showing time allocation across all projects
- **Weekly Activity Breakdown**: Stacked bar chart comparing Reading, Practice, and Training hours per week

**Use Cases**:
- Individual performance reviews
- Identifying areas for improvement
- Comparing individual performance against team averages
- Understanding work distribution patterns

### 2. Team Productivity Trends (`/charts/trends`)

**Purpose**: Displays team-wide productivity trends over the last 8 weeks.

**Features**:
- **Trend Indicators**: Week-over-week change indicators for key metrics
- **Key Metrics Cards**:
  - Total team hours for the latest week
  - Average hours per person
  - Number of active team members
  - Number of people who achieved 40h goal
- **Total Team Performance**: Area chart showing accumulated team hours over time
- **Average Performance**: Line chart comparing average hours per person and number of goal achievers
- **Active Members**: Bar chart showing team participation levels
- **Project Trends**: Multi-line chart tracking time spent on each project type over time

**Use Cases**:
- Team capacity planning
- Identifying productivity trends
- Monitoring team engagement
- Project resource allocation analysis

### 3. Performance Leaderboard (`/charts/leaderboard`)

**Purpose**: Gamified view of team performance with rankings and detailed statistics.

**Features**:
- **Time Period Selection**: 4, 8, or 12 weeks
- **Sorting Options**:
  - Total hours (cumulative)
  - Average hours per week
  - Consistency score
- **Podium Display**: Visual representation of top 3 performers with medals
- **Full Leaderboard**: Complete ranking with:
  - Rank icons (trophy for 1st, medals for 2nd/3rd)
  - Summary statistics
  - Project count
  - Goal achievement badges
- **Detailed Statistics Table**: Breakdown by project type (Reading, Practice, Training) and weeks active

**Use Cases**:
- Friendly competition and motivation
- Recognizing top performers
- Quick team performance overview
- Identifying consistent contributors

## Data Sources

All new analytics pages use the existing Clockify API integration:
- `/api/clockify/users/details` - Fetches detailed time entries with user, project, and task information
- Data is aggregated and processed client-side for maximum flexibility

## Technical Implementation

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Charts**: Recharts library
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4

### Key Features
- **Responsive Design**: All charts and layouts work on mobile and desktop
- **Real-time Filtering**: Dynamic data updates based on user selections
- **Performance Optimized**: Efficient data processing and memoization
- **Type Safety**: Full TypeScript implementation

## Integration with Existing Dashboard

The new analytics pages are accessible from the main dashboard with dedicated cards:
- **Výkon** (Performance) - Individual performance metrics
- **Trendy** (Trends) - Team productivity trends
- **Žebříček** (Leaderboard) - Performance rankings

## Future Enhancements

Potential improvements for consideration:
1. Export functionality (PDF/Excel reports)
2. Custom date range selection
3. Email notifications for milestones
4. Integration with Google Calendar events
5. Predictive analytics and forecasting
6. Department/team filtering for larger organizations
7. Historical comparison (year-over-year)
8. Custom KPI definitions

## Usage Tips

### For Team Leaders
1. Use **Trends** page for weekly team reviews and capacity planning
2. Check **Leaderboard** to identify and recognize top performers
3. Review **Performance** page for individual 1-on-1 meetings
4. Compare different time periods to identify seasonal patterns

### For Team Members
1. Monitor your **Performance** page to track personal progress
2. Use **Leaderboard** for motivation and goal-setting
3. Compare your metrics against team averages
4. Track consistency and work on maintaining steady output

### For HR/Management
1. Use aggregate data from **Trends** for resource allocation
2. Identify training needs from project distribution data
3. Monitor team engagement through active member metrics
4. Use consistency scores to identify potential burnout or disengagement

## Support

For issues or questions about these analytics features, please contact the development team or create an issue in the repository.
