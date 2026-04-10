# MournBit Testing Guide

Complete testing procedures for all user roles and features.

## Prerequisites
- Running `wrangler dev --local`
- Latest browser (Chrome, Firefox, Safari, Edge)
- Geolocation enabled (or allow on first use)

---

## 1. Authentication Testing

### Test 1.1: Marker Sign Up
1. Go to landing page
2. Click "Sign Up"
3. Select Role: **Marker**
4. Fill:
   - Username: `marker_test_1`
   - Full Name: `Test Marker`
   - Email: `marker@example.com`
   - Password: `TestPassword123`
5. Click "Sign Up"

**Expected Result**:
- ✅ Account created
- ✅ Redirected to Marker Dashboard
- ✅ Stats show 0 tickets generated
- ✅ Token stored in localStorage

### Test 1.2: Marker Login
1. Logout (top right)
2. Click "Login"
3. Enter email: `marker@example.com`
4. Enter password: `TestPassword123`
5. Click "Login"

**Expected Result**:
- ✅ Login successful
- ✅ Redirected to Marker Dashboard
- ✅ Previous stats restored

### Test 1.3: Authority Domain Validation
1. Click "Sign Up"
2. Select Role: **Authority**
3. Email: `invalid@example.com` (not @vdnry.com)
4. Click "Sign Up"

**Expected Result**:
- ❌ Error: "Authority users must use an authorized domain"

### Test 1.4: Authority Sign Up (Valid)
1. Click "Sign Up"
2. Select Role: **Authority**
3. Fill:
   - Username: `authority_test_1`
   - Full Name: `Test Authority`
   - Email: `admin@vdnry.com` ← Must be @vdnry.com
   - Password: `TestPassword123`
4. Click "Sign Up"

**Expected Result**:
- ✅ Authority account created
- ✅ Redirected to Authority Dashboard

---

## 2. Marker Dashboard Testing

### Test 2.1: Create Ticket
1. Login as Marker
2. Click "+ Create Ticket"
3. Modal appears

**Steps**:
- Click "Choose File" (upload any image)
- See preview
- Click "Get Current Location"
- See location updated: "📍 40.7128, -74.0060" (or your location)
- Select Severity: **High**
- Click "Create Ticket"

**Expected Result**:
- ✅ Toast: "Ticket created successfully!"
- ✅ Modal closes
- ✅ "Tickets Generated" stat increases to 1
- ✅ New ticket card appears in list

### Test 2.2: Verify Ticket Fields
1. View newly created ticket card

**Should display**:
- ✅ Ticket ID (first 8 chars)
- ✅ Status badge: "📍 Unclaimed"
- ✅ Severity badge: "High"
- ✅ Location coordinates
- ✅ Uploaded photo preview
- ✅ Created timestamp

### Test 2.3: Multiple Tickets
1. Create 3 more tickets with different severities (Low, Medium, High)
2. Verify all appear in Marker Dashboard
3. Verify stats show "4" in "Tickets Generated"

**Expected Result**:
- ✅ All tickets visible
- ✅ Stats correct
- ✅ Different severity colors (green/orange/red)

---

## 3. Landing Page - Unauthenticated Access

### Test 3.1: View Heat Map
1. Logout
2. Go to landing page
3. Scroll to "Live Garbage Density Map"

**Expected Result**:
- ✅ Map loads (Leaflet)
- ✅ Your location marked
- ✅ Heat layer shows intensity

### Test 3.2: View Tickets Near You
1. Heat map loaded
2. Scroll to "Tickets Near You"
3. See filter controls
4. Click "Use Current Location"

**Expected Result**:
- ✅ Location input updates
- ✅ Ticket list shows nearby tickets (from Marker's 4 tickets)
- ✅ All statuses visible except "Cleared"

### Test 3.3: Filter by Status
1. Select dropdown: "In Progress"
2. No tickets should show (all still Unclaimed)

**Expected Result**:
- ✅ Filters work even without auth
- ✅ CLEARED tickets NOT shown by default

---

## 4. Volunteer Dashboard Testing

### Test 4.1: Volunteer Sign Up
1. Logout
2. Sign Up as **Volunteer**
3. Fill details: `volunteer@example.com`

**Expected Result**:
- ✅ Volunteer account created
- ✅ Redirected to Volunteer Dashboard
- ✅ Stats show 0 tickets claimed/closed

### Test 4.2: View Available Tickets
1. In Volunteer Dashboard
2. Section "Available Tickets" shows Marker's tickets
3. All 4 tickets visible

**Expected Result**:
- ✅ Only Unclaimed tickets shown
- ✅ Distance calculated from your location
- ✅ Estimated distance shown if >10km away

### Test 4.3: Claim Ticket
1. Find a ticket in "Available Tickets"
2. Click "Claim" button

**Expected Result**:
- ✅ Toast: "Ticket claimed successfully!"
- ✅ Ticket moves to "My Claimed Tickets"
- ✅ Status badge changes: "🚀 In Progress"
- ✅ "Tickets Claimed" stat increases

### Test 4.4: View Claimed Ticket
1. In "My Claimed Tickets"
2. Ticket shows countdown timer

**Expected Result**:
- ✅ "⏳ 3 days remaining" (approximately)
- ✅ "Mark Complete" button visible
- ✅ Original photo visible

### Test 4.5: Can't Double Claim
1. Go back to "Available Tickets"
2. Try to claim same ticket again

**Expected Result**:
- ✅ Error: "Ticket already claimed"
- ✅ Or button disabled

---

## 5. Ticket Completion Flow

### Test 5.1: Complete Ticket
1. Open claimed ticket
2. Click "Mark Complete"
3. Modal appears with photo upload
4. Upload completion image

**Expected Result**:
- ✅ Photo preview shows
- ✅ "Confirm Clearance" button visible

### Test 5.2: Submit Completion
1. Click "Confirm Clearance"

**Expected Result**:
- ✅ Toast: "Ticket completed!"
- ✅ Modal closes
- ✅ Ticket status changes to: "📍 In Progress" (waiting for Authority)
- ✅ "Mark Complete" button no longer shown

---

## 6. Authority Dashboard Testing

### Test 6.1: Authority View
1. Logout
2. Login as Authority (`admin@vdnry.com`)
3. View Authority Dashboard

**Expected Result**:
- ✅ Different from other dashboards
- ✅ Shows "Tickets Approved" stat
- ✅ "Pending Tickets for Approval" section
- ✅ "Tickets Pending Clearance Verification" section

### Test 6.2: Approve Marker Ticket
1. In "Pending Tickets for Approval"
2. Should see your original markers' tickets
3. Review ticket (photo + severity visible)
4. Click "Approve"

**Expected Result**:
- ✅ Toast: "Ticket approved!"
- ✅ Ticket moves to "Available Tickets" for volunteers
- ✅ "Tickets Approved" stat increases

### Test 6.3: Verify Clearance
1. In "Tickets Pending Clearance Verification"
2. Should see volunteer's completed ticket
3. See both original photo AND completion photo
4. Click "Verify Clearance"

**Expected Result**:
- ✅ Toast: "Ticket marked as cleared!"
- ✅ Ticket status: "✅ Cleared"
- ✅ Ticket disappears from main view (defaults filter out Cleared)

---

## 7. Location Services Testing

### Test 7.1: Geolocation Permission
1. On landing page
2. Click "Use Current Location"

**First Time**:
- ✅ Browser prompts for location permission
- ✅ Choose "Allow"

**Subsequent**:
- ✅ Uses cached location
- ✅ Coordinates update in near-by list

### Test 7.2: Fallback Location
1. If geolocation denied
2. App should use fallback (New York: 40.7128, -74.0060)

**Expected Result**:
- ✅ Still works without permission
- ✅ Can create tickets at default location

### Test 7.3: Distance Calculation
1. Create marker ticket at your location
2. Volunteer dashboard shows distance
3. If >10km away, different styling

**Expected Result**:
- ✅ Distance calculated correctly
- ✅ 10km threshold works

---

## 8. Heat Map Testing

### Test 8.1: Heat Map Rendering
1. Logout → Landing page
2. Wait for map to load
3. See colored circles (heat layer)

**Expected Result**:
- ✅ Map centers on your location
- ✅ Green/orange/red intensity circles
- ✅ Zoom controls work (+ / -)
- ✅ Can pan/drag map

### Test 8.2: Heat Map Updates
1. Create new ticket as Marker
2. Volunteer dashboard, wait 30+ seconds
3. Check heat map again

**Expected Result**:
- ✅ New incident appears on map
- ✅ Auto-refresh every 30 seconds

### Test 8.3: Legend Colors
1. View map legend below heat map
2. Green = Low
3. Orange = Medium
4. Red = High

**Expected Result**:
- ✅ Colors match severity
- ✅ Legend displays correctly

---

## 9. Data Persistence Testing

### Test 9.1: Logout and Login
1. Create ticket as Marker
2. Logout
3. Login again

**Expected Result**:
- ✅ Token restored from localStorage
- ✅ Dashboard loads automatically
- ✅ Ticket history preserved

### Test 9.2: Refresh Page
1. In any dashboard
2. Press F5 (refresh)

**Expected Result**:
- ✅ Stays logged in
- ✅ Dashboard reloads
- ✅ All data intact

### Test 9.3: New Tab
1. Login in one tab
2. Open new tab, go to same URL

**Expected Result**:
- ✅ Can login independently
- ✅ Both tabs work

---

## 10. Error Handling Testing

### Test 10.1: Invalid Login
1. Click Login
2. Email: `notexist@example.com`
3. Password: `WrongPassword`

**Expected Result**:
- ✅ Toast error: "Invalid email or password"
- ✅ Modal stays open

### Test 10.2: Duplicate Email
1. Sign up with `test@example.com`
2. Try to sign up again with same email

**Expected Result**:
- ✅ Toast error: "Email already registered"

### Test 10.3: Missing Fields
1. Sign up form
2. Leave a field blank
3. Click "Sign Up"

**Expected Result**:
- ✅ Browser validation (required fields)
- ✅ Can't submit empty form

### Test 10.4: Network Error Simulation
1. Close browser DevTools Network (offline)
2. Try to create ticket

**Expected Result**:
- ✅ Toast error displayed
- ✅ User informed of failure

---

## 11. Responsive Design Testing

### Test 11.1: Mobile View (375px)
1. DevTools → Toggle Device Toolbar
2. iPhone SE (375x667)
3. Navigate through all dashboards

**Expected Result**:
- ✅ Layout responsive
- ✅ Touch-friendly buttons
- ✅ No horizontal scroll
- ✅ Text readable

### Test 11.2: Tablet View (768px)
1. iPad (768x1024)
2. Verify grid layouts

**Expected Result**:
- ✅ 2-column grid maintained
- ✅ UI proportional

### Test 11.3: Desktop (1400px+)
1. Full screen
2. All features visible

**Expected Result**:
- ✅ 3+ column grids render
- ✅ Optimal spacing

---

## 12. Photo Upload Testing

### Test 12.1: Different Image Formats
1. Create tickets with:
   - JPEG image
   - PNG image
   - GIF file
   - WebP file

**Expected Result**:
- ✅ All formats work
- ✅ Previews render

### Test 12.2: Large File
1. Create image 5+ MB
2. Try to upload

**Expected Result**:
- ✅ Upload succeeds (MVP stores as data URL)
- ✅ May show warning for production

---

## 13. Performance Testing

### Test 13.1: Load Time
1. First load from cold cache: <3 seconds
2. Subsequent loads: <1 second

**Expected Result**:
- ✅ Fast initial load
- ✅ Good perceived performance

### Test 13.2: Dashboard Load
1. Click into dashboard with 10+ tickets

**Expected Result**:
- ✅ Renders instantly (<500ms)
- ✅ No lag when scrolling

---

## 14. Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full Support | Recommended |
| Firefox | ✅ Full Support | Works great |
| Safari | ✅ Full Support | iOS works |
| Edge | ✅ Full Support | Windows works |

**Test**:
1. Open in each browser
2. Run Test 2.1 (Create Ticket)
3. Verify all features work

---

## 15. End-to-End Workflow Test

Complete end-to-end flow testing all three roles:

### Complete Flow (30 minutes)

**1. Marker Reports Dump**
   - Create account as Marker
   - Create 2 tickets (1 High severity, 1 Low)

**2. Authority Approves**
   - Create Authority account
   - Approve the High severity ticket
   - Leave Low severity pending

**3. Volunteer Cleans**
   - Create Volunteer account
   - See available tickets
   - Claim the approved High severity ticket
   - Wait 3 days... (or manually test)
   - Complete cleanup with photo

**4. Authority Verifies**
   - Check "Tickets Pending Clearance Verification"
   - Verify clearance
   - Ticket now shows as "Cleared"

**5. Validation**
   - ✅ Marker dashboard: 2 generated, 1 approved, 1 cleared
   - ✅ Volunteer dashboard: 1 claimed, 1 closed
   - ✅ Authority dashboard: 2 tickets approved

**Expected Result**:
- ✅ All stats updated correctly
- ✅ Full workflow works end-to-end
- ✅ Cleared tickets hidden by default

---

## Test Results Template

Use this to document your testing:

```markdown
## Test Date: YYYY-MM-DD
## Tester: [Name]
## Browser: [Chrome/Firefox/Safari/Edge]
## OS: [Windows/Mac/Linux/iOS/Android]

### Results:
- [ ] Test 1.1: Marker Sign Up - PASS/FAIL
- [ ] Test 2.1: Create Ticket - PASS/FAIL
- [ ] Test 4.3: Claim Ticket - PASS/FAIL
- [ ] Test 5.2: Complete Ticket - PASS/FAIL
- [ ] Test 6.2: Authority Approve - PASS/FAIL

### Issues Found:
1. [Issue description]
2. [Issue description]

### Notes:
[Any additional observations]
```

---

## Quick Regression Checklist

Use before deployment:

- [ ] Sign up works (all 3 roles)
- [ ] Login works
- [ ] Create ticket works
- [ ] Claim ticket works
- [ ] Complete ticket works
- [ ] Authority approve works
- [ ] Heat map loads
- [ ] Responsive on mobile
- [ ] Logout works
- [ ] No console errors

✅ All checked? Ready to deploy!
