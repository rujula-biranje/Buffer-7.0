# 🍽️ Canteen Queue Management System

## Team Members
- Rujula Biranje (Mech)
- Priya Kulkarni (Instru)
- Shreya Joshi (IT)
- Pooja Kawate (IT)

## Theme
Enterprise Systems & Process Optimization

## Project Description
A smart canteen queue management system that calculates 
waiting time for each customer based on pending orders 
and food preparation time.

## Features
- 🔐 Role-based login (Admin & User)
- ⏱️ Real-time waiting time calculation
- 📦 Stock availability tracking
- 🗳️ Admin voting polls for unavailable items
- 📋 Order queue management with Priority Queue (VIP)

## DSA Concepts Used
| Feature | DSA Used |
|---|---|
| Order Queue | Min-Heap Priority Queue |
| Stock Check | Hash Map |
| Wait Time | Prefix Sum |
| Poll Votes | Hash Map + Set |

## Tech Stack
- Backend: Deno + TypeScript + Supabase
- Frontend: React + Vite + Tailwind CSS

## How to Run
### Backend
cd calculate-queue
deno task start

### Frontend
cd canteen-frontend
npm install
npm run dev

Video Link: https://drive.google.com/file/d/1OB2cCWsPWv0JqQKpdPsSRCN345wrRtRq/view?usp=drive_link
