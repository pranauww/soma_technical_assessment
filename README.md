## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/  

To begin, clone this repository to your local machine.

## Environment Setup

Create a `.env.local` file in the root directory and add your Pexels API key:

```bash
PEXELS_API_KEY=your_pexels_api_key_here
```

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates 

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation 

When a todo is created, search for and display a relevant image to visualize the task to be done. 

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request. 

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution. 
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!

## Solution

### Overview

I have successfully implemented all three parts of the technical assessment, creating a comprehensive todo application with advanced project management features. The solution includes due date management, AI-powered image generation, and sophisticated task dependency analysis.

### Part 1: Due Dates

**Implementation Details:**
- Added `dueDate` field to the Todo model in Prisma schema
- Implemented date picker in the frontend for selecting due dates
- Added visual indicators for overdue tasks (red text with "Overdue" label)
- Fixed timezone handling to ensure accurate date display
- Enhanced date formatting for better user experience

**Key Features:**
- Date selection with minimum date constraint (prevents selecting past dates)
- Overdue detection with visual feedback
- Proper date serialization and timezone handling
- User-friendly date formatting (e.g., "Dec 25, 2024")

**Technical Implementation:**
- Database migration for `dueDate` field
- API endpoints handle date creation and retrieval
- Frontend date validation and formatting
- Responsive date input with Enter key support

### Part 2: Image Generation

**Implementation Details:**
- Integrated Pexels API for relevant image search
- Added `imageUrl` field to store generated images
- Implemented loading states during image fetching
- Created fallback placeholders for failed image loads
- Optimized image display with proper aspect ratio handling

**Key Features:**
- Automatic image search based on todo title
- Loading indicators while images are being fetched
- Graceful error handling with placeholder images
- Responsive image display with `object-contain` for optimal viewing
- Environment-based API key configuration

**Technical Implementation:**
- Created `lib/pexels.ts` utility for API integration
- Database migration for `imageUrl` field
- Error handling for API failures
- Image optimization and responsive design
- Environment variable setup for API key

### Part 3: Task Dependencies

**Implementation Details:**
- Implemented self-referencing many-to-many relationship for dependencies
- Created circular dependency detection algorithm
- Built critical path analysis using depth-first search
- Calculated earliest start dates based on dependency chains
- Developed comprehensive dependency graph visualization

**Key Features:**
- Multiple dependency support per task
- Circular dependency prevention with real-time validation
- Critical path identification and highlighting
- Earliest start date calculation for project planning
- Interactive dependency graph visualization
- Dependency management with checkbox interface

**Technical Implementation:**
- Database schema with `TaskDependency` join table
- Circular dependency detection using DFS algorithm
- Critical path calculation with backtracking
- Earliest start date computation with dependency consideration
- Enhanced UI with analysis toggle and visual indicators

### Key Algorithms Implemented

1. **Circular Dependency Detection**: DFS-based algorithm to prevent dependency cycles
2. **Critical Path Analysis**: Longest path calculation using topological sorting
3. **Earliest Start Date Calculation**: Dependency-aware scheduling algorithm
4. **Dependency Graph Traversal**: Efficient graph algorithms for analysis

### Screen Recording

https://github.com/user-attachments/assets/7e7baa8b-399d-4faa-af6e-005be445d9b6
