## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Авторизация

Перейдите по адресу /hh/authorize и выдайте доступ интеграции. Далее интеграция автоматически сохранит ключ и пропишет вебхук для приема запросов.

## .env

- `HH_CLIENT_ID` - client_id из hh.ru
- `HH_CLIENT_SECRET` - client_secret из hh.ru
- `PORT` - сетевой порт, на котором будет слушать сервис (по умолчанию 3999)
- `BASE_URL` - внешний URL сервиса (настройте reverse proxy через Traefik или Nginx с SSL сертификатом) - например `https://mshh.getamo.ru`
- `WEBHOOK_URL` - ссылка, на которую будут отправляться обработанные хуки об откликах - например `https://tglk.ru/in/lPomoh78pipznyZ5`
- `пше ` - ссылка на API hh.ru (по умолчанию `https://api.hh.ru`)

## token.json

Файл необходим для хранения access и refresh токенов для API HeadHunter.
В поле `expiresIn` хранится время истечения срока жизни токена доступа в формате Unix timestamp.