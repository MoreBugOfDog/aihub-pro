;(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error('Sandboxed mode is not supported')
  }
  interface Apiconfig {
    name: string
    url: string
    apikey: string
  }

  interface AiConfig {
    model: string
    api: string
    name: string
  }

  interface OnReply {
    eventId: string
    reply: string
    isRead: boolean
  }

  // Your extension's code
  class AihubPro implements Scratch.Extension {
    runtime: VM.Runtime
    constructor(runtime: VM.Runtime) {
      this.runtime = runtime
    }

    fetchAiWithUrl = async (
      text: string,
      apikey: string,
      url: string,
      model: string
    ) => {
      // 使用Openai标准api格式请求ai api
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apikey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: text
            }
          ]
        })
      })
      const data = await response.json()
      return data.choices[0].message.content
    }

    onReply: OnReply[] = []

    apiConfigs: Apiconfig[] = []

    aiConfigs: AiConfig[] = []
    addAiConfig(config: AiConfig) {
      // 同addApiConfig的做法，创建或修改
      const index = this.aiConfigs.findIndex(item => item.name === config.name)
      if (index === -1) {
        this.aiConfigs.push(config)
        console.log(`Added AI config: ${config.name}`)
      } else {
        this.aiConfigs[index] = config
        console.log(`Updated AI config: ${config.name}`)
      }
    }
    getAiConfig(name: string): AiConfig | undefined {
      return this.aiConfigs.find(c => c.name === name)
    }
    addApiConfig(config: Apiconfig) {
      const existingConfig = this.apiConfigs.find(c => c.name === config.name)
      if (existingConfig) {
        existingConfig.apikey = config.apikey
        existingConfig.url = config.url
        console.log('Updated API config', this.apiConfigs)
      } else {
        this.apiConfigs.push(config)
        console.log('Added new API config', this.apiConfigs)
      }
    }
    getApiConfig(name: string): Apiconfig | undefined {
      return this.apiConfigs.find(c => c.name === name)
    }
    getInfo(): Scratch.Info {
      // 明确指定返回类型为 Scratch.Info
      return {
        id: 'aihubPro', // 修改为 aihubPro
        name: 'AI Hub Pro', // 修改名称
        blocks: [
          // 移除 BlockType.LABEL，因为 Scratch 3.0 扩展中没有此类型。
          // 原始的 @BlockMode.LabelBefore("🚉 自带 API") 可能是特定于某个框架的装饰器，
          // 在原生 Scratch 扩展中没有直接对应。
          {
            // createApi
            opcode: 'createApi',
            blockType: Scratch.BlockType.COMMAND,
            text: '创建或修改 命名为[name] 的 API URL为[url] API KEY为[apikey]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'moreai'
              },
              url: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://api.siliconflow.cn/v1/chat/completions'
              },
              apikey: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sk-123456'
              }
            }
          },
          {
            // createAi
            opcode: 'createAi',
            blockType: Scratch.BlockType.COMMAND,
            text: '创建或修改名为[name]的 AI 使用API配置[api]中模型ID为[model]',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Skydog'
              },
              api: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'moreai'
              },
              model: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'deepseek-ai/DeepSeek-V3'
              }
            }
          },
          {
            // askAiByAwait
            opcode: 'askAiByAwait',
            blockType: Scratch.BlockType.REPORTER,
            text: '向 [name] AI提问[text]并等待',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Skydog'
              },
              text: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '你好'
              }
            }
          },
          {
            // askAiByAsync
            opcode: 'askAiByAsync',
            blockType: Scratch.BlockType.COMMAND,
            text: '异步向 [name] AI提问[text]事件ID为[eventId]',
            tooltip:
              '事件ID是这个请求的唯一标识。如果事件ID和已有的请求相同，那么会覆盖前一个请求。不建议使用相同的事件ID。',
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Skydog'
              },
              text: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '你好'
              },
              eventId: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '00001'
              }
            }
          },
          {
            // whenAiReply
            opcode: 'whenAiReply',
            blockType: Scratch.BlockType.EVENT,
            isEdgeActivated: false,
            text: '当有请求收到回复'
          },
          {
            // getReply
            opcode: 'getReply',
            blockType: Scratch.BlockType.REPORTER,

            text: '获取事件ID为[eventId]的回复',
            arguments: {
              eventId: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '00001'
              }
            }
          },
          {
            opcode: 'hasReply',
            blockType: Scratch.BlockType.BOOLEAN,

            text: '事件ID为[eventId]的请求存在未读取(或不存在)的回复？',
            tooltip:
              '注意：当某个回复被读取过后，尽管事件ID存在，这个积木也会返回false(否)',
            arguments: {
              eventId: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '00001'
              }
            }
          }
        ]
      }
    }

    createApi(args: { name: string; url: string; apikey: string }) {
      this.addApiConfig(args)
    }

    createAi(args: { name: string; api: string; model: string }) {
      this.addAiConfig(args)
    }

    async askAiByAwait(args: { name: string; text: string }) {
      const aiConfig = this.getAiConfig(args.name)
      if (!aiConfig) {
        throw new Error(`AI config not found: ${args.name}`)
      }
      const apiname = aiConfig.api
      const apiConfig = this.getApiConfig(apiname)
      if (!apiConfig) {
        throw new Error(`AI config not found: ${args.name}`)
      }
      return await this.fetchAiWithUrl(
        args.text,
        apiConfig.apikey,
        apiConfig.url,
        aiConfig.model
      ).then(response => {
        console.log(response)
        // 返回AI响应的内容
      })
    }

    async askAiByAsync(args: { name: string; text: string; eventId: string }) {
      const aiConfig = this.getAiConfig(args.name)
      if (!aiConfig) {
        throw new Error(`AI config not found: ${args.name}`) // 修正：移除多余的 new
      }
      const apiname = aiConfig.api
      const apiConfig = this.getApiConfig(apiname)
      if (!apiConfig) {
        throw new Error(`AI config not found: ${args.name}`)
      }
      this.fetchAiWithUrl(
        args.text,
        apiConfig.apikey,
        apiConfig.url,
        aiConfig.model
      ).then(response => {
        console.log(response)
        // 判断事件ID是否重复
        if (this.onReply.some(item => item.eventId === args.eventId)) {
          // 覆盖
          this.onReply = this.onReply.map(item => {
            if (item.eventId === args.eventId) {
              return {
                eventId: args.eventId,
                reply: response,
                isRead: false
              }
            }
            return item
          })
        } else {
          //添加
          this.onReply.push({
            eventId: args.eventId,
            reply: response,
            isRead: false
          })
        }

        this.runtime.startHats(this.getInfo().id + '_whenAiReply')
      })
    }

    whenAiReply() {}
    getReply(args: { eventId: string }) {
      if (this.onReply.find(item => item.eventId === args.eventId)) {
        this.onReply.find(item => item.eventId === args.eventId).isRead = true
      }

      return this.onReply.find(item => item.eventId === args.eventId)?.reply
    }
    hasReply(args: { eventId: string }): boolean {
      return !!this.onReply.find(
        item => item.eventId === args.eventId && !item.isRead
      )
    }
  }
  // The following snippet ensures compatibility with Turbowarp / Gandi IDE. If you want to write Turbowarp-only or Gandi-IDE code, please remove corresponding code
  if (
    (() => {
      let url = new URL(location.href)
      if (url.hostname === 'ccw.site' || url.hostname === 'cocrea.world') {
        return false
      } else {
        return true
      }
    })() // 修改：调用函数
  ) {
    // For Turbowarp
    Scratch.extensions.register(new AihubPro(Scratch.runtime))
  } else {
    // For Gandi
    window.tempExt = {
      Extension: AihubPro,
      info: {
        extensionId: 'moreAi',
        name: 'moreAi.name',
        description: 'moreAi.description',
        featured: true,
        disabled: false,
        collaboratorList: [
          {
            collaborator: '多bug的啸天犬 @ CCW',
            collaboratorURL: 'https://github.com/FurryR'
          }
        ]
      },
      l10n: {
        'zh-cn': {
          'moreAi.name': 'FurryR 的示例扩展',
          'moreAi.description': 'Gandi 扩展开发模板'
        },
        en: {
          'moreAi.name': "FurryR's example extension",
          'moreAi.description': 'Gandi extension development template'
        }
      }
    }
  }
})(Scratch)
