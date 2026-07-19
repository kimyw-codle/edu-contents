-- ============================================
-- 입주 프로젝트 - Supabase 초기 설정
-- Supabase Dashboard → SQL Editor에서 실행
-- ============================================

-- 1. 테이블 생성
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  estimated_cost INTEGER,
  actual_cost INTEGER,
  related_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  actual INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fund_sources (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  source TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  last_updated DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_images (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT,
  upload_date DATE NOT NULL,
  related_task_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 정책 (2인 개인 프로젝트 → 전체 허용)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "전체 허용" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "전체 허용" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "전체 허용" ON fund_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "전체 허용" ON gallery_images FOR ALL USING (true) WITH CHECK (true);

-- 3. 실시간 동기화 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE fund_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_images;

-- 4. 초기 데이터: 할 일
INSERT INTO tasks (id, category, title, description, deadline, completed, estimated_cost, actual_cost) VALUES
('contract-1', 'contract', '약정서 작성 - 매도인에게 약정금 전달', '약정금 4,000만원 매도인에게 전달', '2026-07-04', true, 4000, 4000),
('contract-2', 'contract', '토허제 거래 신고 (법무사 대행)', '법무사 대행료 20만원 입금', '2026-07-06', true, 20, 20),
('contract-3', 'contract', '토허제 허가 발급', NULL, '2026-07-16', true, NULL, NULL),
('contract-4', 'contract', '계약서 작성 - 계약금 납부', '계약금 9,000만원 (약정금 4,000만원 제외 5,000만원 추가 납부)', '2026-07-25', false, 5000, NULL),
('contract-5', 'contract', '매매 집 실측', '인테리어를 위한 실측 진행', '2026-07-28', false, NULL, NULL),
('contract-6', 'contract', '중도금 납부', '중도금 2억 6,000만원 납부', '2026-09-28', false, 26000, NULL),
('contract-7', 'contract', '잔금 납부', '잔금 5억 8,000만원 납부', '2026-10-27', false, 58000, NULL),
('contract-8', 'contract', '소유권 이전 등기', '잔금 납부와 동시에 소유권 이전 등기 진행', '2026-10-27', false, NULL, NULL),
('contract-9', 'contract', '전입신고', '입주 후 14일 이내 전입신고', '2026-10-28', false, NULL, NULL),
('finance-1', 'finance', '대출 가능 금액 확인', '은행 방문 또는 온라인으로 대출 한도 조회', '2026-07-25', false, NULL, NULL),
('finance-2', 'finance', '대출 필요 서류 준비', '소득증명원, 재직증명서, 등기부등본, 매매계약서 등', '2026-08-15', false, NULL, NULL),
('finance-3', 'finance', '대출 상담 및 신청', '은행 대출 상담 후 주담대 신청', '2026-09-01', false, NULL, NULL),
('finance-4', 'finance', '대출 승인 확인', '대출 승인 여부 및 실행일 확인 (잔금일 전 완료 필수)', '2026-09-20', false, NULL, NULL),
('tax-1', 'tax', '취득세 납부', '잔금 납부일 기준 60일 이내 납부. 약 2,790만원 예상', '2026-10-30', false, 2790, NULL),
('tax-2', 'tax', '중개수수료(복비) 납부', '부동산 중개수수료 납부', '2026-10-27', false, 600, NULL),
('interior-1', 'interior', '인테리어 레퍼런스 수집', '원하는 스타일, 사진, 참고 자료 모으기', '2026-07-31', false, NULL, NULL),
('interior-2', 'interior', '인테리어 업체 리서치 및 견적 요청', '3곳 이상 업체에 견적 요청', '2026-08-10', false, NULL, NULL),
('interior-3', 'interior', '인테리어 업체 미팅', '업체별 미팅 및 견적 비교', '2026-08-20', false, NULL, NULL),
('interior-4', 'interior', '인테리어 업체 선정 및 계약', '최종 업체 선정 후 계약 진행', '2026-08-31', false, 5000, NULL),
('interior-5', 'interior', '인테리어 공사 진행 상황 확인', '정기적으로 현장 방문 및 진행 상황 체크', '2026-09-15', false, NULL, NULL),
('interior-6', 'interior', '인테리어 공사 완료 확인 / 하자 체크', '최종 시공 확인 및 하자 점검', '2026-10-20', false, NULL, NULL),
('appliance-1', 'appliance', '냉장고 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-2', 'appliance', '식기세척기 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-3', 'appliance', '인덕션 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-4', 'appliance', '세탁기 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-5', 'appliance', '건조기 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-6', 'appliance', '에어컨 2in1 (스탠드) 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-7', 'appliance', '에어컨 벽걸이 구입', NULL, '2026-10-01', false, NULL, NULL),
('appliance-8', 'appliance', '가전 배송일 조율', '인테리어 공사 완료 후 배송일 조율', '2026-10-15', false, NULL, NULL),
('moving-1', 'moving', '이사업체 예약', NULL, '2026-09-15', false, 100, NULL),
('moving-2', 'moving', '짐 정리 및 포장', NULL, '2026-10-15', false, NULL, NULL),
('moving-3', 'moving', '인터넷/TV 이전 신청', NULL, '2026-10-10', false, NULL, NULL),
('moving-4', 'moving', '우편물 주소 변경', NULL, '2026-10-27', false, NULL, NULL);

-- 5. 초기 데이터: 지출 항목
INSERT INTO expenses (id, item, amount, sort_order) VALUES
('exp-1', '집값', 93000, 0),
('exp-2', '취득세', 2790, 1),
('exp-3', '부동산 중개수수료', 600, 2),
('exp-4', '이사 부대비용', 1500, 3),
('exp-5', '이사비', 100, 4),
('exp-6', '리모델링(인테리어)', 5000, 5);

-- 6. 초기 데이터: 자금 출처
INSERT INTO fund_sources (id, owner, source, amount, last_updated, sort_order) VALUES
('fund-1', '주영', '일반주식', 6400, '2026-07-01', 0),
('fund-2', '주영', '퇴직연금', 9269, '2026-07-01', 1),
('fund-3', '주영', '현금', 3000, '2026-07-01', 2),
('fund-4', '주영', '청약통장', 700, '2026-07-01', 3),
('fund-5', '주영', '신용대출', 2400, '2026-07-01', 4),
('fund-6', '주영', '가계약금 (납부완료)', 4000, '2026-07-04', 5),
('fund-7', '주영', '주담대', 59150, '2026-07-01', 6),
('fund-8', '주영', '회사 대출', 5000, '2026-07-01', 7),
('fund-9', '주영', '부모님 대출', 5000, '2026-07-01', 8),
('fund-10', '주영', '기타', 1000, '2026-07-01', 9),
('fund-11', '예원', '일반주식', 7300, '2026-07-01', 0),
('fund-12', '예원', '퇴직연금', 920, '2026-07-01', 1),
('fund-13', '예원', '청약통장', 700, '2026-07-01', 2),
('fund-14', '예원', '대출', -900, '2026-07-01', 3);

-- ============================================
-- Storage 버킷은 Supabase Dashboard에서 수동 생성:
-- Storage → New bucket → 이름: "gallery" → Public: ON
-- ============================================
