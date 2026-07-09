# Phase 6 — Quick Start Testing Reference

## Servers Status
```
Backend:  http://localhost:5000/api/health ✅
Frontend: http://localhost:3000 ✅
MongoDB:  Connected ✅
```

## Test Credentials

### Test User 1 (Create Family)
```
Name:     Test User 1
Email:    testuser1-<date>@test.com (unique)
Password: Test@123456 (watch strength indicator turn green)
Family:   The Test Family
```

### Test User 2 (Join Family with Invite)
```
Name:     Test User 2
Email:    testuser2-<date>@test.com
Password: Test@Secure123
Invite:   [Copy from family page of Test User 1]
```

## Test Document Sample
```
Title:      Birth Certificate
Category:   Government IDs
Issue Date: 2015-01-15
Expiry:     2025-01-15 (will trigger alert)
File:       Any PDF file
```

---

## Testing Checklist (Quick Version)

### ✅ Test 1: Signup (3 min)
- [ ] Go to http://localhost:3000
- [ ] Click Sign Up → Create family
- [ ] Fill form → Watch password strength bar (green = strong)
- [ ] Submit → Redirected to /family

### ✅ Test 2: Redirect (1 min)
- [ ] While logged in, visit /signup
- [ ] Verify: Redirected to /feed (not signup form)

### ✅ Test 3: Family Page Skeleton (2 min)
- [ ] Go to /family → Refresh
- [ ] Watch 3 skeleton cards animate
- [ ] Real data appears after ~1s

### ✅ Test 4: Invite Code (2 min)
- [ ] Copy invite code (button shows "✓ Copied")
- [ ] Paste into Notepad (verify it's there)
- [ ] Check expiry: "Expires in 30 days"

### ✅ Test 5: Regenerate Code (1 min)
- [ ] Click "Generate a new code" (owner only)
- [ ] New code appears
- [ ] Expiry resets to 30 days

### ✅ Test 6: Document Upload (3 min)
- [ ] Go to /vault → "+ Add"
- [ ] Fill form + select PDF
- [ ] Watch "Uploading…" state
- [ ] Document appears in vault

### ✅ Test 7: Feed & Alerts (3 min)
- [ ] Go to /feed → Refresh
- [ ] Watch skeleton load (score widget + 3 cards)
- [ ] Real alerts appear
- [ ] Birth certificate shows in "🚨 Overdue" (past date)

### ✅ Test 8: Error & Retry (3 min)
- [ ] Stop backend (Ctrl+C in terminal)
- [ ] Refresh /feed
- [ ] See error message + "Retry" button
- [ ] Restart backend
- [ ] Click Retry → Data reloads

### ✅ Test 9: Mobile Layout (2 min, optional)
- [ ] DevTools → Device Toolbar (iPhone 12)
- [ ] Rotate to landscape
- [ ] Check: No content under notch, inputs 16px

### ✅ Test 10: Security Headers (1 min, optional)
- [ ] DevTools → Network tab
- [ ] Inspect response headers
- [ ] Look for `Content-Security-Policy`

### ✅ Test 11: No Console Errors (2 min)
- [ ] DevTools → Console tab
- [ ] Navigate between pages
- [ ] Check: No red errors, no stack traces

### ✅ Test 12: Rate Limiting (5 min, advanced)
- [ ] Go to /login
- [ ] DevTools → Console
- [ ] Paste & run rate limit test code (see MANUAL_TEST_GUIDE.md)
- [ ] Verify: 429 after 10 attempts

---

## Expected Outcomes

| Test | Expected | Status |
|------|----------|--------|
| 1. Signup | Redirected to /family, password indicator works | ⏳ |
| 2. Redirect | Not shown signup form | ⏳ |
| 3. Skeleton | 3 animated skeleton cards | ⏳ |
| 4. Copy Code | Code copied to clipboard, button feedback | ⏳ |
| 5. Regenerate | New code, expiry reset | ⏳ |
| 6. Upload Doc | Document in vault, no errors | ⏳ |
| 7. Alerts | Overdue alert shows, score calculates | ⏳ |
| 8. Retry | Error message + retry, data reloads | ⏳ |
| 9. Mobile | Layout respects safe area, inputs 16px | ⏳ |
| 10. Headers | CSP header present | ⏳ |
| 11. Console | No red errors, no stack traces | ⏳ |
| 12. Rate Limit | 429 after 10 attempts | ⏳ |

---

## Troubleshooting Quick Fixes

### "Email already exists"
→ Use different email (add `-1`, `-2`, etc.)

### Blank page after signup
→ Check console for errors (DevTools F12)

### Skeleton doesn't show
→ Refresh page or network throttle in DevTools

### Document won't upload
→ Ensure file is PDF, < 10MB, backend running

### No alerts on feed
→ Check document has expiry date set, refresh page

### Retry button doesn't work
→ Check backend is running (`npm run dev` in /backend)

### Rate limiting test fails
→ Use `localhost:5000`, not proxy, 10+ rapid attempts

---

## Key Shortcuts

| Action | Shortcut |
|--------|----------|
| Hard refresh | Ctrl+Shift+R |
| DevTools | F12 |
| Console tab | Ctrl+Shift+J |
| Network tab | Ctrl+Shift+E |
| Device toolbar | Ctrl+Shift+M |
| Rotate device | Ctrl+Shift+M (toggle) |

---

## URL Cheat Sheet

```
Signup:    http://localhost:3000/signup
Login:     http://localhost:3000/login
Feed:      http://localhost:3000/feed
Vault:     http://localhost:3000/vault
Family:    http://localhost:3000/family
Health:    http://localhost:5000/api/health
```

---

## Time Estimate

| Phase | Time |
|-------|------|
| Tests 1-5 | ~10 min |
| Tests 6-8 | ~10 min |
| Tests 9-11 | ~5 min (optional: 2 min) |
| Test 12 | ~5 min (advanced) |
| **Total** | **~30-45 min** |

---

## Success Criteria (All Pass)

✅ All 8 required tests pass (1-8)  
✅ No red errors in console  
✅ No stack traces exposed  
✅ Retry buttons work  
✅ Skeletons animate  
✅ Mobile layout OK  

**When all pass:** MVP ready for deployment ✅

---

## Next: After Testing

1. Document any issues in a new file (e.g., `ISSUES_FOUND.md`)
2. If all pass: Ready for production deployment
3. If any fail: Fix and retest that scenario
4. Celebrate 🎉

---

**Ready to test? Open MANUAL_TEST_GUIDE.md and start with Test 1.**

---
