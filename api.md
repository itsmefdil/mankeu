# API Documentation

Base URL: `http://localhost:8000/api/v1`

## Authentication

### Login
**POST** `/auth/login`
- **Request Body** (OAuth2 Password Request Form):
  - `username`: Email address
  - `password`: Password
- **Response**: Access Token (JSON)

---

## Users

### Register
**POST** `/users/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password",
    "name": "User Name"
  }
  ```
- **Response**: User Object

### Get Current User
**GET** `/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User Object

### List Users
**GET** `/users/`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of User Objects

---

## Categories
*Global categories (not user-specific)*

**Prefix**: `/categories`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all categories |
| POST | `/` | Create a category |
| GET | `/{id}` | Get category by ID |
| PUT | `/{id}` | Update category |
| DELETE | `/{id}` | Delete category |

---

## Transactions
*User-specific data. Requires Authentication.*

**Prefix**: `/transactions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's transactions |
| POST | `/` | Create transaction |
| GET | `/{id}` | Get transaction by ID |
| PUT | `/{id}` | Update transaction |
| DELETE | `/{id}` | Delete transaction |

**Request Body (Create/Update)**:
```json
{
  "category_id": 1,
  "name": "Lunch",
  "transaction_date": "2025-12-16",
  "amount": 50000,
  "notes": "Optional notes"
}
```

---

## Monthly Budgets
*User-specific data. Requires Authentication.*

**Prefix**: `/budgets`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's budgets |
| POST | `/` | Create budget |
| GET | `/{id}` | Get budget by ID |
| PUT | `/{id}` | Update budget |
| DELETE | `/{id}` | Delete budget |

**Request Body (Create/Update)**:
```json
{
  "category_id": 1,
  "month": 12,
  "year": 2025,
  "budget_amount": 1000000
}
```

---

## Fixed Expenses
*User-specific data. Requires Authentication.*

**Prefix**: `/fixed-expenses`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's fixed expenses |
| POST | `/` | Create fixed expense |
| GET | `/{id}` | Get fixed expense by ID |
| PUT | `/{id}` | Update fixed expense |
| DELETE | `/{id}` | Delete fixed expense |

**Request Body (Create/Update)**:
```json
{
  "name": "Rent",
  "amount": 1500000,
  "due_day": 5
}
```

---

## Debts
*User-specific data. Requires Authentication.*

**Prefix**: `/debts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's debts |
| POST | `/` | Create debt |
| GET | `/{id}` | Get debt by ID |
| PUT | `/{id}` | Update debt |
| DELETE | `/{id}` | Delete debt |

**Request Body (Create/Update)**:
```json
{
  "name": "Credit Card",
  "amount": 5000000,
  "status": "unpaid",
  "due_date": "2025-12-31"
}
```

---

## Incomes
*User-specific data. Requires Authentication.*

**Prefix**: `/incomes`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's incomes |
| POST | `/` | Create income |
| GET | `/{id}` | Get income by ID |
| PUT | `/{id}` | Update income |
| DELETE | `/{id}` | Delete income |

**Request Body (Create/Update)**:
```json
{
  "source": "Salary",
  "amount": 10000000,
  "income_date": "2025-12-01"
}
```

---

## Savings
*User-specific data. Requires Authentication.*

**Prefix**: `/savings`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's savings |
| POST | `/` | Create saving |
| GET | `/{id}` | Get saving by ID |
| PUT | `/{id}` | Update saving |
| DELETE | `/{id}` | Delete saving |

**Request Body (Create/Update)**:
```json
{
  "name": "Trip to Japan",
  "amount": 2000000,
  "saving_date": "2025-12-10"
}
```
