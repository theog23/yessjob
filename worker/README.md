# Worker Python (Railway)

Servicio unico que corre en Railway:

1. Bot de Telegram (polling) — vincula chats a usuarios y genera propuestas IA.
2. Loop de scraping multi-usuario — cada `SCRAPE_LOOP_SECONDS` lee los
   filtros activos de todos los usuarios, scrapea Workana + Freelancer,
   deduplica y envia por Telegram lo que matchea.

## Estructura

```
worker/
├── main.py                 # entry point
├── requirements.txt
├── railway.toml
├── Procfile
├── .env.example
└── src/
    ├── config.py           # settings desde .env
    ├── db.py               # cliente Supabase (service role)
    ├── bot.py              # handlers Telegram
    ├── scheduler.py        # loop principal
    ├── notifier.py         # formateo y envio de jobs
    ├── translator.py       # traduccion auto al espanol
    ├── claude_service.py   # generacion de propuestas IA
    └── scrapers/
        ├── workana.py      # requests + endpoint JSON publico
        └── freelancer.py   # curl_cffi impersonate=chrome
```

## Correr localmente

```bash
cd worker
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env       # completa las variables
python main.py
```

## Deploy en Railway

1. Push del repo a GitHub.
2. Railway > New Project > Deploy from GitHub > selecciona el repo,
   subdirectorio `worker/`.
3. En Variables, pega las mismas del `.env`.
4. El `railway.toml` ya define `startCommand = "python main.py"`.

## Notas

- El worker usa `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS). Nunca la
  expongas al frontend.
- Freelancer requiere `curl_cffi`. En Railway usa Nixpacks que compila
  las dependencias sin problema (a diferencia de Vercel serverless).
- Si Freelancer bloquea, pega cookies del navegador en
  `FREELANCER_COOKIES` (formato `k1=v1; k2=v2`).
