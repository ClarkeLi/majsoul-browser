/**
 * 一段教学文字。以前会把术语变成可悬停的解释（点状下划线 + 气泡），按你的要求已取消：现在原样显示文字。
 * 术语表（glossary.ts）保留，以后想恢复只需要改这里。
 */
export function Rich({ text }: { text: string }) {
  return <>{text}</>
}
