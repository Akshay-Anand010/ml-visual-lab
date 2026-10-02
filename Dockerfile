FROM python:3.11-slim

WORKDIR /app
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install --no-cache-dir -r /app/server/requirements.txt

COPY . /app
WORKDIR /app/server
ENV PORT=8000
EXPOSE 8000
CMD ["python", "app.py"]
