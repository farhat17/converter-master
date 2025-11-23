FROM python:3.11-slim-buster
WORKDIR /app
COPY requirements.txt  requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD [ "python manage.py runserver" ]