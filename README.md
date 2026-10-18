# VOIDROLL : RENEWAL
모바일 브라우저 오라 굴림 게임. `main` 브랜치에 푸시하면 Cloud Run이 Dockerfile로 자동 빌드·배포합니다.

## 구성
- `js/data.js` — 리뉴얼 오라·날씨·재료·물약·퀘스트
- `js/classic-auras.js` — 원작 VOIDROLL 오라 191종 (매지컬 걸·여름 축제·v22 포함)
- `js/classic-data.js` — 원작 시스템 데이터 (상위 등급, 날씨 4종+해변, 원작 재료·물약 상점, 제작 장비, 코드·관리자 권한, 도전 과제, 여름 축제, 오라 스킬)
- `js/render.js` — 캔버스 연출 (날씨, 주인공, 오라 이펙트, 컷신)
- `js/game.js` — 게임 로직·UI
- `manifest.json`, `sw.js` — 홈 화면 설치·오프라인 지원
