export interface ProcessedCommandTagText {
  extracted: string;
  clipped: string;
}

export function processPromptTextCommandTag(A: string, B: string): ProcessedCommandTagText {
  // 从 B 中提取开始标签和结束标签
  const startTag = `<Command-${B}>`;
  const endTag = `</Command-${B}>`;

  // 查找开始标签和结束标签的位置
  const startIndex = A.indexOf(startTag);
  const endIndex = A.indexOf(endTag);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // 提取开始标签和结束标签之间的文本
    const extractedText = A.substring(startIndex + startTag.length, endIndex);

    // 移除开始标签和结束标签及其之间的文本
    const clippedText = A.substring(0, startIndex) + A.substring(endIndex + endTag.length);

    return {
      extracted: extractedText.trim(),
      clipped: clippedText.trim()
    };
  } else {
    // 如果没有找到开始标签和结束标签，则返回原始文本
    return {
      extracted: '',
      clipped: A
    };
  }
}
