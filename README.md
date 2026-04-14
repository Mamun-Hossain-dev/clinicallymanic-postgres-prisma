# Node Express typescript postgres modular boilerplate

A production-ready, modular, and reusable Node.js Express starter package designed for building scalable SaaS applications. Built with TypeScript, clean architecture, and best practices in mind.

## 🚀 Features

- **Modular Architecture**: Feature-based modules (Controller, Service, Model, Validation, Interface, Routes) for better scalability.
- **Production-Grade Authentication**: robust JWT-based authentication (Access & Refresh Tokens) with secure cookie handling.
- **Strict Validation**: Zod-based schema validation for request bodies, queries, and params.
- **Centralized Error Handling**: Global error handler catching Zod, Prisma, and App errors with consistent responses.
- **Security First**: Helmet protection, Rate limiting, CORS configuration, and Data sanitization.
- **Database Best Practices**: PostgreSQL & Prisma ORM with optimized connection pooling, proper indexing, and schema design.
- **File Uploads**: Integrated Multer and Cloudinary for secure file storage.
- **Logging**: Production-ready logging with Winston.
- **Developer Experience**: ESLint, Prettier, Husky (optional setup), and typed configurations.
- **Email & OTP**: Built-in utilities for sending emails and handling One-Time Passwords (OTP).

## 📂 Project Structure

```
src/
├── config/             # Environment configuration (Zod validated)
├── errors/             # Custom Error classes and handlers
├── interface/          # Global interfaces
├── middlewares/        # Express middlewares (Auth, Validation, Errors)
├── modules/            # Feature modules (User, Auth, etc.)
│   ├── auth/
│   └── user/
├── routes/             # Centralized router
├── utils/              # Shared utilities (Logger, Pick, Pagination, etc.)
├── app.ts              # Express app setup
└── server.ts           # Entry point (Database connection & Server start)
```

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd node-express-modular-starter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```

   **Required Variables:**
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`: Secrets for JWT.
   - `CLOUDINARY_*`: Cloudinary credentials for file uploads.

4. **Run the server:**
   ```bash
   npm run dev
   ```

## 📜 Scripts

- `npm run dev`: Start development server with hot-reload.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm start`: Start the production server (after build).
- `npm run lint`: Run ESLint.
- `npm run lint:fix`: Fix linting errors.
- `npm run format`: Format code with Prettier.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the ISC License.

## Verification Results
✅ npx prisma generate — Prisma Client generated
✅ npx tsc --noEmit — Zero TypeScript errors

## Next Steps (User Action Required)
Set up PostgreSQL and add your connection string to `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/mydb?schema=public
```

Run the initial migration:

```bash
npx prisma migrate dev --name init
```

Start the dev server:

```bash
npm run dev
```

Test endpoints with Postman/curl:

- `POST /api/v1/auth/register` — register a user
- `POST /api/v1/auth/login` — login and get tokens
- `GET /api/v1/users` — list users
- `POST /api/v1/posts` — create a post (auth required)
- `GET /api/v1/posts` — list posts

## 🛠️ Post-Run Instructions

Once you have verified that the project runs successfully locally (`npm run dev`), follow these steps:

- **Check the Database Connection:**
  Ensure your PostgreSQL database is running and `DATABASE_URL` is correctly configured in your `.env` file. You should be able to see the connected database tables using a tool like pgAdmin or DataGrip.

- **Explore Prisma Studio (Optional):**
  You can run `npx prisma studio` to open a web interface where you can view and edit the data in your database visually.

- **Test the Endpoints:**
  Make sure you pass the received token in the `Authorization` header as a Bearer token for protected routes.

## ➕ How to Add New Features / Modules

Since this is a modular boilerplate, follow these steps to add any new feature (e.g., a "Product" or "Order" module):

1. **Update the Prisma Schema:**
   - Go to `prisma/schema.prisma` and add your new model (e.g., `Product`).
   - Run a migration to apply it to your database: `npx prisma migrate dev --name add_product`
   - Generate the Prisma Client: `npx prisma generate`

2. **Create the Module Folder:**
   - Navigate to `src/modules/` and create a new folder for your feature (e.g., `src/modules/product`).

3. **Create Module Files:**
   Inside your new module folder, create the necessary components:
   - `product.interface.ts`: Define any specific TypeScript interfaces or types.
   - `product.validation.ts`: Create Zod schemas to validate incoming request bodies.
   - `product.service.ts`: Implement the business logic and database interactions using Prisma (`prisma.product...`).
   - `product.controller.ts`: Handle incoming HTTP requests, call the service methods, and send back responses using `sendResponse()`.
   - `product.route.ts`: Define the specific Express routes for the feature and attach middlewares.

4. **Register the New Routes:**
   - Finally, open `src/routes/index.ts` and add your new module's routes so the application recognizes them:
   ```typescript
   const moduleRoutes = [
     // ...existing routes
     {
       path: '/products',
       route: ProductRoutes,
     },
   ];
   ```

5. **Test Your New Feature:**
   Run `npm run dev` and test your newly created endpoints via Postman.
