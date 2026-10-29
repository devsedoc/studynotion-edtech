
# StudyNotion — EdTech Platform

A full-stack educational platform designed to connect students and instructors through online courses, learning resources, and course management tools.

**Built with React, Node.js, Express, and MongoDB.**

## Overview

StudyNotion is a web-based learning platform with separate experiences for students and instructors. Students can explore courses and manage their learning, while instructors can create and manage course content.

This project uses a React frontend and an Express backend connected to MongoDB.

## Features

- **Authentication:** User registration, login, email verification, and password recovery.
- **Course discovery:** Browse available courses and view course details.
- **Student dashboard:** Access profile information and enrolled-course features.
- **Instructor dashboard:** Create, edit, and manage courses and learning content.
- **Course content:** Organize courses into sections and subsections.
- **Media uploads:** Cloudinary integration for supported media uploads.
- **Email notifications:** Email verification and account-related notifications.
- **Reviews and ratings:** Course feedback functionality.
- **Responsive interface:** React-based user interface styled with Tailwind CSS.

> Payment integration is currently disabled unless valid Razorpay credentials are configured.

## Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Email | Nodemailer |
| Media storage | Cloudinary |
| Payments | Razorpay integration (optional configuration) |
| Development tools | Git, npm, Nodemon |

## Project Structure

```text
studynotion-edtech/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── slices/
│   └── utils/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── mail/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- A MongoDB database (MongoDB Atlas or a local MongoDB instance)
- Git

Optional services such as Cloudinary, Gmail SMTP, and Razorpay require their own credentials.

### 1. Clone the repository

```bash
git clone https://github.com/devsedoc/studynotion-edtech.git
cd studynotion-edtech
```

### 2. Install dependencies

Install the frontend dependencies from the project root:

```bash
npm install
```

Install the backend dependencies:

```bash
cd server
npm install
cd ..
```

### 3. Configure environment variables

Create the required environment files locally. Use the provided example configuration as a reference:

```text
server/.env.example
```

Create `server/.env` and configure the variables required by the backend, such as:

```env
PORT=4000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_private_jwt_secret
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email_address
MAIL_PASS=your_email_app_password
```

Configure any additional Cloudinary and payment variables required by the features you want to enable. Check the backend configuration files for their exact variable names.

**Never commit real passwords, API secrets, database connection strings, or private tokens to GitHub.**

### 4. Start the application

From the project root:

```bash
npm run dev
```

The development servers should be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

Make sure MongoDB is reachable and the required environment variables are configured before testing backend features.

## Environment Configuration

Keep private configuration in local `.env` files. These files should remain excluded from version control.

For a fresh installation, use the example environment file to understand which settings need to be configured. Never copy production credentials into the repository.

## Future Improvements

- Deploy the frontend and backend with production-ready environment configuration.
- Add automated tests for authentication and course-management workflows.
- Improve API validation, error handling, and security.
- Add a public demo with sample courses and screenshots.
- Improve accessibility and mobile responsiveness.
- Add CI checks for formatting, linting, and builds.

## Author

**Devang Sharma**

GitHub: [@devsedoc](https://github.com/devsedoc)

## License and Attribution

Review the original project's license and attribution requirements before redistributing or publishing a modified version. Add the applicable license information here.

---

*An educational full-stack web development project focused on course management, authentication, and online learning workflows.*