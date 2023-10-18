import plugin from '../../../lib/plugins/plugin.js'
import Log from '../utils/logs.js'
import Config from '../components/Config.js'
import Init from '../model/init.js'
import { pluginResources } from '../model/path.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'

export class Admin extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: 'MJ-配置',
      /** 功能描述 */
      dsc: 'Midjourney 配置',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?(mj|MJ)配置.*$',
          /** 执行方法 */
          fnc: 'admin',
          permission: 'master'
        }
      ]
    })
  }

  async admin (e) {
    Init.initConfig()
    // 读取配置项
    const config = Config.getConfig()
    const key =
      /(服务器ID|频道ID|账号token|抱脸token|调试模式|代理(地址)?|使用翻译接口|(百度|有道)翻译(appid|appkey)|切换)/g.exec(
        e.msg
      )?.[1]
    const value = e.msg
      .replace(/#?(mj|MJ)配置/, '')
      .replace(new RegExp(`${key}`), '')
      .trim()
    // key匹配失败,value存在时
    if (!key && value != '') {
      e.reply('配置项不存在,请检查输入')
      return true
    }
    // 修改标志位,修改成功后修改为true
    let alterFlag = false
    switch (key) {
      case '服务器ID':
        config.server_id = value
        alterFlag = true
        break
      case '频道ID':
        config.channel_id = value
        alterFlag = true
        break
      case '账号token':
        config.salai_token = value
        alterFlag = true
        break
      case '抱脸token':
        config.huggingface_token = value
        alterFlag = true
        break
      case '调试模式':
        if (value.match(/(开启|关闭)/)) {
          if (value === '开启') {
            config.debug = true
          } else {
            config.debug = false
          }
          alterFlag = true
        }
        break
      case '代理':
        if (value.match(/(开启|关闭)/)) {
          if (value === '开启') {
            config.proxy = true
          } else {
            config.proxy = false
          }
          alterFlag = true
        }
        break
      case '代理地址':
        if (
          /^http:\/\/((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):[\d]{1,5}$/.test(
            value
          )
        ) {
          config.proxy_url = value
          alterFlag = true
        } else {
          e.reply('请输入正确的代理地址,如http://127.0.0.1:7890', true)
          return true
        }
        break
      case '百度翻译appid':
        config.baidu_translate.appid = value
        alterFlag = true
        break
      case '百度翻译appkey':
        config.baidu_translate.appkey = value
        alterFlag = true
        break
      case '有道翻译appid':
        config.youdao_translate.appid = value
        alterFlag = true
        break
      case '有道翻译appid':
        config.youdao_translate.appkey = value
        alterFlag = true
        break
      case '使用翻译接口':
        if (value.match(/(不|百度|有道)/)) {
          if (value === '百度') {
            config.translate_use = 1
            alterFlag = true
          } else if (value === '有道') {
            config.translate_use = 2
            alterFlag = true
          } else {
            config.translate_use = 0
            alterFlag = true
          }
        }
        break
      case '切换':
        if (value === 'mj') {
          config.bot_type = 'Midjourney'
        } else if (value === 'niji') {
          config.bot_type = 'Nijijourney'
        } else {
          e.reply('请输入正确的Bot名称，如#mj配置切换mj/niji', true)
          return true
        }
        alterFlag = true
        break
      default:
        // 如果key为空且value为空则展示
        const TmpModels = [
          [
            {
              list1: '服务器ID',
              list2: config.server_id
            },
            {
              list1: '频道ID',
              list2: config.channel_id
            },
            {
              list1: '账号token',
              list2: config.salai_token
                ? config.salai_token.substring(0, 10) + '...'
                : ''
            },
            {
              list1: '抱脸token',
              list2: config.huggingface_token
                ? config.huggingface_token.substring(0, 10) + '...'
                : ''
            },
            {
              list1: '调试模式',
              list2: config.debug ? '开启' : '关闭'
            },
            {
              list1: '代理',
              list2: config.proxy ? '开启' : '关闭'
            },
            {
              list1: '代理地址',
              list2: config.proxy_url
            },
            {
              list1: '翻译接口',
              list2:
                config.translate_use == 1
                  ? '百度'
                  : config.translate_use == 2
                    ? '有道'
                    : '未使用'
            },
            {
              list1: '百度appid',
              list2: config.baidu_translate.appid
                ? config.baidu_translate.appid.substring(0, 10) + '...'
                : ''
            },
            {
              list1: '百度appkey',
              list2: config.baidu_translate.appkey
                ? config.baidu_translate.appkey.substring(0, 10) + '...'
                : ''
            },
            {
              list1: '有道appid',
              list2: config.youdao_translate.appid
                ? config.youdao_translate.appid.substring(0, 10) + '...'
                : ''
            },
            {
              list1: '有道appkey',
              list2: config.youdao_translate.appkey
                ? config.youdao_translate.appkey.substring(0, 10) + '...'
                : ''
            },
            {
              list1: 'Bot类型',
              list2: config.bot_type
            }
          ]
        ]
        const base64 = await puppeteer.screenshot('mj-plugin', {
          saveId: 'Admin',
          imgType: 'png',
          tplFile: `${pluginResources}/listTemp/listTemp.html`,
          pluginResources,
          header: 'Midjourney 配置',
          lable: 'Midjourney账号配置 代理配置 翻译配置',
          sidebar: '配置列表',
          list1: '配置项',
          list2: '配置状态',
          modelsGroup: TmpModels,
          notice: '需修改配置可发送#MJ帮助查看'
        })
        await e.reply(base64)
        return true
    }
    if (alterFlag) {
      try {
        await Config.setConfig(config)
        const msg = [
          key.match(
            /(服务器ID|频道ID|账号token|抱脸token|代理地址|(百度|有道)翻译(appid|appkey))/
          )
            ? `配置项${key}已设置为${value}`
            : key === '调试模式' || key === '代理'
              ? `设置项${key}已${value}`
              : key === '使用翻译接口'
                ? value == '不'
                  ? '当前将不再使用翻译'
                  : `翻译接口已修改为${value}`
                : key === '切换'
                  ? `已切换到${value} Bot，请使用 #mj重连 生效`
                  : '未知错误'
        ]
        Log.i('更新配置项', key, value)
        e.reply(msg, true)
      } catch (err) {
        Log.e(err)
        Log.e(err.message)
        return this.e.reply('配置失败。请查看控制台报错', true)
      }
      return true
    } else {
      e.reply(`设置项${key}无法修改为${value || '空'}`, true)
    }
  }
}
