# Testing Configuration - FinControl

## TestSprite Configuration

### Testing Types

**Mode:** Frontend

**Type:** Frontend Testing

The FinControl application is a Next.js 14 frontend application that requires frontend testing to validate user workflows, UI components, and user interactions.

### Scope

**Scope:** Codebase

**Type:** Codebase Testing

Test against the entire codebase to ensure comprehensive coverage of all features and functionalities.

### Authentication

**Type:** Authentication Required

**Method:** Supabase Authentication

The application uses Supabase Auth for user authentication. Users must:

1. Sign up or log in via `/login` or `/signup` pages
2. Authenticate via Supabase Auth system
3. Access protected routes after authentication

**Authentication Flow:**

- Login page: `/login`
- Signup page: `/signup`
- Protected routes require authenticated session
- Session managed via Supabase Auth cookies

### Local Development Port

**Port:** 3000

**URL:** http://localhost:3000

**Path:** `/`

**Server Status:** Ensure the development server is running before testing:

```bash
npm run dev
```

The server should be accessible at `http://localhost:3000` and reachable for testing.

## Application Overview

### Main Features to Test

1. **User Authentication**

   - User registration (`/signup`)
   - User login (`/login`)
   - Session management
   - Protected route access

2. **Account Management**

   - Create accounts (`/accounts/new`)
   - View accounts (`/accounts`)
   - Edit account settings (`/accounts/[id]/settings`)
   - Delete accounts
   - Account sharing and invites

3. **Transaction Management**

   - Create transactions (`/transactions/new`)
   - View transactions (`/transactions`)
   - Edit transactions
   - Delete transactions
   - Bulk transaction creation (`/transactions/bulk`)

4. **Dashboard & Analytics**

   - Dashboard overview (`/dashboard`)
   - Spending forecast (AI-powered)
   - Budget tracking
   - Financial analytics

5. **Telegram Bot Integration**

   - Telegram authentication (`/telegram/auth`)
   - Telegram settings (`/telegram/settings`)
   - Bot webhook functionality

6. **Export Functionality**

   - Export transactions (`/export`)
   - Excel/PDF/CSV export formats

7. **Recurring Bills**
   - Manage recurring bills (`/recurring-bills`)
   - Set up recurring transactions

## Test Scenarios

### Critical User Flows

1. **New User Registration Flow**

   - Navigate to `/signup`
   - Fill registration form
   - Submit and verify account creation
   - Verify redirect to dashboard

2. **Login Flow**

   - Navigate to `/login`
   - Enter credentials
   - Verify successful login
   - Verify session persistence

3. **Create Account Flow**

   - Navigate to `/accounts/new`
   - Fill account form (name, type, currency, color, icon)
   - Submit and verify account creation
   - Verify account appears in accounts list

4. **Create Transaction Flow**

   - Navigate to `/transactions/new`
   - Select account
   - Enter transaction details (type, amount, category, date, description)
   - Submit and verify transaction creation
   - Verify transaction appears in transactions list

5. **Dashboard View Flow**

   - Navigate to `/dashboard`
   - Verify account cards display
   - Verify spending forecast displays
   - Verify recent transactions display
   - Verify budget status indicators

6. **Telegram Bot Connection Flow**
   - Navigate to `/telegram/auth`
   - Initiate Telegram bot connection
   - Verify authentication token generation
   - Verify successful connection

## Technical Details

### Framework

- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components

### Database

- **Supabase** (PostgreSQL)
- **Row Level Security (RLS)** enabled
- Real-time subscriptions

### Authentication

- **Supabase Auth**
- Session-based authentication
- Protected routes via middleware

### Key Routes

- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Main dashboard
- `/accounts` - Accounts list
- `/accounts/new` - Create account
- `/accounts/[id]/settings` - Account settings
- `/transactions` - Transactions list
- `/transactions/new` - Create transaction
- `/transactions/bulk` - Bulk transaction creation
- `/export` - Export transactions
- `/recurring-bills` - Recurring bills management
- `/telegram/auth` - Telegram authentication
- `/telegram/settings` - Telegram settings

## Test Data Requirements

### Test User Accounts

- Valid user credentials for login testing
- Test accounts with various permission levels

### Test Accounts

- Sample financial accounts (personal, shared)
- Accounts with different currencies (KR, Real, Dollar, Euro)

### Test Transactions

- Sample income transactions
- Sample expense transactions
- Transactions across different categories
- Transactions across different accounts

## Environment Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Development server running on port 3000

### Environment Variables

Required environment variables (should be in `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

### Starting the Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server should be running at http://localhost:3000
```

## Notes

- Ensure the development server is running before starting tests
- Authentication is required for most features
- Some features require test data to be set up in the database
- Real-time features may require active Supabase connection
- Telegram bot features require valid Telegram bot token configuration
