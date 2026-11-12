# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# pixel-gaussian-splat-maker

픽셀아트 3D 가우시안 스플랫 생성 도구. 빌드 없이 정적 파일(`index.html` + `css/style.css` + `js/*.js`)만으로 동작한다(WebGL 2.0, 외부 의존성은 Google Fonts뿐).

## 실행과 확인

- 빌드·린트·테스트 명령은 없다. `open index.html`로 열면 끝이다(`file://`에서 동작).
- 자동 테스트가 없으므로 브라우저 콘솔의 `window.__forge`로 확인한다. `S`, `cam`, `generate`, `pixelize`, `parsePLY`, `parseSplat`, `exportPLY`, `exportSplat`, `buildZip`, `SUBJ`, `draw`, `show(키워드)`가 노출돼 있다.
  - 형태 하나 보기: `__forge.show('용, 얼음')`
  - 스플랫 수 확인: `__forge.generate('검', 0, 24).base.n`
  - 왕복 시험: `__forge.parsePLY(__forge.exportPLY(__forge.S.model, false).buffer)`

## 구조

`index.html`은 마크업만 담고, 스타일은 `css/style.css`, 스크립트는 `js/` 아래 일반 스크립트 8개다. 아래 순서대로 불러오며 순서가 곧 의존 관계다.

| 파일 | 내용 |
| --- | --- |
| `js/core.js` | `$`, 난수(`hashStr`, `mulberry32`, `h3`), 색 변환과 `ramp()` |
| `js/shapes.js` | 형태 도우미와 `SUBJ` |
| `js/generate.js` | `MOOD`, `MODS`, `ACC`, `interpret()`, `wrap()`, `decorate()`, `buildVoxels()`, `generate()` |
| `js/import.js` | `parsePLY()`, `parseSplat()`, `pixelize()` |
| `js/gaussians.js` | `derive()`, `animate()` |
| `js/export.js` | `exportPLY()`, `exportSplat()`, `zipStore()` |
| `js/render.js` | 상태(`S`, `cam`), 셰이더, `sortUpload()`, `draw()`, `frame()`, `invalidate()` |
| `js/app.js` | 모델 갱신, 입력 연결, `save()`, 시작 코드, `window.__forge` |

- ES 모듈이 아니다. `file://`에서 바로 열리도록 일반 `<script>`를 쓰고, 파일들은 전역 스코프의 `const`/`function` 선언을 그대로 공유한다. `import`/`export`나 `type="module"`을 넣지 않는다.
- 그래서 최상위 이름은 파일 사이에서 겹치면 안 되고, `top`·`location`처럼 `window`에 고정된 이름도 최상위 `const`/`let`으로 쓸 수 없다.
- 불러오는 시점에 실행되는 코드는 앞선 파일의 것만 쓸 수 있다. 뒤 파일의 함수는 호출 시점에만 참조한다.

### 주요 함수

- `SUBJ` — 형태 44종. 각 항목의 `make(R)`이 `(x, y, z, i, j, k) => 슬롯(0~4)` 함수를 돌려준다. 좌표는 [-1, 1], Y가 위, 정면은 +Z.
- `MOOD` — 팔레트 16종(슬롯 4색). `MODS` — 변형 7종. `ACC` — 장식 4종.
- `interpret()` — 키워드 해석. 영문 키는 정확히 일치(끝의 `s` 하나는 허용), 한글 1글자 키는 정확히 일치, 한글 2글자 이상은 포함 검사. 토큰은 12개, 형태는 3개까지. 팔레트는 처음 맞은 것만 쓴다.
- `wrap()` / `decorate()` — 변형과 장식 적용. 슬롯 5~7은 장식 전용 색(`EXTRA`).
- `buildVoxels()` — N³ 격자 채우기, 겉면 추출, 법선 기반 3단 명암.
- `derive()` — 격자 → 가우시안(위치·스케일·회전·불투명도) + GPU용 공분산 패킹(스플랫당 float 13개).
- `animate()` — 움직임 8종. 중심만 매 프레임 옮기며 내보내는 파일에는 들어가지 않는다.
- `sortUpload()` / `draw()` — CPU 계수 정렬(뒤→앞) 후 저해상도 FBO에 그리고 최근접 확대.
- `parsePLY()` / `parseSplat()` / `pixelize()` — 3DGS 파일 읽기와 복셀·k-means 픽셀화.
- `exportPLY()` / `exportSplat()` / `zipStore()` — 내보내기.
- `save()` — `window.claude.use('downloads')`가 있으면 그것을, 없으면 `<a download>`를 쓴다.

## 데이터 흐름

두 입력 경로가 같은 `base`(`{ n, pos, col, cell }`)로 모인다.

```
키워드: regenGen() → generate() → interpret → wrap(make(R)) → buildVoxels ┐
파일:   regenFile() → pixelize(S.pts)                                    ┴→ setBase() → rederive() → derive() → S.model → invalidate()
```

- 상태는 `S`(모델·시드·출처 `src: 'gen' | 'file'`)와 `cam` 둘뿐이고, 슬라이더 값은 저장하지 않고 `num(id)` / `chk(id)`로 DOM에서 바로 읽는다.
- 컨트롤이 바뀔 때 다시 계산하는 범위는 세 단계다. 새 컨트롤은 맞는 단계에 연결한다.
  1. 격자가 바뀜(키워드, `n`, 가져오기 설정) → `regenGen()` / `regenFile()`
  2. 가우시안만 바뀜(`size`, `chaos`, `op`) → `rederive()`
  3. 화면만 바뀜(셰이더 유니폼, 카메라) → `invalidate(false)`, 정렬 순서가 달라지면 `invalidate(true)`
- 렌더 루프는 필요할 때만 돈다. `live()`(자동 회전, 움직임, 녹화 중)가 참일 때만 매 프레임 그리고, 아니면 `invalidate()`가 한 프레임만 요청한다.
- 결과는 결정적이다. 시드 = `hashStr(토큰들) ^ nonce`이고 난수는 전부 `mulberry32(seed)`와 `h3()`에서 나온다. 생성 경로에 `Math.random()`을 쓰지 않는다(`rand` 버튼의 키워드 고르기만 예외).

## 규칙

- 새 형태는 24³ 격자에서 가는 부분이 사라지지 않게 한다. 격자 한 칸은 2/N이고, 중심에 놓인 기둥은 반지름² 0.0045 이상이어야 남는다.
- 화면 문구는 한국어. 반응형 기준은 680px(패드), 1080px(데스크톱).
- 색은 `:root` 토큰으로만 쓰고 라이트·다크 둘 다 유지한다.
- 내보내기 포맷(`.ply` float32 17개, `.splat` 32바이트)을 바꾸면 `README.md`와 `buildZip()` 안의 `README.txt` 문구도 같이 고친다.
- 형태·팔레트·변형·장식 개수를 바꾸면 `README.md`와 이 파일의 숫자도 맞춘다.

## 확인되지 않은 것

- 외부 뷰어에서 내보낸 파일 열기, 실제 학습된 3DGS 파일 픽셀화, Safari·Firefox 영상 녹화.
