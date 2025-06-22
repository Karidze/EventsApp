# EventsApp

EventsApp to mobilna aplikacja stworzona w React Native z wykorzystaniem Expo. Umożliwia zarządzanie wydarzeniami – dodawanie, przeglądanie, edytowanie i usuwanie wydarzeń. Aplikacja korzysta z lokalnego przechowywania danych i działa również w trybie offline.

## Funkcjonalności

- Rejestracja i logowanie użytkownika (tymczasowo bez Firebase)
- Dodawanie nowych wydarzeń
- Przeglądanie wydarzeń (w tym przeszłych)
- Usuwanie wydarzeń
- Oznaczanie wydarzeń jako zakończone
- Nawigacja między ekranami
- Tryb offline (AsyncStorage)
- Obsługa błędów (walidacja formularzy)
- Przejrzysty interfejs użytkownika

## Użyte technologie

- React Native (Expo SDK 53)
- React Navigation
- AsyncStorage
- TypeScript
- Styled Components
- Jest + React Native Testing Library

## Struktura folderów

```
├── App.tsx
├── components/
│   └── EventItem.tsx
├── screens/
│   ├── AddEventScreen.tsx
│   ├── EventDetailsScreen.tsx
│   └── HomeScreen.tsx
├── context/
│   └── EventsContext.tsx
├── test/
│   └── Example.test.tsx
├── utils/
│   └── storage.ts
```

## Instalacja i uruchomienie

```bash
git clone https://github.com/Karidze/EventsApp/
cd EventsApp
npm install
npx expo start
```

## Testowanie

```bash
npm run test
```

## Tryb offline

Wydarzenia są przechowywane w pamięci lokalnej urządzenia za pomocą `AsyncStorage`. Dzięki temu użytkownik ma dostęp do listy wydarzeń nawet bez połączenia z internetem.

## Bezpieczeństwo

Aplikacja nie przechowuje danych wrażliwych. W przyszłości zalecane jest zastosowanie `react-native-keychain` lub `expo-secure-store`.

## Dokumentacja kodu

Kod zawiera komentarze opisujące logikę najważniejszych komponentów i funkcji. Testy jednostkowe znajdują się w folderze `test`.

## Autors

Oleksandra Volina, Illia Kozynets, Vladyslav Shtepan
