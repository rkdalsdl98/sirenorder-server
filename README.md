회원가입 루틴 분할  
(이메일 인증코드 요청 -> 인증코드 검증 -> 계정생성 요청)  
결제 루틴 작성  
결제취소 루틴 추가  
결제루틴 분할  
모바일 주문요청 가게에 전달 루틴 작성  
유저측에서 주문현황을 체크할 수 있는 루틴필요  
주문취소 알림 루틴 작성  
조리완료 알림 루틴 작성  
쿠폰발행 루틴 작성  
쿠폰삭제 루틴 작성  
쿠폰모듈로 분할  
쿠폰 사용루틴 작성  
선물하기 루틴 작성  
선물하기 루틴 테스트  
유저에게 알림을 전달 할 수 있는 방법찾기  
Sse 앱과 연동  
Sse 메세지 송, 수신 테스트  
알림루틴 작성  
데이터 초기화시 트랜잭션으로 만료된, 사용된, 폐기기간이 지난 데이터들 삭제하는 루틴 추가  

*해야됨*  

쿠폰 사용방식을 유효한지 판단하고 유효 하다면,
매장에 주문을 보내고 유저에게도 메세지 보내는 형식으로 변경  
RxJS, SSE 공부  
주문부분에서 예외처리가 미숙함  

-------------------------------------------------------------------  


레디스는 다이나믹 모듈로 만들면 오류 발생 Unit 테스트는 기능 추가시 작성 해야 함 레포지토리 데이터 생성 루틴에서 중복으로 인한 오류 체크하고, Accepted로 반환 해주기  

Redis del 함수는 catch 구문이 없다.  
(작성하면 오류남)  

현제 주문취소는 캐시데이터만 삭제하게 해두었고, 포트원에 요청해서 결제취소 루틴은 있긴하나, 실제결제가 아닌 테스트 결제이므로 사용안함   