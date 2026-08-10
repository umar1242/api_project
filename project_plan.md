# Project Plan: Telegram Bot Network with Unified API

This document provides a detailed, step-by-step technical project plan for developing the Telegram bot network (Admin, Cert, Registrar, Main, Homework, Material) using a modular monolith architecture with a unified API core. The plan is broken down into the stages outlined in the technical specification.

## Stage 0: Preparation (1–2 weeks)
*   **Infrastructure Setup:** Initialize the Git repository and define a branching strategy (e.g., GitFlow).
*   **Containerization:** Set up Docker and `docker-compose.yml` configured with PostgreSQL and Redis.
*   **Backend Initialization:** Scaffold the backend API core using NestJS (or FastAPI) and configure the modular monolith project structure (domain-driven folders).
*   **CI/CD:** Configure CI/CD pipelines (e.g., GitHub Actions) for linting, testing, and automated deployment.
*   **Database Setup:** Design the initial database schema (Users, Courses, Groups, Enrollments). Set up the ORM (e.g., Prisma or TypeORM for Node.js, SQLAlchemy for Python) and run the initial migrations.

**Recommended ECC Skills:**
* `git-workflow`
* `docker-patterns`
* `nestjs-patterns` (or `fastapi-patterns`)
* `postgres-patterns`
* `database-migrations`
* `api-design`

**Prompt for Execution:**
```text
Please execute Stage 0 of the project plan. Start by initializing the repository and setting up the Docker environment (`docker-compose.yml` with PostgreSQL and Redis). Scaffold the backend API core (NestJS/FastAPI), configure the ORM with the initial schema (Users, Courses, Groups, Enrollments), run initial migrations, and set up CI/CD. Utilize the `docker-patterns`, `nestjs-patterns` (or `fastapi-patterns`), `postgres-patterns`, and `database-migrations` skills for best practices.
```

## Stage 1: Users & Auth + Admin Bot Skeleton (2–3 weeks)
*   **Users Module:** Develop the `Users` backend module handling user CRUD operations and roles (student, curator, admin).
*   **Authentication:** 
    *   Implement Telegram `initData` validation for secure Mini App authentication.
    *   Implement internal service token authentication for Bot-to-API communication.
*   **Admin Bot Skeleton:** Initialize the Admin Bot project (using grammY or aiogram).
*   **Integration Test:** Create basic command handlers and a simple menu in the Admin Bot. Connect it to the API core to verify the end-to-end flow (Bot → API → Database).

**Recommended ECC Skills:**
* `backend-patterns`
* `nestjs-patterns` (or `fastapi-patterns`)
* `postgres-patterns`
* `security-review`

**Prompt for Execution:**
```text
Please execute Stage 1 of the project plan. Create the `Users` module in the backend for user CRUD and roles. Implement Telegram `initData` validation and internal service token authentication. Scaffold the Admin Bot skeleton, create basic command handlers, and perform an integration test to ensure end-to-end communication (Bot -> API -> Database). Ensure to use the `backend-patterns`, `nestjs-patterns` (or `fastapi-patterns`), and `security-review` skills.
```

## Stage 2: Registrar Bot + Courses/Groups Module (2–3 weeks)
*   **Courses & Groups Module:** Develop the backend logic for managing courses (free/paid) and groups, including generating unique referral links.
*   **Registrar Bot Initialization:** Scaffold the Registrar Bot.
*   **Mini App Frontend:** Create the React + TypeScript Mini App for the user registration questionnaire.
*   **Registration Flow:** Implement the flow for handling referral links, displaying the questionnaire, and saving the `enrollment` record.
*   **Group Integration:** Implement the logic to detect when the bot is added to a private Telegram group and associate that group with a course.

**Recommended ECC Skills:**
* `react-patterns`
* `frontend-patterns`
* `backend-patterns`
* `nestjs-patterns` (or `fastapi-patterns`)

**Prompt for Execution:**
```text
Please execute Stage 2 of the project plan. Develop the backend module for Courses & Groups. Scaffold the Registrar Bot and build the React + TypeScript Mini App for the registration questionnaire. Implement the registration flow (referral links, enrollments) and group integration logic. Rely on the `react-patterns`, `frontend-patterns`, and `backend-patterns` skills for structuring the UI and API logic.
```

## Stage 3: Main Bot (Basic Version) (2 weeks)
*   **Main Bot Initialization:** Scaffold the Main Bot.
*   **Student Dashboard Mini App:** Build the React UI for the student profile, course progress, and "My Schedule" block.
*   **Schedule Endpoints:** Implement API endpoints to fetch the student's schedule and track progress.
*   **Scheduler & Queue:** Implement the `Scheduler/Queue` module using Redis (e.g., BullMQ for Node.js or Celery for Python).
*   **Automated Jobs:** Set up background tasks to send reminders 10 minutes before online lessons and automatically publish recorded videos/files at lesson deadlines.

**Recommended ECC Skills:**
* `react-patterns`
* `frontend-patterns`
* `redis-patterns`
* `backend-patterns`

**Prompt for Execution:**
```text
Please execute Stage 3 of the project plan. Scaffold the Main Bot and build the Student Dashboard Mini App (React). Create the schedule endpoints on the backend, implement the Scheduler/Queue using Redis, and set up background jobs for lesson reminders and material publishing. Use the `react-patterns`, `frontend-patterns`, and `redis-patterns` skills to ensure a robust frontend and task queue.
```

## Stage 4: Assignment Engine + Cert Bot (3–4 weeks)
*   **Assignments Engine:** Build the core backend module for assignments (supporting types 1, 2, and 3). Implement logic for saving drafts, submitting answers, and auto-grading (for types 1 and 2).
*   **Files Service:** Set up the `Files Service` module and integrate it with S3-compatible storage (for handling assignment attachments and image uploads).
*   **Cert Bot Initialization:** Scaffold the Cert Bot and its Mini App.
*   **Test Interface:** Build the Mini App UI for taking tests, including timer logic, mathematical keyboard integration, and assignment navigation.
*   **Admin Test Creation:** Develop the Admin Bot interface for creating certification test variants (setting deadlines, adding questions).
*   **Deadline Enforcement:** Use the Scheduler module to enforce test deadlines and close submission forms.

**Recommended ECC Skills:**
* `backend-patterns`
* `react-patterns`
* `frontend-patterns`

**Prompt for Execution:**
```text
Please execute Stage 4 of the project plan. Build the Assignments Engine and Files Service (S3 integration) in the backend. Scaffold the Cert Bot and develop the Mini App interface for taking tests. Update the Admin Bot for test creation and use the Scheduler for deadline enforcement. Apply the `backend-patterns`, `react-patterns`, and `frontend-patterns` skills to ensure scalable assignment logic and responsive test interfaces.
```

## Stage 5: Homework Bot (1–2 weeks)
*   **Homework Bot Initialization:** Scaffold the Homework Bot and its Mini App.
*   **Homework UI:** Build the Mini App interface showing active, submitted, graded, and overdue assignments.
*   **Engine Reuse:** Connect the Homework Bot to the existing `Assignments Engine` to render homework tasks and handle submissions.
*   **Admin Assignment Flow:** Develop the Admin interface to link homework assignments to specific group lessons in the calendar.
*   **Manual Grading Interface:** Implement a specific Admin/Curator interface to view type 3 submissions (text + photos), assign scores, and leave text feedback.

**Recommended ECC Skills:**
* `react-patterns`
* `frontend-patterns`
* `backend-patterns`

**Prompt for Execution:**
```text
Please execute Stage 5 of the project plan. Scaffold the Homework Bot and its Mini App, reusing the Assignments Engine to render tasks and accept submissions. Build the Admin interfaces for linking assignments to lessons and manual grading for type 3 submissions. Utilize `react-patterns` and `backend-patterns` for integrating the UI with the existing assignment logic.
```

## Stage 6: Material Bot (1–2 weeks)
*   **Materials Module:** Develop the backend module for managing educational materials.
*   **Material Bot Initialization:** Scaffold the Material Bot and its Mini App.
*   **Admin Upload Flow:** Create the Admin interface for uploading files and attaching them to calendar lessons or the general course directory.
*   **Visibility & Access Logic:** Implement logic to unlock materials only after the lesson starts, and enforce access checks based on payment status in the `enrollments` table.
*   **Student View:** Build the UI for viewing materials (folders by lessons, search functionality, and read/unread status tracking).

**Recommended ECC Skills:**
* `react-patterns`
* `backend-patterns`

**Prompt for Execution:**
```text
Please execute Stage 6 of the project plan. Develop the Materials backend module, handling visibility and access logic. Scaffold the Material Bot and its Mini App. Build the Admin upload flow and the Student view for accessing materials. Refer to `react-patterns` and `backend-patterns` while implementing the frontend views and backend authorization logic.
```

## Stage 7: Gamification & Rating (2 weeks)
*   **Gamification Module:** Build the backend module to handle Coins, Fines, and Streaks.
*   **Rules Engine:** Implement course-specific configuration for coin rewards and penalties.
*   **Event Triggers:** Add triggers in existing modules (e.g., attendance in Main Bot, homework submissions in Homework Bot, test scores in Cert Bot) to interact with the Gamification module.
*   **Dashboard Updates:** Update the Main Bot Mini App to display coin balances, ranks, and leaderboards.
*   **Coin Shop Setup:** Create the database models and basic endpoints for the future Coin Shop.

**Recommended ECC Skills:**
* `backend-patterns`
* `postgres-patterns`
* `react-patterns`

**Prompt for Execution:**
```text
Please execute Stage 7 of the project plan. Build the Gamification module (Coins, Fines, Streaks) and a rules engine for course-specific configuration. Integrate event triggers across existing modules. Update the Main Bot Mini App dashboard to display gamification stats, and set up the models/endpoints for the Coin Shop. Apply `backend-patterns`, `postgres-patterns`, and `react-patterns`.
```

## Stage 8: Roles, Audit Log, and Notifications (2 weeks)
*   **Curator Permissions:** Enforce Curator/Assistant role restrictions across the Admin interface (allowing grading/payment confirmation but blocking course creation).
*   **Audit Log:** Develop the `Audit Log` module to record critical administrative actions (e.g., user deletion, manual grade overrides).
*   **Aggregated Notifications:** Refactor individual bot notifications into a unified `Notifications` module to send daily aggregated summaries to users.
*   **End-to-End Testing:** Conduct comprehensive testing across all bots and the API core to ensure data consistency and eliminate cross-module bugs.
*   **Final Deployment:** Configure production deployment, monitoring, and backup strategies.

**Recommended ECC Skills:**
* `backend-patterns`
* `deployment-patterns`
* `e2e-testing`

**Prompt for Execution:**
```text
Please execute Stage 8 of the project plan. Finalize Curator permission restrictions in the Admin interface and implement the Audit Log. Refactor notifications into a unified, aggregated module. Perform comprehensive E2E testing across the bots and API, and configure production deployment, monitoring, and backups. Use the `backend-patterns`, `deployment-patterns`, and `e2e-testing` skills to ensure system robustness and readiness for production.
```
