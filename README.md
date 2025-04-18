# Fundraiser Website

A complete fundraiser platform for creating and managing fundraising campaigns and accepting donations.

## Features

- User registration and login with JWT authentication
- Create and manage fundraising campaigns
- Track donations with progress bars
- Responsive UI built with Tailwind CSS
- Image upload support for campaigns
- Client and server-side validation

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     PORT=3000
     JWT_SECRET=your_jwt_secret
     ```

4. Start the application:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Technology Stack

- **Backend**: Node.js, Express.js, SQLite (via better-sqlite3)
- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript
- **Authentication**: JWT, bcrypt
- **File Upload**: Multer
- **Security**: CORS, Helmet 