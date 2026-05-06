# Security Specification - TrafficOps Command

## 1. Data Invariants
- **Users**:
  - A User profile must be tied to the authenticated user's UID.
  - Profiles are private: Only the owner can read/write their own profile.
- **Incidents**:
  - Readable by all authenticated and verified users.
  - Writable (Create/Update) by any authenticated user (acting as operator).
  - `operatorId` must match the creator's UID.
- **Violations**:
  - Readable by all authenticated and verified users.
  - Immutable once created, except for `status` updates.
  - Only specific transitions allowed for `status` (e.g., pending -> approved).

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Attempt to create a document in `users/` where the ID is NOT the current user's UID.
2. **Ghost Creation**: Attempt to create a user document with extra fields like `isAdmin: true`.
3. **Cross-User Read**: User A attempts to `get` User B's profile.
4. **Cross-User Update**: User A attempts to `update` User B's username.
5. **No Auth Access**: Unauthenticated user attempts to read incidents or violations.
6. **Schema Violation**: Attempt to set `incident.severity` to "Super Critical" (not in enum).
7. **Size Attack**: Attempt to set `incident.description` to a 5MB string.
8. **Invalid ID**: Attempt to use `../poison/..` as a document ID.
9. **Operator Impersonation**: Create an incident with `operatorId` of another user.
10. **Timestamp Spoofing**: Attempt to set `updatedAt` to a client-side timestamp instead of `request.time`.
11. **Violation Tampering**: Attempt to update the `plate` or `location` of an existing violation.
12. **Unauthorized Status Change**: Attempt to change violation status to an invalid value or bypass the approved/rejected workflow.

## 3. Deployment Guards
- `rules_version = '2';`
- Default deny all: `match /{document=**} { allow read, write: if false; }`
- Mandatory size checks on all string inputs.
- Email verification required for all data access (`request.auth.token.email_verified == true`).
