# Gravida Care

A pregnancy care platform with AI-powered emotion tracking, diet planning, health monitoring, and doctor tools.

The project is split into two parts that must both be running at the same time:

| Part | Folder | What it does |
|---|---|---|
| **Frontend** | `frontend/` | React + Vite web application |
| **FER API** | `fer/` | Python + Flask facial emotion recognition server |

---

## Prerequisites

Make sure you have the following installed on your Windows machine before you begin:

- [Node.js](https://nodejs.org/) (v18 or higher) — includes `npm` automatically
- [Python](https://www.python.org/downloads/) (v3.9 or higher) — tick **"Add Python to PATH"** during installation
- [VS Code](https://code.visualstudio.com/) with the project folder open

> All terminal commands below are run inside **VS Code's integrated terminal** using **PowerShell**.  
> Open it with the shortcut: `` Ctrl + ` `` (backtick)

---

## 1. Setting Up the FER API

In VS Code, open a new terminal (`` Ctrl + ` ``) and run:

```powershell
cd fer
```

### Create a virtual environment

> Skip this step if the `fer_env2` folder already exists inside `fer/`.

```powershell
python -m venv fer_env2
```

### Activate the virtual environment

```powershell
.\fer_env2\Scripts\Activate.ps1
```

You should see `(fer_env2)` appear at the start of your terminal prompt. This means the virtual environment is active.

> **Tip — If you get a permissions error on activation**, run this once in PowerShell and then try again:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### Install the dependencies

```powershell
pip install -r requirements.txt -r requirements-api.txt
```

### Run the FER server

```powershell
python api.py
```

The FER API will start at **`http://localhost:5050`**. Your terminal should show:

```
Starting FER API → http://localhost:5050
```

> **Leave this terminal running.** The FER server must stay on while you use the app.  
> To open a second terminal without closing this one, click the **+** icon in the VS Code terminal panel, or press `` Ctrl + Shift + ` ``.

---

## 2. Setting Up the Frontend

Open a **new terminal** in VS Code (`` Ctrl + Shift + ` ``) and run:

```powershell
cd frontend
```

### Install the dependencies

```powershell
npm install
```

This may take a minute the first time — it downloads all the required packages into `node_modules/`.

### Set up the `.env` file

The frontend needs a Gemini API key to power AI meal recommendations and medication suggestions.

**Step 1** — In VS Code, right-click the `frontend/` folder in the Explorer sidebar and select **New File**. Name it `.env`

**Step 2** — Open the `.env` file and paste the following:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Step 3** — Replace `your_gemini_api_key_here` with your real key.  
You can get a free key at 👉 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

The final file should look like this:

```env
VITE_GEMINI_API_KEY=AIzaSy...your_actual_key...
```

> ⚠️ **Never push your `.env` file to GitHub.** It is already listed in `.gitignore` and will be excluded automatically.

### Run the frontend

```powershell
npm run dev
```

The app will start at **`http://localhost:5173`**.  
Hold `Ctrl` and click the link in your terminal to open it in your browser, or navigate there manually.

---

## 3. Running Both Together

You need **two terminals open at the same time** in VS Code. Here is the full picture:

| Terminal | Folder | Command | URL |
|---|---|---|---|
| Terminal 1 — FER API | `fer/` (venv active) | `python api.py` | `http://localhost:5050` |
| Terminal 2 — Frontend | `frontend/` | `npm run dev` | `http://localhost:5173` |

Once both are running, open **`http://localhost:5173`** in your browser and the full app will work.

The frontend is pre-configured to automatically forward emotion analysis requests to the FER server — no extra configuration is needed.

---

## Quick Reference — Every Time You Work on the Project

Each time you open VS Code and want to run the project, follow these steps:

**Terminal 1 (FER):**
```powershell
cd fer
.\fer_env2\Scripts\Activate.ps1
python api.py
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

---

## Project Structure

```
Gravida/
├── fer/                      # Python Flask FER API
│   ├── api.py                # Main server entry point  (run this)
│   ├── requirements.txt      # Core Python dependencies
│   ├── requirements-api.txt  # Flask-specific dependencies
│   ├── fer_env2/             # Virtual environment       (not on GitHub)
│   └── .gitignore
│
├── frontend/                 # React + Vite web application
│   ├── src/                  # All application source code
│   ├── public/               # Static assets (logo, images)
│   ├── .env                  # Your API keys             (not on GitHub)
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite + proxy configuration
│   └── .gitignore
│
└── README.md                 # This file
```
