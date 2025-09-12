# Духовная линия — PWA пилот (шаги)

## Как запустить локально
1) Распакуйте архив.
2) Откройте `index.html` в браузере (лучше через локальный сервер, например VSCode Live Server).
3) Установите на телефон: «Добавить на главный экран».

## Поток (step-by-step)
- index.html → выбрать роль («Я прихожанин» / «Я батюшка»).
- register.html → ввести имя, email, пароль → «Создать аккаунт».
- home.html → «Записать сообщение» → record.html → удерживать кнопку → предпрослушка → «Отправить».
- Вернуться на home.html, увидеть «Мои сообщения».

Сейчас данные хранятся в localStorage (для пилота).

## TODO (замены на Firebase)
- scripts/register.js → createUserWithEmailAndPassword + Firestore профили.
- scripts/record.js → uploadBytes(Storage) → addDoc(messages) с ссылкой на audioUrl.
- push-уведомления батюшке: Cloud Functions (onCreate) + FCM.
- правила безопасности Firestore/Storage: доступ только участникам треда.
