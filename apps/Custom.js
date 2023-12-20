import plugin from '../../../lib/plugins/plugin.js'
import getPic from '../components/Proxy.js'
import Log from '../utils/logs.js'

export class Custom extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'MJ-按钮',
      /** 功能描述 */
      dsc: 'Midjourney 按钮',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#(mj|MJ)?按钮([\\s\\S]*)$',
          /** 执行方法 */
          fnc: 'custom'
        }
      ]
    })
  }

  async custom (e) {
    if (!global.mjClient) {
      await e.reply('未连接到 Midjourney Bot，请先使用 #mj连接', true)
      return true
    }

    const taskInfo = await JSON.parse(
      await redis.get(`mj:${e.msg.match(/\d{19}/)?.[0] || e.user_id}`)
    )

    if (!taskInfo) {
      if (e.msg.match(/\d{19}/)) {
        await e.reply('未找到指定的绘制结果，请检查ID是否正确', true)
        return true
      } else {
        await e.reply('未找到上一次的绘制结果，请先使用 #mj绘制', true)
        return true
      }
    }

    const index = e.msg.replace(/#(mj|MJ)?按钮/, '').trim()

    const rerollCustomID = taskInfo.options?.find(
      (o) => o.label === index
    )?.custom

    if (!rerollCustomID) {
      await e.reply(`上一次的绘制结果不允许使用${index}`)
      return true
    }

    if (typeof taskInfo.content === 'string') {
      taskInfo.content = taskInfo.content.match(/\*\*(.*)\*\*/)?.[1]
    }

    try {
      e.reply(`正在使用${index}，请稍后...`)
      const response = await mjClient.Custom({
        msgId: taskInfo.id.toString(),
        customId: rerollCustomID,
        flags: taskInfo.flags,
        content: taskInfo.content,
        loading: (uri, progress) => {
          Log.i(`[${progress}]绘制中，当前状态：${uri}`)
        }
      })

      await redis.set(`mj:${e.user_id}`, JSON.stringify(response))
      await redis.set(`mj:${response.id}`, JSON.stringify(response))

      try {
        const base64 = await getPic(response.uri)
        await e.reply(segment.image(`base64://${base64}`))
      } catch (err) {
        Log.e(err)
        await e.reply(response.uri)
        await e.reply('发送图片遇到问题，错误已发送至控制台')
      }
      const optionList = []
      for (let i = 0; i < response.options.length; i++) {
        optionList.push(`[${response.options[i].label}]`)
      }
      if (optionList.length > 0) {
        await e.reply(
          `[ID:${response.id}]\n可选的操作：\n${optionList.join(' | ')}`
        )
      }
    } catch (err) {
      Log.e(err)
      e.reply('Midjourney 返回错误：\n' + err, true)
    }
    return true
  }
}
