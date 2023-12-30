<div>
    <h1>SirenOrder-Server</h1>
</div>  

# 💡 Topic

스타벅스 사이렌 오더 기능을 직접 구현해보고 코드 구성과 인프라 구성등을 더욱 발전시켜보자  

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
* 회원가입시 NodeMailer와 Redis 캐싱을 이용한 메일 인증
* AccessToken, RefreshToken을 사용해 보안성 증가와 서버 부하감소
* SSE 방식으로 서버의 상태와 실시간 알림(주문상태, 공지사항 등등)을 받음  

### 1.2 Store (Desktop APP)  
*  Socket.IO를 이용한 통신으로 실시간 주문요청, 주문정보 조회, 서버와의 재연결 요청  

## 2 DB  

### 2.1 Diagram (업로드 예정)  

## 3 CI/CD  
* GitHub Action (CI)
* Docker (CD)  
### 부가적인 내용  
> 현재 git action은 빌드 테스트와 그 결과를 slack에 메세지를 보내주는 형태만 취해 있으며 Docker또한 환경설정이 되어 있지 않습니다. -2023.12.30  


### 클라이언트 레포지토리 이동하기  
[https://github.com/rkdalsdl98/sirenorder-app](모바일 앱)  
[https://github.com/rkdalsdl98/sirenorder-desktop](데스크톱 앱)