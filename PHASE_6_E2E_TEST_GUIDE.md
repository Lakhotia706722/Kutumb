# PHASE 6 — End-to-End Test Guide

This guide walks through a complete two-person family scenario to verify Phase 6 (and all prior phases) are working correctly.

## Pre-Test Checklist

- [ ] Fresh browser session (or clear cookies)
- [ ] Two test email addresses ready (e.g., person_a@test.com, person_b@test.com)
- [ ] One browser in normal mode, one in incognito/private mode (or two different browsers)
- [ ] Internet connection stable
- [ ] Backend running (http://localhost:5000)
- [ ] Frontend running (http://localhost:3000)

---

## Test Scenario: "The Sharma Family"

### PART 1: Person A Creates Family & Adds Documents

#### Step 1.1: Signup as Person A (Family Owner)
1. Navigate to http://localhost:3000/signup
2. Tab: "Create a family"
3. Form:
   - Name: Rahul Sharma
   - Email: rahul@test.com
   - Password: SecurePass123!
   - Family name: The Sharma Family
4. Click "Create family & account"
5. **Expected**: Redirected to /feed, see "The Sharma Family Feed"

**Verify**:
- ✓ Signup form responsive at current viewport
- ✓ Password strength indicator working
- ✓ No raw error messages (if any)
- ✓ Button showed "Creating account…" during request

---

#### Step 1.2: Verify Feed (Empty State)
1. On /feed page
2. **Expected**:
   - Score widget showing "0/100" (red)
   - "You're all caught up" message
   - "Go to Document Vault →" link
   - Empty feed (no alert sections)

**Verify**:
- ✓ Score displays correctly
- ✓ Empty state text is clear and encouraging
- ✓ No blank screens or errors

---

#### Step 1.3: Add Documents (6 total)
Go to Vault (/vault). Click "+ Add" to add each:

**Document 1: Property Deed**
- Category: Property
- Title: Property Sale Deed - Mumbai
- Issue date: 2020-01-15
- Expiry date: (leave blank)
- Renewal required: No
- Notes: (optional)
- File: Upload any PDF (< 20 MB)
- Click "Add document"

**Expected**: Doc appears in Vault under "Property"

**Document 2: Motor Insurance (Expires in 10 days)**
- Category: Insurance
- Title: Motor Insurance - Maruti Swift
- Issue date: 2024-01-01
- Expiry date: [Today's date + 10 days]
- Renewal required: Yes
- File: Upload any PDF
- Click "Add document"

**Expected**: Doc appears under "Insurance", badge shows "10d left" (amber)

**Document 3: Motor Insurance (Expired 5 days ago)**
- Category: Insurance
- Title: Old Motor Insurance - Honda City
- Issue date: 2023-01-01
- Expiry date: [Today's date - 5 days]
- Renewal required: Yes
- File: Upload any PDF
- Click "Add document"

**Expected**: Doc appears under "Insurance", badge shows "Expired 5d ago" (red)

**Document 4: Government ID (No Expiry)**
- Category: Government IDs
- Title: Aadhaar Card
- Issue date: 2015-06-10
- Expiry date: (leave blank)
- Renewal required: No
- File: Upload any PDF
- Click "Add document"

**Expected**: Doc appears under "Government IDs", no badge (no expiry)

**Document 5: Will (Legal)**
- Category: Legal
- Title: Will - Rahul Sharma
- Issue date: 2024-06-01
- Expiry date: (leave blank)
- Renewal required: No
- File: Upload any PDF
- Click "Add document"

**Expected**: Doc appears under "Legal"

**Document 6: FD Certificate (Expires in 60 days)**
- Category: Investments
- Title: Fixed Deposit - HDFC Bank
- Issue date: 2024-01-01
- Expiry date: [Today's date + 60 days]
- Renewal required: No
- File: Upload any PDF
- Click "Add document"

**Expected**: Doc appears under "Investments", badge shows "60d left" (yellow/neutral)

**Verify During Uploads**:
- ✓ File size validation: Try uploading a file > 20 MB → should show error
- ✓ File type validation: Try uploading .txt file → should show error
- ✓ Loading state: See "Uploading…" button during request
- ✓ Success: Each doc added to correct category
- ✓ Mobile responsive: Try at 360px width, buttons/form still usable

---

#### Step 1.4: Check Vault View
After adding all 6 docs:
1. On /vault page
2. **Expected**:
   - 6 documents total (shown in header)
   - Grouped by category:
     - Property (1): sale deed
     - Insurance (2): motor 10d left, motor expired 5d ago
     - Government IDs (1): aadhaar
     - Legal (1): will
     - Investments (1): FD
   - Each card shows title, expiry date, and badge
   - Expired doc (motor) has red "Expired 5d ago" badge
   - 10-day doc has amber "10d left" badge

**Verify**:
- ✓ Documents grouped correctly by category
- ✓ Expiry badges showing correct urgency colors
- ✓ No missing documents

---

#### Step 1.5: Trigger Alert Generation (Cron)
The alert cron runs at 01:30 UTC, but we can manually trigger it for testing.

Via the API (using Postman or curl):
```bash
POST http://localhost:5000/api/alerts/sweep
Cookie: kutumb_token=[your_token_here]
```

Or wait until the next scheduled run.

**Expected**: Alerts created for Motor Insurance docs based on Phase 3 rules.

---

#### Step 1.6: Check Feed (With Alerts)
1. Go back to /feed
2. Click refresh or wait 5 seconds
3. **Expected** (assuming alert sweep ran):
   - Score changed (from 0 to ~40-50)
   - Feed now shows alert sections:
     - 🚨 **Overdue**: Old motor insurance (expired 5 days ago)
     - **This Week**: Motor insurance (10 days, possibly in this week depending on rules)
     - **This Month**: Depends on alert triggers
     - **Upcoming**: FD and property alerts if they exist

**Verify**:
- ✓ Score increased (now counting vault coverage + family access 0 + doc health penalties)
- ✓ Alert cards show:
  - Category emoji (🛡️ for insurance)
  - Human-readable message ("Motor insurance for Maruti Swift expires in 10 days")
  - Expiry time badge
  - Document title
  - "View document" button (orange)
  - "Done" button (green)
  - "✕" dismiss button
- ✓ Alerts sorted by urgency within each bucket

**Expected Score Breakdown** (rough estimates):
```
Vault Coverage: 40/40 (Property ✓, Insurance ✓, Gov IDs ✓, Legal ✓, Investments ✓)
Document Health: ~20/30 (penalties for 1 expired -3, 1 critical -5, = 15 left, but health only deducts what's applicable)
Family Access: 0/20 (only 1 member)
Critical Documents: 10/10 (Legal ✓, Investments ✓)
Total: ~50-60/100 (exact depends on alert rules and penalties)
```

---

#### Step 1.7: Test Alert Actions
1. On /feed, find the overdue alert (old motor insurance)
2. Click "Done" button
3. **Expected**: Alert disappears from feed, count decreases, score updates silently
4. Find another alert (e.g., 10-day insurance)
5. Click "✕" (dismiss)
6. **Expected**: Alert disappears, marked as dismissed

**Verify**:
- ✓ Buttons show loading spinner during request
- ✓ Alert removes immediately from UI (optimistic update)
- ✓ No errors shown
- ✓ Score may update (if dismissing changed scoring)

---

### PART 2: Person A Invites Person B

#### Step 2.1: Go to Family Page
1. Click Navbar → Family page (/family)
2. **Expected**:
   - "The Sharma Family" card
   - "Members (1)" — shows Rahul Sharma (Owner)
   - "Invite a family member" section
   - Invite code displayed (e.g., "V1StGXR8_Z")
   - "Copy" button
   - "Expires in 7 days" label

**Verify**:
- ✓ All information displays correctly
- ✓ "Copy" button works (click it, should see "✓ Copied" for 2 seconds)

---

#### Step 2.2: Copy Invite Code
1. Click "Copy" button
2. **Expected**: Button shows "✓ Copied" for 2 seconds, then reverts to "Copy"
3. Code is now in clipboard

---

### PART 3: Person B Joins Family

#### Step 3.1: Logout Person A
1. Click Navbar → Logout
2. **Expected**: Redirected to /login

---

#### Step 3.2: Signup as Person B (In Incognito/New Browser)
1. Open incognito window or new browser
2. Navigate to http://localhost:3000/signup
3. Tab: "Join with invite"
4. Form:
   - Name: Priya Sharma
   - Email: priya@test.com
   - Password: SecurePass123!
   - Invite code: [Paste the code from step 2.2]
5. Click "Join family"
6. **Expected**: Redirected to /feed for "The Sharma Family"

**Verify**:
- ✓ Same family, same documents visible
- ✓ Score now updated to ~60-70/100 (family access +20)
- ✓ Top hint in score changed from "Invite spouse" to next gap

---

#### Step 3.3: Verify Shared Vault
1. On /feed, click Vault
2. **Expected**: All 6 documents visible (same as Person A)
   - Can view all documents
   - Can add new documents
   - Can edit/delete (depending on permissions)

**Verify**:
- ✓ All 6 docs visible to both members
- ✓ No confusion about who uploaded what

---

#### Step 3.4: Check Score (Person B)
1. On /feed
2. **Expected**: Score ~60-70/100 (increased from when Person A was alone)
3. Top hint changed to reflect new highest gap

**Verify**:
- ✓ Score reflects family-level state (all docs, 2 members)
- ✓ Not per-member (both see same score)

---

### PART 4: Cross-Member Actions

#### Step 4.1: Person B Adds Document
1. Still in Person B's session
2. Go to Vault, click "+ Add"
3. Add a Health Insurance document:
   - Category: Insurance
   - Title: Health Insurance - Nykaa Wellness
   - Issue date: 2024-01-01
   - Expiry date: [Today + 45 days]
   - File: Upload any PDF
4. Click "Add document"
5. **Expected**: New doc appears in Vault

---

#### Step 4.2: Person A Sees Person B's Document
1. Switch back to Person A's session (or login again)
2. Go to Vault
3. **Expected**: New health insurance doc is visible

**Verify**:
- ✓ Cross-member document visibility working
- ✓ Real-time sync (or at least fresh on reload)

---

### PART 5: Error Handling Tests

#### Step 5.1: Test Network Error Handling
1. Open DevTools (F12)
2. Go to Network tab
3. Throttle to "Slow 3G" or higher latency
4. Try to load /feed
5. **Expected**: Page loads with visible loading states, then content
6. If throttle causes timeout:
   - Should see specific error message: "Request timed out. Check your connection and try again."
   - Retry button available

**Verify**:
- ✓ No generic "Something went wrong"
- ✓ Specific, actionable error message

---

#### Step 5.2: Test Session Expiry
1. In DevTools → Application tab → Cookies
2. Delete the "kutumb_token" cookie
3. Try to navigate to /feed
4. **Expected**: Redirected to /login with message about expired session

**Verify**:
- ✓ Clean session expiry handling
- ✓ No error traces exposed

---

#### Step 5.3: Test Offline Detection
1. In DevTools → Network → Offline (checkbox)
2. Try to perform an action (e.g., load feed, add document)
3. **Expected**: Offline alert appears at bottom of screen
4. Turn network back on
5. **Expected**: Alert disappears

**Verify**:
- ✓ Offline detection working
- ✓ User-friendly message

---

### PART 6: Mobile Responsiveness

#### Step 6.1: Test at 360px (Smallest Android)
1. Open DevTools (F12)
2. Device toolbar: Custom 360x800
3. Test each page:
   - /login: Form still usable, buttons clickable, text readable
   - /signup: Both tabs clickable, form fields stack vertically
   - /feed: Score widget visible, alert cards readable, buttons at least 44px tall
   - /vault: Category sections visible, document cards clickable
   - /family: Invite code section visible, copy button usable

**Verify**:
- ✓ No horizontal scrolling needed
- ✓ Touch targets (buttons) are 44px+ (accessibility)
- ✓ Text is readable (no tiny fonts)
- ✓ Form inputs are properly sized

---

#### Step 6.2: Test at 375px (iPhone SE)
1. Device toolbar: 375x667
2. Repeat page tests
3. **Expected**: Same quality as 360px

---

#### Step 6.3: Test at 412px (Larger Android)
1. Device toolbar: 412x915
2. Repeat page tests
3. **Expected**: Same quality, possibly better spacing

---

### PART 7: Verify MVP Launch Bar

> "A stranger — or your co-founder, without you explaining anything — could sign up, create a family, invite a second member, add documents, and understand the feed and score on their own."

#### Step 7.1: Stranger Signup
1. Fresh incognito window
2. No prior knowledge of the app
3. Navigate to http://localhost:3000
4. **Expected**: Can infer how to proceed (login or signup link visible)

**Verify**:
- ✓ Clear CTA: "Create an account" or "Sign in"
- ✓ Signup page obvious next step

---

#### Step 7.2: Create Family (Stranger Flow)
1. Click "Create an account"
2. **Expected**: Form is self-explanatory (Name, Email, Password, Family name)
3. Can infer password strength from indicator
4. Can understand "Create a family" tab

**Verify**:
- ✓ Each field has clear label
- ✓ Placeholder text is helpful
- ✓ Password strength indicator visible and clear

---

#### Step 7.3: Vault & Documents (Stranger Flow)
1. After signup, logged in to /feed
2. Click "Vault"
3. Empty state says "Your vault is empty"
4. "Add your first document" button is obvious
5. **Expected**: Stranger clicks button, form appears

**Verify**:
- ✓ Empty state is inviting, not confusing
- ✓ CTA button is prominent
- ✓ Form is easy to understand (Category dropdown, Title field, Date fields, File upload)

---

#### Step 7.4: Feed & Score (Stranger Flow)
1. After adding documents, return to /feed
2. **Expected**: 
   - Score widget with circular ring is visually striking
   - "Inheritance Readiness" label explains what score is
   - Score band ("Well prepared", "Mostly ready", etc.) is self-explanatory
   - Top hint ("Add your X to reach Y") guides next action
3. Alerts section shows pending renewals
4. Alert card message is human-readable (not a raw JSON dump)

**Verify**:
- ✓ No technical jargon
- ✓ Icons (🛡️ for insurance, etc.) are intuitive
- ✓ Colors (red = urgent, amber = warning, green = ready) make sense
- ✓ Stranger could use without manual

---

#### Step 7.5: Invite Flow (Stranger Flow)
1. Stranger clicks "Family" page
2. Sees invite code section
3. Clicks "Copy" to copy code
4. **Expected**: Can describe to friend: "Share this code, they sign up and paste it"

**Verify**:
- ✓ Invite code prominently displayed
- ✓ "Copy" button obvious
- ✓ "Anyone who signs up with it will join your family" text is clear

---

---

## Test Completion Checklist

- [ ] All 6 documents added successfully
- [ ] Alerts generated correctly (overdue, this week, etc.)
- [ ] Score calculated correctly (both members see same family score)
- [ ] Alert actions (Done, Dismiss) working
- [ ] Person B joined family and sees all data
- [ ] Mobile responsive at 360px, 375px, 412px
- [ ] Error messages are specific and helpful
- [ ] Network error handling works
- [ ] Session expiry redirects cleanly
- [ ] Offline detection shows alert
- [ ] Stranger could use app without guidance

---

## Known Limitations (Acceptable for MVP)

1. **Score doesn't update in real-time** when deleting documents in Vault — refresh feed to see new score
2. **Invite code is 7 days** — after that, family owner must generate new code
3. **File uploads max 20 MB** — adequate for document scans, but not for videos
4. **No per-member engagement tracking** — score is family-level only
5. **No email notifications** — alerts only visible in app

---

## Success Criteria

**MVP Launch Ready if:**
- ✓ All tests above pass
- ✓ No raw error messages shown to user
- ✓ App works smoothly on mobile (360-412px)
- ✓ A stranger could onboard without explanation
- ✓ Feed and score are self-explanatory
- ✓ Two-member family flow works end-to-end

---
