# 🎮 Vanilla JS + FastAPI 오목(Gomoku) 게임

바닐라 JavaScript와 Python FastAPI 기반의 모던 실시간 오목 웹 게임입니다.

---

## 🌟 주요 기능 및 특징

- **모던 UX/UI**: 다크 글래스모피즘 디자인, 호버 가이드, 3D 착수 애니메이션, 승리 5목 하이라이트
- **Web Audio API sound**: 별도 오디오 자원 없이 브라우저 자체 합성음 재생 (착수, 승리, 패배 등)
- **다양한 대국 모드**:
  - 🤖 **AI 대국 (Single Player)**: 초급, 중급, 고급 (Minimax + Alpha-Beta Pruning)
  - 👥 **로컬 2P (Pass & Play)**: 한 컴퓨터에서 친구와 승부
  - 🌐 **온라인 멀티플레이 (WebSockets)**: 방 코드 생성 및 실시간 2인 대국 & 대화
- **부가 기능**: 무르기 (Undo), 점수판, 승패 자동 판정

---

## 🚀 실행 방법 (Quick Start)

### 1. 파이썬으로 통합 실행 스크립트 실행 (권장)
```bash
# installed Python 3.12 환경에서 바로 실행
& "C:\Users\iborg\AppData\Local\Programs\Python\Python312\python.exe" run_server.py
```
> 스크립트가 가상환경(`venv`) 생성 및 의존성 패키지(`backend/requirements.txt`)를 자동으로 수월하게 구성합니다.

### 2. 브라우저 접속
서버 기동 후 브라우저에서 아래 주소로 접속합니다:
👉 **[http://localhost:8000/](http://localhost:8000/)**

---

## 📂 프로젝트 구조

```text
omok/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 앱 & 라우팅 & Static 파일 서빙
│   │   ├── game_logic.py        # 15x15 오목 승패 판정 알고리즘
│   │   ├── ai.py                # Minimax & 알파베타 가지치기 AI
│   │   ├── websocket_manager.py  # WebSocket 멀티플레이 방 관리자
│   │   └── models.py            # Pydantic 스키마 정의
│   └── requirements.txt         # FastAPI, Uvicorn, WebSockets 의존성
├── frontend/
│   ├── index.html               # 메인 레이아웃 및 UI
│   ├── css/style.css            # 다크 글래스모피즘 CSS 디자인
│   └── js/
│       ├── audio.js              # Web Audio API 효과음 엔진
│       ├── board.js              # Canvas 오목판 렌더러
│       ├── websocket.js          # WebSocket 실시간 통신 클라이언트
│       └── app.js                # 메인 게임 상태 및 컨트롤러
├── run_server.py                # 가상환경 자동 생성 및 통합 실행 스크립트
└── README.md
```
