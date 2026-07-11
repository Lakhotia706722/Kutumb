# PHASE 6 — Polish, Edge Cases, and MVP Hardening — AUDIT

## Current State Assessment

### ✅ What's Already Solid

1. **Mobile Responsiveness**
   - Layout uses Tailwind (responsive classes: `grid-cols-1 sm:grid-cols-2`, `px-4`)
   - Max-width container: `max-w-2xl w-full mx-auto`
   - Safe area padding: `pb-safe` (iOS home indicator)
   - Forms stack on small screens

2. **Input Validation**
   - Signup: Name, email format, password length (8+ chars), required fields
   - Login: Email + password required
   - Document form: Title required, file type/size, date order (issue < expiry)
   - Invite code: Alphanumeric validation

3. **Error Handling (Forms)**
   - Signup/login: Clear error messages
   - Document upload: File type/size validation
   - Password strength indicator
   - Form validation before submission

4. **Loading States**
   - Buttons show spinner during async operations
   - Button disabled while loading
   - Loading text changes (e.g., "Uploading...", "Signing in...")

5. **Session Management**
   - httpOnly cookies (secure against XSS)
   - JWT expiration: 7 days
   - 401 response redirects to login (via API interceptor)
   - Logout clears cookie

6. **File Upload**
   - Size limit: 20 MB (enforced server + client)
   - Allowed types: PDF, JPG, PNG (validated server + client)
   - Multer error handling
   - File filter middleware

7. **Error Boundary**
   - Catches render errors, prevents blank screen
   - Shows user-friendly message with refresh button

---

## Gaps Identified (Phase 6 To-Dos)

### 1. Cookie Settings ⚠️ FOUNDER DECISION NEEDED
**Current State**:
```javascript
sameSite: isProduction ? 'none' : 'lax',
secure: isProduction,
```

**Issue**: `sameSite: 'none'` requires `secure: true`, but this might cause issues if:
- Frontend is HTTPS but API is HTTP (mixed content)
- Cross-origin cookie sending isn't properly configured
- CORS policy is too restrictive

**Decision Needed**:
- Option A: Keep `sameSite: 'lax'` in production (more restrictive but safer)
- Option B: Set `sameSite: 'strict'` for first-party requests only
- Option C: Implement specific CORS whitelist + `sameSite: 'none'` + `secure: true`

---

### 2. File Upload Error Messages 🔧 IMPROVEMENT
**Current State**:
- Server returns generic "Something went wrong" or multer error
- Client catches error and shows it in alert

**Missing**:
- Specific error for file too large: "File is too large (Max 20 MB)"
- Network failure during upload: "Upload failed — check your connection"
- Server error: "Upload failed — please try again"

---

### 3. Network Error Handling 🔧 IMPROVEMENT
**Current State**:
- API interceptor catches 401, redirects to login
- Generic error messages on timeout/network failure

**Missing**:
- Specific message for network timeout
- Offline detection (navigator.onLine check)
- Retry button on network errors
- Exponential backoff on retries

---

### 4. Feed/Page Loading States 🔧 IMPROVEMENT
**Current State**:
- Feed shows skeleton cards while loading
- Vault shows skeleton cards while loading
- Family page shows skeleton while loading

**Missing**:
- Smooth transitions between skeleton → content
- "Loading..." text on navigation (next.js router events)
- Optimistic updates (e.g., add doc → show immediately, sync later)

---

### 5. Mobile Viewport Testing 📱 VERIFICATION NEEDED
**Current State**:
- Design assumes responsive layout
- No explicit testing at 360px, 375px, 412px

**To-Do**:
- Test signup form at 360px (smallest Android)
- Test vault document cards at 375px (iPhone SE)
- Test feed cards at 412px (larger Android)
- Check spacing, button sizes, readability
- Verify touch targets are 44px+ (accessibility)

---

### 6. Session Expiry UX 🔧 IMPROVEMENT
**Current State**:
- 401 redirects to /login
- User loses current page context

**Better**:
- Show inline warning: "Your session has expired. Please log in again."
- Redirect after user closes warning (or on next action)
- Optional: Store pre-login URL to redirect back post-login

---

### 7. Form Error States 🔧 IMPROVEMENT
**Current State**:
- Error shown below form
- Required fields not visually highlighted

**Better**:
- Highlight invalid field (border color)
- Show error directly on field (tooltip or message)
- Focus first invalid field on submit

---

### 8. Validation Error Types 🔧 IMPROVEMENT
**Current State**:
- Generic validation errors: "Please enter a valid email address"

**Better**:
- Clear, actionable errors: "Email already in use — try logging in instead"
- Distinguish between:
  - Client-side validation (format)
  - Server-side validation (duplicate, not found)
  - Network errors (timeout, offline)
  - Server errors (500)

---

### 9. End-to-End Manual Test 🧪 TEST REQUIRED
**Scenario**: Two-person family flow

**Prerequisites**:
- Fresh browser session
- Fresh test emails
- Network connection

**Steps**:
1. Signup as person A (create family)
2. Create 5-6 documents:
   - Property (expires in 90 days)
   - Insurance (expires in 10 days) — critical
   - Insurance (expired 5 days ago) — overdue
   - Government ID (no expiry)
   - Legal document (will)
   - Investment (FD, expires in 60 days)
3. Verify feed:
   - Overdue section (1 doc)
   - This Week section (1 doc)
   - This Month section (1 doc)
   - Upcoming section (3 docs)
4. Verify score:
   - Vault Coverage: 5/10 (Property, Insurance, Legal, Investments present; Gov IDs missing)
   - Document Health: Penalties applied (expired: -3, critical: -5)
   - Family Access: 0/20 (only 1 member)
   - Critical Documents: 10/10 (legal ✓, investments ✓)
   - Expected total: ~40/100
5. Invite person B (copy code)
6. Logout, open new browser (incognito)
7. Signup as person B (join family with code)
8. Verify:
   - Can see all 6 docs
   - Can add new doc
   - Score updated (now 60/100 — family access +20)
9. Test actions:
   - Resolve critical alert (should disappear)
   - Dismiss overdue alert (should disappear)
   - Delete expired doc (should decrease score)

---

## File Size & Type Limits — Founder Decision Needed ⚠️

**Current**:
- Max file size: 20 MB
- Allowed types: PDF, JPG, PNG

**Question**: With full flow now built, should these change?

**Considerations**:
- Storage cost (local disk vs S3)
- User experience (upload speed on mobile)
- Document types (most insurance/property docs are < 5 MB)
- Accessibility (could we auto-compress JPG?)

**Recommendation**: Keep 20 MB for MVP (generous for document scans), revisit after measuring actual usage.

---

## Summary of Action Items

- [ ] Implement file upload error categorization (size, type, network)
- [ ] Add network error handling + offline detection
- [ ] Enhance session expiry UX (inline warning instead of silent redirect)
- [ ] Test mobile viewports (360px, 375px, 412px)
- [ ] Verify form error highlighting
- [ ] Run end-to-end manual test (2-person family)
- [ ] Document cookie settings decision
- [ ] Confirm file size/type limits with founder

---
