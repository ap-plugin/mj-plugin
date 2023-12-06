import plugin from '../../../lib/plugins/plugin.js'
import { pluginResources } from '../model/path.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'

export class Setting extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'MJ-设置',
      /** 功能描述 */
      dsc: 'Midjourney 设置',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?(mj|MJ)设置$',
          /** 执行方法 */
          fnc: 'setting'
        }
      ]
    })
  }

  async setting (e) {
    if (!global.mjClient) {
      await e.reply('未连接到 Midjourney Bot，请先使用 #mj连接', true)
      return true
    }
    const response = await mjClient.Settings()
    const TmpModels = []
    const TmpItem = []
    for (
      let i = 0;
      i < response.content.components[0].components[0].options.length;
      i++
    ) {
      const item = response.content.components[0].components[0].options[i]
      TmpItem.push({
        list1: item.emoji ? item.emoji.name + item.label : item.label,
        list2: '选择器（单选）',
        able: !!item.default
      })
    }
    TmpModels.push(TmpItem)

    for (let i = 1; i < response.content.components.length; i++) {
      const TmpItem = []
      for (
        let j = 0;
        j < response.content.components[i].components.length;
        j++
      ) {
        const item = response.content.components[i].components[j]
        TmpItem.push({
          list1: item.emoji ? item.emoji.name + item.label : item.label,
          list2: '按钮（单选）',
          able: item.style === 3
        })
      }
      TmpModels.push(TmpItem)
    }
    const base64 = await puppeteer.screenshot('mj-plugin', {
      saveId: 'Setting',
      imgType: 'png',
      tplFile: `${pluginResources}/listTemp/listTemp.html`,
      pluginResources,
      header: 'Midjourney 设置',
      lable: '在此处设置的内容将会使账号全局生效，请谨慎设置',
      sidebar: `设置项：${response.content.components.length}个`,
      list1: '选项',
      list2: '类型',
      modelsGroup: TmpModels,
      notice: response.content.content
    })
    await e.reply(base64)

    await redis.set(`mj:${e.user_id}`, JSON.stringify(response))
    await redis.set(`mj:${response.id}`, JSON.stringify(response))

    const optionList = []
    for (let i = 0; i < response.options.length; i++) {
      optionList.push(`[${response.options[i].label}]`)
    }
    if (optionList.length > 0) {
      await e.reply(
        `[ID:${response.id}]\n可选的操作：\n${optionList.join(' | ')}`
      )
    }
    return true
  }
}
