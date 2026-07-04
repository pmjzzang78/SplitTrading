// calc.js — 순수 계산 로직 (DOM 접근 금지)
// 모든 함수는 입력 검증 실패 시 한국어 메시지를 담은 Error를 throw 한다.

// ----- 내부 검증 헬퍼 -----

function assertPositiveNumber(value, name) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${name}은(는) 숫자여야 합니다`);
  }
  if (value <= 0) {
    throw new Error(`${name}은(는) 0보다 커야 합니다`);
  }
}

function assertNonNegativeNumber(value, name) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${name}은(는) 숫자여야 합니다`);
  }
  if (value < 0) {
    throw new Error(`${name}은(는) 0 이상이어야 합니다`);
  }
}

function assertSplitCount(n) {
  if (typeof n !== 'number' || !isFinite(n) || !Number.isInteger(n)) {
    throw new Error('분할 횟수는 정수여야 합니다');
  }
  if (n < 2 || n > 30) {
    throw new Error('분할 횟수는 2에서 30 사이여야 합니다');
  }
}

// 최고가→최저가(또는 그 반대)를 N개로 선형 등분한 가격 배열을 만든다.
// from: i=0 일 때 가격, to: i=N-1 일 때 가격
function linspace(from, to, n) {
  if (n === 1) return [from];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(from - (from - to) * (i / (n - 1)));
  }
  return out;
}

// 1..n 합
function sumTo(n) {
  return (n * (n + 1)) / 2;
}

// ----- 1. 분할매수 계산기 -----
// params: { total, count, highPrice, lowPrice, mode: 'equal' | 'weighted' }
export function calcBuySplit({ total, count, highPrice, lowPrice, mode = 'equal' }) {
  assertPositiveNumber(total, '총 투자금액');
  assertSplitCount(count);
  assertPositiveNumber(highPrice, '최고 매수가');
  assertPositiveNumber(lowPrice, '최저 매수가');
  if (lowPrice >= highPrice) {
    throw new Error('최저 매수가는 최고 매수가보다 낮아야 합니다');
  }
  if (mode !== 'equal' && mode !== 'weighted') {
    throw new Error('분배 방식이 올바르지 않습니다');
  }

  const prices = linspace(highPrice, lowPrice, count);
  const weightSum = sumTo(count);
  const rows = [];
  let totalQty = 0;
  let totalAmount = 0;

  for (let i = 0; i < count; i++) {
    const price = prices[i];
    // 하방 가중: 낮은 가격(i가 큼)일수록 큰 금액 -> 가중치 i+1
    const amount = mode === 'weighted'
      ? total * ((i + 1) / weightSum)
      : total / count;
    const qty = amount / price;
    totalQty += qty;
    totalAmount += amount;
    rows.push({ index: i + 1, price, amount, qty });
  }

  const avgPrice = totalAmount / totalQty;
  // 최저가 도달 시 평가손익률: (최저가 / 평균단가 - 1) * 100
  const worstPnlRate = (lowPrice / avgPrice - 1) * 100;

  return { rows, totalQty, totalAmount, avgPrice, worstPnlRate };
}

// ----- 2. 분할매도 계산기 -----
// params: { holdingQty, avgBuyPrice(optional, null 가능), count, lowTarget, highTarget, mode: 'equal' | 'weighted' }
export function calcSellSplit({ holdingQty, avgBuyPrice = null, count, lowTarget, highTarget, mode = 'equal' }) {
  assertPositiveNumber(holdingQty, '보유 수량');
  assertSplitCount(count);
  assertPositiveNumber(lowTarget, '최저 목표가');
  assertPositiveNumber(highTarget, '최고 목표가');
  if (lowTarget >= highTarget) {
    throw new Error('최저 목표가는 최고 목표가보다 낮아야 합니다');
  }
  if (mode !== 'equal' && mode !== 'weighted') {
    throw new Error('분배 방식이 올바르지 않습니다');
  }
  const hasAvg = avgBuyPrice !== null && avgBuyPrice !== undefined && avgBuyPrice !== '';
  if (hasAvg) {
    assertPositiveNumber(avgBuyPrice, '평균 매수단가');
  }

  // 가격: 최저 목표가 -> 최고 목표가 선형 등분 (i=0 최저, i=N-1 최고)
  const prices = linspace(lowTarget, highTarget, count);
  const weightSum = sumTo(count);
  const rows = [];
  let totalQty = 0;
  let totalAmount = 0;

  for (let i = 0; i < count; i++) {
    const price = prices[i];
    // 상방 가중: 높은 가격(i가 큼)일수록 많이 -> 가중치 i+1
    const qty = mode === 'weighted'
      ? holdingQty * ((i + 1) / weightSum)
      : holdingQty / count;
    const amount = qty * price;
    totalQty += qty;
    totalAmount += amount;
    const row = { index: i + 1, price, qty, amount };
    if (hasAvg) {
      row.pnlRate = (price / avgBuyPrice - 1) * 100;
    }
    rows.push(row);
  }

  const avgSellPrice = totalAmount / totalQty;
  const result = { rows, totalQty, totalAmount, avgSellPrice };
  if (hasAvg) {
    result.totalProfit = totalAmount - avgBuyPrice * totalQty;
    result.totalPnlRate = (avgSellPrice / avgBuyPrice - 1) * 100;
  }
  return result;
}

// ----- 3. 물타기 계산기 -----
// params: { avgPrice, holdingQty, addPrice, addAmount }
export function calcAverageDown({ avgPrice, holdingQty, addPrice, addAmount }) {
  assertPositiveNumber(avgPrice, '현재 평단');
  assertPositiveNumber(holdingQty, '보유 수량');
  assertPositiveNumber(addPrice, '추가 매수가');
  assertPositiveNumber(addAmount, '추가 매수 금액');

  const addQty = addAmount / addPrice;
  const totalQty = holdingQty + addQty;
  const existingInvest = avgPrice * holdingQty;
  const totalInvest = existingInvest + addAmount;
  const newAvgPrice = totalInvest / totalQty;
  // 평단 하락률: (새평단/기존평단 - 1) * 100 (음수면 하락)
  const avgDropRate = (newAvgPrice / avgPrice - 1) * 100;
  // 추가 매수가 기준 본전까지 필요 상승률
  const breakEvenRate = (newAvgPrice / addPrice - 1) * 100;

  return { addQty, totalQty, totalInvest, newAvgPrice, avgDropRate, breakEvenRate };
}

// ----- 4. 수익 계산기 -----
// params: { buyPrice, sellPrice, qty, feeRate(%) }
export function calcProfit({ buyPrice, sellPrice, qty, feeRate = 0.05 }) {
  assertPositiveNumber(buyPrice, '매수가');
  assertPositiveNumber(sellPrice, '매도가');
  assertPositiveNumber(qty, '수량');
  assertNonNegativeNumber(feeRate, '수수료율');

  const fee = feeRate / 100;
  const buyGross = buyPrice * qty;
  const sellGross = sellPrice * qty;
  const totalBuy = buyGross * (1 + fee);       // 매수 시 수수료 포함 지출
  const totalSell = sellGross * (1 - fee);      // 매도 시 수수료 차감 수령
  const buyFee = buyGross * fee;
  const sellFee = sellGross * fee;
  const totalFee = buyFee + sellFee;
  const profit = totalSell - totalBuy;
  const pnlRate = (profit / totalBuy) * 100;

  return { totalBuy, totalSell, profit, pnlRate, totalFee };
}
