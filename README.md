# Formatter Workbench

**HTML + CSS + JavaScript**로 만든 영어 UI의 브라우저 포맷터입니다. React나 앱 번들러 없이 정적 파일로 실행됩니다.

## 실행

Node.js 22 이상에서 설치·빌드 없이 실행:

```sh
npm run dev
```

주소: http://127.0.0.1:5174

`python3 -m http.server 5174`도 사용할 수 있습니다. ES 모듈과 Web Worker를 사용하므로 HTTP 서버가 필요합니다.

## 지원 형식 및 옵션

JSON, XML, HTML, CSS, SCSS, JavaScript, TypeScript, YAML, Markdown, SQL, JSON5, GraphQL의 **12가지 형식**을 선택할 수 있습니다.

| 범위 | 옵션 |
| --- | --- |
| 공통 | 2·4·8칸 또는 탭 들여쓰기, 목표 줄 너비 40–240, LF·CRLF, 마지막 줄바꿈 |
| JSON | 재귀 키 정렬, Compact JSON 압축 |
| XML | 공백 보존·엄격 보존·재정렬, 속성 정렬·따옴표·줄바꿈, self-closing 태그 공백 |
| JavaScript·TypeScript | 따옴표, 세미콜론, 후행 쉼표, 중괄호 내부 공백 |
| HTML | 공백 처리, 속성별 줄바꿈, 내장 코드 포맷 |
| Markdown | 문단 줄바꿈, 코드 블록 포맷 |
| SQL | Standard·PostgreSQL·MySQL·SQLite·SQL Server·BigQuery·Snowflake·PL/SQL 방언, 키워드 대소문자 |
| YAML·JSON5 | 따옴표 및 JSON5의 후행 쉼표 |

입력창 하나에서 코드를 편집하고 **Format** 버튼을 누르면 같은 창의 내용이 정렬 결과로 바뀝니다. 파일 업로드·드롭, 확장자에 따른 형식 선택, 형식별 예제, 현재 내용 복사·다운로드, Ctrl+Enter / ⌘+Enter, 화면 내 긴 줄바꿈을 지원합니다.

옵션은 Format 또는 Compact JSON을 누를 때 적용됩니다. 정렬에 실패하면 입력 내용은 그대로 보존하며, 현재 내용을 복사하거나 다운로드할 수 있습니다.

## 처리 방식과 범위

- 입력은 1 MiB까지 지원하며 Web Worker에서 처리합니다. 15초를 넘는 작업은 종료합니다.
- 라이브러리는 `vendor/`에 포함되며 필요한 파서만 로드합니다. 외부 CDN·API 요청이나 입력 저장은 없습니다.
- **“Your input is not sent to a server.”** 문구가 표시됩니다. HTML·JavaScript 입력은 실행하지 않고 텍스트로 취급합니다.
- JSON 정렬·압축은 숫자 리터럴, 중복 키, 배열 순서를 유지합니다. `JSON.parse`는 검증에만 사용합니다.
- XML은 기본적으로 텍스트 공백을 보존합니다. **Reindent all**은 혼합 콘텐츠의 의미 있는 공백을 바꿀 수 있습니다.
- 줄 너비는 목표값이며 긴 문자열이나 문법에 따라 초과할 수 있습니다. SQL 포맷은 쿼리 검증을 대신하지 않습니다.
- CRLF는 화면 표시와 별도로 보관해 다운로드·클립보드에 적용합니다.

## Cloudflare Pages

| 설정 | 값 |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 이 폴더 자체라면 비워둠, 상위 저장소라면 `formatter` |
| Node.js | `.node-version`의 24 |

`build`는 정적 파일과 `vendor/`를 `dist/`에 복사합니다. 런타임 npm 패키지나 서버는 필요하지 않습니다. `_headers`로 CSP 등 보안 헤더를 적용합니다.

```sh
npm run build
npx wrangler pages deploy dist --project-name formatter-workbench
```

본인의 프로젝트 이름에 맞게 `wrangler.jsonc`의 `name`과 명령을 수정하세요.

## 검증 및 라이브러리 갱신

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`vendor/`는 저장소에 포함됩니다. 버전은 `vendor/versions.json`, 라이선스는 `vendor/licenses/`에 있습니다. npm 의존성은 개발·테스트·라이브러리 갱신용입니다. 갱신할 때만 `npm run vendor`를 실행한 후 테스트·빌드를 수행하세요. 이 명령은 XML·SQL 라이브러리를 브라우저용 ES 모듈로 묶으며 앱 코드는 번들링하지 않습니다.

기반 라이브러리: [Prettier browser API](https://prettier.io/docs/browser), [XML 플러그인](https://github.com/prettier/plugin-xml), [SQL Formatter](https://github.com/sql-formatter-org/sql-formatter).

## 구조

- `index.html`, `styles.css`, `app.js`: 화면·옵션·파일 입출력
- `lib/formats.js`, `lib/format.js`: 형식 정의·예제·포맷 엔진
- `formatter.worker.js`: 로컬 포맷 작업
- `vendor/`, `assets/`: 자체 호스팅 라이브러리·폰트·라이선스
- `scripts/`: 정적 서버, 배포 파일 복사, vendor 갱신

## 서드파티 라이선스

[THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)에 배포 구성과 고지 파일을 정리했습니다. 실제 번들에 포함된 7개 npm 패키지의 버전·라이선스·원문 위치는 `vendor/manifest.json`에 기록됩니다. Prettier의 내부 의존성은 upstream의 `THIRD-PARTY-NOTICES.md` 전체를 함께 배포합니다. 폰트·아이콘 고지는 `assets/licenses/`, 라이브러리 고지는 `vendor/licenses/`에 있습니다.

`npm run vendor`는 esbuild가 기록한 실제 번들 입력을 기준으로 LICENSE·NOTICE·AUTHORS·THIRD-PARTY-NOTICES를 복사합니다. 원문 라이선스나 Prettier 내부 의존성 고지가 없으면 실패합니다. 개발 전용 패키지의 라이선스를 런타임 의존성으로 잘못 나열하지 않습니다. 이 문서는 앱 자체의 소스코드에 오픈소스 라이선스를 부여하지 않습니다.
