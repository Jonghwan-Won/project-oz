import type { Metadata } from 'next';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import { getGuideDocuments } from '@/server/services/guide-documents';
import { MarkdownViewer } from '@/app/guide/markdown/MarkdownViewer';
import { getGuideMessages } from '@/i18n/guide-server';
import s from '@/app/guide/guide.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getGuideMessages();
  return {
    title: messages.markdown.labMetaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LabMarkdownPage() {
  const [documents, { messages }] = await Promise.all([
    getGuideDocuments(),
    getGuideMessages(),
  ]);
  const copy = messages.markdown;
  return (
    <div className={`page ${s.guide}`}>
      <h1>
        {copy.title}
        <span className="accentDot" />
      </h1>
      <p>{copy.description}</p>
      <div className={s.row}>
        <CommonButtonLink href="/lab">
          {messages.lab.backToLab}
        </CommonButtonLink>
        {documents.length > 0 && (
          <CommonButtonLink href="/guide/environment">
            {copy.environmentLink}
          </CommonButtonLink>
        )}
      </div>
      <MarkdownViewer
        documents={documents}
        messages={copy.viewer}
        filePickerLabels={messages.components.filePicker}
      />
    </div>
  );
}
