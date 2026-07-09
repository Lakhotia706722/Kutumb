# Phase 6 Manual E2E Test Guide

## Prerequisites
- Both servers running (backend on 5000, frontend on 3000)
- MongoDB connected and running
- DevTools available (Chrome/Firefox)
- Fresh browser session recommended

---

## Test 1: Signup with Password Strength Indicator
**Goal:** Verify signup form, password strength indicator, and family creation  
**Time:** ~3 minutes

### Steps
1. **Open** http://localhost:3000 in browser
2. **Click** "Sign Up" tab
3. **Verify** two buttons: "Create a family" | "Join with invite"
4. **Select** "Create a family" (should be default)
5. **Fill form:**
   - Name: `Test User 1`
   - Email: `testuser1-date-today@test.com` (unique for each run)
   - Password: Start typing `Test` → watch strength indicator
   - Password complete: `Test@123456` → Should show **Strong** (green bar full)
   - Family Name: `The Test Family`
6. **Watch password strength indicator:**
   - `Test` → Red (weak, too short)
   - `Test123` → Amber (medium, has uppercase + number)
   - `Test@123456` → Green (strong, has uppercase + number + symbol)
7. **Click** "Create family & account"
8. **Wait** 2-3 seconds for signup/login

### Expected Results
- ✅ Redirected to `/family` page
- ✅ Success toast shown (or URL changed)
- ✅ Password strength indicator worked in real-time
- ✅ No error messages
- ✅ No console errors (check DevTools)

### Notes
- If you get "Email already exists", use a different email (add `-1`, `-2`, etc.)
- Password must be 8+ characters, 1+ uppercase, 1+ number recommended

---

## Test 2: Already-Logged-In Redirect
**Goal:** Verify logged-in users can't access signup/login pages  
**Time:** ~1 minute

### Steps
1. **While still logged in**, open a new tab
2. **Navigate** to http://localhost:3000/signup
3. **Observe** page behavior

### Expected Results
- ✅ **NOT** redirected to /login (you're already logged in)
- ✅ **Redirected** to `/feed` OR `/family` (depends on route)
- ✅ Signup form **not visible**
- ✅ No console errors

### Variations
- Try `/login` → should also redirect away
- Try `/family` → should load (you're authorized)

---

## Test 3: Family Page - Skeleton Loading
**Goal:** Verify loading skeleton state, then real data  
**Time:** ~2 minutes

### Steps
1. **Go to** http://localhost:3000/family (you're already here)
2. **Watch** for loading state
3. **Refresh** page (Ctrl+R)
4. **Observe** loading animation

### Expected Results
- ✅ **3 skeleton cards** appear briefly (animated pulse effect)
- ✅ Each skeleton has a header bar + content bar
- ✅ After ~1 second, skeleton fades and real data appears
- ✅ Family name: "The Test Family"
- ✅ Members: Shows "Test User 1" (Owner)
- ✅ Invite code visible (alphanumeric, ~10 chars)
- ✅ No spinner shown (skeleton instead)

### DevTools Check
- Open DevTools → Elements
- During load: `<div className="animate-pulse">` visible
- After load: Content visible, pulse classes gone

---

## Test 4: Invite Code - Copy & Expiry
**Goal:** Verify clipboard copy and expiry display  
**Time:** ~2 minutes

### Steps
1. **On Family page**, locate invite code section (bottom)
2. **Note** the invite code (e.g., `V1StGXR8_Z`)
3. **Click** the "Copy" button next to the code
4. **Observe** button text change
5. **Check** clipboard:
   - Open Notepad (or any text editor)
   - Paste (Ctrl+V)
   - Verify code matches what was shown

### Expected Results
- ✅ Button shows "✓ Copied" immediately
- ✅ Button returns to "Copy" after 2 seconds
- ✅ Clipboard contains exact code
- ✅ Expiry message shows: "Expires in 30 days" or similar
- ✅ If expired: "Expired"

### (Owner Only) Test 5: Regenerate Invite Code
**Steps**
1. **Scroll down** on Family page
2. **Find** "Generate a new code" button (visible because you're Owner)
3. **Click** it
4. **Wait** for request to complete
5. **Observe** new code appears
6. **Verify** expiry date is reset

### Expected Results
- ✅ New code generated (different from previous)
- ✅ "Expires in 30 days" shows again
- ✅ Button shows loading spinner during request
- ✅ Error message (if any) is user-friendly

---

## Test 6: Add Document with Validation
**Goal:** Verify file upload, validation, and error states  
**Time:** ~3 minutes

### Steps
1. **Go to** http://localhost:3000/vault
2. **Click** "+ Add" button
3. **Fill form:**
   - Title: `Birth Certificate`
   - Category: `Government IDs`
   - Issue Date: `2015-01-15`
   - Expiry Date: `2025-01-15` (in the past, will trigger alert)
4. **Choose file:** Select any PDF file from your computer
5. **Click** "Upload document"
6. **Watch** upload progress

### Expected Results
- ✅ "Uploading…" state visible during upload
- ✅ File uploaded successfully
- ✅ Document appears in vault
- ✅ No console errors
- ✅ Redirect to vault list (modal closes)

### File Validation Test
1. **Try to upload a non-PDF** (e.g., `.txt`, `.jpg`)
2. **Observe** error message

### Expected Results
- ✅ Client-side validation message shown: "Only PDF files are allowed" (or similar)
- ✅ Upload button disabled or form prevented
- ✅ No request sent to backend
- ✅ Clear error message to user

---

## Test 7: Feed Page - Skeleton & Alerts
**Goal:** Verify skeleton loading, score widget, and alerts  
**Time:** ~3 minutes

### Steps
1. **Go to** http://localhost:3000/feed
2. **Refresh** page to see loading state
3. **Observe** skeleton loading
4. **Wait** for real data to appear

### Expected Results (Loading)
- ✅ **Score widget skeleton** appears (large circle placeholder)
- ✅ **3 alert card skeletons** appear below
- ✅ All skeletons pulse with animation
- ✅ After ~1 second, real data appears

### Expected Results (Loaded)
- ✅ **Score widget visible** (shows family health score)
- ✅ **Feed sections appear:**
   - 🚨 Overdue (red, past expiry date)
   - This Week (next 7 days)
   - This Month (8-30 days)
   - Upcoming (31-90 days)
- ✅ **Document expiry alerts** show:
   - Document name
   - Days until expiry
   - Action buttons (Resolve/Dismiss)

### Verify Alerts
- Check document added in Test 6:
  - Title: "Birth Certificate"
  - Expiry: "2025-01-15" (now in past/near-past)
  - Should appear in "🚨 Overdue" section

---

## Test 8: Error State & Retry
**Goal:** Verify error handling and retry functionality  
**Time:** ~3 minutes

### Steps (Option A: Throttle Network)
1. **Open DevTools** → Network tab
2. **Set throttling** to "Slow 3G"
3. **Refresh** /feed or /vault page
4. **Quickly** look at page before data loads
5. **Observe** error message (optional depending on timing)

### Steps (Option B: Stop Backend)
1. **In terminal**, find backend process (npm run dev)
2. **Press Ctrl+C** to stop backend (once you see output)
3. **Refresh** frontend page (in browser)
4. **Observe** error message

### Expected Results
- ✅ **Error message displayed** on page:
  - Not a stack trace
  - User-friendly message: "Could not load [data]. Please try again."
  - OR "Connection failed"
- ✅ **"Retry" button visible** in red error box
- ✅ **Button is clickable**
- ✅ **No console errors** (check DevTools)

### Steps (Verify Retry)
1. **Restart backend** (run `npm run dev` again, wait for "listening on port 5000")
2. **Click "Retry" button** on frontend
3. **Wait** for data to reload

### Expected Results
- ✅ **Page reloads successfully**
- ✅ **Data appears** (alerts, documents, family, etc.)
- ✅ **Error message disappears**
- ✅ **No console errors**

---

## Test 9: Mobile Safe Area & Inputs
**Goal:** Verify mobile layout, safe area padding, and 16px inputs  
**Time:** ~3 minutes (optional)

### Steps
1. **Open DevTools** (F12)
2. **Click Device Toolbar** icon (top-left of DevTools)
3. **Select iPhone 12** from dropdown
4. **Rotate to landscape** (Ctrl+Shift+M or button)
5. **Observe** layout

### Expected Results (Safe Area)
- ✅ **No content hidden** behind notch
- ✅ **Text/buttons visible** in safe zones
- ✅ **Padding applied** around edges
- ✅ **Bottom sheet doesn't overlap** iOS home indicator

### Expected Results (Input Font Size)
1. **Open DevTools** → Elements tab
2. **Find any input field** on page (e.g., signup form)
3. **Right-click** → Inspect
4. **Check Computed tab** in DevTools
5. **Look for `font-size: 16px`**

### Expected Results
- ✅ **Input font size is exactly 16px** (prevents iOS zoom on focus)
- ✅ **Text readable** on mobile device
- ✅ **No horizontal scroll** in landscape

---

## Test 10: Security Headers (Optional)
**Goal:** Verify CSP and security headers  
**Time:** ~2 minutes

### Steps
1. **Go to** http://localhost:3000 (any page)
2. **Open DevTools** → Network tab
3. **Refresh** page
4. **Click on any request** (e.g., the HTML document)
5. **View Response Headers** section
6. **Look for CSP header**

### Expected Results (Development)
- ℹ️ CSP header **may not appear** in development mode
- This is OK — CSP is production-gated in code

### If Production Mode
- ✅ **`Content-Security-Policy` header present**
- ✅ Contains `default-src 'self'`
- ✅ No eval errors in console
- ✅ Styles load successfully (despite `'unsafe-inline'` in CSP)

---

## Test 11: TypeScript & No Console Errors
**Goal:** Verify no errors in DevTools console  
**Time:** ~1 minute

### Steps
1. **Open DevTools** → Console tab
2. **Navigate between pages** (Feed → Vault → Family → Feed)
3. **Perform user actions:**
   - Upload document
   - Copy invite code
   - Click refresh button
4. **Observe** console

### Expected Results
- ✅ **No red error messages**
- ✅ **No TypeError, SyntaxError, or similar**
- ✅ **No "Cannot read property" errors**
- ✅ Warnings OK (e.g., deprecation warnings)
- ✅ Logs OK (e.g., "logged in as X")

---

## Test 12: Rate Limiting (Advanced, Optional)
**Goal:** Verify rate limiting on auth endpoints  
**Time:** ~5 minutes

### Steps
1. **Go to** http://localhost:3000/login
2. **Open DevTools** → Console tab
3. **Run this code** (paste in console):
```javascript
for (let i = 0; i < 15; i++) {
  fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
  }).then(r => r.json()).then(d => console.log(`Attempt ${i+1}:`, d));
}
```
4. **Observe** responses

### Expected Results
- ✅ **Attempts 1-10:** `{ message: "Invalid credentials" }` (or similar auth error)
- ✅ **Attempt 11+:** `{ message: "Too many requests..." }` (429 status)
- ✅ **After 15 minutes:** Reset and can try again
- ✅ **Per-IP rate limit:** Different IP can still login

---

## Summary Checklist

| Test | Status | Notes |
|------|--------|-------|
| Signup with strength indicator | ⚪ | Run through Test 1 |
| Already-logged-in redirect | ⚪ | Run through Test 2 |
| Family page skeleton | ⚪ | Run through Test 3 |
| Invite code copy & expiry | ⚪ | Run through Test 4 |
| Invite code regenerate | ⚪ | Run through Test 5 (owner) |
| Document upload & validation | ⚪ | Run through Test 6 |
| Feed skeleton & alerts | ⚪ | Run through Test 7 |
| Error state & retry | ⚪ | Run through Test 8 |
| Mobile safe area & inputs | ⚪ | Run through Test 9 (optional) |
| Security headers | ⚪ | Run through Test 10 (optional) |
| No console errors | ⚪ | Run through Test 11 |
| Rate limiting | ⚪ | Run through Test 12 (advanced) |

---

## Troubleshooting

### Page shows blank screen
- Check DevTools Console for errors
- Verify backend is running (`npm run dev` in `/backend`)
- Check that port 5000 is accessible
- Try hard refresh (Ctrl+Shift+R)

### Signup fails with "Email already exists"
- Use a different email address (add `-1`, `-2`, etc.)
- Or wait and use `testuser-[timestamp]@test.com`

### Document upload fails
- Verify file is PDF
- Check file size < 10MB
- Verify backend is running
- Check DevTools Console for error message

### Invite code appears empty
- Refresh page
- Check if you have permission (logged-in user)
- Try regenerating code (owner only)

### Alerts don't appear on feed
- Verify document has expiry date set
- Expiry date should be soon (within 90 days)
- Check if document's expiry date is correctly parsed (YYYY-MM-DD)
- Wait a moment for alert cron to run (or restart backend)

### Rate limiting doesn't work
- Use `localhost:5000` (not a proxy or different IP)
- Verify `express-rate-limit` installed (`npm ls express-rate-limit`)
- Check backend logs for rate limit message

---

## When All Tests Pass

Once all tests complete successfully:

1. **Note the date/time** of completion
2. **Screenshot key pages** (if needed for documentation)
3. **Mark MVP as ready for production**
4. **Next phase:** Deployment to staging/production

**Phase 6 is complete when all manual tests pass with no errors.**

---
