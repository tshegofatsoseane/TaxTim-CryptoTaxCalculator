# Group4: Crypto Calculator (React + Laravel)

A SARS-compliant crypto capital gains calculator using FIFO multi-balance accounting.

**Tech stack**

- Laravel (PHP) – API backend  
- React (Vite) – frontend UI  
- Stateless calculation engine (no database)  

---

## Project Structure

```
crypto-calculator/
├── backend/        # Laravel API
├── frontend/       # React (Vite)
├── .gitignore
└── README.md
```

---

## Prerequisites

### Required (macOS & Windows)

- PHP **8.2+**
- Composer
- Node.js **18+**
- npm

---

## 1. Clone the repository

From your terminal, run:

```bash
git clone https://github.com/tshegofatsoseane/TaxTim-CryptoTaxCalculator
cd TaxTim-CryptoTaxCalculator
```

---

## 2. Install prerequisites

### macOS

Install Homebrew (if not installed):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install required tools:

```bash
brew install php composer node
```

Verify installation:

```bash
php -v
composer -V
node -v
npm -v
```

---

### Windows

#### PHP

1. Download PHP from [windows.php.net/download](https://windows.php.net/download)  
2. Extract and add PHP to your **PATH**  
3. Enable extensions in `php.ini`:
   ```
bcmath
mbstring
openssl
json
ctype
```

#### Composer

- Download installer from [getcomposer.org/download](https://getcomposer.org/download/)  
- Ensure “Add to PATH” is enabled

#### Node.js

- Download LTS from [nodejs.org](https://nodejs.org/)  

Verify (Command Prompt or PowerShell):

```powershell
php -v
composer -V
node -v
npm -v
```

---

## 3. Backend setup (Laravel)

From the project root:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

Create environment file:

```bash
cp .env.example .env
```

On Windows (PowerShell):

```powershell
copy .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

Clear caches (recommended):

```bash
php artisan config:clear
php artisan cache:clear
```

Start the backend server:

```bash
php artisan serve
```

Backend URL:

```
http://127.0.0.1:8000
```

---

## 4. Frontend setup (React + Vite)

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend URL (Vite will display this in terminal):

```
http://localhost:5173
```

> Make sure the backend server is running so the frontend can fetch data correctly.

---

## 5. Contributing

- Create a new branch for your changes:
  ```bash
  git checkout -b feature/your-feature-name
  ```

## Commit Guidelines

- Use clear and descriptive commit messages.
- Keep commits small and focused.

Example:
```bash
git commit -m "fix: resolve component re-render issue"
```

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request targeting the `main` branch.
3. In your Pull Request description, include:
   - A clear summary of the changes
   - The reason for the change
   - Screenshots or additional context if applicable


## Code of Conduct

By participating in this project, you agree to be respectful and considerate of others.  
Harassment, abusive behavior, or discrimination will not be tolerated.

---


## 6. Architecture notes

- All tax logic lives in:
  ```
  backend/app/Services/CryptoTax/
  ```
- No database required
- Backend is stateless and deterministic
- Frontend only renders results

---

## 6. Disclaimer

This tool assists with crypto tax calculations but does not replace professional tax advice.  
Final responsibility remains with the taxpayer.
