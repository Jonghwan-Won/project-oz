import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default function AdminLayout(){
// shortcut: 인증 공급자 연결 전에는 관리자 접근을 모두 거부, DB 세션 인가 도입 시 교체.
redirect('/login');
}
