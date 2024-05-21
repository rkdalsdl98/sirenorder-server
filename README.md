<h2>📚 STACKS</h2>
<div>
  <img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white">
</div>  
<div>  
    <img src="https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"> <img src="https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white"> <img src="https://img.shields.io/badge/redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
</div>  
<div>  
    <img src="https://img.shields.io/badge/githubactions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"> <img src="https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
</div>   
<div>  
  <img src="https://img.shields.io/badge/socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white"> <img src="https://img.shields.io/badge/Nestia-E0234E?style=flat-square"> <img src="https://img.shields.io/badge/Typia-critical?style=flat-square"> <img src="https://img.shields.io/badge/JWT-yellow?style=flat-square"> <img src="https://img.shields.io/badge/NodeMailer-brightgreengreen?style=flat-square"> <img src="https://img.shields.io/badge/SSE-important?style=flat-square">
</div>  

## 1 Features  

### 1.1 User (APP)  
* 전체 메뉴, 나만의 메뉴 페이지 구현  
* 쿠폰함 페이지 구현  
* 쿠폰 선물하기, 등록하기, 사용하기 기능 구현  
* 선물함 페이지 구현  
* 선물 상세 페이지 구현  
* 구매 내역 페이지 구현  
* 주문하기 페이지 구현  
* 회원가입, 로그인 페이지 구현  

[APP Repository 이동하기](https://github.com/rkdalsdl98/sirenorder-app)

### 1.2 Store (Desktop APP)  
* 로그인, 회원가입 페이지 구현  
* 서버와 Socket.IO 연동 구현  
* 들어온 주문을 실시간으로 확인 할 수 있는 주문 알림과 수락한 주문을 관리 할 수 있는 주문 목록 페이지 구현  
* 서버와의 연결 상태를 실시간으로 알 수 있는 상태 표시 구현  

[Desktop Repository 이동하기](https://github.com/rkdalsdl98/sirenorder-desktop)

### 1.3 Server  
* JWT 토큰 인증 파이프 구현  
* NodeMailer를 이용한 메일 인증 구현  
* 요청부터 응답까지의 시간, 요청 Route, 결과, 이유 등을 기록하는 로그구현  
* Socket.IO를 사용해 상인과의 통신 프로토콜 구현  
* SSE와 rxjs를 사용해 실시간 알림 서비스 구현  
* PortOne API로 실 결제 테스트 환경 구현  
* Nestia Swagger를 사용해 API 문서화  

## 2 Diagrams  

> 이미지를 클릭하시면 확대해서 보실 수 있습니다.  

<div align="cetner">
  <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/134096be-e23a-41a3-b4ea-28a4cf9530dd" width="355" height="200">  
  <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/15e379b9-b262-442f-86b6-5790d4bbc1e7" width="355" height="200"> 
  <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/5677be6d-c319-471a-92a3-1408ea39dfcc" width="355" height="200"> <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/c2389ff4-adab-4527-8bef-8cfded265e09" width="355" height="200">  
  <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/6f60c0e1-cfcb-4ea2-80ec-186335af077b" width="355" height="200"> <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/77210c80-42cb-4c76-aa29-082cd135f142" width="355" height="200">   
  <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/4afaa450-ee98-473e-b1a4-7f55fe6c2340" width="355" height="200">  
  <img src="https://github.com/rkdalsdl98/sirenorder-server/assets/77562358/86cdfea0-bfff-4b20-ab51-98b074872daf" width="355" height="200">
</div>  

## 3 CI/CD  
* GitHub Action (CI)  
* Docker (CD)  

### 부가적인 내용  
> 현제 git action은 빌드 테스트와 그 결과를 slack에 메세지를 보내주는 형태만 취해 있습니다.  

## 업데이트  

+ 요청의 결과를 txt 파일 형태로 기록하는 기능  