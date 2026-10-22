import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { parseRichText, richTextExtensions } from '@/lib/rich-text';
import s from './CommonRichText.module.css';
export function CommonRichTextView({ value }: { value: unknown }) {
  const content = parseRichText(value);
  return content ? (
    <div className={s.content}>
      {renderToReactElement({ extensions: richTextExtensions, content })}
    </div>
  ) : null;
}
