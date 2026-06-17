-- ====================================================================
-- 027: 이름에 'test'가 들어가는 실모 기록을 silmo_round_scores(대항전 라운드 테이블)로 이전
-- ====================================================================

DO $$
DECLARE
    r RECORD;
    v_schedule_id UUID;
    v_user_uuid UUID;
BEGIN
    -- 1. 'test' (대소문자 무관)가 포함된 silmo_records 데이터를 순회
    FOR r IN 
        SELECT id, user_id, title, type, subject, score, wrong_numbers, is_post_take, created_at 
        FROM public.silmo_records 
        WHERE title ILIKE '%test%'
    LOOP
        -- 2. user_id가 UUID 형식인지 확인하고 적절한 UUID로 캐스팅 시도
        BEGIN
            v_user_uuid := r.user_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            -- 캐스팅 실패 시 (예: 기존의 텍스트 아이디인 경우) 해당 사용자 데이터는 건너뛰거나
            -- auth.users 테이블에 있는 임의의 UUID 매핑이 필요할 수 있습니다.
            -- 여기선 에러 방지를 위해 넘어가거나 auth.users의 실제 ID와 비교해야 합니다.
            CONTINUE;
        END;

        -- 3. 이 test 실모 제목에 매핑되는 전역 일정이 있는지 확인 (없으면 대항전 라운드로 자동 생성)
        SELECT id INTO v_schedule_id 
        FROM public.silmo_global_schedules 
        WHERE title = r.title AND is_round_game = TRUE 
        LIMIT 1;

        IF v_schedule_id IS NULL THEN
            INSERT INTO public.silmo_global_schedules (date, title, type, created_by, is_round_game, created_at)
            VALUES (
                r.created_at::DATE,
                r.title,
                r.type,
                r.user_id,
                TRUE,
                r.created_at
            )
            RETURNING id INTO v_schedule_id;
        END IF;

        -- 4. silmo_round_scores 테이블로 이전 (UNIQUE 제약조건 충돌 방지를 위해 ON CONFLICT 사용)
        INSERT INTO public.silmo_round_scores (schedule_id, user_id, subject, score, wrong_numbers, is_post_take, created_at)
        VALUES (
            v_schedule_id,
            v_user_uuid,
            r.subject,
            r.score,
            r.wrong_numbers,
            COALESCE(r.is_post_take, FALSE),
            r.created_at
        )
        ON CONFLICT (schedule_id, user_id, subject) 
        DO UPDATE SET 
            score = EXCLUDED.score,
            wrong_numbers = EXCLUDED.wrong_numbers,
            is_post_take = EXCLUDED.is_post_take;

        -- 5. 원본 silmo_records 데이터 삭제
        DELETE FROM public.silmo_records WHERE id = r.id;

    END LOOP;
END $$;
