# Access Control Matrix v1

Last updated: 2026-02-24

## Roles

- `ADMIN`: Platform/system management and high-privilege support operations.
- `LANDLORD`: Manages owned properties, units, leases, and financial operations for their portfolio.
- `TENANT`: Operates only within their assigned lease/property context.

## Authorization Principles

- Deny by default.
- Backend enforces authorization; frontend is not a trust boundary.
- Ownership/assignment checks are required on every domain query and mutation.
- Role-only checks are insufficient without scope checks (property/lease/user mapping).

## Matrix (v1 Foundation)

| Domain Action               | Admin | Landlord                           | Tenant                        |
| --------------------------- | ----- | ---------------------------------- | ----------------------------- |
| View own profile            | Yes   | Yes                                | Yes                           |
| Manage all users            | Yes   | No                                 | No                            |
| Create property/unit        | Yes   | Yes (own portfolio only)           | No                            |
| View property/unit          | Yes   | Yes (own portfolio only)           | Yes (assigned only)           |
| Manage lease                | Yes   | Yes (own portfolio only)           | No                            |
| View lease                  | Yes   | Yes (own portfolio only)           | Yes (own lease only)          |
| Create rent charge          | Yes   | Yes (own leases only)              | No                            |
| Record cash payment         | Yes   | Approve/Reject                     | Submit only                   |
| Manage payment methods      | Yes   | Yes (self/tenant-scoped by policy) | Yes (self only)               |
| Create maintenance request  | Yes   | Yes                                | Yes (own lease/property only) |
| Resolve maintenance request | Yes   | Yes (own portfolio only)           | No                            |
| Chat messages               | Yes   | Yes (thread participant only)      | Yes (thread participant only) |
| Upload/view documents       | Yes   | Yes (owned entities)               | Yes (assigned entities)       |
| View audit logs             | Yes   | Limited/self-portfolio             | No                            |

## Implementation Notes

- Global auth guard validates bearer token and maps it to internal user record.
- Global roles guard enforces route-level role metadata where defined.
- Role claims are sourced from signed `app_metadata` first (never from `user_metadata`).
- Resource-scope checks (owner/tenant assignment) are implemented per module service layer in subsequent phases.
