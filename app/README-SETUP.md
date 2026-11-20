# ZEIT — local setup

This package preserves the existing React UI and styling. It connects the existing pages to a single Express + MySQL backend.

## Requirements
- Node.js 20.19+ (Vite 8 requirement) and npm
- MySQL 8+

## 1. Database
1. Start MySQL.
2. Run `database/user.sql` in MySQL Workbench (only for a fresh database).
3. Check for duplicate phone numbers before migration:
   `SELECT phone, COUNT(*) FROM zeit.user GROUP BY phone HAVING COUNT(*) > 1;`
4. If there are no duplicates, run `database/migrations/001_zeit_auth_and_address.sql`.
5. The current registration screen collects a single free-form address. City/state/pincode are blank until a later UI change; no UI has been changed here.

## 2. Backend
1. Open a terminal in `backend`.
2. Copy `.env.example` to `.env` and fill in your local MySQL password and a random JWT_SECRET (32+ characters).
3. Run `npm install` then `npm start`.
4. Check `http://localhost:5000/api/health` and `http://localhost:5000/api/db-test`.

## 3. Frontend
1. Open another terminal in `frontend`.
2. Run `npm install` then `npm run dev`.
3. Open the Vite URL shown (normally `http://localhost:5173`).

## Implemented
- Registration writes the customer and address to MySQL, hashes passwords, and prevents duplicate phone/email.
- Login uses the requested 10-digit phone number + password and returns a signed JWT.
- Profile fetches the authenticated customer's data.
- Forgot-password verifies a time-limited, one-use OTP hash and updates the password.
- Existing cart and PDF bill UI are preserved. The cart remains browser-local (localStorage), matching the existing implementation; it is not yet synchronized between devices.
- Existing product, cart, and bill API routes remain in the backend.

## Important password-reset limitation
No SMS provider credentials/service were supplied. In local development, the generated OTP is returned to the UI only when `NODE_ENV` is not `production` and `OTP_EXPOSE_IN_DEVELOPMENT=true`. Before deployment, configure an SMS gateway and set `OTP_EXPOSE_IN_DEVELOPMENT=false`; otherwise OTP delivery is not production-ready.

## Notes
- Do not commit `.env` or share real credentials.
- The database migration is not automatically run by the server. Run it once in MySQL Workbench.
