FROM node:18

WORKDIR /usr/src/app/

RUN apt-get update; \
		apt-get install -y apt-utils redis-server nano curl git locales;

# 깃 설정 값

RUN git config --global user.name KangMins
RUN git config --global user.email rkdalsdl98@naver.com

# 언어 추가
RUN localedef -i ko_KR -f UTF-8 ko_KR.UTF-8
RUN localedef -i en_US -f UTF-8 en_US.UTF-8
ENV LANG en_US.utf8

# RUN git init
# RUN git remote add origin https://github.com/rkdalsdl98/sirenorder-server.git
# RUN git clone https://github.com/rkdalsdl98/sirenorder-server.git

# 서버 환경 변수

ENV DATABASE_URL="postgresql://{username}:{password}@{ip or service}:5432/postgres"

ENV SERVER_IP=127.0.0.1
ENV SERVER_IP_DEV=127.0.0.1
ENV SERVER_PORT=80

ENV SOCKET_PORT=81

ENV REDIS_PORT=6379
ENV REDIS_TTL=60

ENV EMAIL_HOST=smtp.gmail.com
ENV EMAIL_FROM_USER_NAME=SirenOrder
ENV EMAIL_TTL=180
ENV AUTH_PASSWORD=auth-pass
ENV AUTH_EMAIL=auth-email

ENV AUTH_ITERATION=iteration
ENV AUTH_KEY_LEN=len
ENV AUTH_ALGORITHM=algorithm
ENV AUTH_ENCODING=encoding
ENV AUTH_BUFFER_ENCODING=buffer-encoding

ENV JWT_EXPIRATION=60
ENV JWT_SECRET=jwt-secret

ENV IMP_KEY=imp-key
ENV IMP_SECRET=imp-secret


ENV COUPON_SECRET=coupon-secret

ENV SERVER_SECRET=server-secret

COPY . .

# 컨테이너 로드 중 실행 될 기타 명령어

RUN npm install
RUN npm run build

RUN npx prisma generate
# CMD ["node", "dist/src/main.js"]