# CloudCost AI – AI-Powered AWS Infrastructure Cost Optimization Platform

CloudCost AI is a full-stack cloud optimization platform that automatically scans AWS infrastructure, analyzes cloud resources using Artificial Intelligence, and provides actionable recommendations to reduce cloud costs and improve infrastructure health.

The application uses **AWS CLI** to collect infrastructure information, **Inception AI** to analyze cloud resources, and **PostgreSQL** to store historical analysis reports. A modern React dashboard provides live progress updates and an intuitive interface for viewing optimization recommendations.

---

## Features

* AWS Infrastructure Scanning using AWS CLI
* AI-Powered Cost Optimization Analysis
* Infrastructure Health Score
* Estimated Monthly & Annual Cost Savings
* AWS CLI Fix Commands for Recommendations
* Secure JWT Authentication
* PostgreSQL Analysis History
* Real-Time Progress Tracking with Socket.io
* Modern React Dashboard
* Responsive UI with Tailwind CSS

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios
* Socket.io Client
* React Router DOM

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* bcrypt
* Socket.io
* Axios

### Cloud Technologies

* AWS CLI
* Amazon EC2
* Amazon EBS
* Amazon S3
* Amazon RDS
* AWS Lambda
* IAM
* Amazon VPC
* Elastic Load Balancer
* CloudWatch

### AI

* Inception AI API

### Tools

* Git
* GitHub
* Docker
* PostgreSQL
* VS Code

---

# Project Architecture

```
User
   │
   ▼
React Frontend
   │
   ▼
Node.js + Express Backend
   │
   ├────────────► AWS CLI
   │                   │
   │                   ▼
   │           AWS Infrastructure
   │
   ├────────────► Inception AI API
   │                   │
   │                   ▼
   │         Cost Optimization Report
   │
   ├────────────► PostgreSQL
   │                   │
   │                   ▼
   │           Analysis History
   │
   ▼
React Dashboard
```

---

# Application Workflow

1. User logs into the application.
2. User selects an AWS Region.
3. Backend scans AWS infrastructure using AWS CLI.
4. Infrastructure data is collected.
5. Data is sent to the Inception AI API.
6. AI analyzes infrastructure and identifies optimization opportunities.
7. Analysis report is stored in PostgreSQL.
8. Results are displayed on the dashboard.
9. Users can revisit previous analyses from the History page.

---

# Folder Structure

```
CloudCost-AI/
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── database/
│   ├── socket/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── README.md
└── .gitignore
```

---

# Prerequisites

Install the following before running the project.

* Node.js (v18 or later)
* npm
* PostgreSQL
* AWS CLI
* Git

---

# AWS CLI Setup

### Install AWS CLI

Follow the official AWS CLI installation guide for your operating system.

Verify installation

```bash
aws --version
```

Configure your AWS credentials

```bash
aws configure
```

Provide

* AWS Access Key ID
* AWS Secret Access Key
* Default Region
* Output Format (json)

Verify your credentials

```bash
aws sts get-caller-identity
```

---

# PostgreSQL Setup

Create a PostgreSQL database

```sql
CREATE DATABASE cloudcost;
```

---

# Backend Configuration

Create a `.env` file inside the backend folder.

```env
PORT=5000

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cloudcost

JWT_SECRET=your_super_secret_key

AWS_PROFILE=default

INCEPTION_API_KEY=your_inception_api_key

INCEPTION_MODEL=your_model_name
```

---

# Frontend Configuration

Create a `.env` file inside the frontend folder.

```env
VITE_API_URL=http://localhost:5000
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/cloudcost-ai.git

cd cloudcost-ai
```

---

## Install Backend

```bash
cd backend

npm install
```

Start backend

```bash
npm run dev
```

---

## Install Frontend

```bash
cd frontend

npm install
```

Start frontend

```bash
npm run dev
```

The application will be available at

```
Frontend
http://localhost:5173

Backend
http://localhost:5000
```

---

# API Endpoints

## Authentication

```
POST /api/auth/signup

POST /api/auth/login
```

## AWS

```
GET /api/health

GET /api/regions

POST /api/analyze
```

## History

```
GET /api/history

GET /api/history/:id
```

---

# Key Features

### AWS Infrastructure Scanner

Scans AWS resources including:

* EC2
* EBS
* RDS
* Lambda
* IAM
* S3
* Elastic Load Balancer
* VPC
* CloudWatch

---

### AI Analysis

The Inception AI model analyzes infrastructure and generates

* Infrastructure Health Score
* Cost Optimization Recommendations
* Estimated Monthly Savings
* Estimated Annual Savings
* Best Practice Recommendations
* AWS CLI Fix Commands

---

### Real-Time Progress Tracking

The frontend receives live updates while analysis is running using Socket.io.

Example

```
✔ Connected to AWS

✔ Scanning EC2

✔ Scanning EBS

✔ Scanning RDS

✔ Running AI Analysis

✔ Saving Report

✔ Analysis Complete
```

---

# Future Enhancements

* AWS Cost Explorer Integration
* AWS SDK Support
* PDF Report Export
* Email Notifications
* Scheduled Infrastructure Scans
* Terraform Support
* CloudFormation Integration
* Multi-Cloud Support (Azure & GCP)
* Team Collaboration
* Role-Based Access Control


# Learning Outcomes

Through this project, the following skills were applied:

* AWS Cloud Architecture
* Cloud Infrastructure Scanning
* Cost Optimization
* Full-Stack Development
* React & TypeScript
* Node.js & Express
* PostgreSQL
* REST APIs
* JWT Authentication
* Socket.io
* AI Integration
* Git & GitHub
* System Design

---

