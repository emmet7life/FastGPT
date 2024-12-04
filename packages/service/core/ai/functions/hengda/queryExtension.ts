import { replaceVariable } from '@fastgpt/global/common/string/tools';
import { createChatCompletion } from '../../config';
import { ChatItemType } from '@fastgpt/global/core/chat/type';
import { countGptMessagesTokens } from '../../../../common/string/tiktoken/index';
import { chatValue2RuntimePrompt } from '@fastgpt/global/core/chat/adapt';
import { getLLMModel } from '../../model';
import { llmCompletionsBodyFormat } from '../../utils';
import { processPromptTextCommandTag } from './utils';

/* 
    query extension - 问题扩展
    可以根据上下文，消除指代性问题以及扩展问题，利于检索。
*/

const title = global.feConfigs?.systemTitle || 'FastAI';
const defaultPrompt = `作为一个向量检索助手，你的任务是结合历史记录，从不同角度，为“原问题”生成个不同版本的“检索词”，从而提高向量检索的语义丰富度，提高向量检索的精度。
生成的问题要求指向对象清晰明确，并与“原问题语言相同”。

参考 <Example></Example> 标中的示例来完成任务。

<Example>
历史记录: 
"""
"""
原问题: 介绍下剧情。
检索词: ["介绍下故事的背景。","故事的主题是什么？","介绍下故事的主要人物。"]
----------------
历史记录: 
"""
Q: 对话背景。
A: 当前对话是关于 Nginx 的介绍和使用等。
"""
原问题: 怎么下载
检索词: ["Nginx 如何下载？","下载 Nginx 需要什么条件？","有哪些渠道可以下载 Nginx？"]
----------------
历史记录: 
"""
Q: 对话背景。
A: 当前对话是关于 Nginx 的介绍和使用等。
Q: 报错 "no connection"
A: 报错"no connection"可能是因为……
"""
原问题: 怎么解决
检索词: ["Nginx报错"no connection"如何解决？","造成'no connection'报错的原因。","Nginx提示'no connection'，要怎么办？"]
----------------
历史记录: 
"""
Q: 护产假多少天?
A: 护产假的天数根据员工所在的城市而定。请提供您所在的城市，以便我回答您的问题。
"""
原问题: 沈阳
检索词: ["沈阳的护产假多少天？","沈阳的护产假政策。","沈阳的护产假标准。"]
----------------
历史记录: 
"""
Q: 作者是谁？
A: ${title} 的作者是 labring。
"""
原问题: Tell me about him
检索词: ["Introduce labring, the author of ${title}." ," Background information on author labring." "," Why does labring do ${title}?"]
----------------
历史记录:
"""
Q: 对话背景。
A: 关于 ${title} 的介绍和使用等问题。
"""
原问题: 你好。
检索词: ["你好"]
----------------
历史记录:
"""
Q: ${title} 如何收费？
A: ${title} 收费可以参考……
"""
原问题: 你知道 laf 么？
检索词: ["laf 的官网地址是多少？","laf 的使用教程。","laf 有什么特点和优势。"]
----------------
历史记录:
"""
Q: ${title} 的优势
A: 1. 开源
   2. 简便
   3. 扩展性强
"""
原问题: 介绍下第2点。
检索词: ["介绍下 ${title} 简便的优势", "从哪些方面，可以体现出 ${title} 的简便"]。
----------------
历史记录:
"""
Q: 什么是 ${title}？
A: ${title} 是一个 RAG 平台。
Q: 什么是 Laf？
A: Laf 是一个云函数开发平台。
"""
原问题: 它们有什么关系？
检索词: ["${title}和Laf有什么关系？","介绍下${title}","介绍下Laf"]
</Example>

-----

下面是正式的任务：

历史记录:
"""
{{histories}}
"""
原问题: {{query}}
检索词: `;

// ## 注意，要求具有优先级顺序，编号越小，优先级越高，满足某个要求后请忽略之后的要求。 ##
const defaultSystemPrompt = `
# 角色 #
You are a question rewriter for conversational question answer. 你是一个对话式问答中的问题改写/重写专家，负责将依赖于对话语境的歧义问题重新表述为可以再对话语境之外正确解释的明确问题，将人类对话中的两个典型特征，包括回指（明确引用前一次对话转向的词）和省略（可以从对话中省略的词），将其补充完整，使得问题的语义清晰和明确。


# 要求 #
1. 不要直接回答问题，记住，你的职责是改写/重写问题，请直接输出改写/重写后的问题，除非我要求你增加一些修饰词或者其他特殊要求。
2. 问题是在表达情绪或者对上一次回答的反馈时（如满意、赞赏、愤怒、不满等），直接返回不经改写/重写的问题，不要再添加任何修饰词语或概括，可参考下面的第3个，第9个和第10个演示示例。
3. 识别问题是否是简单的要求某个产品的技术参数，比如：它的技术参数、产品型号的技术参数，此时应根据第9条，代入代词和指代词后，在保持问题语义完整性的前提下重写描述问题，可参考下面的第4个演示示例。
4. 识别我的问题是否是非常直截了当的询问，比如：什么是螺旋天线？或者 螺旋天线是什么？，则此时应直接返回不经任何重写的问题。
5. 问题是在询问联系方式时，将原始问题重写为：你们公司的联系方式是什么。如果问题是在寻求人工客服帮助，将原始问题重写为：人工客服。可参考下面的第12个示例。
6. 问题是明确询问某个产品型号时，不要从对话上下文中代入任何对产品的诸如产品类型、类别之类的任何修饰进行重写。
7. 描述问题时的身份和语气：注意描述问题时的身份和语气仅从对话历史中的用户角色中参考，注意用“我”而不是“您”来重写问题。
8. 问题较为简短或者概念模糊时，可参考下面的微波与毫米波行业知识，将问题表述完整。参考下面的第11个演示示例。
9. 保持上下文的连续性和中文语义完整性：结合对话历史确保将问题描述清晰、明确，保持中文语义完整，不改变原问题的语义。
10. 具体化和精确化问题：如有必要，从对话历史中代入相应的代词和指代词以保持对话的一致性，比如代词和指代词可能是用户询问过的某一产品型号或产品特性、技术参数等。
11. 不要将非问句形式的问题强制转换为问句。
12. 询问人物的介绍或成就时不要回答问题，根据第10条要求具体化和精确化问题后，将问题直接返回。
13. 当原始问题中以“当前问题来自微信”开头时，请原封不动保留“当前问题来自微信”的部分，不对这部分内容进行改写/重写，只重写实际问题部分，可参考下面的第13个示例。


下面是微波与毫米波行业知识
--------------------------------
1. 频率一般指频率范围，单位一般是GHz，除非特别指明是MHz。
2. 带宽一般指工作带宽，无单位。
3. 天线类型：标准增益天线、线极化喇叭类天线、圆极化天线、抛物反射面天线、对称振子天线、双锥天线、环形天线、EMC测量天线、EMI测量天线、微带天线、扇形波束天线、全向天线、半向天线、半球天线、阵列天线、端射型引向阵列天线、测量天线。
--------------------------------


下面是演示问题改写/重写的示例
--------------------------------
## 第1个输出示例 ##
原始问题: 
你们有介质天线吗？

改写/重写问题: 
你们公司有介质天线吗？


## 第2个输出示例 ##
下面是对话历史：

-------------
User: 你们有全向天线吗？
Assistant: 您好！我们确实提供全向天线的产品。全向天线是一种……
-------------

原始问题: 
频率在2.4-2.48之间的产品推荐一下

改写/重写问题: 
频率在2.4-2.48GHz之间的全向天线产品推荐一下


## 第3个输出示例 ##
下面是对话历史：

-------------
User: 频率在2.4-2.48GHz之间的全向天线产品推荐一下。
Assistant: 根据您提供的需求，我为您推荐我们的单极子全向天线产品 HD-2425CVOA1S。该产品的频率范围为……
-------------

原始问题: 
非常棒！

改写/重写问题: 
非常棒！

或者

原始问题: 
很好

改写/重写问题: 
很好


## 第4个输出示例 ##
下面是对话历史：

-------------
User: 频率在2.4-2.48GHz之间的全向天线产品推荐一下。
Assistant: 根据您提供的需求，我为您推荐我们的单极子全向天线产品 HD-140SGACPHXS。该产品应用于……
-------------

原始问题: 
该产品技术参数

改写/重写问题: 
详细介绍一下HD-140SGACPHXS的技术参数


## 第5个输出示例 ##
下面是对话历史：

-------------
User: 频率在2.4-2.48GHz之间的全向天线产品推荐一下。
Assistant: 根据您提供的需求，我为您推荐我们的单极子全向天线产品 HD-2425CVOA1S。该产品的频率范围为……
-------------

原始问题: 
不符合我的要求

改写/重写问题: 
这款产品的天线口径不符合我的要求


## 第6个输出示例 ##
原始问题: 
8-18GHz，增益17，2.92接头的产品有吗?

改写/重写问题: 
你们公司有频率范围在8至18 GHz，增益为17 dB，且配备2.92接头的产品可以推荐吗


## 第7个输出示例 ##
下面是对话历史：

-------------
User: 您是否提供介质天线？
Assistant: 是的，我们提供多种介质天线产品。介质天线通常用于……
-------------

原始问题: 
有没有频率在8.8-8.9的？具体产品指标是什么？

改写/重写问题: 
你们提供的介质天线中，是否有频率范围在8.8至8.9GHz的产品？详细介绍该频率段产品的具体技术指标。


## 第8个输出示例 ##
下面是对话历史：

-------------
User: 请问有频率范围在 F0 ± 100MHz 的产品吗？
Assistant: 我找到了一款符合您要求的产品：平面阵列赋形波束天线……
User: 除了平面阵列赋形波束天线 HD-95CSBWSA40 * 0.7B 外，还有没有其他性能相当的产品？
Assistant: 我找到了另一款性能相当的产品：双弯曲反射面赋形波束天线 HD-56CSBA1200T1。这款产品的技术参数……
-------------

原始问题：
频率范围不符合要求

改写/重写问题：
HD-56CSBA1200T1的频率范围不符合我的要求


## 第9个输出示例 ##
原始问题: 
你回答的太糟糕了

改写/重写问题: 
你回答的太糟糕了


## 第10个输出示例 ##
原始问题: 
回答的很好，谢谢

改写/重写问题: 
回答的很好，谢谢


## 第11个输出示例 ##
原始问题: 
频率12.8-16，带宽<4%的标准增益天线

改写/重写问题: 
推荐一款频率范围(GHz)在12.8至16，工作带宽(小于等于)<4%的标准增益天线产品


## 第12个输出示例 ##
原始问题: 
联系方式

改写/重写问题: 
你们公司的联系方式是什么

原始问题: 
你们的联系方式？

改写/重写问题: 
你们公司的联系方式是什么

原始问题: 
如何联系你们

改写/重写问题: 
你们公司的联系方式是什么

原始问题: 
人工客服

改写/重写问题: 
人工客服

原始问题: 
人工

改写/重写问题: 
人工客服

原始问题: 
转接人工

改写/重写问题: 
人工客服

## 第13个输出示例 ##
原始问题:
当前问题来自微信好友，问题如下:
HD-140CPDDPT

改写/重写问题: 
当前问题来自微信好友，问题如下:
HD-140CPDDPT的技术参数


--------------------------------
`;

const defaultUserPrompt = `
# 任务目标
结合下面的对话历史，改写/重新问题，保持语义不变，记住不要提到任何你思考的过程，不要回答问题，不要总结历史对话，按照上述的要求直接输出改写/重写后的问题。

# 注意事项
1. 当原始问题的内容格式为“当前问题来自微信...，问题如下: <实际问题>”时，请只将<实际问题>部分的问题进行改写/重写，原始问题中“当前问题来自微信...，问题如下: ”部分的内容在改写/重写后的问题中保留。
2. 当原始问题的内容中不含有“当前问题来自微信...，问题如下: ”时，不要自行添加。

# 当前任务
下面是对话历史：
--------------------------------------
{{histories}}
--------------------------------------
下面是原始问题
--------------------------------------
{{query}}
--------------------------------------
`;

export const queryExtension = async ({
  chatBg,
  query,
  histories = [],
  model
}: {
  chatBg?: string;
  query: string;
  histories: ChatItemType[];
  model: string;
}): Promise<{
  rawQuery: string;
  extensionQueries: string[];
  model: string;
  tokens: number;
}> => {
  // 提取系统提示词
  let _extractedSystemPrompt = '';
  // 提取用户提示词
  let _extractedUserPrompt = '';

  try {
    if (chatBg) {
      const matchResult = processPromptTextCommandTag(chatBg, 'SystemPrompt');
      if (matchResult.extracted) {
        _extractedSystemPrompt = matchResult.extracted;
        chatBg = matchResult.clipped;
      }
    }

    if (chatBg) {
      const matchResult = processPromptTextCommandTag(chatBg, 'UserPrompt');
      if (matchResult.extracted) {
        _extractedUserPrompt = matchResult.extracted;
        chatBg = matchResult.clipped;
      }
    }
  } catch (error) {
    console.log('questionExtension >> ❌ processPromptTextCommandTag ❌ catch error:', error);
  }

  const systemPrompt = _extractedSystemPrompt || defaultSystemPrompt;
  const userPrompt = _extractedUserPrompt || defaultUserPrompt;

  const systemFewShot = chatBg
    ? `Q: 对话背景。
A: ${chatBg}
`
    : '';
  const historyFewShot = histories
    .map((item) => {
      const role = item.obj === 'Human' ? 'Q' : 'A';
      return `${role}: ${chatValue2RuntimePrompt(item.value).text}`;
    })
    .join('\n');
  const concatFewShot = `${systemFewShot}${historyFewShot}`.trim();

  const modelData = getLLMModel(model);

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: replaceVariable(userPrompt, {
        query: `${query}`,
        histories: concatFewShot
      })
    }
  ] as any;

  const { response: result } = await createChatCompletion({
    body: llmCompletionsBodyFormat(
      {
        stream: false,
        model: modelData.model,
        temperature: 0.01,
        max_tokens: 2048,
        messages
      },
      modelData
    )
  });

  let answer = result.choices?.[0]?.message?.content || '';
  if (!answer) {
    return {
      rawQuery: query,
      extensionQueries: [],
      model,
      tokens: 0
    };
  }

  // Intercept the content of [] and retain []
  // answer = answer.match(/\[.*?\]/)?.[0] || '';
  // answer = answer.replace(/\\"/g, '"');

  try {
    // const queries = JSON.parse(answer) as string[];
    const queries = [answer];

    return {
      rawQuery: query,
      extensionQueries: queries, //Array.isArray(queries) ? queries : [],
      model,
      tokens: await countGptMessagesTokens(messages)
    };
  } catch (error) {
    console.log(error);
    return {
      rawQuery: query,
      extensionQueries: [],
      model,
      tokens: 0
    };
  }
};
