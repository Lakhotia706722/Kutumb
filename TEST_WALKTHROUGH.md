# Phase 6 Manual E2E Test Walkthrough

## Environment
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Date: 2026-07-09

## Test Scenarios

### 1. User Signup Flow with Validation
**Steps:**
1. Open http://localhost:3000
2. Click "Sign Up"
3. Fill form:
   - Name: "Test User 1"
   - Email: "testuser1@test.com"
   - Password: "Test@123456" (watch strength indicator turn green)
   - Family Code: (leave empty - new family)
4. Submit
5. **Expected:** Redirected to /family page, success toast shown

**Validation Points:**
- [ ] Password strength indicator shows real-time feedback
- [ ] No stack traces in errors (UI-facing messages only)
- [ ] Form validates email format, password length

---

### 2. Already-Logged-In Redirect
**Steps:**
1. While logged in, navigate to http://localhost:3000/signup
2. **Expected:** Redirected to /family page

**Validation Points:**
- [ ] No signup form shown if already logged in
- [ ] Smooth redirect (no flash of signup page)

---

### 3. Family Page - Initial Load with Skeleton
**Steps:**
1. Navigate to http://localhost:3000/family (while logged in)
2. **Expected:** Skeleton loaders show briefly, then real data appears

**Validation Points:**
- [ ] Skeleton cards animate (4px pulse animation visible)
- [ ] Family name displays after load
- [ ] Invite code displayed (active, not expired)
- [ ] Members list shows current user as "Owner"

---

### 4. Invite Code - Copy & Regenerate
**Steps:**
1. On family page, click "Copy" button next to invite code
2. **Expected:** Button changes to "✓ Copied" for 2s, code in clipboard
3. Click "Generate a new code" (Owner only action)
4. **Expected:** New code generated, expiry reset to 30 days

**Validation Points:**
- [ ] Copy works (test by pasting elsewhere)
- [ ] Regenerate only available to Owner
- [ ] Expiry date updates after regenerate
- [ ] UI never exposes full error stack

---

### 5. Add Documents with File Validation
**Steps:**
1. Navigate to http://localhost:3000/vault
2. Click "Add Document"
3. Upload a PDF file:
   - Title: "Birth Certificate"
   - Type: "Identity"
   - Date: "2020-01-15"
4. **Expected:** File validates (type, size), uploads, appears in vault
5. Try uploading wrong file type (e.g., .txt)
6. **Expected:** Client-side validation message shown

**Validation Points:**
- [ ] File type validation works (only PDF allowed by default)
- [ ] File size validation shown (e.g., "Max 10MB")
- [ ] "Uploading…" state shows during upload
- [ ] Document appears in vault after success
- [ ] Dates stored in ISO format

---

### 6. Feed Page - Loading Skeleton & Alerts
**Steps:**
1. Navigate to http://localhost:3000/feed
2. **Expected:** Skeleton loaders appear briefly
3. Score widget shows (if expiry alerts exist)
4. Feed cards show document-expiry alerts
5. Add more documents with near-future expiry dates
6. Refresh page
7. **Expected:** Alerts appear in feed (recalculated by alert engine)

**Validation Points:**
- [ ] Skeleton shows score widget + 3 alert card placeholders
- [ ] Real alerts populate after load
- [ ] Alerts show correct document name, days until expiry
- [ ] Score widget displays overall family expiry score
- [ ] Alert cron ran at startup (check backend logs)

---

### 7. Error States & Retry
**Steps:**
1. Stop backend server (kill process)
2. Click refresh on frontend
3. **Expected:** Error message with "Retry" button
4. Restart backend
5. Click "Retry"
6. **Expected:** Data reloads successfully

**Validation Points:**
- [ ] Error UI shows user-friendly message (not stack trace)
- [ ] Retry button works
- [ ] No console errors (check DevTools)
- [ ] Session persists (auth token in localStorage)

---

### 8. Security - Rate Limiting on Auth
**Steps:**
1. Open DevTools Console
2. Rapidly submit login form 15+ times
3. **Expected:** 429 Too Many Requests after 10 attempts in 15 min window

**Validation Points:**
- [ ] Rate limiting enforced on auth routes
- [ ] Clear error message shown to user
- [ ] Backend logs rate limit hit

---

### 9. Security - CSP Headers
**Steps:**
1. Open DevTools Network tab
2. Inspect response headers on any request
3. **Expected:** `Content-Security-Policy` header present in production config

**Validation Points:**
- [ ] CSP header blocks eval (security)
- [ ] CSP allows `'unsafe-inline'` for styles (PWA requirement)
- [ ] No eval errors in console for legitimate styles

---

### 10. Mobile - Safe Area & Font Size
**Steps:**
1. Open DevTools → Device Toolbar (e.g., iPhone 12)
2. Notch visible (simulated)
3. **Expected:** Content respects safe area (no text under notch)
4. Input fields are 16px font (prevents iOS zoom on focus)
5. Test on landscape orientation

**Validation Points:**
- [ ] Padding applied on notched devices
- [ ] Input font 16px (check DevTools Computed styles)
- [ ] No layout shifts in landscape
- [ ] Bottom sheet doesn't overlap safe area

---

## Test Results Summary

| Scenario | Status | Notes |
|----------|--------|-------|
| Signup with strength indicator | ⚪ | Pending |
| Already-logged-in redirect | ⚪ | Pending |
| Family page skeleton & data | ⚪ | Pending |
| Invite code copy & regenerate | ⚪ | Pending |
| Document upload & validation | ⚪ | Pending |
| Feed alerts & score | ⚪ | Pending |
| Error retry | ⚪ | Pending |
| Rate limiting | ⚪ | Pending |
| CSP headers | ⚪ | Pending |
| Mobile safe area & inputs | ⚪ | Pending |

---

## Notes
- All tests assume MongoDB running locally
- Backend logs alert cron at startup (check for "Alert Sweep")
- Frontend build has zero TypeScript errors (verified)
- Rate limit window: 15 minutes per IP
- Invite code expiry: 30 days

---

## Manual Test Checklist (Do This Now)

1. **Signup:** New user → family creation
2. **Copy Invite Code:** Verify clipboard
3. **Add 2-3 Documents:** With various expiry dates
4. **Check Feed:** Alerts appear, score calculates
5. **Simulate Error:** Kill backend, retry
6. **Check Headers:** CSP in DevTools
7. **Mobile Test:** Safe area respected

---
