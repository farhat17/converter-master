
set -o errexit
pip install -r requirement.txt
python manage.py collectstatic --noinput
python manage.py migrate
if [ "$CREATE_SUPERUSER" = "True" ]; then
    python manage.py createsuperuser --noinput --username "$DJANGO_SUPERUSER_NAME" --email "$DJANGO_SUPERUSER_EMAIL"
    echo "Superuser created with username: $DJANGO_SUPERUSER_NAME and email: $DJANGO_SUPERUSER_EMAIL"
else
    echo "Superuser creation skipped."
fi
python manage.py runserver  

