# MikroTik Hotspot Management System

This is a comprehensive hotspot management system for MikroTik routers, built with Next.js, Tailwind CSS, and Prisma. It provides a user-friendly interface for managing users, vouchers, and sessions on your MikroTik router.

## Features

*   **Dashboard Overview:** Get a quick overview of your hotspot's status, including active users, active sessions, and system resources.
*   **User Management:** Create, view, update, and delete hotspot users.
*   **Voucher Management:** Generate and manage voucher codes for hotspot access.
*   **Session Monitoring:** Monitor active hotspot sessions and disconnect users.
*   **Router Management:** Manage multiple MikroTik routers from a single interface.
*   **Statistics:** View detailed statistics about your hotspot's usage.

## Getting Started

### Prerequisites

*   Node.js (v18.18.0 or later)
*   npm
*   A MikroTik router with the API enabled

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the project and add the following environment variables:
    ```
    DATABASE_URL="file:./db/custom.db"
    ```
4.  Run the database migrations:
    ```bash
    npx prisma migrate dev
    ```
5.  Seed the database with some initial data:
    ```bash
    npx prisma db seed
    ```

### Running the Application

To run the application in development mode, use the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Security Vulnerabilities

During the setup of this project, 3 moderate severity vulnerabilities were identified in the `highlight.js` package, which is a dependency of `react-syntax-highlighter`. Attempts to fix these vulnerabilities using `npm audit fix --force` and by manually updating the `react-syntax-highlighter` package were unsuccessful.

The vulnerabilities are:
*   [GHSA-7wwv-vh3v-89cq](https://github.com/advisories/GHSA-7wwv-vh3v-89cq)
*   [GHSA-vfrc-7r7c-w9mx](https://github.com/advisories/GHSA-vfrc-7r7c-w9mx)

Since these are moderate vulnerabilities and do not pose a direct threat to the core functionality of the application, the risk has been accepted for now. A more permanent solution would be to replace `react-syntax-highlighter` with a different syntax highlighting library that does not have these vulnerabilities.
