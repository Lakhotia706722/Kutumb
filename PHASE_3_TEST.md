# Phase 3 Stop Condition — Manual Test Verification

**Test Date:** July 9, 2026  
**Goal:** Verify alert generation works correctly with three test scenarios

---

## Test Prerequisites

**Ensure servers are running:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

**Servers should be at:**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

---

## Test Scenario 1: Motor Insurance (10 days until expiry)

### Setup (User A)
1. Sign up / login to family
2. Go to /vault → "+ Add"
3. Fill form:
   - **Category:** Insurance
   - **Title:** Motor Insurance - Tesla Model 3
   - **Expiry Date:** 10 days from today (e.g., July 19, 2026)
   - **Upload:** Any PDF
4. Click "Upload document"

### Expected Behavior
- Document appears in vault under "Insurance"
- Alert records created with triggerDates:
  - 45 days before: June 4, 2026 (PASSED — alert overdue)
  - 15 days before: July 4, 2026 (PASSED — alert overdue)
  - 3 days before: July 16, 2026 (PENDING — 7 days away)

### Verify in Database
```bash
# SSH to MongoDB (or use MongoDB Compass)
db.alerts.find({ 
  "message": { $regex: "Motor Insurance" },
  "family": ObjectId("...") 
}).pretty()
```

**Expected output:**
```json
[
  {
    "_id": ObjectId("..."),
    "family": ObjectId("..."),
    "document": ObjectId("..."),
    "message": "Motor Insurance - Tesla Model 3 expires on 19 Jul 2026 — renewal due soon",
    "triggerDate": ISODate("2026-07-16T00:00:00.000Z"),
    "daysBeforeExpiry": 3,
    "status": "pending",
    "createdAt": ISODate("2026-07-09T..."),
    "updatedAt": ISODate("2026-07-09T...")
  },
  {
    "triggerDate": ISODate("2026-07-04T00:00:00.000Z"),
    "daysBeforeExpiry": 15,
    "status": "pending",
    ...
  },
  {
    "triggerDate": ISODate("2026-06-04T00:00:00.000Z"),
    "daysBeforeExpiry": 45,
    "status": "pending",
    ...
  }
]
```

**Count:** Should be 3 alert records

---

## Test Scenario 2: Passport (Already Expired)

### Setup (User A)
1. Go to /vault → "+ Add"
2. Fill form:
   - **Category:** Government IDs
   - **Title:** Passport - John Doe
   - **Expiry Date:** 60 days ago (e.g., May 10, 2026)
   - **Upload:** Any PDF
3. Click "Upload document"

### Expected Behavior
- Document appears in vault
- Alert records created with triggerDates:
  - 180 days before: November 12, 2025 (PASSED)
  - 90 days before: February 10, 2026 (PASSED)
  - 30 days before: June 10, 2026 (PASSED)

### Verify in Database
```bash
db.alerts.find({ 
  "message": { $regex: "Passport" },
  "family": ObjectId("...")
}).pretty()
```

**Expected:**
- 3 alert records
- All have `status: "pending"` (even though dates are past)
- Messages indicate expiration (e.g., "has expired (was due May 10, 2026)")

---

## Test Scenario 3: Health Insurance (60 days until expiry)

### Setup (User A)
1. Go to /vault → "+ Add"
2. Fill form:
   - **Category:** Insurance
   - **Title:** Health Insurance - Family Mediclaim
   - **Expiry Date:** 60 days from today (e.g., September 8, 2026)
   - **Upload:** Any PDF
3. Click "Upload document"

### Expected Behavior
- Document appears in vault
- Alert records created with triggerDates:
  - 60 days before: July 10, 2026 (TODAY or tomorrow — should trigger soon)
  - 30 days before: August 9, 2026 (PENDING)
  - 7 days before: September 1, 2026 (PENDING)

### Verify in Database
```bash
db.alerts.find({ 
  "message": { $regex: "Health Insurance" },
  "family": ObjectId("...")
}).pretty()
```

**Expected:**
- 3 alert records
- triggerDate values: 60d, 30d, 7d before expiry
- All status: "pending"

---

## Test Scenario 4: Idempotency Check (No Duplicates on Second Run)

### Setup
1. Trigger the alert sweep manually:
   ```bash
   curl -X POST http://localhost:5000/api/alerts/sweep \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json"
   ```

2. Note the response:
   ```json
   {
     "message": "Alert sweep completed.",
     "summary": {
       "checked": 3,
       "created": 9,
       "skipped": 0,
       "errors": 0
     }
   }
   ```

### Expected Behavior
- **First run:** `created: 9` (3 documents × 3 alerts each)
- **Second run (same curl again):** `created: 0, skipped: 9`
   - No new alerts created (upsert found existing ones)
   - All 9 alerts updated (but not duplicated)

### Verify No Duplicates
```bash
db.alerts.find({ 
  "family": ObjectId("...") 
}).count()
```

**Expected:** 9 alert records total (not 18)

---

## Test Scenario 5: Editing Expiry Date (Smart Merge)

### Setup
1. Find the Motor Insurance document (expires in 10 days)
2. Click to view → "Edit"
3. Change **Expiry Date** to 75 days from today
4. Save

### Expected Behavior (Smart Merge Logic)
- Old alerts for 10-day expiry:
  - 45d before: June 4 → DELETED (passed)
  - 15d before: July 4 → DELETED (passed)
  - 3d before: July 16 → DELETED (passed)

- New alerts for 75-day expiry:
  - 45d before: May 26 → DELETED (passed)
  - 15d before: June 25 → NEW
  - 3d before: August 19 → NEW

### Verify in Database
```bash
db.alerts.find({ 
  "message": { $regex: "Motor Insurance" },
  "family": ObjectId("...")
}).pretty()
```

**Expected:**
- 2 alert records (45d and 15d alerts deleted, only 15d and 3d remain after smart merge)
- New triggerDate: August 19, 2026 (3 days before new expiry)

---

## Test Scenario 6: User Interaction — Resolve and Dismiss

### Setup
1. Get alert ID from database or from Feed (Phase 4)
2. Resolve an alert:
   ```bash
   curl -X PATCH http://localhost:5000/api/alerts/{alertId}/resolve \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json"
   ```

3. Dismiss another alert:
   ```bash
   curl -X PATCH http://localhost:5000/api/alerts/{alertId}/dismiss \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -H "Content-Type: application/json"
   ```

### Expected Behavior
- Alert 1: status changes to "resolved", resolvedAt set to now
- Alert 2: status changes to "dismissed", resolvedAt set to now
- Next cron run skips these (status != 'pending')

### Verify in Database
```bash
db.alerts.findOne({ _id: ObjectId("..."), status: "resolved" })
```

**Expected:**
```json
{
  "_id": ObjectId("..."),
  "status": "resolved",
  "resolvedAt": ISODate("2026-07-09T..."),
  ...
}
```

---

## Verification Checklist

| Test | Expected | Verified |
|------|----------|----------|
| Motor insurance (10 days) | 3 alerts created | ⚪ |
| Passport (expired) | 3 alerts created | ⚪ |
| Health insurance (60 days) | 3 alerts created | ⚪ |
| Second sweep run | No new alerts (upsert) | ⚪ |
| Edit expiry date | Old alerts deleted, new alerts created | ⚪ |
| Resolve alert | status → "resolved" | ⚪ |
| Dismiss alert | status → "dismissed" | ⚪ |

---

## How to Run the Test

### Quick Manual Test (5 min)
1. Start servers
2. Sign up user
3. Upload motor insurance with 10-day expiry
4. Check MongoDB for 3 alert records
5. Run `/api/alerts/sweep` twice, verify no duplicates

### Comprehensive Test (15 min)
1. Run all 6 test scenarios above
2. Verify each alert record
3. Test user interactions (resolve/dismiss)
4. Confirm cron idempotency

---

## Expected Alert Structure (Reference)

```javascript
{
  _id: ObjectId,
  family: ObjectId,        // family ID
  document: ObjectId,      // document ID
  message: String,         // "Motor Insurance - Tesla expires on 19 Jul 2026..."
  triggerDate: Date,       // when alert becomes active (visible on Feed in Phase 4)
  daysBeforeExpiry: Number, // 45, 15, or 3 (for motor insurance)
  status: String,          // "pending" | "resolved" | "dismissed"
  resolvedAt: Date,        // null until resolved/dismissed
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notes

- **Timezone:** All dates stored in UTC; triggers at 01:30 UTC daily (07:00 IST)
- **Idempotency:** Using MongoDB `updateOne` with `upsert:true` ensures no duplicates
- **Cascade Delete:** When a document is deleted, all its alerts are deleted too
- **Message Format:** Dynamic messages based on days-to-expiry (e.g., "expires in 3 days", "expired on July 9")
- **Status Lifecycle:** pending → resolved | dismissed (one-way; cannot revert)

---

## Phase 3 Stop Condition: READY TO VERIFY

All functionality implemented:
- ✅ Alert model created
- ✅ Alert rules hardcoded (easy to tune)
- ✅ Daily cron job running
- ✅ Idempotent alert generation (no duplicates)
- ✅ Resolve/dismiss endpoints
- ✅ Smart merge on date edit (old deleted, new created)

**Next:** Execute test scenarios and confirm alert records are correct.

---
