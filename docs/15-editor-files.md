# 공통 에디터와 NAS 파일

## 에디터

Tiptap 3.32.0의 MIT 오픈소스 패키지를 고정 버전으로 사용한다. RichTextEditor는 JSON 문서와 일반 텍스트를 onChange로 전달한다. RichTextView는 같은 스키마로 검증한 JSON을 React 요소로 출력한다. HTML 문자열을 실행하지 않으며 링크 노드는 현재 에디터에 포함하지 않는다. 본문 이미지는 이미지 삽입 버튼으로 NAS에 업로드한 파일을 커서 위치에 넣는다. 본문 JSON에는 /api/assets/UUID 주소와 대체 텍스트만 저장하며 외부 URL·base64 이미지 문서는 검증에서 거부한다. 굵게/기울임/밑줄/제목/목록/인용/코드와 되돌리기를 지원한다. 브라우저 맞춤법 검사·자동 교정을 끄며 이미지 선택 후 삭제할 수 있다. 본문에서 이미지 삭제는 문서 참조만 제거하고 NAS 파일 삭제는 하지 않는다. 서버 저장 단계에서도 parseRichText 검증을 호출해야 한다. 현재 관리자 소개는 introduction JSON과 summary 일반 텍스트로 화면 상태에 보관하며 DB 저장은 하지 않는다.

## 저장 경로

NAS의 project-oz/uploads/dev와 project-oz/uploads/prod를 분리한다. 개발 PC는 인증된 SMB 공유의 dev 폴더를 STORAGE_ROOT로 지정하고, 운영 컨테이너는 prod만 /app/uploads 등에 마운트해 STORAGE_ROOT로 지정한다. 실제 주소는 개인 .env.local에서만 관리한다. SMB 비밀번호를 소스에 넣지 않는다. 현재 개발 폴더 생성 및 PC 접근을 확인했다. 운영 폴더·볼륨 마운트는 적용하지 않았다.

파일 키는 UTC 연도/월/UUID.확장자다. Asset에 상대 storageKey, 원본 이름, MIME, 크기를 저장한다. 실제 절대 경로는 응답에 포함하지 않는다. DB용 SSH 터널은 SMB 파일 경로를 제공하지 않는다. 집 밖에서는 SMB 접근용 VPN 연결과 계정 권한을 별도로 준비한다.

## 공통 업로드·다운로드

- CommonFileUpload: 이미지 또는 이미지/PDF 선택, 최대 10MB, 서버 처리 상태/실패 안내. 업로드 결과를 콜백으로 전달한다.
- POST /api/assets: 현재는 development + localhost/loopback 호스트 + 동일 Origin만 허용한다. 1초 내 반복 요청을 제한한다. 운영 쓰기는 403이다. 인증 구현 전 운영에서 이 제한을 제거하지 않는다.
- 서버에서 최대 요청 크기, 파일 확장자/MIME/시그니처를 검사한다. PNG/JPEG/WebP/PDF만 허용하며 SVG/HTML/실행 파일은 차단한다. UUID 키와 경로 경계 검사로 임의 경로 접근을 막고 기존 파일을 덮어쓰지 않는다. 파일 저장 후 DB 기록이 실패하면 생성한 파일을 정리한다.
- GET /api/assets/:id: 이미지는 inline, ?download=1이면 원본 이름으로 다운로드한다. PDF는 항상 첨부 다운로드다. nosniff/sandbox/private no-store를 적용한다.
- 공개 조회는 ProjectAsset으로 PUBLIC 프로젝트에 연결된 파일만 허용한다. 로컬 개발에서는 아직 연결하지 않은 업로드를 미리볼 수 있다. 비공개 문의·회원별 첨부 접근은 인증/소유권 검사 도입 전 지원하지 않는다.
- CommonAssetLinks는 이름·크기·다운로드 링크를 공통 출력한다. 프로젝트 조회는 COVER를 썸네일로, ATTACHMENT를 상세 첨부 목록으로 반환한다.
- 썸네일 URL은 http(s) 또는 사이트 내부 경로만 허용한다. 외부 이미지는 서버에서 가져와 저장하지 않고 브라우저에서 표시한다.

## 현재 제한

관리자 프로젝트 저장과 파일 연결은 아직 화면 상태다. 업로드만 NAS와 Asset DB에 실제 저장되므로 취소/새로고침 시에도 파일은 남는다. 자동 고아 파일 정리·삭제·악성 파일 검사·운영 업로드·범용 문서 형식은 미구현이다. 관리자 저장 기능 도입 시 ProjectAsset 연결과 실패/취소 정리를 함께 구현한다.

## 검증

node tests/assets.smoke.mjs는 oz_dev 및 dev 저장 폴더만 대상으로 실제 NAS 업로드/이미지 조회/원본명 다운로드/Origin 및 ID 차단을 검사하고 자신이 생성한 파일과 DB 행만 제거한다. 일반 npm test는 NAS에 쓰지 않는다.

## 2026-10-21 프로젝트 관리자 실제 저장 연결

이 절이 현재 상태다. 프로젝트 관리자는 DB 목록과 한국어/영어 제목·요약·문서, 작업 구분·유형·진행 상태·공개 범위·순서·기술·주제 태그를 편집한다. 저장 버튼은 POST /api/admin/projects로 개발 DB에 실제 저장한다. 본문 이미지·대표 이미지·일반 첨부는 각각 ProjectAsset INLINE/COVER/ATTACHMENT로 같은 트랜잭션에 반영한다. 외부/내부 썸네일 URL은 Project.thumbnailUrl로 저장한다. 기존 파일 원본은 삭제하지 않는다. 영어 제목을 비우면 해당 영어 번역을 제거하고 공개 조회에서 한국어로 대체한다. version과 행 잠금으로 수정 충돌을 차단한다. 코드·본문·파일 존재/형식·URL·크기 검증은 서버에서 수행하며 실패하면 전체 롤백한다.

저장·관리자 조회는 development 및 oz_dev로 제한하며 변경 API는 loopback 호스트·동일 Origin만 허용한다. 운영 관리자 인증·게시판 DB 저장·파일 삭제/고아 정리는 미구현이다. 위의 관리자 프로젝트/파일 연결이 임시 상태라는 설명은 이 절로 대체한다.

표는 TableKit으로 삽입·행/열 추가/삭제·셀 병합/나누기를 지원하며 서버 렌더러도 같은 스키마를 사용한다. CKEditor 5의 GPL/상용 라이선스와 별개로, 현재 구현은 기존 MIT Tiptap을 유지하고 문단 선택·아이콘 서식 툴바를 정리했다.
