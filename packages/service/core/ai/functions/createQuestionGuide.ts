import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { createChatCompletion } from '../config';
import { countGptMessagesTokens } from '../../../common/string/tiktoken/index';
import { loadRequestMessages } from '../../chat/utils';
import { llmCompletionsBodyFormat } from '../utils';

export const Prompt_QuestionGuide = `你是一名AI助手，任务是根据对话历史预测用户的下一个问题。你的目标是生成3个潜在问题，以引导用户继续对话。生成这些问题时，请遵循以下规则：

1. 使用与用户上一个问题相同的语言。
2. 每个问题的长度不超过20个字符。
3. 以JSON格式返回问题：["问题1", "问题2", "问题3"]。

请分析提供给你的对话历史，并将其作为上下文生成相关且引人入胜的后续问题。你的预测应是当前话题的逻辑延伸，或是用户可能感兴趣的相关领域。

记住，在保持与现有对话一致的语气和风格的同时，提供多样化的选项供用户选择。你的目标是让对话自然流畅，帮助用户深入探讨主题或探索相关话题。`;

export async function createQuestionGuide({
  messages,
  model
}: {
  messages: ChatCompletionMessageParam[];
  model: string;
}) {
  const concatMessages: ChatCompletionMessageParam[] = [
    ...messages,
    {
      role: 'user',
      content: Prompt_QuestionGuide
    }
  ];

  const { response: data } = await createChatCompletion({
    body: llmCompletionsBodyFormat(
      {
        model,
        temperature: 0.1,
        max_tokens: 200,
        messages: await loadRequestMessages({
          messages: concatMessages,
          useVision: false
        }),
        stream: false
      },
      model
    )
  });

  const answer = data.choices?.[0]?.message?.content || '';

  const start = answer.indexOf('[');
  const end = answer.lastIndexOf(']');

  const tokens = await countGptMessagesTokens(concatMessages);

  if (start === -1 || end === -1) {
    return {
      result: [],
      tokens: 0
    };
  }

  const jsonStr = answer
    .substring(start, end + 1)
    .replace(/(\\n|\\)/g, '')
    .replace(/  /g, '');

  try {
    return {
      result: JSON.parse(jsonStr),
      tokens
    };
  } catch (error) {
    return {
      result: [],
      tokens: 0
    };
  }
}
