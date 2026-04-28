-- 계정 탈퇴(삭제)를 위한 RPC (Remote Procedure Call) 함수 생성
-- 이 함수는 클라이언트에서 `supabase.rpc('delete_my_account')` 형태로 호출됩니다.

create or replace function delete_my_account()
returns void
language plpgsql
security definer -- 이 함수가 생성자의 권한(일반적으로 postgres/supabase_admin)으로 실행되도록 하여 auth.users에 접근 가능하게 함
as $$
begin
  -- auth.users 테이블에서 현재 요청한 유저의 ID를 찾아 삭제합니다.
  -- Supabase의 외래 키(ON DELETE CASCADE) 설정에 의해 
  -- user_books와 reading_sessions에 있는 해당 유저의 데이터도 함께 영구 삭제됩니다.
  delete from auth.users where id = auth.uid();
end;
$$;
