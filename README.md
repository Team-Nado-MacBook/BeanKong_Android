# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

<br>
<br>
<br>

---

# 빈콩 사용자 매뉴얼 💾

빈콩(BinKong)은 사용자의 현재 위치를 기반으로 대학교 내에서 이용 가능한 빈 강의실 정보를 **가장 가까운 순서**로 빠르게 찾아주는 모바일 서비스입니다.

별도의 디자인과 플로우를 대폭 줄이고 **아주 빠르게 비어 있는 강의실 정보**를 확인할 수 있습니다.

---

## 1. 메인 화면 및 빈 강의실 바로보기 🔍

앱을 실행했을 때 가장 먼저 보이는 화면입니다. 사용자의 위치 정보와 사용 시간대에 기반하여 빈 강의실 정보를 제공합니다.

### 1.1. 빈 강의실 리스트 🏫

- 메인 화면에는 사용자의 현재 위치와 시간을 기준으로 대학교의 **빈 강의실 리스트**가 표시됩니다.
- 빈 강의실 리스트는 거리순으로 정렬 되어있어, 가까운 강의실을 즉시 파악할 수 있습니다.
  (위치 권한이 없는 경우 건물명을 기준으로 정렬 됩니다.)

### 1.2. 조건 설정 및 검색 결과 정렬 🗂️

| **기능**             | **위치**         | **설명**                                                                                                |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| **다음 수업**        | 화면 상단 좌측   | **내 시간표**를 기준으로, 현재 시각 이후의 **다음 수업 정보**를 보여줍니다.                             |
| **가까운 빈 강의실** | 화면 상단 우측   | 현재 위치에서 가장 가까운 **빈 강의실의 위치**를 보여줍니다.                                            |
| **조건 설정**        | 화면 중앙        | **시작 시간**, **사용 시간**, **콘센트 여부**를 설정해 강의실 선택 조건을 선택합니다. (기본값 자동설정) |
| **결과 표시**        | 빈 강의실 리스트 | 설정한 조건(`사용 시작 시간`·`사용 시간`)을 만족하는 **사용 가능한 빈 강의실**을 필터링해 표시합니다.   |
| **정렬 기준**        | 빈 강의실 리스트 | 빈 강의실은 사용자로부터 **거리 기준으로 가까운 순서대로** 자동 정렬됩니다.                             |

> ℹ️ **내 시간표가 등록되지 않은 경우**  
> 화면 상단에는 다음 수업 | 가까운 빈 강의실 대신 `시간표를 추가하세요` 안내 컴포넌트가 표시되며, 여기에서 시간표를 등록할 수 있습니다.

---

## 2. 강의실 상세 정보 확인 📑

메인 화면에서 빈 강의실의 **상세보기>** 버튼을 눌러 그 **강의실 시간표**와 **강의실 정보(수용인원, 콘센트 정보)**를 확인할 수 있습니다.

---

## 3. 지도 탭 활용 🗺️

지도 탭을 통해 캠퍼스 전체의 강의실 위치와 이용 가능 여부를 시각적으로 확인할 수 있습니다.

- 앱 하단의 **`지도` 탭**을 클릭하여 지도 화면으로 이동합니다.
- 지도에서 각 **건물의 실제 위치**를 확인할 수 있습니다.
- 지도를 통해 건물 별 강의실 목록을 쉽게 파악할 수 있습니다.

메인 화면으로 다시 돌아가려면 하트 탭을 누르세요.

---

## 4. 즐겨찾기 (선호 강의실 등록) ⭐

자주 이용하거나 확인이 필요한 강의실을 즐겨찾기에 등록하여 접근성을 높일 수 있습니다.

### 4.1. 즐겨찾기 등록/해제 방법

즐겨찾기는 다음 위치에서 등록/해제 할 수 있습니다.

1. **상세 페이지 이용:** 상세보기> 버튼 클릭하여 진입한 **강의실 상세 페이지**에서 화면 하단의 `즐겨찾기에 추가` 버튼을 눌러 즐겨찾기를 등록합니다.
   > 즐겨찾기에 이미 등록되어 있을 시 `즐겨찾기에서 제거` 버튼을 눌러 즐겨찾기를 해제합니다.
2. **즐겨찾기 목록 이용:** 즐겨찾기 화면에서 강의실 카드의 별 버튼을 눌러 즐겨찾기를 해제/재등록 합니다.

### 4.2. 즐겨찾기 확인

- 즐겨찾기에 등록된 강의실은 **메인 화면**에서 우측 상단의 별을 누르면 모아서 확인할 수 있습니다.

---

## 5. 내 시간표 ⏰

우측 상단의 달력을 눌러 내 시간표를 확인할 수 있습니다.

### 5.1. 내 시간표에 강의 추가

**내 시간표 화면**의 우측 하단의 동그라미를 누르면 수업을 내 시간표에 선택할 수 있습니다.

수업은 **강의명**이나 **강의코드**로 검색할 수 있습니다.

### 5.2. 내 시간표의 강의 삭제

하단의 **내 시간표 목록**에서 **삭제하기 >** 버튼을 눌러 내 시간표의 강의를 삭제할 수 있습니다.
