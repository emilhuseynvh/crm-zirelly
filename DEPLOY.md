# Zirelly CRM — Deploy təlimatı

## 1. Backend (mövcud API serverində)

CRM backend-i mövcud Laravel API-nin içindədir (`/api/crm/*`). Serverdə:

```bash
cd /var/www/projects/zirelly-backend
git pull   # və ya faylları köçürün

# .env-ə superadmin məlumatlarını əlavə edin (seed-dən ƏVVƏL):
# CRM_SUPERADMIN_EMAIL=oz-mailiniz@...
# CRM_SUPERADMIN_PASSWORD=guclu-sifre

php artisan migrate --force
php artisan db:seed --class=Database\\Seeders\\CrmSetupSeeder --force
php artisan config:clear && php artisan config:cache && php artisan route:clear && php artisan route:cache
```

Seeder superadmin hesabını yaradır və mövcud sayt istifadəçilərini/sifarişlərini
CRM kontaktlarına bağlayır (bir dəfə işlətmək kifayətdir, təkrar işlətmək təhlükəsizdir).

## 2. CRM Frontend (crm.zirelly.az)

```bash
# serverdə
cd /var/www/projects/zirelly-crm
npm ci
echo "NEXT_PUBLIC_API_URL=https://api.zirelly.az/api" > .env.local
npm run build
# PM2 ilə (port 3002 nümunə):
pm2 start npm --name zirelly-crm -- start -- -p 3002
```

### Nginx (SSL məcburi)

```nginx
server {
    listen 80;
    server_name crm.zirelly.az;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.zirelly.az;

    # certbot --nginx -d crm.zirelly.az
    ssl_certificate     /etc/letsencrypt/live/crm.zirelly.az/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.zirelly.az/privkey.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## 3. Avtomatik backup

`scripts/db-backup.sh` bazanın gzip backup-ını `storage/backups`-a yazır
(sqlite və MySQL-i avtomatik ayırd edir, 14 gündən köhnələri silir).

```bash
crontab -e
# hər gecə 03:30-da:
30 3 * * * /var/www/projects/zirelly-backend/scripts/db-backup.sh >> /var/log/zirelly-backup.log 2>&1
```

Bərpa (MySQL): `gunzip -c db-....sql.gz | mysql -u USER -p DBNAME`

## 4. Təhlükəsizlik xülasəsi

- CRM istifadəçiləri sayt istifadəçilərindən tam ayrıdır (`crm_users` cədvəli), parollar bcrypt ilə hash olunur.
- Login: 3 uğursuz cəhddən sonra 5 dəqiqə blok (e-poçt+IP üzrə); token 12 saatdan sonra bitir → avtomatik logout.
- Rollar: superadmin (tam giriş) / admin (yalnız verilən bölmələr). Kritik silmələr və istifadəçi idarəçiliyi yalnız superadmin.
- Silinmələr soft delete-dir (arxiv), hamısı audit log-da: kim, nəyi, nə vaxt, hansı IP-dən.
- Kart/bank məlumatı saxlanmır — yalnız status, məbləğ və sifariş məlumatları.
- DB-ni internetə açmayın (bind 127.0.0.1); API token-ları yalnız HTTPS üzərindən ötürülür.
