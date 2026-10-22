import { CommonButtonLink } from '@/components/ui/CommonButton';
import { getMessages } from '@/i18n/server';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.account.metadata };
}

export default async function Login() {
  const { messages } = await getMessages();
  const copy = messages.account;
  return (
    <div className="page">
      <h1>{copy.title}</h1>
      <p className="lead">{copy.intro}</p>
      <div className="notice">{copy.notice}</div>
      <CommonButtonLink href="/" variant="primary">
        {copy.home}
      </CommonButtonLink>
    </div>
  );
}
