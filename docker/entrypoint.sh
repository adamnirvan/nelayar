#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

# ---------------------------------------------------------------------
# Wait for PostgreSQL to accept connections before touching the DB.
# ---------------------------------------------------------------------
wait_for_db() {
    echo "Waiting for database ${DB_HOST}:${DB_PORT:-5432} ..."
    for i in $(seq 1 30); do
        if php -r '
            $h=getenv("DB_HOST"); $p=getenv("DB_PORT")?:5432;
            $c=@fsockopen($h,(int)$p,$e,$s,2);
            exit($c ? 0 : 1);
        '; then
            echo "Database is up."
            return 0
        fi
        sleep 2
    done
    echo "Database did not become available in time." >&2
    exit 1
}

# ---------------------------------------------------------------------
# One-time app initialisation. Only the primary (php-fpm) container runs
# migrations so worker/scheduler replicas don't race on them.
# ---------------------------------------------------------------------
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    wait_for_db

    # storage symlink (idempotent)
    [ -L public/storage ] || php artisan storage:link || true

    php artisan migrate --force

    # Cache config/routes/views for production speed.
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
else
    # Workers/scheduler still need the DB to be reachable before starting.
    case "${1:-}" in
        php-fpm) ;;
        *) wait_for_db ;;
    esac
fi

exec "$@"
