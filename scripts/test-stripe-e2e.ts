/**
 * Stripe E2E 자동화 테스트
 * 실행: pnpm test:stripe
 * ✅ 실제 카드 불필요 — STRIPE_SECRET_KEY(sk_test_...) 만 필요
 */
import Stripe from 'stripe';
const KEY = process.env.STRIPE_SECRET_KEY || '';
if (!KEY) { console.error('❌ STRIPE_SECRET_KEY 없음. .env 설정 필요'); process.exit(1); }
const stripe = new Stripe(KEY);
let ok=0, fail=0;
const pass=(m:string)=>{console.log(`  ✅ ${m}`);ok++;};
const err=(m:string,e?:any)=>{console.log(`  ❌ ${m}${e?.message?` — ${e.message}`:''}`);fail++;};

(async()=>{
  console.log('\n🧪 한진 공통 엔진 Stripe E2E 테스트');
  console.log(`모드: ${KEY.startsWith('sk_test_')?'✅ 테스트':'⚠️  라이브'}\n`);

  // 1. API 연결
  console.log('[1] API 연결');
  try { await stripe.balance.retrieve(); pass('API 연결 성공'); }
  catch(e){err('API 연결 실패 — 키 확인',e); process.exit(1);}

  // 2. 고객 생성
  console.log('\n[2] 고객 생성');
  let cid='';
  try {
    const c=await stripe.customers.create({email:'e2e@hanjin.test',name:'E2E 테스트',metadata:{test:'true'}});
    cid=c.id; pass(`고객 생성: ${cid}`);
  }catch(e){err('고객 생성 실패',e);}

  // 3. 체크아웃 세션 (11단계 멤버십 3개)
  console.log('\n[3] 체크아웃 세션 생성');
  for(const t of [{k:'bronze',n:'브론즈',a:29000},{k:'gold',n:'골드',a:79000},{k:'black_platinum',n:'블랙플래티넘',a:599000}]){
    try{
      const s=await stripe.checkout.sessions.create({
        customer:cid||undefined,
        payment_method_types:['card'],
        line_items:[{price_data:{currency:'krw',product_data:{name:t.n},unit_amount:t.a,recurring:{interval:'month'}},quantity:1}],
        mode:'subscription',
        success_url:'http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url:'http://localhost:3000/payment/cancel',
        metadata:{tier_key:t.k,project_slug:'glwa-franchise',test:'e2e'},
      });
      pass(`${t.n} (₩${t.a.toLocaleString()}) → ${s.url?.slice(0,60)}...`);
    }catch(e){err(`${t.n} 세션 실패`,e);}
  }

  // 4. 웹훅 확인
  console.log('\n[4] 웹훅 설정');
  try{
    const wh=await stripe.webhookEndpoints.list({limit:5});
    if(wh.data.length===0){
      console.log('  ⚠️  웹훅 미등록 (아래 조치 필요 항목 참고)');
    }else wh.data.forEach(w=>pass(`${w.url} (${w.status})`));
  }catch(e){err('웹훅 조회 실패',e);}

  // 5. 상품 확인
  console.log('\n[5] Stripe 상품');
  try{
    const p=await stripe.products.list({limit:5,active:true});
    if(p.data.length===0) console.log('  ⚠️  등록 상품 없음 (price_data 방식 사용 중 — 정상)');
    else p.data.forEach(x=>pass(`${x.name}`));
  }catch(e){err('상품 조회',e);}

  // 정리
  if(cid) try{await stripe.customers.del(cid);}catch{}

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`결과: ${ok}개 통과 / ${fail}개 실패`);
  if(fail===0){
    console.log('\n🎉 완료! 아래 테스트 카드로 실제 결제 흐름 확인:');
    console.log('  카드: 4242 4242 4242 4242');
    console.log('  만료: 12/26  CVC: 123\n');
  }
  process.exit(fail>0?1:0);
})();
