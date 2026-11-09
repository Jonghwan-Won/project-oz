# 기술 아이콘

- 사용자 제공 원본: 외부 `기술스택 로고` 폴더. 원본은 수정하지 않고 필요한 파일만 복사한다.
- Icons8 PNG: 무료 사용에 대한 출처 링크를 기술스택 화면에 표시한다. https://icons8.com/license
- AWS S3: Simple Icons 11.15.0의 amazons3.svg. 함께 보관한 CC0 라이선스 참조. https://github.com/simple-icons/simple-icons/tree/11.15.0
- Spring Framework: 사용자 파일 springboot-initializer.svg 내부 title은 spring-icon이며 일반 Spring 잎 로고다.
- Tiptap: 사용자 확인에 따라 WF64GZHY_200x200.jpg를 연결한다.
- SVN: 사용자 지정 Apache_Subversion-Logo.wine.svg를 사용한다.
- 그 외 사용자 제공 SVG·이미지의 개별 원본 출처·사용 조건은 추가 기록이 필요하다.
- Nexacro AI는 웹에 배포하지 않는다. SVG 또는 PNG 준비 전까지 약자 표시를 유지한다.

아이콘 파일 추가 후 src/lib/technology-icons.ts에 기술명과 경로를 연결한다. 등록하지 않은 기술은 약자로 표시한다.

## PlanB 추가 아이콘

- Swagger.svg, jwt.png, portone.png: 사용자가 다운로드 폴더에 제공한 원본에서 복사.
- Vuetify: 사용자 지정 공식 브랜드 이미지 https://cdn.vuetifyjs.com/docs/images/brand-kit/v-logo-atom.svg
- Vuex: 사용자 지정 이미지 URL https://i.namu.wiki/i/zJNaE19eY-AkwlV7gqW8dZTTgtx1lYPMSdNeqKSPiku11FzLyIlxvWxCpDJk6CowiFtmQ876hkJWFli-wYdloQ.webp
- 위 이미지의 개별 사용 조건은 추가 확인이 필요하다.

## 기호만 잘라 낸 아이콘

- jpa-mark.png, jsp-mark.png, mssql-mark.png: 같은 폴더의 사용자 제공 원본(jpa.png, jsp.png, mssql.png)에서 글자를 빼고 기호 부분만 잘라 256px 투명 배경으로 만든 파일이다. 32px 타일에서 글자 위주 로고가 읽히지 않아서다.
- svn-mark.svg: 사용자 지정 svn.svg에서 "Subversion" 글자 경로를 빼고 기호(사각형+곡선)만 남겼다.
- 원본은 그대로 보관한다. 되돌리려면 src/lib/technology-icons.ts의 경로만 바꾸면 된다.
