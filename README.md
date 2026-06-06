# Order Tracker

A simple, reliable order-tracking app. It sits behind one login and moves orders
through four stages: **Order Received → Sales Documents → Awaiting Pickup → Completed**.
Everything is saved to Supabase the moment you click, and an open page updates
automatically when data changes elsewhere.

You do **not** need to be a developer to set this up. Follow the steps below in order.

---

## What you'll need (all free to start)

1. A **Supabase** account → https://supabase.com
2. A **GitHub** account → https://github.com (free)
3. A **Vercel** account → https://vercel.com (sign in with GitHub)

Set aside about 20 minutes.

---

## PART A — Set up the database (Supabase)

### A1. Create a project
1. Go to https://supabase.com and sign in.
2. Click **New project**. Give it a name (e.g. `order-tracker`), choose a region
   near you, and set a database password (save it somewhere; you won't need it for the app).
3. Wait ~2 minutes for it to finish setting up.

### A2. Create the tables
1. In the left sidebar click **SQL Editor**.
2. Click **New query**.
3. Open the file **`supabase-setup.sql`** from this project, copy **everything** in it,
   and paste it into the editor.
4. Click **Run** (bottom-right). You should see *"Success. No rows returned"*.

That created your tables, security rules, and turned on realtime.

### A3. Create your login user
1. Left sidebar → **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter the email and password you want to log in with.
4. **Tick "Auto Confirm User"** (so you can log in immediately without a confirmation email).
5. Click **Create user**.

> This is the single account the whole app sits behind. You can add more later the same way.

### A4. Copy your two keys
1. Left sidebar → **Project Settings** (gear icon) → **API** (or **Data API** / **API Keys**).
2. Copy the **Project URL** — looks like `https://abcdefgh.supabase.co`.
3. Copy the **anon public** key (also called **publishable** key) — a long string.

Keep these two values handy for Part C. They are safe to use in the browser; your
data is protected by the security rules and the login, not by hiding the key.

---

## PART B — Put the code on GitHub

Easiest path, no command line:

1. Go to https://github.com/new and create a new **empty** repository (e.g. `order-tracker`).
   Do **not** add a README.
2. On the next page, click **"uploading an existing file"**.
3. Drag the **entire contents** of this `order-tracking-app` folder into the upload box.
   - Skip the `node_modules` folder if it exists (it's large and not needed).
4. Click **Commit changes**.

> Prefer the command line? From this folder run:
> `git init && git add . && git commit -m "Order tracker" && git branch -M main`
> then `git remote add origin <your repo url> && git push -u origin main`.

---

## PART C — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New… → Project**.
3. Find your `order-tracker` repository and click **Import**.
4. Before deploying, open **Environment Variables** and add these two
   (copy the names exactly):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from step A4 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon/publishable key from step A4 |

5. Click **Deploy** and wait ~1 minute.
6. When it finishes, click the preview to open your app. Log in with the email and
   password you created in step A3. Done.

> If you ever change the environment variables, click **Redeploy** in Vercel for them to take effect.

---

## Running it on your own computer (optional)

Only if you want to test changes locally first:

1. Install **Node.js** (LTS) from https://nodejs.org.
2. In this folder, make a copy of `.env.example` and name it **`.env.local`**.
   Fill in the same two values from step A4.
3. Open a terminal in this folder and run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000.

---

## Where to change things (no deep coding needed)

Open **`src/lib/config.ts`**. Everything you'll likely want to tweak is in that one file:

- **App title** → `APP_TITLE`
- **Stuck-order threshold** (default 3 days) → `STUCK_THRESHOLD_DAYS`
- **Tab names and the "move" button text** → the `STAGES` section
- **Batch-code rules** (prefixes, products, packaging options) → the `PREFIX_RULES` section

After editing, save, commit/upload to GitHub again, and Vercel will redeploy automatically.

---

## How it works (quick tour)

- **Add Order** — top of the card. Type the order number, customer, destination. Starts in Stage 1.
- **Move buttons** — each card has its own. Stage 2's button opens the **Batches** dialog first.
- **Stuck flag** — if an order sits in a stage longer than the threshold, its card turns amber.
- **Global search** (top bar) — searches every stage, including Completed. Click a result to jump to it.
- **Audit Log** (top-right) — every action is recorded with a timestamp; filter by order number.
- **Reopen** — in the Completed tab, send an order back to Stage 1, 2, or 3.
- **Realtime** — open the app on two computers; a change on one shows up on the other.
