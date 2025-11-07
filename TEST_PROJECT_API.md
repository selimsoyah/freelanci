# 🧪 Testing the Project Posting System

## What We Built:
- **10 Categories** seeded (Web Dev, Mobile, UI/UX, etc.)
- **6 Project API Endpoints** to create, view, edit, and delete projects
- **Role-based access**: Clients can post, everyone can view

---

## ✅ Test 1: View All Categories (Public - No Auth)

```bash
curl http://localhost:5000/api/v1/projects
```

**What this does:** Lists all available project categories
**Expected:** Returns empty list `[]` (no projects yet)

---

## ✅ Test 2: Register a Client User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@freetun.tn",
    "password": "SecurePass123!",
    "phone": "+216 20 123 456",
    "full_name": "Ahmed Ben Ali",
    "role": "client"
  }'
```

**What this does:** Creates a new client account
**Expected:** Returns user data + JWT tokens

---

## ✅ Test 3: Login as Client

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@freetun.tn",
    "password": "SecurePass123!"
  }'
```

**What this does:** Logs in and gets JWT token
**Expected:** Returns `accessToken` - **COPY THIS TOKEN!**

---

## ✅ Test 4: Create a Project (Requires Client Auth)

**Replace `YOUR_TOKEN_HERE` with the access token from Test 3**

First, get a category ID:
```bash
curl http://localhost:5000/api/v1/projects
```

Then create project:
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Build Modern E-commerce Website",
    "description": "I need a full-featured e-commerce website with product catalog, shopping cart, payment integration (Flouci), and admin dashboard. The site should be responsive and support both French and Arabic languages.",
    "budget_min": 2000,
    "budget_max": 3500,
    "deadline": "2025-12-31",
    "category_id": "51a0a483-578d-4024-a6f1-5bda4e56c6f4",
    "skills_required": ["React", "Node.js", "PostgreSQL", "Flouci API"]
  }'
```

**What this does:** Posts a new project to the marketplace
**Expected:** Returns the created project with ID

---

## ✅ Test 5: Browse All Projects (Public)

```bash
curl "http://localhost:5000/api/v1/projects?page=1&limit=10"
```

**What this does:** Lists all projects with pagination
**Expected:** Shows your created project

---

## ✅ Test 6: Search Projects by Budget

```bash
curl "http://localhost:5000/api/v1/projects?min_budget=1500&max_budget=4000"
```

**What this does:** Filters projects by budget range
**Expected:** Returns projects within budget

---

## ✅ Test 7: Search Projects by Keyword

```bash
curl "http://localhost:5000/api/v1/projects?search=website"
```

**What this does:** Searches in title and description
**Expected:** Returns matching projects

---

## ✅ Test 8: Get Project Details

```bash
curl http://localhost:5000/api/v1/projects/PROJECT_ID_HERE
```

**What this does:** Gets full details of one project
**Expected:** Complete project info with client details

---

## ✅ Test 9: Update Your Project

```bash
curl -X PUT http://localhost:5000/api/v1/projects/PROJECT_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "budget_max": 4000,
    "status": "open"
  }'
```

**What this does:** Updates project budget
**Expected:** Returns updated project

---

## ✅ Test 10: Get My Projects Only

```bash
curl http://localhost:5000/api/v1/projects/my-projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**What this does:** Shows only your posted projects
**Expected:** List of your projects

---

## 🚫 Test 11: Try Creating Project as Freelancer (Should Fail)

Register as freelancer:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freelancer@freetun.tn",
    "password": "SecurePass123!",
    "phone": "+216 21 654 321",
    "full_name": "Fatima Zouari",
    "role": "freelancer"
  }'
```

Try to create project (will fail):
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer FREELANCER_TOKEN" \
  -d '{
    "title": "Test",
    "description": "This should fail because freelancers cannot post projects",
    "budget_min": 100,
    "budget_max": 200,
    "deadline": "2025-12-31",
    "category_id": "51a0a483-578d-4024-a6f1-5bda4e56c6f4"
  }'
```

**Expected:** Error: "Insufficient permissions" (403)

---

## 📊 Summary of What Works:

✅ **Authentication** - Users can register and login
✅ **Role-based Access** - Only clients can post projects
✅ **Create Projects** - Clients post projects with all details
✅ **Browse Projects** - Anyone can view all projects
✅ **Search & Filter** - By budget, category, keywords, status
✅ **Pagination** - Handle large project lists
✅ **Update/Delete** - Only project owner can modify
✅ **Data Validation** - Budget, deadline, required fields checked
✅ **Database Relations** - Projects linked to users and categories

---

## 🎯 Ready for Phase 5: Proposal System

Next up: Freelancers will be able to submit proposals to these projects!
