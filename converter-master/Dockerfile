FROM python:3.11-slim-buster

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files (optional, if using static files)
RUN python manage.py collectstatic --noinput

# Expose the port Render will use
EXPOSE 8000

# Run Gunicorn for production
CMD ["gunicorn", "converter-master.wsgi:application", "--bind", "0.0.0.0:8000"]
