# Deploying Your Next.js App on Hostinger: A Step-by-Step Guide

This guide will walk you through deploying this Next.js application to a Hostinger hosting environment. Follow these steps carefully to avoid common errors like "403 Forbidden" or "500 Timeout".

### **IMPORTANT: Hosting Plan Requirement**

This guide is for Hostinger plans that include the **Node.js** feature. A Next.js app cannot run on basic static web hosting.

- To check if you have this, log into your Hostinger hPanel, go to **Websites** → **Manage**, and look for **Node.js** under the "Advanced" section on the sidebar.
- If you do not see this option, you may need to check if your current Hostinger plan supports Node.js applications.

---

### Step 1: Prepare Your Project

Before uploading, you need to build your project. This creates an optimized production version in a folder named `.next`.

1.  **Open your terminal** in the project directory.
2.  Run the command: `npm run build`
3.  Wait for it to finish. You should now have a `.next` folder in your project.

---

### Step 2: Upload Your Project to Hostinger

1.  **Connect via SFTP or use Hostinger's File Manager.**
2.  **Create a dedicated folder for your app.** It's best practice to place it *outside* your `public_html` directory for security. For example, create a folder named `plotpilot_app` in your account's root directory (`/home/your_user/plotpilot_app`).
3.  **Upload the following files and folders** into `plotpilot_app`:
    *   The `.next` folder (this is the most important part)
    *   The `public` folder
    *   The `node_modules` folder
    *   `package.json`
    *   `package-lock.json`
    *   `next.config.ts`

---

### Step 3: Set Up the Node.js Application in hPanel

1.  In your Hostinger hPanel, go to **Websites** → **Manage**.
2.  On the sidebar, find and click on **Node.js** (under "Advanced").
3.  Click **Create application**.
4.  **Application root**: Enter the path to the folder you created in Step 2 (e.g., `plotpilot_app`).
5.  **Application startup file**: Leave this **blank**. Your `package.json` already has the correct "start" command.
6.  **Node.js version**: Choose a recent version like **20.x.x**.
7.  Click **Create**. Hostinger will detect your `package.json` and start your app.

---

### Step 4: Configure Your Node.js App

1.  Once the application is created, stay on the Node.js page.
2.  **Find the Port**: You will see your running application listed. It will have a **Port** number assigned to it (e.g., `35482`). **Copy this port number.** You will need it in the next step.
3.  **Set Environment Variables**:
    *   Scroll down to the **Environment variables** section.
    *   Click **Create**.
    *   Add each of your Firebase keys from your local `.env` file. For example:
        *   Key: `NEXT_PUBLIC_FIREBASE_API_KEY`, Value: `AIzaSy...`
        *   Key: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, Value: `plotpilot-d5a25...`
    *   Add all the required keys.

---

### Step 5: Configure the `.htaccess` File

This is the final and most critical step to connect your domain to your app.

1.  Go to the **Hostinger File Manager**.
2.  Navigate to the **document root** for your subdomain. This is the public folder for `plotpilot.hublancer.pk`. It is likely located at: `/home/your_user/domains/hublancer.pk/public_html/plotpilot`. If you are unsure, check your subdomain settings in hPanel.
3.  Create a new file named `.htaccess` in this directory (or upload the one from this project).
4.  Paste the following content into the file:

    ```htaccess
    # This file is for Hostinger's server (LiteSpeed/Apache).
    # It tells the server to send all traffic to your running Next.js application.

    # Turn on the rewrite engine
    RewriteEngine On

    # DO NOT send requests for existing files (like images in /public) to Next.js
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Send all other requests to your Node.js app's port
    # IMPORTANT: Replace YOUR_NODE_APP_PORT with the port from your Hostinger panel.
    RewriteRule ^(.*)$ http://127.0.0.1:YOUR_NODE_APP_PORT/$1 [P,L]
    ```

5.  **IMPORTANT**: Replace the text `YOUR_NODE_APP_PORT` with the actual port number you copied in Step 4.
6.  **Save** the `.htaccess` file.

---

### Step 6: Restart and Check

1.  Go back to the **Node.js** section in hPanel.
2.  Click the **Restart** button for your application.
3.  Wait a minute, then visit `https://plotpilot.hublancer.pk/` in your browser. Your site should now be live.

---

### Troubleshooting Common Node.js Issues

- **403 Forbidden Error**: This almost always means your `.htaccess` file is missing, in the wrong folder, or has the wrong content. Double-check Step 5. The `.htaccess` file must be in the public document root of your subdomain, NOT in the `plotpilot_app` folder.
- **500 Timeout Error**: This usually means the port in your `.htaccess` file doesn't match the port assigned to your app in the Node.js section of hPanel. It can also happen if your app crashes on startup. Check the application logs in the Node.js section for errors.
- **App Crashes**: Make sure all your **Environment Variables** (Step 4) are set correctly. A missing variable can cause the app to fail on startup. Also ensure you have selected a modern **Node.js version** (like 20.x) in Step 3. The `start` script `next start -p $PORT` in `package.json` is correct and should not be changed, as Hostinger provides the `$PORT` variable automatically.

    