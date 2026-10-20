# NAS 배포·운영

## 목표 환경과 확인 항목
보유 NAS: Synology DS218+. Synology 공식 Container Manager 적용 모델 목록에 포함된다. 실제 DSM 버전, 설치 가능한 패키지 버전, RAM, 디스크 여유, Compose 명령 지원은 장비에서 확인해야 한다. 이 문서는 장비 실측이나 배포 성공을 주장하지 않는다.
DS218+ 대상 이미지는 linux/amd64. Mac M1에서 만든 arm64 전용 이미지를 그대로 배포하지 않는다. NAS에서는 빌드나 로컬 LLM 추론을 수행하지 않는다.

## Git와 이미지 역할
- Git: 원본 코드, 문서, 설정 템플릿, migration, 변경 이력.
- CI: 고정된 코드로 검사 후 실행 가능한 Docker 이미지를 빌드.
- Registry(GHCR 제안): 빌드한 이미지 저장. Git 저장소와 별개.
- NAS: 이미지를 pull하여 컨테이너로 실행. 운영 데이터는 이미지 밖 영속 볼륨에 저장.

## 기본 배포 흐름
로컬 수정 → PR/MR → main 병합 → CI 검증 → linux/amd64 이미지 빌드 → commit SHA 태그/digest로 registry push → 관리자가 NAS에서 승인된 digest pull → 백업·migration → 앱 교체 → health/로그인 확인.
초기에는 CI 자동 빌드 + NAS 수동 배포. SSH/DSM을 공개 인터넷에 노출하여 CI를 연결하지 않는다. 향후 VPN 또는 제한된 내부 배포 경로로 자동화한다. PR 검증 작업에는 운영 키를 제공하지 않는다.

## 운영 컨테이너
| 서비스 | 역할 | 저장/접근 |
|---|---|---|
| web | Next standalone Node 서버 | 역방향 프록시에서만 접속 |
| db | PostgreSQL | Docker 내부 네트워크, 호스트 포트 없음 |
| migrate | 일회성 schema migration | 같은 릴리스의 도구 이미지, 배포 시만 실행 |
| job | 동일 코드의 CLI 작업 | 스케줄러에서 일회 실행, 별도 공개 포트 없음 |

web runtime 이미지에는 Next standalone 산출물, public, .next/static을 포함한다. migration/작업용 target에는 Prisma CLI·schema·migrations·컴파일된 jobs 코드 등 필요한 도구를 별도로 포함한다. standalone 이미지에 Prisma CLI가 자동 포함된다고 가정하지 않는다. 빌드 캐시와 비밀은 최종 이미지에 넣지 않는다.

DSM이 호스트 프록시라면 web 포트는 127.0.0.1 바인딩을 우선 검증한다. 그 경로가 장비에서 불가능하면 NAS 방화벽으로 접근 주체를 제한한다. 공개하는 것은 사이트 HTTPS뿐이며 DB 5432, Node 3000, DSM/SSH 관리 포트를 인터넷에 공개하지 않는다.

## 영속 저장 경로 예시
실제 공유폴더 위치는 장비에서 확정한다.
| NAS 디렉터리 예시 | 내용 |
|---|---|
| /volume1/docker/personal-site/postgres | DB 데이터, 선택한 PostgreSQL 이미지 버전에 맞는 mount target 확인 |
| /volume1/docker/personal-site/uploads | 공개 이미지·비공개 첨부 별도 하위 경로 |
| /volume1/docker/personal-site/backups | 논리 DB dump와 파일 백업 |
| /volume1/docker/personal-site/config | 운영 env, 접근 제한 |

컨테이너 재생성은 DB/첨부를 지우지 않아야 한다. 단순 RAID나 같은 NAS 내부 백업만으로 장애 복구를 보장하지 않는다. 암호화한 외장/외부 백업 사본을 별도 위치에 유지한다.

## 실제 배포 순서
1. 고정 릴리스 digest와 변경 내역 확인. 자동 작업 잠시 중지.
2. DB pg_dump 및 업로드 스냅샷/증분 백업. 실행 중 pgdata 폴더 복사만으로 일관된 백업이라고 간주하지 않는다.
3. 새 web/migrate/job 이미지 pull, 디스크 여유 확인.
4. `migrate deploy`를 일회 실행하고 성공 종료를 확인. DB healthcheck와 재시도 포함.
5. 호환되는 변경이면 web을 새 digest로 재생성. 비호환 변경은 사전 유지보수와 확장/축소 계획 적용.
6. liveness, DB readiness, 공개 목록, 로그인, 관리자, 비공개 문의 차단 확인.
7. 작업 재개, 실행 오류·메모리·디스크 확인, 릴리스 기록.

Dockerfile/Compose가 구현되면 위 단계는 deploy runbook의 실제 명령으로 확정한다. 단일 컨테이너 교체는 짧은 중단 가능성이 있다. 무중단 배포를 약속하지 않는다.

## 복구
- 앱 실패: 호환되는 이전 digest로 되돌린다. 이전 migration과 호환되는지 먼저 확인.
- migration 실패: 트래픽을 열지 않고 로그 확인, migration 상태 해결/forward fix. migrate reset 금지.
- 데이터 손상: 별도 DB에 백업 복원 → 무결성·첨부 링크 확인 → 전환. 이미지 롤백으로 DB를 되돌릴 수 없다.
- 제안 백업 목표: 일일 7개 + 주간 4개, RPO 최대 24시간/RTO 4시간 목표. 실제 복원 훈련 전 보장값 아님.
- 첫 공개 전 복원 연습, 이후 월 1회 검증. 메모리 사용량·오류율·작업 실패·디스크 여유·인증서 만료 점검.

## 도메인/접속 미정
도메인, HTTPS 인증서, DDNS/고정 IP, 공유기 포트포워딩 가능 여부, CGNAT 여부를 확인한다. 포트포워딩 불가 환경은 터널/외부 호스팅을 검토한다. 공인 도메인과 OAuth 콜백을 확정한 뒤 인증 공급자를 설정한다.
