
# CanteenSync

CanteenSync is a smart campus canteen management system designed to streamline food ordering, stall operations, order tracking, and future inventory management.

## Problem

Campus canteens often face long queues, manual order handling, order confusion, and limited visibility into stall operations.

CanteenSync provides a unified digital platform connecting students and canteen stall operators through an integrated ordering and order-management workflow.

## Current Prototype

The current prototype implements:

- Student food menu
- Stall-wise food browsing
- Shopping cart
- Order placement
- Backend API
- SQLite database
- Stall operator dashboard
- Incoming order queue
- Order status management
- Order lifecycle tracking

## Order Workflow

The current working order lifecycle is:

Student
→ Place Order
→ Placed
→ Accepted
→ Preparing
→ Ready for Pickup

## System Architecture

The current prototype consists of:

Frontend
- HTML
- CSS
- JavaScript

Backend
- Node.js
- Express.js

Database
- SQLite
- better-sqlite3

## Project Structure

```text
CanteenSync/
├── index.html
├── style.css
├── app.js
├── README.md
├── .gitignore
└── backend/
    ├── server.js
    ├── database.js
    ├── package.json
    └── package-lock.json
