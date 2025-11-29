"use client";

import React from "react";

const API_DOCS = [
  {
    group: "Auth",
    base: "/api/auth",
    endpoints: [
      {
        method: "POST",
        path: "/register",
        description: "Register a new user.",
        auth: "Public",
        body: {
          email: "string (required)",
          password: "string (required)",
        },
      },
      {
        method: "POST",
        path: "/login",
        description: "Login with email and password.",
        auth: "Public",
        body: {
          email: "string (required)",
          password: "string (required)",
        },
      },
      {
        method: "POST",
        path: "/register-admin",
        description: "Create an admin user (dev-only; protect/disable in production).",
        auth: "Public (should be restricted in production)",
        body: {
          email: "string (required)",
          password: "string (required)",
        },
      },
    ],
  },
  {
    group: "Admin Users",
    base: "/api/admin",
    note: "All endpoints require Authorization: Bearer <JWT> with role=admin.",
    endpoints: [
      {
        method: "GET",
        path: "/users",
        description: "List users with pagination and optional search.",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on email)",
        },
        auth: "Admin",
      },
      {
        method: "GET",
        path: "/users/:id",
        description: "Get a single user by id.",
        auth: "Admin",
      },
      {
        method: "PUT",
        path: "/users/:id",
        description: "Update user fields (email, password, role).",
        auth: "Admin",
        body: {
          email: "string (optional)",
          password: "string (optional)",
          role: "string (optional, e.g. 'user' | 'admin')",
        },
      },
      {
        method: "DELETE",
        path: "/users/:id",
        description: "Delete a user.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Admin Summary",
    base: "/api/admin/summary",
    note: "All endpoints require Authorization: Bearer <JWT> with role=admin.",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "Get counts for users, categories, exercises, workouts, meditations, nutrition, medicines, faqs.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Categories",
    base: "/api/categories",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List categories with pagination and search.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on name/slug/description)",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single category by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a category.",
        auth: "Admin",
        body: {
          name: "string (required)",
          description: "string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a category.",
        auth: "Admin",
        body: {
          name: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a category.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Exercises",
    base: "/api/exercises",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List exercises with pagination, search, category and difficulty filters.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on title/slug/description)",
          category: "string (optional category id)",
          difficulty: "string (optional, e.g. 'beginner' | 'intermediate' | 'advanced')",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single exercise by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create an exercise.",
        auth: "Admin",
        body: {
          title: "string (required)",
          category: "string (optional category id)",
          description: "string (optional)",
          difficulty: "string (optional, default 'beginner')",
          duration: "number (optional seconds/minutes depending on UI)",
          equipment: "string[] | string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update an exercise.",
        auth: "Admin",
        body: {
          title: "string (optional)",
          category: "string (optional category id or empty to clear)",
          description: "string (optional)",
          difficulty: "string (optional)",
          duration: "number (optional)",
          equipment: "string[] | string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete an exercise.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Workouts",
    base: "/api/workouts",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List workouts with pagination, search, difficulty and optional category filter.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on name/slug/description)",
          difficulty: "string (optional)",
          category: "string (optional category id; filters by workouts containing exercises in that category)",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single workout by id (including populated exercises).",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a workout.",
        auth: "Admin",
        body: {
          name: "string (required)",
          description: "string (optional)",
          difficulty: "string (optional, default 'beginner')",
          exercises: "string[] exercise ids (optional)",
          thumbnail: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a workout.",
        auth: "Admin",
        body: {
          name: "string (optional)",
          description: "string (optional)",
          difficulty: "string (optional)",
          exercises: "string[] exercise ids (optional; empty array clears)",
          thumbnail: "string URL (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a workout.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Meditations",
    base: "/api/meditations",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List meditations with pagination, search and category filter.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on title)",
          category: "string (optional category id)",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single meditation by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a meditation.",
        auth: "Admin",
        body: "See Meditation model; this route forwards body directly to Mongoose.",
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a meditation.",
        auth: "Admin",
        body: "Partial Meditation fields.",
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a meditation.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Nutrition",
    base: "/api/nutrition",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List nutrition items with pagination, search and type filter.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on title/slug/description)",
          type: "string (optional, e.g. 'Recipe')",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single nutrition item by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a nutrition item.",
        auth: "Admin",
        body: {
          title: "string (required)",
          description: "string (optional)",
          type: "string (optional, default 'Recipe')",
          image: "string URL (optional)",
          calories: "number (optional)",
          ingredients: "string[] | string (optional)",
          instructions: "string (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a nutrition item.",
        auth: "Admin",
        body: {
          title: "string (optional)",
          description: "string (optional)",
          type: "string (optional)",
          image: "string URL (optional)",
          calories: "number (optional)",
          ingredients: "string[] | string (optional)",
          instructions: "string (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a nutrition item.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Medicines",
    base: "/api/medicines",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List medicines with pagination and search.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on name/slug/description)",
        },
      },
      {
        method: "POST",
        path: "/",
        description: "Create a medicine.",
        auth: "Admin",
        body: {
          name: "string (required)",
          dosage: "string (optional)",
          unit: "string (optional)",
          frequency: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
          user: "string user id (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a medicine.",
        auth: "Admin",
        body: {
          name: "string (optional)",
          dosage: "string (optional)",
          unit: "string (optional)",
          frequency: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
          user: "string user id (optional or empty to clear)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a medicine.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "FAQs",
    base: "/api/faqs",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List FAQs, optionally filtered by category.",
        auth: "Public",
        query: {
          category: "string (optional, e.g. 'Account')",
        },
      },
      {
        method: "POST",
        path: "/",
        description: "Create an FAQ.",
        auth: "Admin",
        body: {
          question: "string (required)",
          answer: "string (optional)",
          category: "string (optional)",
          order: "number (optional, controls sort order)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update an FAQ.",
        auth: "Admin",
        body: {
          question: "string (optional)",
          answer: "string (optional)",
          category: "string (optional)",
          order: "number (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete an FAQ.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Uploads",
    base: "/api/uploads",
    endpoints: [
      {
        method: "POST",
        path: "/image",
        description: "Upload an image to Cloudinary.",
        auth: "Admin",
        body: "multipart/form-data with field 'file' as the image binary.",
      },
    ],
  },
  {
    group: "Health Check",
    base: "",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Simple health check for the backend.",
        auth: "Public",
      },
    ],
  },
];

function JsonLike(props: { value: any }) {
  const { value } = props;
  if (!value) return null;
  if (typeof value === "string") return <span className="font-mono text-xs text-slate-800 dark:text-slate-100">{value}</span>;
  return (
    <pre className="mt-1 rounded bg-slate-950/5 p-2 text-[11px] leading-relaxed text-slate-900 dark:bg-slate-900 dark:text-slate-100 overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">API Documentation</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          This page documents the current HTTP APIs exposed by the Healthify backend. Share this URL with the
          mobile app developer. All URLs are relative to the backend base URL (e.g. <code>https://your-backend.example.com</code>).
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
          Authentication
        </h2>
        <p>
          Use <span className="font-mono">Authorization: Bearer &lt;JWT&gt;</span> for all endpoints marked as
          <span className="font-semibold"> Admin</span>. Public endpoints do not require a token.
        </p>
      </section>

      <div className="flex flex-col gap-4">
        {API_DOCS.map((group) => (
          <section
            key={group.group}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {group.group} <span className="font-mono text-xs text-slate-500">{group.base}</span>
                </h2>
                {group.note ? (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{group.note}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              {group.endpoints.map((ep) => (
                <article
                  key={ep.method + ep.path}
                  className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-100">
                        {group.base}
                        {ep.path}
                      </span>
                    </div>
                    {ep.auth ? (
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {ep.auth}
                      </span>
                    ) : null}
                  </div>

                  {ep.description ? (
                    <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">{ep.description}</p>
                  ) : null}

                  {"query" in ep && ep.query ? (
                    <div className="mt-2">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Query params
                      </h3>
                      <JsonLike value={ep.query} />
                    </div>
                  ) : null}

                  {"body" in ep && ep.body ? (
                    <div className="mt-2">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Request body
                      </h3>
                      <JsonLike value={ep.body} />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
