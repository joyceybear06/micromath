## What changed
<!-- Short summary of the change. Example:
- Made header sticky on mobile
- Added big +/− buttons next to answer input (Android-friendly)
- Switched Share to Web Share API with clipboard fallback
- Cleaned instructions copy (only specific headings bold)
- Fixed header background to blend with theme (no white card)
-->

- [ ] UI copy/styles
- [ ] UI behavior (mobile)
- [ ] Logic only (no UI)
- [ ] No new dependencies introduced

### Issue / Ticket (optional)
<!-- Link related issue/linear/jira, if any -->

---

## Manual checks (tick **before** merge)

### Devices
- [ ] iPhone Safari (real device)
- [ ] Android Chrome (real device)
- [ ] Desktop (Chrome/Firefox/Safari)

### Sticky header / timer
- [ ] Scroll on iPhone → header & timer stay pinned
- [ ] Scroll on Android → header & timer stay pinned
- [ ] No content overlaps under the sticky header

### Android +/− controls (inside the input row)
- [ ] + and − are clearly visible and large enough to tap
- [ ] Tapping **−** toggles sign: `12 → -12`, `-7 → 7`, empty → `-`
- [ ] Tapping **+** removes leading minus: `-9 → 9`
- [ ] Focus remains in the input after tapping

### Share flow (Web Share with clipboard fallback)
- [ ] Mobile: tapping **Share** opens the native share sheet
- [ ] Desktop: shows “Copied to clipboard!” and text pastes correctly
- [ ] Share message includes app name, score/total, time, and link

### Instructions copy (clarity + weight)
- [ ] Only these headings are bold: **Daily Button**, **How to use**, **Why to use it regularly**, **Modes at a glance**
- [ ] All other text is normal weight, clean, and black (simple and readable)

### Theme / header surface
- [ ] Header area behind title/subtitle **matches** the page background in each theme
- [ ] No white “card” behind the title/subtitle in **Default / Light / Dark**
- [ ] Timer pill remains a small chip (it may have its own white/ink background)

### General sanity
- [ ] No horizontal scrolling on mobile
- [ ] No console errors in devtools
- [ ] Build/Preview is green (Vercel)

---

## Screenshots / recordings (recommended)
<!-- Drag/drop short phone screen recordings or images here -->

---

## Risk & rollback
- **Risk level:** Low / Medium / High
- **Rollback plan:** Revert this PR if issues found in production

---

## Reviewer notes (optional)
<!-- Anything you want reviewers to focus on -->
