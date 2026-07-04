import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcBuySplit,
  calcSellSplit,
  calcAverageDown,
  calcProfit,
} from '../js/calc.js';

const approx = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// ----- 1. 분할매수 -----

test('분할매수 균등: 금액 합계 = 총액, 각 주문 동일', () => {
  const total = 1_000_000;
  const r = calcBuySplit({ total, count: 5, highPrice: 100, lowPrice: 50, mode: 'equal' });
  const sum = r.rows.reduce((a, x) => a + x.amount, 0);
  assert.ok(approx(sum, total), `합계 ${sum} != ${total}`);
  assert.ok(approx(r.totalAmount, total));
  for (const row of r.rows) {
    assert.ok(approx(row.amount, total / 5));
  }
  // 가격은 최고 100에서 최저 50까지 선형
  assert.ok(approx(r.rows[0].price, 100));
  assert.ok(approx(r.rows[4].price, 50));
});

test('분할매수 하방 가중: 금액 합계 = 총액, 낮은 가격일수록 큰 금액', () => {
  const total = 1_000_000;
  const n = 4;
  const r = calcBuySplit({ total, count: n, highPrice: 200, lowPrice: 100, mode: 'weighted' });
  const sum = r.rows.reduce((a, x) => a + x.amount, 0);
  assert.ok(approx(sum, total), `합계 ${sum} != ${total}`);
  // 가중치 1,2,3,4 -> 합 10
  assert.ok(approx(r.rows[0].amount, total * (1 / 10)));
  assert.ok(approx(r.rows[3].amount, total * (4 / 10)));
  // 낮은 가격(마지막)이 더 큰 금액
  assert.ok(r.rows[3].amount > r.rows[0].amount);
});

test('분할매수 평균단가 = 총금액 / 총수량', () => {
  const r = calcBuySplit({ total: 900_000, count: 3, highPrice: 300, lowPrice: 100, mode: 'equal' });
  const expectedAvg = r.totalAmount / r.totalQty;
  assert.ok(approx(r.avgPrice, expectedAvg));
  // 균등, 가격 300/200/100, 각 금액 300000 -> 수량 1000,1500,3000 = 5500
  assert.ok(approx(r.totalQty, 1000 + 1500 + 3000));
  assert.ok(approx(r.avgPrice, 900_000 / 5500));
});

test('분할매수 최저가 도달 손익률 계산', () => {
  const r = calcBuySplit({ total: 900_000, count: 3, highPrice: 300, lowPrice: 100, mode: 'equal' });
  const expected = (100 / r.avgPrice - 1) * 100;
  assert.ok(approx(r.worstPnlRate, expected));
  assert.ok(r.worstPnlRate < 0); // 최저가는 평단보다 낮으므로 손실
});

// ----- 2. 분할매도 -----

test('분할매도 균등: 수량 합 = 보유수량', () => {
  const holding = 3;
  const r = calcSellSplit({ holdingQty: holding, count: 6, lowTarget: 100, highTarget: 200, mode: 'equal' });
  const sum = r.rows.reduce((a, x) => a + x.qty, 0);
  assert.ok(approx(sum, holding));
  assert.ok(approx(r.totalQty, holding));
});

test('분할매도 상방 가중: 수량 합 = 보유수량, 높은 가격일수록 많이', () => {
  const holding = 10;
  const n = 4;
  const r = calcSellSplit({ holdingQty: holding, count: n, lowTarget: 100, highTarget: 400, mode: 'weighted' });
  const sum = r.rows.reduce((a, x) => a + x.qty, 0);
  assert.ok(approx(sum, holding));
  assert.ok(approx(r.rows[0].qty, holding * (1 / 10)));
  assert.ok(approx(r.rows[3].qty, holding * (4 / 10)));
  assert.ok(r.rows[3].qty > r.rows[0].qty);
});

test('분할매도 평단 입력 시 수익률/수익금 계산', () => {
  const r = calcSellSplit({ holdingQty: 10, avgBuyPrice: 100, count: 3, lowTarget: 100, highTarget: 200, mode: 'equal' });
  assert.ok('totalProfit' in r);
  assert.ok('totalPnlRate' in r);
  // 가격 100/150/200, 각 수량 10/3
  const expectedAmount = (10 / 3) * (100 + 150 + 200);
  assert.ok(approx(r.totalAmount, expectedAmount));
  assert.ok(approx(r.totalProfit, expectedAmount - 100 * 10));
  for (const row of r.rows) {
    assert.ok('pnlRate' in row);
  }
});

test('분할매도 평단 미입력 시 수익 필드 없음', () => {
  const r = calcSellSplit({ holdingQty: 10, count: 3, lowTarget: 100, highTarget: 200, mode: 'equal' });
  assert.ok(!('totalProfit' in r));
  assert.ok(!('pnlRate' in r.rows[0]));
});

// ----- 3. 물타기 -----

test('물타기 새 평단 공식', () => {
  // 평단 100, 보유 10 -> 기존 1000. 추가가 50, 추가금액 500 -> 추가수량 10
  const r = calcAverageDown({ avgPrice: 100, holdingQty: 10, addPrice: 50, addAmount: 500 });
  assert.ok(approx(r.addQty, 10));
  assert.ok(approx(r.totalQty, 20));
  assert.ok(approx(r.totalInvest, 1500));
  // 새 평단 = 1500 / 20 = 75
  assert.ok(approx(r.newAvgPrice, 75));
  // 하락률 = (75/100 - 1)*100 = -25
  assert.ok(approx(r.avgDropRate, -25));
  // 본전 필요 상승률 = (75/50 - 1)*100 = 50
  assert.ok(approx(r.breakEvenRate, 50));
});

// ----- 4. 수익 계산 -----

test('수익 계산 수수료 반영', () => {
  const r = calcProfit({ buyPrice: 100, sellPrice: 200, qty: 10, feeRate: 0.05 });
  const fee = 0.0005;
  const totalBuy = 100 * 10 * (1 + fee);   // 1000.5
  const totalSell = 200 * 10 * (1 - fee);  // 1999
  assert.ok(approx(r.totalBuy, totalBuy));
  assert.ok(approx(r.totalSell, totalSell));
  assert.ok(approx(r.profit, totalSell - totalBuy));
  assert.ok(approx(r.totalFee, 1000 * fee + 2000 * fee));
  assert.ok(approx(r.pnlRate, (r.profit / totalBuy) * 100));
});

test('수익 계산 수수료 0', () => {
  const r = calcProfit({ buyPrice: 100, sellPrice: 150, qty: 2, feeRate: 0 });
  assert.ok(approx(r.totalFee, 0));
  assert.ok(approx(r.profit, (150 - 100) * 2));
});

// ----- 검증 에러 케이스 (4개 이상) -----

test('검증: 분할매수 최저가 >= 최고가 에러', () => {
  assert.throws(
    () => calcBuySplit({ total: 100, count: 3, highPrice: 100, lowPrice: 100, mode: 'equal' }),
    /최저 매수가는 최고 매수가보다 낮아야 합니다/
  );
});

test('검증: 분할 횟수 범위 밖 에러', () => {
  assert.throws(
    () => calcBuySplit({ total: 100, count: 1, highPrice: 100, lowPrice: 50, mode: 'equal' }),
    /분할 횟수는 2에서 30 사이여야 합니다/
  );
  assert.throws(
    () => calcBuySplit({ total: 100, count: 31, highPrice: 100, lowPrice: 50, mode: 'equal' }),
    /분할 횟수는 2에서 30 사이여야 합니다/
  );
});

test('검증: 분할 횟수 정수 아님 에러', () => {
  assert.throws(
    () => calcBuySplit({ total: 100, count: 3.5, highPrice: 100, lowPrice: 50, mode: 'equal' }),
    /분할 횟수는 정수여야 합니다/
  );
});

test('검증: 양수 아님 에러', () => {
  assert.throws(
    () => calcBuySplit({ total: -100, count: 3, highPrice: 100, lowPrice: 50, mode: 'equal' }),
    /총 투자금액/
  );
  assert.throws(
    () => calcAverageDown({ avgPrice: 0, holdingQty: 10, addPrice: 50, addAmount: 500 }),
    /현재 평단/
  );
});

test('검증: 분할매도 최저 목표가 >= 최고 목표가 에러', () => {
  assert.throws(
    () => calcSellSplit({ holdingQty: 10, count: 3, lowTarget: 200, highTarget: 100, mode: 'equal' }),
    /최저 목표가는 최고 목표가보다 낮아야 합니다/
  );
});
