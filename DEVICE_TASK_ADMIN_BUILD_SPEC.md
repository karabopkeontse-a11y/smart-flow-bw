# Smart Flow BW — Device + Task + Admin Completion Spec

## Objective
Complete the existing Smart Flow BW application without rebuilding the project. Preserve the existing Supabase schema and offline Android prototype.

## Devices
Users can create multiple devices/meters independently. Required fields: name, location, meter type, capacity, active status. Each device belongs to the authenticated user through the existing household/meter relationship.

Device list must show: name, location, status, latest reading, latest flow, last seen. Each device opens its own detail view containing latest reading, usage history, alerts and a test-reading simulator. Add/edit/deactivate/delete must work. Never mix readings between devices.

## Readings
Allow a test/manual reading per selected device. Store litres, flow rate, timestamp and meter/device ID. Display latest reading and history for only the selected device. Real hardware integration remains future work; clearly label simulator data.

## Tasks
Create task must work from the UI. Tasks can be checked/unticked, completed, reopened, deleted and cancelled. Persist every change. Do not rely on local-only state.

## Alerts
Alerts must identify the exact device. Device detail shows only its alerts; dashboard may aggregate all user alerts. Resolve/unresolve must persist.

## Authentication / roles
Existing Supabase authentication remains authoritative. Normal users can access only their own data. Admin role exists in profiles. Admin UI must expose users/devices/tasks/alerts and allow privileged operational monitoring. Never expose service-role keys in frontend. Enforce privileged access with database policies/functions.

## Admin dashboard
Add an Admin tab visible only when profile.role = admin. Show user count, active device count, readings today, open alerts, and recent activity. Provide drill-down into users and their devices. Admin can deactivate devices and resolve alerts but must not impersonate users.

## UX
Add a Devices tab to the existing Smart Flow BW navigation. Keep current visual identity, Thothi AI, forecast and simulator. Make responsive/mobile-first. Use clear empty states and validation. No fake success messages: every create/update/delete action must await Supabase and report real errors.

## Acceptance tests
1. Sign in as normal user.
2. Add Device A and Device B.
3. Add reading to A; B remains unchanged.
4. Add reading to B; A remains unchanged.
5. Open A and verify only A readings/alerts appear.
6. Deactivate A and verify status persists after refresh.
7. Create task, untick, complete, reopen, cancel/delete and refresh after every action.
8. Sign in as admin and verify Admin tab and aggregate monitoring.
9. Verify normal user cannot read another user's device by changing IDs in browser requests.
10. Verify admin policies are database-enforced, not merely hidden UI.
