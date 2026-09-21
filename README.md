# Student Academic Management System (SAMS)
## NBN Sinhgad Technical Institute Campus

A complete, modern, responsive **Student Academic Management System (SAMS)** designed for **NBN Sinhgad Technical Institute Campus** as a college **DBMS project**. Built strictly with **HTML5, CSS3, Vanilla JavaScript, and Supabase PostgreSQL**, ready for 1-click static deployment on **Netlify** without requiring any Python, Flask, or Node.js server.

---

## 1. Project Description

The **Student Academic Management System (SAMS)** enables **NBN Sinhgad Technical Institute Campus** to manage students, subjects, attendance, examination marks, and generate official student grade marksheets. It provides two role-based user interfaces:
- **Administrator / Teacher Portal:** For college authorities and faculty to enroll students, manage subjects, record marks, track attendance, and generate grade cards.
- **Student Portal:** For students to securely log in and view their personal academic profile, subject enrollments, internal & external marks breakdown, attendance percentages, and download/print official marksheets.

---

## 2. Features

- **Role-Based Access Control (RBAC):** Admin (Teacher) and Student portals with dedicated dashboards.
- **Account Registration (Sign Up):** Self-service registration on `signup.html` for both Students (with Roll No, Enrollment No, Course, Semester) and Teachers (with Department & Faculty ID).
- **Student Management:** Add, edit, view, delete, and search students with live filtering by course and semester.
- **Subject Curriculum Management:** Manage course codes, subject names, semester offerings, and credit units.
- **Examination Marks Management:** Record internal (0–40) and external (0–60) marks with **automatic live calculation of total marks and grades** (`A+`, `A`, `B+`, `B`, `C`, `D`, `F`).
- **Attendance Tracking:** Record class sessions and attendance with auto-calculated percentages and **color-coded threshold badges** (Green ≥ 75%, Yellow 60–74%, Red < 60%).
- **Official Printable Marksheet:** Student grade cards with college branding, marks breakdown, percentage, pass/fail status, and browser print (`window.print()`) support.
- **Light & Dark Mode:** Native theme switcher with persistence in `localStorage`.
- **Row Level Security (RLS):** Supabase PostgreSQL policies ensure students only access their own academic records.
- **Static Hosting Friendly:** 100% compatible with Netlify, GitHub Pages, or any static web server.

---

## 3. Technology Stack

- **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+).
- **Database & Authentication:** [Supabase](https://supabase.com) (PostgreSQL 15+, Supabase Auth, Row Level Security).
- **Deployment:** Netlify (Static web hosting) + GitHub.
- **No Heavy Backend:** No Node.js server, Python, Flask, PHP, React, or MongoDB required.

---

## 4. Database Structure & Schema

The PostgreSQL database consists of 5 normalized tables:

### 1. `users`
- `id` (UUID, Primary Key, references `auth.users(id)`)
- `email` (VARCHAR(150), UNIQUE, NOT NULL)
- `role` (VARCHAR(20), CHECK (`role IN ('admin', 'student')`))
- `student_id` (UUID, nullable, references `students(id)`)
- `created_at` (TIMESTAMPTZ, default `NOW()`)

### 2. `students`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `roll_no` (VARCHAR(50), UNIQUE, NOT NULL)
- `enrollment_no` (VARCHAR(50), UNIQUE, NOT NULL)
- `name` (VARCHAR(150), NOT NULL)
- `email` (VARCHAR(150), UNIQUE, NOT NULL)
- `phone` (VARCHAR(20))
- `course` (VARCHAR(100), NOT NULL)
- `semester` (INT, CHECK (`semester >= 1 AND semester <= 8`))
- `division` (VARCHAR(10), default `'A'`)
- `created_at` (TIMESTAMPTZ, default `NOW()`)

### 3. `subjects`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `subject_code` (VARCHAR(30), UNIQUE, NOT NULL)
- `subject_name` (VARCHAR(150), NOT NULL)
- `semester` (INT, CHECK (`semester >= 1 AND semester <= 8`))
- `credits` (INT, default `3`, CHECK (`credits > 0`))
- `created_at` (TIMESTAMPTZ, default `NOW()`)

### 4. `marks`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `student_id` (UUID, references `students(id)` ON DELETE CASCADE)
- `subject_id` (UUID, references `subjects(id)` ON DELETE CASCADE)
- `internal_marks` (NUMERIC(5,2), CHECK (`internal_marks >= 0 AND internal_marks <= 40`))
- `external_marks` (NUMERIC(5,2), CHECK (`external_marks >= 0 AND external_marks <= 60`))
- `total_marks` (NUMERIC(5,2), CHECK (`total_marks >= 0 AND total_marks <= 100`))
- `grade` (VARCHAR(5))
- `created_at` (TIMESTAMPTZ, default `NOW()`)
- `updated_at` (TIMESTAMPTZ, default `NOW()`)
- *Constraint:* `UNIQUE(student_id, subject_id)`

### 5. `attendance`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `student_id` (UUID, references `students(id)` ON DELETE CASCADE)
- `subject_id` (UUID, references `subjects(id)` ON DELETE CASCADE)
- `total_classes` (INT, CHECK (`total_classes >= 0`))
- `present_classes` (INT, CHECK (`present_classes >= 0 AND present_classes <= total_classes`))
- `attendance_percentage` (NUMERIC(5,2))
- `updated_at` (TIMESTAMPTZ, default `NOW()`)
- *Constraint:* `UNIQUE(student_id, subject_id)`

---

## 5. ER Diagram & Table Relationships

```
              +--------------------------+
              |         STUDENTS         |
              +--------------------------+
              | PK id (UUID)             |
              | UK roll_no               |
              | UK enrollment_no         |
              |    name, email, course   |
              +--------------------------+
                     |            |
                     | 1          | 1
                     |            |
                     | N          | N
                     v            v
        +-------------------+    +----------------------+
        |       MARKS       |    |      ATTENDANCE      |
        +-------------------+    +----------------------+
        | PK id             |    | PK id                |
        | FK student_id     |    | FK student_id        |
        | FK subject_id     |    | FK subject_id        |
        |    internal_marks |    |    total_classes     |
        |    external_marks |    |    present_classes   |
        |    total_marks    |    |    attendance_pct    |
        |    grade          |    +----------------------+
        +-------------------+               |
                     |                      |
                     | N                    | N
                     |                      |
                     +----------+-----------+
                                |
                                | 1
                                v
                    +------------------------+
                    |        SUBJECTS        |
                    +------------------------+
                    | PK id (UUID)           |
                    | UK subject_code        |
                    |    subject_name        |
                    |    semester, credits   |
                    +------------------------+
```

---

## 6. DBMS Concepts Demonstrated (For Viva)

1. **Relational Constraints:**
   - **Primary Key (PK):** UUID fields guaranteeing row uniqueness.
   - **Foreign Keys (FK):** Linking `marks` and `attendance` to `students` and `subjects` with `ON DELETE CASCADE`.
   - **Unique Constraints (UK):** `roll_no`, `enrollment_no`, `email`, and `(student_id, subject_id)`.
   - **Check Constraints:** Preventing negative or overflow marks and ensuring `present_classes <= total_classes`.
2. **Database Triggers:**
   - `trg_calc_marks`: Auto-calculates `total_marks = internal_marks + external_marks` and assigns letter grade (`A+` to `F`).
   - `trg_calc_attendance`: Auto-computes `attendance_percentage`.
3. **Stored Database Function:**
   - `calculate_attendance_percentage(present_classes, total_classes)`: Safely prevents division by zero if total classes = 0.
4. **Database Views:**
   - `student_marks_view`: Multi-table SQL `JOIN` of `students`, `subjects`, and `marks`.
   - `student_attendance_view`: Joins attendance records with student and course details.
5. **Indexes:**
   - B-Tree indexes on `students(roll_no)`, `students(enrollment_no)`, `marks(student_id)`, etc., optimizing query retrieval.
6. **Row Level Security (RLS):**
   - Implements fine-grained data protection so students cannot view other students' private grades.

---

## 7. Step-by-Step Setup Instructions

### Stage 1: Supabase Database Setup

1. Create a free account at [Supabase](https://supabase.com).
2. Click **New Project** and name it:
   ```
   student_academic_management
   ```
3. In the Supabase Dashboard, navigate to the **SQL Editor** (left menu).
4. Open the SQL files in the `sql/` folder of this project:
   - Copy the entire contents of [`sql/schema.sql`](sql/schema.sql) and click **Run**.
   - Copy the entire contents of [`sql/policies.sql`](sql/policies.sql) and click **Run**.
   - Copy the entire contents of [`sql/sample_data.sql`](sql/sample_data.sql) and click **Run**.
5. Go to **Project Settings** -> **API**:
   - Copy **Project URL**
   - Copy **Project API Key (`anon` / public)**

### Stage 2: Configure Frontend

1. Open [`js/supabase.js`](js/supabase.js) in any text editor.
2. Replace the placeholder constants:
   ```javascript
   const SUPABASE_URL = "https://your-project-id.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
   ```
3. *Note:* If you haven't created a Supabase project yet, the application automatically runs in **Interactive Demo Mode** with pre-populated data!

### Stage 3: Local Testing

To test the application locally:
- Simply double-click [`index.html`](index.html) to open in your browser, or:
- Use VS Code Live Server extension, or:
- Run a simple local server:
  ```bash
  # Python 3
  python -m http.server 8000
  ```
  Open `http://localhost:8000` in your browser.

---

## 8. Deployment on Netlify (Static Hosting)

The project has zero backend server dependencies and can be deployed directly:

### Option A: Drag & Drop (Fastest, 30 seconds)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `Dbms project` folder into the upload box.
3. Your site is instantly live with a public URL!

### Option B: Connect via GitHub
1. Initialize Git and push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Student Academic Management System"
   git remote add origin https://github.com/yourusername/student-academic-management.git
   git push -u origin main
   ```
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** -> **Import an existing project**.
4. Choose **GitHub** and select your repository.
5. Configuration settings:
   - **Branch:** `main`
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.` *(current directory)*
6. Click **Deploy Site**. Your website is now live!

---

## 9. Login Credentials

### Administrator Portal
- **Email:** `admin@college.edu`
- **Password:** `admin123`
- *Capabilities:* Full CRUD on students, subjects, examination marks, class attendance, and student reports.

### Student Portal
- **Email:** `aarav.sharma@college.edu`
- **Password:** `student123`
- *Capabilities:* Read-only personal academic profile, semester grades, attendance percentage, and printable marksheet.

*(Tip: On the login page, you can click the **Admin Demo** or **Student Demo** buttons to autofill these credentials instantly).*

---

## 10. Sample SQL Queries for DBMS Viva

Demonstrating fundamental SQL concepts in [`sql/queries.sql`](sql/queries.sql):

```sql
-- 1. Subject-wise average marks with GROUP BY and HAVING
SELECT 
    sub.subject_name,
    ROUND(AVG(m.total_marks), 2) AS average_score
FROM marks m
JOIN subjects sub ON m.subject_id = sub.id
GROUP BY sub.subject_name
HAVING AVG(m.total_marks) >= 75;

-- 2. Multi-Table Join for Marksheet Generation
SELECT 
    s.roll_no,
    s.name AS student_name,
    sub.subject_name,
    m.internal_marks,
    m.external_marks,
    m.total_marks,
    m.grade
FROM marks m
JOIN students s ON m.student_id = s.id
JOIN subjects sub ON m.subject_id = sub.id
WHERE s.roll_no = 'CS2026-01';

-- 3. Meaningful Subquery (Above Average Performers in DBMS)
SELECT name, roll_no, email
FROM students
WHERE id IN (
    SELECT student_id 
    FROM marks 
    WHERE subject_id = (SELECT id FROM subjects WHERE subject_code = 'CS301')
      AND total_marks > (
          SELECT AVG(total_marks) 
          FROM marks 
          WHERE subject_id = (SELECT id FROM subjects WHERE subject_code = 'CS301')
      )
);
```

---

## 11. Future Scope

- Integration with college library management.
- Semester fee payment tracking module.
- Automated email alerts for students with attendance below 75%.
- Student feedback and teacher evaluation module.
