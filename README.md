# PlotPilot - Firebase Setup Guide

This guide will walk you through the essential steps to connect your PlotPilot application to your personal Firebase project. Your app is already coded to work with Firebase, so you just need to configure your project in the Firebase console.

---

### **How Registration & The Database are Connected**

This application uses two main Firebase services:
1.  **Firebase Authentication:** Handles user sign-up and login securely.
2.  **Cloud Firestore:** A NoSQL database where all your app's data (like properties, payments, and users) is stored.

When a new user registers in your app, the following happens automatically:
1.  A new user account is created in **Firebase Authentication**.
2.  A new "document" (like a row in a table) for that user is created in a "collection" (like a table) called `users` in your **Cloud Firestore** database.

Other collections like `properties`, `employees`, and `payments` will also be created automatically the first time you add an item through the app's forms.

---

### **Step 1: Get Your Firebase Project Credentials**

If you haven't already, you need to get your project's configuration keys.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and select your project (e.g., `plotpilot-gi902`).
2.  Click the **Project Overview** gear icon ⚙️ and select **Project settings**.
3.  Under the **General** tab, scroll down to the **Your apps** section.
4.  Find your web app and look for the **SDK setup and configuration** section.
5.  Select the **Config** option to view your `firebaseConfig` object. This contains your keys.

This project uses a `.env` file to store these keys. I have already created this file for you with the keys you provided.

---

### **Step 2: Enable Firebase Services**

This is the most important step. You need to "turn on" the services your app uses.

1.  **Enable Firestore Database:**
    *   In the Firebase Console, go to the **Build** menu on the left and click **Firestore Database**.
    *   Click **Create database**.
    *   Select **Start in test mode**. This allows your app to write data without complicated security rules for now. You can change this later.
    *   Choose a location for your database and click **Enable**.

2.  **Enable Authentication Methods:**
    *   In the Firebase Console, go to the **Build** menu and click **Authentication**.
    *   Go to the **Sign-in method** tab.
    *   Click on **Add new provider** and enable both **Email/Password** and **Google**.

---

### **Step 3: Run the App and Verify**

1.  If your app is running, **stop and restart it**. This is necessary for it to load the credentials from the `.env` file.
2.  Open your app and **register a new user**.
3.  Go back to the **Firestore Database** in the Firebase console. You should now see a new collection called `users` with one document inside it for the user you just created!

You are now fully connected to Firebase!