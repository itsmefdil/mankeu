# Mankeu API Documentation

Base URL: `http://localhost:8888/api/v1`

## Authentication

### Login
**POST** `/auth/login`

**Body (`application/x-www-form-urlencoded`):**
- `username`: Email address
- `password`: Password

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer"
}
```

### Google Login
**POST** `/auth/login/google`

**Body (`application/json`):**
```json
{
  "id_token": "eyJhbGciOiJSUzI1Ni..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer"
}
```

---

## Users

### Get Current User
**GET** `/users/me`

**Headers:**
- `Authorization`: `Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "picture": "https://...",
  "currency": "IDR",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Update User Profile
**PUT** `/users/me`

**Body (`application/json`):**
```json
{
  "name": "John Updated", // optional
  "email": "john.new@example.com", // optional
  "currency": "USD" // optional
}
```

---

## Categories

### List Categories
**GET** `/categories`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Food",
    "type": "expense"
  }
]
```

### Create Category
**POST** `/categories`

**Body (`application/json`):**
```json
{
  "name": "Salary",
  "type": "income" // expense, income, saving
}
```

### Update Category
**PUT** `/categories/:id`

**Body:** Same as Create (fields optional depending on implementation, but typically required for PUT)

### Delete Category
**DELETE** `/categories/:id`

---

## Transactions

### List Transactions
**GET** `/transactions`

**Query Params:**
- `limit`: Number of items (default 100)
- `skip`: Offset (default 0)

### Create Transaction
**POST** `/transactions`

**Body (`application/json`):**
```json
{
  "category_id": 1,
  "name": "Lunch",
  "transaction_date": "2024-01-07",
  "amount": 50000,
  "notes": "With friends", // optional
  "goal_id": 2 // optional, for saving goals
}
```

### Update Transaction
**PUT** `/transactions/:id`

**Body:** Same as Create

### Delete Transaction
**DELETE** `/transactions/:id`

### Bulk Delete
**POST** `/transactions/bulk-delete`

**Body (`application/json`):**
```json
{
  "ids": [1, 2, 3]
}
```

---

## Budgets

### List Budgets
**GET** `/budgets`

### Create Budget
**POST** `/budgets`

**Body (`application/json`):**
```json
{
  "category_id": 1,
  "month": 1,
  "year": 2024,
  "budget_amount": 1000000
}
```

### Update Budget
**PUT** `/budgets/:id`

### Delete Budget
**DELETE** `/budgets/:id`

---

## Fixed Expenses

### List Fixed Expenses
**GET** `/fixed-expenses`

### Create Fixed Expense
**POST** `/fixed-expenses`

**Body (`application/json`):**
```json
{
  "name": "Netflix",
  "amount": 180000,
  "due_day": 5
}
```

### Update Fixed Expense
**PUT** `/fixed-expenses/:id`

### Delete Fixed Expense
**DELETE** `/fixed-expenses/:id`

---

## Debts

### List Debts
**GET** `/debts`

### Create Debt
**POST** `/debts`

**Body (`application/json`):**
```json
{
  "name": "Loan",
  "amount": 5000000,
  "status": "unpaid", // unpaid, paid
  "due_date": "2024-12-31"
}
```

### Update Debt
**PUT** `/debts/:id`

### Delete Debt
**DELETE** `/debts/:id`

---

## Incomes

### List Incomes
**GET** `/incomes`

### Create Income
**POST** `/incomes`

**Body (`application/json`):**
```json
{
  "source": "Salary",
  "amount": 10000000,
  "income_date": "2024-01-25"
}
```

### Update Income
**PUT** `/incomes/:id`

### Delete Income
**DELETE** `/incomes/:id`

---

## Savings (Goals)

### List Savings
**GET** `/savings`

### Create Saving
**POST** `/savings`

**Body (`application/json`):**
```json
{
  "name": "New Car",
  "amount": 0,
  "saving_date": "2025-01-01" // Target date or start date
}
```

### Update Saving
**PUT** `/savings/:id`

### Delete Saving
**DELETE** `/savings/:id`

---

## Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "ok"
}
```
