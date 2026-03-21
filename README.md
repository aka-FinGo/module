# 🍳 Oshxona Konstruktori

Supabase + GitHub Pages bilan to'liq ishlaydigan oshxona modullar konstruktori.

---

## 📁 Loyiha tuzilmasi

```
kitchen-constructor/
├── .github/workflows/deploy.yml   ← GitHub Actions (avtomatik deploy)
├── src/
│   ├── lib/supabase.js            ← Supabase client
│   ├── pages/
│   │   ├── Constructor.jsx        ← Asosiy konstruktor sahifasi
│   │   └── Admin.jsx              ← Admin panel
│   ├── App.jsx                    ← Router
│   └── main.jsx
├── supabase-schema.sql            ← DB jadvallar + RLS + demo data
├── .env.example                   ← Environment variables namuna
├── vite.config.js                 ← Build sozlamalari
└── package.json
```

---

## 🚀 Sozlash bosqichlari

### 1️⃣ Supabase

1. [supabase.com](https://supabase.com) → yangi loyiha yarating
2. **SQL Editor** → `supabase-schema.sql` faylini to'liq nusxalab, ishlatib chiqing
3. **Project Settings → API** dan ikki narsa oling:
   - `Project URL`  → `VITE_SUPABASE_URL`
   - `anon public`  → `VITE_SUPABASE_ANON_KEY`

---

### 2️⃣ Admin foydalanuvchi yaratish

Supabase **Authentication → Users → Add User**:
- Email + parol kiriting
- **Auto Confirm User** ni belgilang ✅

---

### 3️⃣ Mahalliy ishlatish (.env fayl)

```bash
# .env faylini yarating:
cp .env.example .env
```

`.env` faylini to'ldiring:
```env
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm install
npm run dev
```

---

### 4️⃣ GitHub Pages deploy

#### a) `vite.config.js` ni tahrirlang
```js
base: '/sizning-repo-nomingiz/',
```

#### b) GitHub Secrets qo'shing
`Settings → Secrets and variables → Actions → New repository secret`:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://XXXX.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

#### c) GitHub Pages yoqing
`Settings → Pages → Source: GitHub Actions`

#### d) Push qiling!
```bash
git add .
git commit -m "feat: kitchen constructor"
git push origin main
```

✅ **Bir necha daqiqadan so'ng saytingiz ishlaydi:**  
`https://username.github.io/repo-name/`

---

## 🔗 Sahifalar

| URL | Sahifa |
|-----|--------|
| `/` | Konstruktor |
| `/#admin` | Admin panel (login kerak) |

---

## ✨ Imkoniyatlar

| | Xususiyat |
|---|---|
| 🎨 | Modullarni rang-barang qilib sozlash |
| 🖱️ | Drag & drop yoki 2x bosish |
| 📦 | Admin paneldan modul qo'shish/o'chirish/yoqish |
| 📋 | Buyurtmalar Supabasega saqlanadi |
| 🔄 | Buyurtma statusini yangilash |
| ⚙️ | GitHub Actions bilan avtomatik deploy |
