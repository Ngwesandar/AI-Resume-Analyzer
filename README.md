# AI Resume Analyzer

A full-stack MERN application that analyzes resumes and scores them based on detected skills.

## Features
- User registration & login with JWT authentication
- Upload PDF resumes
- Automatic skill detection & scoring
- Resume analysis history saved to MongoDB
- Dark / Light theme toggle

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **PDF Parsing:** pdf-parse

## Getting Started

### Prerequisites
- Node.js
- MongoDB running locally

### Installation

1. Clone the repo
```bash
   git clone https://github.com/YOUR_USERNAME/ai-resume-analyzer.git
   cd ai-resume-analyzer
```

2. Install dependencies
```bash
   npm install
```

3. Create a `.env` file