
# 📺 Grabberty - YouTube Downloader

Grabberty ist eine moderne, selbstgehostete Webanwendung, mit der du YouTube-Videos und -Audio-Dateien unkompliziert herunterladen kannst. Das Projekt ist vollständig containerisiert und lässt sich mithilfe von Docker innerhalb weniger Sekunden auf dem eigenen Server oder lokalen Rechner starten.

---

## 🛠 Architektur & Technologien

Das Projekt ist in eine Microservice-Architektur aufgeteilt, um maximale Performance und Trennung von Zuständigkeiten zu gewährleisten:

* **Frontend:** Eine reaktive Benutzeroberfläche, entwickelt mit **React / Vite** und **TypeScript**, gestylt mit **Tailwind CSS**.
* **Backend:** Eine performante Fastify-API, gebaut mit **TypeScript**. Für die Kernfunktionalität der Downloads greift das Backend auf optimierte Bibliotheken wie `yt-dlp` zurück.
* **Reverse Proxy:** Ein **Nginx**-Container fungiert als zentraler Einstiegspunkt. Er leitet API-Anfragen (`/api/*`) an das Backend und alle regulären Seitenaufrufe an das Frontend weiter, sodass die Anwendung sicher über einen einzigen Port erreichbar ist.

---

## 🚀 Deployment & Installation

Um Grabberty zu hosten, benötigst du lediglich **Docker** und **Docker Compose** auf deinem System.

### 1. Konfigurationsdateien herunterladen
Erstelle einen neuen Ordner auf deinem Server und lade die beiden benötigten Konfigurationsdateien in dieses Verzeichnis herunter:

* [`docker-compose.yml`](docker-compose.yml) — Definiert die Services und Container.
* [`nginx.conf`](nginx.conf) — Regelt das Routing zwischen Frontend und Backend.

*Tipp: Du kannst die Dateien direkt über dein Terminal mit `curl` oder `wget` beziehen:*
```bash
mkdir grabberty && cd grabberty
curl -O https://raw.githubusercontent.com/marcusnebel/grabberty/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/marcusnebel/grabberty/main/nginx.conf

```

### 2. Anwendung starten

Führe im selben Ordner den folgenden Befehl aus, um die Docker-Container im Hintergrund zu starten:

```bash
docker compose up -d

```

Sobald die Container hochgefahren sind, ist die Anwendung auf deinem Server unter Port **6767** (bzw. HTTP) erreichbar:
> `http://localhost` oder `http://DEINE_SERVER_IP`

---

## ⚙️ Konfiguration (Optional)

### Port ändern

Standardmäßig läuft der Nginx-Proxy auf Port `6767`. Falls dieser Port auf deinem Server bereits belegt ist, kannst du den Host-Port in der `docker-compose.yml` unter dem `proxy`-Service anpassen:

```yaml
  proxy:
    image: nginx:alpine
    ports:
      - "6767:80" # Ändere die 6767 auf deinen Wunschport

```

### Logs einsehen

Die Backend-Logs werden automatisch in das Verzeichnis `./logs` auf deinem Host-System geschrieben. Alternativ kannst du die Docker-Live-Logs wie folgt einsehen:

```bash
docker compose logs -f backend

```

---

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Weitere Details findest du in der [LICENSE](https://github.com/MarcusNebel/Grabberty/blob/main/LICENSE)-Datei.
